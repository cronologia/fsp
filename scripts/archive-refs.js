#!/usr/bin/env node
'use strict';
/**
 * archive-refs.js — preserve every reference in the Internet Archive Wayback
 * Machine and cache the best snapshot URL for use as a fallback link.
 *
 * For each reference URL found in data/forum.json:
 *   1. Query the Wayback "availability" API for an existing snapshot.
 *   2. If none exists (or --save-all is given), trigger "Save Page Now" to
 *      archive the page, then re-check until the snapshot appears.
 *   3. Record the snapshot URL + timestamp into data/archives.json.
 *
 * References marked `official: true` (the Forum's own site and other live
 * official pages whose content can be changed or removed) get a FORCED fresh
 * capture the first time they are seen — accepting a years-old snapshot is not
 * enough when we are citing the page's current content. The capture is then
 * marked `fresh` in the cache so subsequent runs stay idempotent; use
 * --save-all to re-capture everything.
 *
 * Design: data/forum.json stays the hand-curated source of truth. This script
 * never edits it. The machine-generated cache lives in data/archives.json,
 * which build.js merges in to render "archived" fallback links next to each
 * reference. Re-running is idempotent: already-archived URLs are skipped unless
 * --save-all is passed.
 *
 * Usage:
 *   node scripts/archive-refs.js              check + archive missing, update cache
 *   node scripts/archive-refs.js --dry-run    report only; write nothing, save nothing
 *   node scripts/archive-refs.js --save-all    (re)archive every URL even if a snapshot exists
 *   node scripts/archive-refs.js --timeout=60  per-request timeout in seconds (default 45)
 *
 * Network: requires outbound HTTPS to archive.org / web.archive.org. Behind a
 * proxy on Node >= 22.21, run with NODE_USE_ENV_PROXY=1. The Save Page Now
 * endpoint is rate-limited for anonymous use, so the script paces its requests.
 *
 * Exit codes: 0 = all reachable references have a cached snapshot; 1 = one or
 * more URLs could not be archived (useful for CI gating).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'forum.json');
const CACHE_FILE = path.join(ROOT, 'data', 'archives.json');

const AVAILABILITY_API = 'https://archive.org/wayback/available';
const SAVE_API = 'https://web.archive.org/save/';

// ---- CLI args -------------------------------------------------------------
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SAVE_ALL = args.includes('--save-all');
const TIMEOUT_MS = (() => {
  const a = args.find((x) => x.startsWith('--timeout='));
  const n = a ? parseInt(a.split('=')[1], 10) : 45;
  return (Number.isFinite(n) ? n : 45) * 1000;
})();

const SAVE_POLL_ATTEMPTS = 6;     // times to re-check availability after a save
const SAVE_POLL_DELAY_MS = 8000;  // delay between availability polls
const PACING_DELAY_MS = 6000;     // polite delay between Save Page Now calls

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Collect the distinct reference URLs from forum.json, flagging those marked
 * `official: true`. Official/live pages (e.g. the Forum's own site) are the
 * ones whose content can be silently changed or removed, so they get a forced
 * fresh capture rather than accepting whatever old snapshot already exists.
 */
function collectUrls(data) {
  const byUrl = new Map();
  for (const ref of data.references || []) {
    if (ref && typeof ref.url === 'string') {
      const url = ref.url.trim();
      byUrl.set(url, (byUrl.get(url) || false) || ref.official === true);
    }
  }
  return [...byUrl].map(([url, official]) => ({ url, official }));
}

