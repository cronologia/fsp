#!/usr/bin/env node
'use strict';
/**
 * fetch-declarations.js — download the archived final-declaration pages into
 * the repo as raw data (phase 1 of signatory extraction, issue #28).
 *
 * For each meeting in data/forum.json with a `declarationUrl`, fetch the page
 * body and save it to data/declarations/<year>.html.
 *
 * SHELL-AWARE: the newest Wayback snapshots of the old declaration slugs are
 * JS-era navigation shells with no article text. When a fetched body's visible
 * text is below MIN_CHARS, the script mines data/wayback-inventory.json for
 * alternate captures of the same declaration (same year + host-city slug,
 * preferring the 2014–2019 static-site era) and retries until it finds a body
 * with real text. Existing files that are shells are retried automatically on
 * the next run — no --force needed — so the corpus self-heals.
 *
 * Usage:
 *   node scripts/fetch-declarations.js            # fetch missing/shell bodies
 *   node scripts/fetch-declarations.js --force    # re-fetch everything
 *
 * Network: needs archive.org (run via the Wayback collection Action or
 * locally). Exit codes: 0 = every target has a full-text body; 1 = some are
 * still missing or shells.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'forum.json');
const INVENTORY_FILE = path.join(ROOT, 'data', 'wayback-inventory.json');
const OUT_DIR = path.join(ROOT, 'data', 'declarations');

const FORCE = process.argv.includes('--force');
const TIMEOUT_MS = 60000;
const PACING_MS = 2500;      // polite delay between Wayback fetches
const MIN_CHARS = 4000;      // visible-text threshold: below this = nav shell
const MAX_ATTEMPTS = 6;      // snapshot candidates tried per meeting
const STATIC_ERA = 2016;     // static-site sweet spot; prefer captures near it

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CITY_ALIASES = {
  'São Paulo': ['sao-paulo'],
  'Mexico City': ['mexico'],
  'Managua': ['managua', 'niquinohomo'],
  'Havana': ['havana', 'habana'],
  'Montevideo': ['montevideu', 'montevideo'],
  'San Salvador': ['san-salvador'],
  'Porto Alegre': ['porto-alegre'],
  'Antigua Guatemala': ['antigua'],
  'Quito': ['quito'],
  'Buenos Aires': ['buenos-aires'],
  'Caracas': ['caracas'],
  'La Paz': ['la-paz'],
  'Brasília': ['brasilia'],
  'Tegucigalpa': ['tegucigalpa'],
};

/** Visible-text length: strips script/style blocks and tags. */
function textChars(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;
}

async function fetchOnce(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'fsp-fetch-declarations/3.0 (+https://github.com/cronologia/fsp)' },
    });
    if (!res.ok) {
      const e = new Error(`HTTP ${res.status}`);
      e.permanent = res.status === 404 || res.status === 410;
      throw e;
    }
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

/**
 * Fetch with retries. Wayback frequently connection-resets the FIRST request
 * for a cold snapshot while it warms it from storage ("fetch failed" after
 * ~10s); a retry then succeeds. 404/410 are permanent — no retry.
 */
async function fetchBody(url) {
  const backoffs = [0, 8000, 20000];
  let lastErr;
  for (const wait of backoffs) {
    if (wait) await sleep(wait);
    try {
      return await fetchOnce(url);
    } catch (err) {
      lastErr = err;
      if (err.permanent) break;
    }
  }
  throw lastErr;
}

/**
 * Candidate snapshot URLs for a meeting's declaration, best-first:
 * the meeting's own declarationUrl, then inventory captures of matching
 * declaration slugs, each at firstSeen and lastSeen, ordered by proximity to
 * the static-site era. Junk endpoints (feeds, oembed, form callbacks) are
 * excluded.
 */
function candidatesFor(m, inventory) {
  const aliases = CITY_ALIASES[m.city] || [];
  const seen = new Set();
  const out = [];
  const push = (url, ts) => {
    const snap = `https://web.archive.org/web/${ts}/${url}`;
    if (!seen.has(snap)) { seen.add(snap); out.push({ snap, ts }); }
  };

  const entries = inventory.filter((e) => {
    const u = e.url.toLowerCase();
    return (
      /declarac/.test(u) &&
      u.includes(String(m.year)) &&
      aliases.some((a) => u.includes(a)) &&
      !/feed\/?$|\.pdf|wp-json|oembed|_wpcf7|\?replytocom|%3e$/.test(u)
    );
  });
  for (const e of entries) {
    push(e.url, e.firstSeen);
    if (e.lastSeen !== e.firstSeen) push(e.url, e.lastSeen);
  }

  // Rank: captures nearest the static era first.
  out.sort((a, b) => {
    const ya = Math.abs(Number(a.ts.slice(0, 4)) - STATIC_ERA);
    const yb = Math.abs(Number(b.ts.slice(0, 4)) - STATIC_ERA);
    return ya - yb;
  });

  // The recorded declarationUrl is the fallback of last resort (often a shell).
  if (m.declarationUrl && !seen.has(m.declarationUrl)) out.push({ snap: m.declarationUrl, ts: 'recorded' });
  return out.slice(0, MAX_ATTEMPTS);
}

