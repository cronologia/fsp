#!/usr/bin/env node
'use strict';
/**
 * archive-country-sources.js — Wayback preservation for country-dossier URLs.
 *
 * Repo-owned companion to the shared scripts/archive-refs.js (which is the
 * template copy from cronologia/core and covers data/forum.json
 * `references[]`). The country dossiers (data/countries/*.json) cite sources
 * as bare URL strings scattered across nested arrays — sources[] on
 * legislativeComposition/benchControl/courtHistory entries, plus the
 * top-level membership/court source lists. This script walks those arrays
 * and archives any URL that references[] does not already cover, writing
 * into the same data/archives.json cache that build.js reads.
 *
 * This split is the core#33 resolution: the dossier walk is fsp-specific
 * machinery the shared archiver's ADOPT points deliberately do not express,
 * so it lives beside the template copy instead of forking it. Dossier URLs
 * are bare strings and cannot carry `official: true`, so they only ever need
 * a first capture — the refresh-window logic stays in archive-refs.js.
 *
 * Politeness mirrors the template: lookup-first (cheap), Save Page Now only
 * for URLs with no snapshot at all, >= 10s between saves, saves per run
 * capped, HTTP 429/403 treated as inconclusive and retried next run.
 *
 * Usage: node scripts/archive-country-sources.js
 * Env:   ARCHIVE_MAX_SAVES      max Save Page Now requests per run (default 25)
 *        ARCHIVE_SAVE_DELAY_MS  pause between save requests (default 12000, min 10000)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'forum.json');
const COUNTRIES_DIR = path.join(ROOT, 'data', 'countries');
const ARCHIVES_FILE = path.join(ROOT, 'data', 'archives.json');

const MAX_SAVES = clampInt(process.env.ARCHIVE_MAX_SAVES, 25, 0, 500);
const SAVE_DELAY_MS = Math.max(10000, clampInt(process.env.ARCHIVE_SAVE_DELAY_MS, 12000, 0, 600000));
const LOOKUP_DELAY_MS = 1500;

const USER_AGENT =
  'cronologia-archive-refs/1.0 (Cronologia Foro de Sao Paulo chronology, country dossiers; +https://github.com/cronologia/fsp)';

// Source arrays carried by the country dossiers (data/countries/*.json). These
// hold bare URL strings (not reference objects), scattered across the dossier —
// sources[] on legislativeComposition/benchControl/courtHistory entries, plus
// the top-level membership/court source lists. We walk for these key names.
const COUNTRY_SOURCE_KEYS = new Set([
  'sources',
  'courtHistorySources',
  'fspMembershipSources',
]);

function clampInt(raw, dflt, min, max) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, n));
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Recursively collect bare URL strings held in a country dossier's source
 * arrays (see COUNTRY_SOURCE_KEYS).
 */
function collectCountryUrls(node, into) {
  if (Array.isArray(node)) {
    for (const item of node) collectCountryUrls(item, into);
    return;
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (COUNTRY_SOURCE_KEYS.has(key) && Array.isArray(value)) {
        for (const s of value) {
          if (typeof s === 'string' && /^https?:\/\//i.test(s.trim())) {
            into.add(s.trim());
          }
        }
      }
      collectCountryUrls(value, into);
    }
  }
}

/** Read every country dossier and return the distinct source URLs they cite. */
function loadCountryUrls() {
  const urls = new Set();
  let files = [];
  try {
    files = fs.readdirSync(COUNTRIES_DIR);
  } catch {
    return urls; // no country dossiers in this checkout
  }
  for (const file of files) {
    if (!file.endsWith('.json') || file === 'index.json') continue;
    let dossier;
    try {
      dossier = JSON.parse(fs.readFileSync(path.join(COUNTRIES_DIR, file), 'utf8'));
    } catch {
      continue;
    }
    collectCountryUrls(dossier, urls);
  }
  return urls;
}

/**
 * Merge forum.json references with country-dossier URLs into a single list of
 * { url, official } entries. When the same URL appears in both, the `official`
 * flag from `references[]` wins (dossier strings cannot be flagged official).
 */
function collectUrls(data, countryUrls) {
  const byUrl = new Map();
  for (const ref of data.references || []) {
    if (ref && typeof ref.url === 'string') {
      const url = ref.url.trim();
      byUrl.set(url, (byUrl.get(url) || false) || ref.official === true);
    }
  }
  for (const url of countryUrls || []) {
    if (!byUrl.has(url)) byUrl.set(url, false);
  }
  return [...byUrl].map(([url, official]) => ({ url, official }));
}

/** Prefer https for web.archive.org links regardless of what the API returns. */
function normalizeArchiveUrl(url) {
  return String(url).replace(/^http:\/\/web\.archive\.org\//, 'https://web.archive.org/');
}

async function request(url) {
  return fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    redirect: 'follow',
    signal: AbortSignal.timeout(120000),
  });
}