/** fetch JSON with a timeout; returns null on any failure. */
async function fetchJson(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'fsp-archive-refs/1.0 (+https://github.com/cronologia/fsp)' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Normalise a Wayback snapshot URL to https. */
function toHttps(u) {
  return typeof u === 'string' ? u.replace(/^http:\/\//, 'https://') : u;
}

/** Look up the closest existing snapshot for a URL, or null. */
async function lookupSnapshot(url) {
  const api = `${AVAILABILITY_API}?url=${encodeURIComponent(url)}`;
  const json = await fetchJson(api);
  const closest = json && json.archived_snapshots && json.archived_snapshots.closest;
  if (closest && closest.available && closest.url) {
    return {
      archiveUrl: toHttps(closest.url),
      timestamp: closest.timestamp || null,
      status: closest.status || null,
    };
  }
  return null;
}

/** Trigger Save Page Now, then poll availability until the snapshot appears. */
async function savePage(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    await fetch(SAVE_API + url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'fsp-archive-refs/1.0 (+https://github.com/cronologia/fsp)' },
    });
  } catch {
    // Save endpoint is best-effort; we confirm via availability polling below.
  } finally {
    clearTimeout(t);
  }
  for (let i = 0; i < SAVE_POLL_ATTEMPTS; i++) {
    await sleep(SAVE_POLL_DELAY_MS);
    const snap = await lookupSnapshot(url);
    if (snap) return snap;
  }
  return null;
}

function loadCache() {
  try {
    const parsed = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    if (parsed && typeof parsed === 'object' && parsed.snapshots) return parsed;
  } catch {
    /* fall through to fresh cache */
  }
  return { _meta: {}, snapshots: {} };
}

function writeCache(cache) {
  cache._meta = {
    generatedBy: 'scripts/archive-refs.js',
    lastRun: new Date().toISOString(),
    count: Object.keys(cache.snapshots).length,
  };
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2) + '\n');
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const urls = collectUrls(data);
  const cache = loadCache();

  console.log(`Found ${urls.length} reference URL(s).${DRY_RUN ? ' (dry-run)' : ''}`);

  let archived = 0;
  let saved = 0;
  let failed = 0;
  let first = true;

  for (const { url, official } of urls) {
    const cached = cache.snapshots[url];
    const haveFresh = !!(cached && cached.fresh);
    // A cached snapshot is enough — except for official pages we haven't yet
    // captured ourselves, which we force-save once so the cited content is
    // preserved as it stood at citation time.
    if (cached && cached.archiveUrl && !SAVE_ALL && (!official || haveFresh)) {
      console.log(`  ✓ cached     ${url}`);
      archived++;
      continue;
    }

    let snap = await lookupSnapshot(url);
    // Force a new capture when: --save-all, no snapshot exists, or this is an
    // official page without a fresh (self-made) capture yet.
    const mustSave = SAVE_ALL || !snap || (official && !haveFresh);

    if (mustSave) {
      if (DRY_RUN) {
        console.log(`  · would save ${official ? '(official) ' : ''}${url}${snap ? ' (re-archive)' : ' (no snapshot)'}`);
        if (!snap) { failed++; continue; }
      } else {
        if (!first) await sleep(PACING_DELAY_MS);
        first = false;
        console.log(`  ⟳ saving${official ? ' (official)' : ''}…    ${url}`);
        const fresh = await savePage(url);
        if (fresh) { snap = fresh; snap.fresh = true; saved++; }
      }
    }

    if (snap) {
      cache.snapshots[url] = {
        archiveUrl: snap.archiveUrl,
        timestamp: snap.timestamp,
        status: snap.status,
        fresh: !!(snap.fresh || haveFresh),
        checkedAt: new Date().toISOString(),
      };
      console.log(`  ✓ archived   ${url} -> ${snap.archiveUrl}${snap.fresh ? ' (fresh)' : ''}`);
      archived++;
    } else {
      console.log(`  ✗ FAILED     ${url}`);
      failed++;
    }
  }

  if (!DRY_RUN) writeCache(cache);

  console.log(
    `\nDone. ${archived} archived (${saved} newly saved), ${failed} failed.` +
      (DRY_RUN ? ' No files written.' : ` Cache: ${path.relative(ROOT, CACHE_FILE)}`)
  );
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('archive-refs failed:', err);
  process.exit(1);
});