/** Binary fetch with the same cold-snapshot retry policy. */
async function fetchBinary(url) {
  const backoffs = [0, 8000, 20000];
  let lastErr;
  for (const wait of backoffs) {
    if (wait) await sleep(wait);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'fsp-fetch-declarations/3.0 (+https://github.com/cronologia/fsp)' },
      });
      if (!res.ok) {
        const e = new Error(`HTTP ${res.status}`);
        e.permanent = res.status === 404 || res.status === 410;
        throw e;
      }
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      lastErr = err;
      if (err.permanent) break;
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr;
}

/**
 * Download the official numbered declaration PDFs (book chapters 01-19,
 * data/declarations/official-pdfs.json) to data/declarations/pdf/. These are
 * the authoritative texts for 1990-2013 and immune to the HTML-shell problem.
 */
async function fetchOfficialPdfs() {
  let list;
  try {
    list = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'official-pdfs.json'), 'utf8')).pdfs || [];
  } catch {
    return { pdfOk: 0, pdfFailed: 0 };
  }
  const dir = path.join(OUT_DIR, 'pdf');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  let pdfOk = 0;
  let pdfFailed = 0;
  for (const p of list) {
    const out = path.join(dir, `${p.officialNumber}-${p.year}.pdf`);
    if (fs.existsSync(out) && fs.statSync(out).size > 10 * 1024) { pdfOk++; continue; }
    await sleep(PACING_MS);
    try {
      const buf = await fetchBinary(p.snapshot);
      if (buf.slice(0, 5).toString() !== '%PDF-') throw new Error('not a PDF payload');
      fs.writeFileSync(out, buf);
      console.log(`  ✓ pdf ${p.officialNumber} (${p.year}) — ${(buf.length / 1024).toFixed(0)} KB`);
      pdfOk++;
    } catch (err) {
      console.log(`  ✗ pdf ${p.officialNumber} (${p.year}) — ${err.message}`);
      pdfFailed++;
    }
  }
  return { pdfOk, pdfFailed };
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  let inventory = [];
  try {
    inventory = JSON.parse(fs.readFileSync(INVENTORY_FILE, 'utf8')).entries || [];
  } catch {
    console.log('note: wayback inventory unavailable; only recorded declarationUrls will be tried.');
  }
  const targets = data.meetings.filter((m) => m.declarationUrl);
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`${targets.length} meetings have a declarationUrl (min ${MIN_CHARS} visible chars).`);
  const status = {};
  let ok = 0;
  let shells = 0;
  let failed = 0;
  let first = true;

  for (const m of targets) {
    const out = path.join(OUT_DIR, `${m.year}.html`);
    if (!FORCE && fs.existsSync(out) && textChars(fs.readFileSync(out, 'utf8')) >= MIN_CHARS) {
      status[m.year] = { state: 'ok', chars: textChars(fs.readFileSync(out, 'utf8')) };
      ok++;
      continue;
    }

    // Seed with the existing body (if any) so a bad run never downgrades a file.
    let best = null; // { body, chars, snap }
    if (fs.existsSync(out)) {
      const existing = fs.readFileSync(out, 'utf8');
      best = { body: existing, chars: textChars(existing), snap: 'existing file' };
    }
    for (const cand of candidatesFor(m, inventory)) {
      if (!first) await sleep(PACING_MS);
      first = false;
      try {
        const body = await fetchBody(cand.snap);
        const chars = textChars(body);
        if (!best || chars > best.chars) best = { body, chars, snap: cand.snap };
        if (chars >= MIN_CHARS) break;
      } catch (err) {
        console.log(`  · ${m.year}: ${err.message} — ${cand.snap.slice(0, 90)}`);
      }
    }

    if (best) {
      fs.writeFileSync(out, best.body);
      const full = best.chars >= MIN_CHARS;
      status[m.year] = { state: full ? 'ok' : 'shell', chars: best.chars, snapshot: best.snap };
      console.log(`  ${full ? '✓' : '△'} ${m.year} (${m.city}) — ${best.chars} chars${full ? '' : ' (best available; still a shell)'}`);
      full ? ok++ : shells++;
    } else {
      status[m.year] = { state: 'failed' };
      console.log(`  ✗ ${m.year} (${m.city}) — all candidates failed`);
      failed++;
    }
  }

  fs.writeFileSync(
    path.join(OUT_DIR, 'index.json'),
    JSON.stringify(
      {
        _meta: {
          generatedBy: 'scripts/fetch-declarations.js',
          lastRun: new Date().toISOString(),
          minChars: MIN_CHARS,
          note: 'Raw archived declaration bodies (Wayback snapshots) for signatory/date extraction (#28). "shell" entries have no article text yet — the script retries them on each run. Do not hand-edit.',
        },
        status,
      },
      null,
      2
    ) + '\n'
  );

  const { pdfOk, pdfFailed } = await fetchOfficialPdfs();
  console.log(`Done. HTML: ${ok} full-text, ${shells} shells, ${failed} failed · PDFs: ${pdfOk} ok, ${pdfFailed} failed → data/declarations/.`);
  process.exit(shells + failed + pdfFailed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('fetch-declarations failed:', err);
  process.exit(1);
});
