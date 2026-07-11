#!/usr/bin/env node
'use strict';
/**
 * fetch-declarations.js — download the archived final-declaration pages into
 * the repo as raw data (phase 1 of signatory extraction, issue #28).
 *
 * For each meeting in data/forum.json with a `declarationUrl` (a Wayback
 * snapshot), fetch the page body and save it to data/declarations/<year>.html.
 * Raw-data-first: bodies are committed as-is so the signatory/date parsing can
 * be developed and reviewed against real content, offline.
 *
 * Incremental: existing files are skipped unless --force. Fails gracefully
 * when archive.org is unreachable (e.g. the dev sandbox) — run it via the
 * Wayback collection Action or locally.
 *
 * Usage:
 *   node scripts/fetch-declarations.js            # fetch missing bodies
 *   node scripts/fetch-declarations.js --force    # re-fetch everything
 *
 * Exit codes: 0 = all present/fetched; 1 = one or more fetches failed.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'forum.json');
const OUT_DIR = path.join(ROOT, 'data', 'declarations');

const FORCE = process.argv.includes('--force');
const TIMEOUT_MS = 60000;
const PACING_MS = 2500; // polite delay between Wayback fetches

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchBody(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'fsp-fetch-declarations/1.0 (+https://github.com/cronologia/fsp)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const targets = data.meetings.filter((m) => m.declarationUrl);
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`${targets.length} meetings have a declarationUrl.`);
  let fetched = 0;
  let skipped = 0;
  let failed = 0;
  let first = true;

  for (const m of targets) {
    const out = path.join(OUT_DIR, `${m.year}.html`);
    if (!FORCE && fs.existsSync(out)) {
      skipped++;
      continue;
    }
    if (!first) await sleep(PACING_MS);
    first = false;
    try {
      const body = await fetchBody(m.declarationUrl);
      fs.writeFileSync(out, body);
      console.log(`  ✓ ${m.year} (${m.city}) — ${(body.length / 1024).toFixed(0)} KB`);
      fetched++;
    } catch (err) {
      console.log(`  ✗ ${m.year} (${m.city}) — ${err.message}`);
      failed++;
    }
  }

  // Index of what's present, for the parser and reviewers.
  const present = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.html')).sort();
  fs.writeFileSync(
    path.join(OUT_DIR, 'index.json'),
    JSON.stringify(
      {
        _meta: {
          generatedBy: 'scripts/fetch-declarations.js',
          lastRun: new Date().toISOString(),
          note: 'Raw archived declaration bodies (Wayback snapshots), committed as source data for signatory/date extraction (#28). Do not hand-edit.',
        },
        files: present,
      },
      null,
      2
    ) + '\n'
  );

  console.log(`Done. ${fetched} fetched, ${skipped} already present, ${failed} failed. Bodies in data/declarations/.`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('fetch-declarations failed:', err);
  process.exit(1);
});
