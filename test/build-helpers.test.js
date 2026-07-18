'use strict';
// Unit tests for build.js's pure helpers (zero-dependency; node --test).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { esc, ptlYear, ptlStateFor, legStateFor, courtEventYears } = require('../build.js');

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

test('courtEventYears extracts 4-digit years ≥1990 from period strings', () => {
  // Naive year extraction; only ever called on packing/purge/reform periods
  // (never on "…(context)" composition entries), so pre-1990 filtering suffices.
  assert.deepEqual(courtEventYears('2015'), [2015]);
  assert.deepEqual(courtEventYears('2011 & 2017'), [2011, 2017]);
  assert.deepEqual(courtEventYears('2016–2017'), [2016, 2017]);
  assert.deepEqual(courtEventYears('1989 (pre-democracy)'), []); // below 1990 → filtered
});
