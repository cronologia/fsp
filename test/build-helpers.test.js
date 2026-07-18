'use strict';
// Unit tests for build.js's pure helpers (zero-dependency; node --test).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { esc, ptlYear, ptlStateFor, legStateFor, courtEventYears, fspBlocStats } = require('../build.js');

const NOW = 2026;

test('esc escapes HTML metacharacters', () => {
  assert.equal(esc('<a href="x">&\'</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
  assert.equal(esc(null), '');
  assert.equal(esc(5), '5');
});

test('ptlYear resolves "present" to the current year', () => {
  assert.equal(ptlYear('2010', NOW), 2010);
  assert.equal(ptlYear('present', NOW), NOW);
});

test('ptlStateFor picks the president in office and maps FSP states', () => {
  const c = {
    fspStatus: 'member',
    presidentialSuccession: [
      { name: 'A', party: 'X', start: '2003', end: '2011', fsp: true },
      { name: 'B', party: 'Y', start: '2011', end: 'present', fsp: false },
    ],
  };
  assert.equal(ptlStateFor(c, 2005, NOW).st, 'fsp');
  assert.equal(ptlStateFor(c, 2020, NOW).st, 'non');
  assert.equal(ptlStateFor(c, 1999, NOW).st, 'nodata');
  // Handover year: the incoming president (greatest start ≤ year) wins.
  assert.equal(ptlStateFor(c, 2011, NOW).p.name, 'B');
});

test('ptlStateFor flags unverified affiliation and one-party states', () => {
  const verify = { fspStatus: 'affiliated (to verify)', presidentialSuccession: [{ name: 'A', party: 'X', start: '2007', end: '2017', fsp: true }] };
  assert.equal(ptlStateFor(verify, 2010, NOW).st, 'fsp-unv');
  const cuba = { fspStatus: 'member', oneParty: true, presidentialSuccession: [{ name: 'F', party: 'PCC', start: '1976', end: 'present', fsp: true }] };
  assert.equal(ptlStateFor(cuba, 2000, NOW).st, 'fsp-op');
});

test('legStateFor returns the bloc spanning a year', () => {
  const c = {
    legislativeControl: [
      { start: '2006', end: '2025', fspBloc: 'majority' },
      { start: '2025', end: 'present', fspBloc: 'opposition' },
    ],
  };
  assert.equal(legStateFor(c, 2010, NOW).fspBloc, 'majority');
  assert.equal(legStateFor(c, 2026, NOW).fspBloc, 'opposition');
  assert.equal(legStateFor(c, 1990, NOW), null);
});

test('fspBlocStats keeps opposition-aligned FSP seats out of the governing bloc', () => {
  // Mexico-2024-shaped: MORENA+PT govern, PRD is FSP-listed but sits in opposition.
  const e = {
    totalSeats: 500, majorityThreshold: 251,
    government: { fspInGovernment: true, hasMajority: true },
    parties: [
      { abbr: 'MORENA', seats: 236, align: 'government', fsp: true },
      { abbr: 'PT', seats: 51, align: 'government', fsp: true },
      { abbr: 'PVEM', seats: 77, align: 'government' },
      { abbr: 'PRD', seats: 1, align: 'opposition', fsp: true },
      { abbr: 'PAN', seats: 135, align: 'opposition' },
    ],
  };
  const st = fspBlocStats(e);
  assert.equal(st.bloc, 287); // NOT 288 — the PRD seat stays out
  assert.equal(st.opp, 1);
  assert.equal(st.label, 'FSP member parties in government');
  assert.match(st.tail, /in its own right/);
});

test('fspBlocStats maps the majority/coalition/minority/opposition tails', () => {
  const base = (over) => fspBlocStats({
    totalSeats: 100, majorityThreshold: 51,
    government: { fspInGovernment: true, hasMajority: true, ...over.g },
    parties: over.p,
  });
  // FSP bloc short of the line but coalition has a majority → coalition tail.
  const coal = base({ p: [{ seats: 40, align: 'government', fsp: true }, { seats: 20, align: 'government' }, { seats: 40, align: 'opposition' }], g: {} });
  assert.match(coal.tail, /non-FSP coalition partners/);
  assert.equal(coal.label, 'FSP member parties together'); // no FSP seats in opposition → plain label
  // Presidency without a chamber majority.
  const min = base({ p: [{ seats: 40, align: 'government', fsp: true }, { seats: 60, align: 'opposition' }], g: { hasMajority: false } });
  assert.match(min.tail, /not a majority/);
  // FSP out of government entirely: all FSP seats count, opposition tail.
  const opp = fspBlocStats({
    totalSeats: 100, majorityThreshold: 51,
    government: { fspInGovernment: false, hasMajority: true },
    parties: [{ seats: 30, align: 'opposition', fsp: true }, { seats: 70, align: 'government' }],
  });
  assert.equal(opp.bloc, 30);
  assert.match(opp.tail, /sat in opposition/);
});

test('courtEventYears extracts 4-digit years ≥1990 from period strings', () => {
  // Naive year extraction; only ever called on packing/purge/reform periods
  // (never on "…(context)" composition entries), so pre-1990 filtering suffices.
  assert.deepEqual(courtEventYears('2015'), [2015]);
  assert.deepEqual(courtEventYears('2011 & 2017'), [2011, 2017]);
  assert.deepEqual(courtEventYears('2016–2017'), [2016, 2017]);
  assert.deepEqual(courtEventYears('1989 (pre-democracy)'), []); // below 1990 → filtered
});
