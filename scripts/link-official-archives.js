#!/usr/bin/env node
'use strict';
/**
 * link-official-archives.js — match the official document index
 * (data/declarations/official-index.json) against our committed Wayback
 * inventory (data/wayback-inventory.json) and record, per document, an existing
 * Wayback snapshot where one exists. Zero-dependency, fully offline (no network:
 * archive.org is reachable but the inventory is already harvested).
 *
 * forodesaopaulo.org geoblocks non-BR IPs (ADR-0012), so its LIVE pages are
 * unreachable from the US — but the Internet Archive captured most of them BEFORE
 * the geoblock, and archive.org is not geoblocked, so those snapshots are the way
 * to read the content from anywhere. Documents with no snapshot (mostly 2024+)
 * are flagged for Brazilian capture (#139).
 *
 * Usage: node scripts/link-official-archives.js
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const IDX = path.join(ROOT, 'data', 'declarations', 'official-index.json');
const INV = path.join(ROOT, 'data', 'wayback-inventory.json');

const norm = (u) => u.replace(/^https?:\/\//, '').replace(/:80\b/, '').replace(/\/+$/, '').replace(/^www\./, '').toLowerCase();

function main() {
  const idx = JSON.parse(fs.readFileSync(IDX, 'utf8'));
  const inv = JSON.parse(fs.readFileSync(INV, 'utf8'));
  const arch = new Map();
  for (const e of inv.entries || []) {
    const k = norm(e.url);
    const prev = arch.get(k);
    if (!prev || (e.lastSeen || '') > (prev.lastSeen || '')) arch.set(k, e);
  }
  let have = 0, miss = 0;
  for (const d of idx.documents) {
    const hit = arch.get(norm(d.url));
    if (hit && hit.lastSeen) {
      d.wayback = { timestamp: hit.lastSeen, url: `https://web.archive.org/web/${hit.lastSeen}/${hit.url.replace(/:80\b/, '')}` };
      have++;
    } else {
      d.wayback = null;
      miss++;
    }
  }
  idx._meta.archived = have;
  idx._meta.needsCapture = miss;
  idx._meta.archivedNote = `${have}/${idx.documents.length} already have a Wayback snapshot (pre-geoblock). ${miss} need Brazilian capture (#139).`;
  fs.writeFileSync(IDX, JSON.stringify(idx, null, 2) + '\n');
  console.log(`Linked Wayback snapshots: ${have} archived, ${miss} need capture.`);
}
if (require.main === module) main();
module.exports = { norm };
