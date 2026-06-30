#!/usr/bin/env node
'use strict';
/**
 * wayback-harvest.js — inventory the archived captures of the Foro de São Paulo
 * official site (forodesaopaulo.org) in the Internet Archive Wayback Machine.
 *
 * This is the first step of recovering historical content: it does NOT scrape
 * page bodies, it builds a reviewable index of WHAT exists in the archive so a
 * human (or a follow-up pass) can pull the high-value pages — meeting pages,
 * "declaração/declaración final", member lists, history pages.
 *
 * PAGINATED: the CDX API caps a single response, so the full scan walks every
 * page using the `resumeKey` cursor until the archive is exhausted (or the
 * --max-pages safety limit is hit). This captures the complete archive, not just
 * the first page.
 *
 * INCREMENTAL BY DESIGN: the inventory (data/wayback-inventory.json) is committed
 * to the repo. On each run the script loads it, asks the CDX API only for captures
 * NEWER than the last one it has seen (via the `from=` watermark), and merges the
 * delta in. A full re-scan only happens the first time, or when forced with --full.
 *
 * Output:
 *   data/wayback-inventory.json       machine-readable inventory (committed, incremental)
 *   docs-research/wayback-inventory.md human-readable summary, useful pages first
 *
 * Usage:
 *   node scripts/wayback-harvest.js                 # incremental update (full if no inventory yet)
 *   node scripts/wayback-harvest.js --full          # force a complete, paginated re-scan
 *   node scripts/wayback-harvest.js --page-size=15000 --max-pages=50
 *   node scripts/wayback-harvest.js --domain=forodesaopaulo.org
 *
 * Network: requires outbound HTTPS to web.archive.org. Some sandboxed/CI
 * environments block archive.org by egress policy — run where the Internet
 * Archive is reachable (locally, or via the GitHub Action in
 * .github/workflows/wayback.yml). Behind a proxy on Node >= 22.21, run with
 * NODE_USE_ENV_PROXY=1.
 *
 * Exit codes: 0 = inventory written; 1 = the CDX query could not be reached.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_JSON = path.join(ROOT, 'data', 'wayback-inventory.json');
const OUT_MD_DIR = path.join(ROOT, 'docs-research');
const OUT_MD = path.join(OUT_MD_DIR, 'wayback-inventory.md');
const CDX = 'https://web.archive.org/cdx/search/cdx';

// ---- CLI args -------------------------------------------------------------
const args = process.argv.slice(2);
const argVal = (name, fallback) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : fallback;
};
const DOMAIN = argVal('domain', 'forodesaopaulo.org');
const PAGE_SIZE = parseInt(argVal('page-size', '15000'), 10) || 15000;
const MAX_PAGES = parseInt(argVal('max-pages', '40'), 10) || 40;
const TIMEOUT_MS = (parseInt(argVal('timeout', '90'), 10) || 90) * 1000;
const FULL = args.includes('--full');
const PACING_MS = 1500; // polite delay between CDX pages

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Keywords that flag a capture as high-value for the chronology.
const USEFUL_PATTERNS = [
  /declarac/i, /declarat/i, /final/i,
  /encontro/i, /encuentro/i, /reunion/i, /reuni[aã]o/i,
  /historia/i, /hist[oó]ric/i, /quem-?somos/i, /quienes-?somos/i, /sobre/i,
  /membr/i, /miembr/i, /partido/i, /organiza/i, /integrant/i,
  /documento/i, /resoluc/i, /acta/i,
];

const isUseful = (url) => USEFUL_PATTERNS.some((re) => re.test(url));
const waybackUrl = (timestamp, original) => `https://web.archive.org/web/${timestamp}/${original}`;
const fmtTs = (ts) => (!ts || ts.length < 8 ? ts || '' : `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`);

/** Load the existing inventory (committed), returning a url -> entry map + watermark. */
function loadExisting() {
  try {
    const parsed = JSON.parse(fs.readFileSync(OUT_JSON, 'utf8'));
    const byUrl = new Map();
    for (const e of parsed.entries || []) byUrl.set(e.url, e);
    return { byUrl, watermark: parsed.latestCapture || null };
  } catch {
    return { byUrl: new Map(), watermark: null };
  }
}