/** Query the availability API. Returns {archiveUrl, timestamp} | null | 'inconclusive'. */
async function lookupSnapshot(url) {
  const api = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`;
  let res;
  try {
    res = await request(api);
  } catch (e) {
    console.warn(`  lookup error (${e.message}) — will retry next run`);
    return 'inconclusive';
  }
  if (res.status === 429 || res.status === 403) {
    console.warn(`  lookup rate-limited (HTTP ${res.status}) — will retry next run`);
    return 'inconclusive';
  }
  if (!res.ok) {
    console.warn(`  lookup failed (HTTP ${res.status}) — will retry next run`);
    return 'inconclusive';
  }
  let body;
  try {
    body = await res.json();
  } catch {
    return 'inconclusive';
  }
  const closest = body && body.archived_snapshots && body.archived_snapshots.closest;
  if (closest && closest.available && closest.url) {
    return { archiveUrl: normalizeArchiveUrl(closest.url), timestamp: closest.timestamp || '' };
  }
  return null;
}

/** Trigger Save Page Now. Returns {archiveUrl, timestamp} | 'inconclusive' | null. */
async function savePage(url) {
  const saveUrl = `https://web.archive.org/save/${url}`;
  let res;
  try {
    res = await request(saveUrl);
  } catch (e) {
    console.warn(`  save error (${e.message}) — will retry next run`);
    return 'inconclusive';
  }
  if (res.status === 429 || res.status === 403) {
    console.warn(`  save rate-limited (HTTP ${res.status}) — inconclusive, retry later`);
    return 'inconclusive';
  }
  if (!res.ok) {
    console.warn(`  save failed (HTTP ${res.status})`);
    return null;
  }
  const hint = res.headers.get('content-location') || res.url || '';
  const m = String(hint).match(/\/web\/(\d{14})/);
  if (m) {
    const rest = String(hint).replace(/^https?:\/\/web\.archive\.org/, '');
    return {
      archiveUrl: normalizeArchiveUrl(rest.startsWith('/') ? `https://web.archive.org${rest}` : hint),
      timestamp: m[1],
    };
  }
  await sleep(LOOKUP_DELAY_MS);
  const found = await lookupSnapshot(url);
  return found === 'inconclusive' ? 'inconclusive' : found;
}

function loadArchives() {
  try {
    const parsed = JSON.parse(fs.readFileSync(ARCHIVES_FILE, 'utf8'));
    return parsed && typeof parsed.snapshots === 'object' && parsed.snapshots ? parsed : { snapshots: {} };
  } catch {
    return { snapshots: {} };
  }
}

/**
 * Preserve the cache's shape (generatedBy stays whatever wrote it last with
 * full knowledge — normally archive-refs.js, which runs before this script in
 * the wayback workflow); only snapshots and the update date change here.
 */
function writeArchives(archives) {
  const sorted = {};
  for (const url of Object.keys(archives.snapshots).sort()) sorted[url] = archives.snapshots[url];
  const out = {
    generatedBy: archives.generatedBy || 'scripts/archive-refs.js',
    updatedAt: new Date().toISOString().slice(0, 10),
    snapshots: sorted,
  };
  fs.writeFileSync(ARCHIVES_FILE, JSON.stringify(out, null, 2) + '\n');
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const refUrls = new Set(
    (data.references || [])
      .map((r) => (r && typeof r.url === 'string' ? r.url.trim() : ''))
      .filter(Boolean)
  );
  const urls = [...loadCountryUrls()].filter((u) => !refUrls.has(u)).sort();
  const archives = loadArchives();

  console.log(`Found ${urls.length} country-dossier source URL(s) not covered by forum.json references[].`);

  let saves = 0;
  let looked = 0;
  let skipped = 0;
  let pending = 0;
  let firstNetworkCall = true;

  const politePause = async (ms) => {
    if (!firstNetworkCall) await sleep(ms);
    firstNetworkCall = false;
  };

  for (const url of urls) {
    const existing = archives.snapshots[url];
    if (existing && existing.archiveUrl) {
      skipped++;
      continue;
    }

    console.log(`checking: ${url}`);
    await politePause(LOOKUP_DELAY_MS);
    const found = await lookupSnapshot(url);
    looked++;
    if (found === 'inconclusive') {
      pending++;
      continue;
    }
    if (found) {
      archives.snapshots[url] = { refId: 'country-source', ...found, checkedAt: new Date().toISOString().slice(0, 10) };
      console.log(`  snapshot exists (${found.timestamp})`);
      continue;
    }

    if (saves >= MAX_SAVES) {
      console.log(`  no snapshot; save cap ${MAX_SAVES} reached — deferred to next run`);
      pending++;
      continue;
    }
    console.log('  no snapshot — requesting capture');
    await politePause(SAVE_DELAY_MS);
    const saved = await savePage(url);
    saves++;
    if (saved && saved !== 'inconclusive') {
      archives.snapshots[url] = { refId: 'country-source', ...saved, checkedAt: new Date().toISOString().slice(0, 10) };
      console.log(`  captured ${saved.timestamp}`);
    } else {
      pending++;
    }
  }

  writeArchives(archives);
  const have = urls.filter((u) => archives.snapshots[u] && archives.snapshots[u].archiveUrl).length;
  console.log(
    `\nDone: ${urls.length} country-source URLs, ${have} with a snapshot in data/archives.json ` +
    `(${skipped} already recorded, ${looked} looked up, ${saves} save requests, ${pending} pending retry).`
  );
}

if (require.main === module) {
  main().catch((e) => {
    console.error(`archive-country-sources: ${e.message}`);
    process.exit(1);
  });
}

module.exports = { collectUrls, collectCountryUrls, loadCountryUrls };
