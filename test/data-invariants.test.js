'use strict';
// Invariants over the real committed data — catches broken seat sums, bad enums,
// or a meeting official-doc that lost its Wayback fallback. Zero-dependency.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const forum = read('data/forum.json');
const index = read('data/countries/index.json');
const countries = index.countries.map((c) => read(`data/countries/${c.code}.json`));

const LEG_BLOCS = new Set(['majority', 'plurality', 'minority', 'opposition', 'single-party']);
const ALIGNS = new Set(['government', 'opposition', 'mixed', 'independent']);

test('legislativeComposition party seats sum to totalSeats', () => {
  for (const c of countries) {
    for (const e of c.legislativeComposition || []) {
      const sum = e.parties.reduce((n, p) => n + (p.seats || 0), 0);
      assert.equal(sum, e.totalSeats, `${c.code} ${e.year} ${e.chamber}: ${sum} ≠ ${e.totalSeats}`);
      for (const p of e.parties) assert.ok(p.align === undefined || ALIGNS.has(p.align), `${c.code} ${e.year}: bad align ${p.align}`);
    }
  }
});

test('legislativeControl uses a valid fspBloc enum and year-parseable bounds', () => {
  for (const c of countries) {
    for (const l of c.legislativeControl || []) {
      assert.ok(LEG_BLOCS.has(l.fspBloc), `${c.code}: bad fspBloc ${l.fspBloc}`);
      assert.ok(/^\d{4}$/.test(l.start), `${c.code}: bad start ${l.start}`);
      assert.ok(l.end === 'present' || /^\d{4}$/.test(l.end), `${c.code}: bad end ${l.end}`);
    }
  }
});

test('presidentialSuccession years are parseable and fsp is boolean', () => {
  for (const c of countries) {
    for (const p of c.presidentialSuccession) {
      assert.equal(typeof p.fsp, 'boolean', `${c.code}: ${p.name} fsp not boolean`);
      assert.ok(/^\d{4}$/.test(p.start), `${c.code}: ${p.name} start ${p.start}`);
      assert.ok(p.end === 'present' || /^\d{4}$/.test(p.end), `${c.code}: ${p.name} end ${p.end}`);
    }
  }
});

test('every meeting officialDoc has a Wayback archive fallback', () => {
  for (const m of forum.meetings) {
    for (const o of m.officialDocs || []) {
      assert.ok(o.url && /^https?:/.test(o.url), `${m.edition}: bad officialDoc url`);
      assert.ok(o.archiveUrl && /web\.archive\.org/.test(o.archiveUrl), `${m.edition} ${o.label}: missing archive fallback`);
    }
  }
});

test('official-index _meta counts match the documents array', () => {
  const idx = read('data/declarations/official-index.json');
  assert.equal(idx._meta.count, idx.documents.length);
  const archived = idx.documents.filter((d) => d.wayback).length;
  assert.equal(idx._meta.archived, archived);
});