/** Fetch one CDX page. Returns the raw parsed JSON array (rows). */
async function fetchCdxPage({ from, collapse, resumeKey }) {
  const params = new URLSearchParams({
    url: DOMAIN,
    matchType: 'domain',
    output: 'json',
    fl: 'original,timestamp,statuscode,mimetype',
    limit: String(PAGE_SIZE),
    showResumeKey: 'true',
  });
  if (collapse) params.set('collapse', 'urlkey');
  if (from) params.set('from', from);
  if (resumeKey) params.set('resumeKey', resumeKey);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${CDX}?${params}`, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'fsp-wayback-harvest/1.0 (+https://github.com/cronologia/fsp)' },
    });
    if (!res.ok) throw new Error(`CDX returned HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/**
 * Split a CDX JSON response into body rows + the next resumeKey. With
 * showResumeKey=true the response ends with an empty row `[]` followed by a
 * single-element row holding the cursor. The header row (`["original",...]`) is
 * also stripped.
 */
function splitPage(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return { body: [], resumeKey: null };
  let data = rows;
  let resumeKey = null;
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  if (Array.isArray(last) && last.length === 1 && Array.isArray(prev) && prev.length === 0) {
    resumeKey = last[0];
    data = data.slice(0, data.length - 2);
  }
  if (data[0] && data[0][0] === 'original') data = data.slice(1); // drop header
  return { body: data, resumeKey };
}

/** Merge CDX body rows into the byUrl map. Returns counts of added/updated URLs. */
function mergeRows(byUrl, body) {
  let added = 0;
  let updated = 0;
  for (const [original, timestamp, statuscode, mimetype] of body) {
    const existing = byUrl.get(original);
    if (!existing) {
      byUrl.set(original, {
        url: original,
        firstSeen: timestamp,
        lastSeen: timestamp,
        snapshots: 1,
        statuscode,
        mimetype,
        useful: isUseful(original),
      });
      added++;
    } else {
      let changed = false;
      if (timestamp < existing.firstSeen) { existing.firstSeen = timestamp; changed = true; }
      if (timestamp > existing.lastSeen) { existing.lastSeen = timestamp; changed = true; }
      existing.snapshots = (existing.snapshots || 1) + 1;
      if (changed) updated++;
    }
  }
  return { added, updated };
}

/** Walk every CDX page via resumeKey, merging into byUrl. Returns totals. */
async function harvestAll(byUrl, { from, collapse }) {
  let resumeKey = null;
  let page = 0;
  let totalAdded = 0;
  let totalUpdated = 0;
  let totalRows = 0;
  do {
    if (page > 0) await sleep(PACING_MS);
    const rows = await fetchCdxPage({ from, collapse, resumeKey });
    const { body, resumeKey: next } = splitPage(rows);
    const { added, updated } = mergeRows(byUrl, body);
    totalAdded += added;
    totalUpdated += updated;
    totalRows += body.length;
    page++;
    resumeKey = next;
    console.log(`  page ${page}: ${body.length} rows (+${added} new), resumeKey=${resumeKey ? 'yes' : 'none'}`);
  } while (resumeKey && page < MAX_PAGES);

  if (resumeKey) {
    console.warn(`  reached --max-pages=${MAX_PAGES} with more results remaining; raise it for a complete scan.`);
  }
  return { pages: page, totalAdded, totalUpdated, totalRows, truncated: Boolean(resumeKey) };
}

function sortEntries(byUrl) {
  return [...byUrl.values()].sort((a, b) => {
    if (a.useful !== b.useful) return a.useful ? -1 : 1; // useful first
    return a.url.localeCompare(b.url);
  });
}

function renderMarkdown(entries, meta) {
  const useful = entries.filter((e) => e.useful);
  const lines = [];
  lines.push('# Wayback inventory — forodesaopaulo.org');
  lines.push('');
  lines.push('> Generated by `scripts/wayback-harvest.js` (paginated, incremental).');
  lines.push('> This is an index of what exists in the Internet Archive, not the');
  lines.push('> harvested content itself. Use the "high-value pages" list to recover');
  lines.push('> meeting declarations, member lists and history into `data/forum.json`.');
  lines.push('');
  lines.push(`- Domain: \`${DOMAIN}\``);
  lines.push(`- Last run: ${meta.lastRun}`);
  lines.push(`- Latest capture seen (incremental watermark): ${fmtTs(meta.latestCapture)}`);
  lines.push(`- Unique archived URLs: **${entries.length}** (high-value: **${useful.length}**)`);
  if (meta.truncated) lines.push(`- ⚠️ Scan truncated at the page limit — not yet complete.`);
  lines.push('');
  lines.push('## High-value pages');
  lines.push('');
  if (useful.length === 0) {
    lines.push('_None matched the high-value patterns — review the full inventory JSON._');
  } else {
    lines.push('| Page | First seen | Last seen | Latest snapshot |');
    lines.push('| --- | --- | --- | --- |');
    for (const e of useful.slice(0, 300)) {
      lines.push(`| ${e.url} | ${fmtTs(e.firstSeen)} | ${fmtTs(e.lastSeen)} | [view](${waybackUrl(e.lastSeen, e.url)}) |`);
    }
    if (useful.length > 300) lines.push(`| … and ${useful.length - 300} more (see JSON) | | | |`);
  }
  lines.push('');
  lines.push(`_Full machine-readable inventory: \`data/wayback-inventory.json\` (${entries.length} URLs)._`);
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const { byUrl, watermark } = FULL ? { byUrl: new Map(), watermark: null } : loadExisting();
  const incremental = !FULL && byUrl.size > 0 && watermark;

  console.log(
    incremental
      ? `Incremental update: ${byUrl.size} URLs known, fetching captures since ${fmtTs(watermark)}…`
      : `Full paginated scan of ${DOMAIN} (page size ${PAGE_SIZE}, max ${MAX_PAGES} pages)…`
  );

  let totals;
  try {
    totals = await harvestAll(byUrl, { from: incremental ? watermark : null, collapse: !incremental });
  } catch (err) {
    console.error(`Could not reach the Wayback CDX API: ${err.message}`);
    console.error('If you are in a sandbox that blocks archive.org, run this where the Internet Archive is reachable.');
    process.exit(1);
  }

  const entries = sortEntries(byUrl);
  if (entries.length === 0) {
    console.log('No captures found.');
    fs.writeFileSync(OUT_JSON, JSON.stringify({ domain: DOMAIN, lastRun: new Date().toISOString(), latestCapture: null, uniqueUrls: 0, usefulUrls: 0, entries: [] }, null, 2) + '\n');
    process.exit(0);
  }

  const latestCapture = entries.reduce((mx, e) => (e.lastSeen > mx ? e.lastSeen : mx), watermark || '');
  const meta = {
    domain: DOMAIN,
    lastRun: new Date().toISOString(),
    latestCapture: latestCapture || null,
    uniqueUrls: entries.length,
    usefulUrls: entries.filter((e) => e.useful).length,
    truncated: totals.truncated,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify({ ...meta, entries }, null, 2) + '\n');
  if (!fs.existsSync(OUT_MD_DIR)) fs.mkdirSync(OUT_MD_DIR, { recursive: true });
  fs.writeFileSync(OUT_MD, renderMarkdown(entries, meta));

  console.log(
    `${incremental ? 'Incremental' : 'Full'} run: ${totals.pages} page(s), +${totals.totalAdded} new, ` +
      `${totals.totalUpdated} updated. Inventory now ${entries.length} URLs (${meta.usefulUrls} high-value). ` +
      `Watermark: ${fmtTs(meta.latestCapture)}.${meta.truncated ? ' [TRUNCATED]' : ''}`
  );
}

main().catch((err) => {
  console.error('wayback-harvest failed:', err);
  process.exit(1);
});
