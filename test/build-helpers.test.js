'use strict';
// Unit tests for build.js's pure helpers (zero-dependency; node --test).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { esc, ptlYear, ptlStateFor, legStateFor, benchStateFor, benchCellText, courtEventYears, fspBlocStats, fspLegControl, fspBenchMajority } = require('../build.js');

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

test('benchStateFor returns the bench-control band spanning a year', () => {
  const c = {
    supremeCourt: {
      benchControl: [
        { start: '1999', end: '2003', control: 'partial' },
        { start: '2004', end: 'present', control: 'aligned', size: 32, fspAppointed: 32 },
      ],
    },
  };
  assert.equal(benchStateFor(c, 2000, NOW).control, 'partial');
  assert.equal(benchStateFor(c, 2004, NOW).control, 'aligned');
  assert.equal(benchStateFor(c, NOW, NOW).control, 'aligned'); // "present" resolves to now
  assert.equal(benchStateFor(c, 1995, NOW), null); // uncovered years are no-data, never guessed
  assert.equal(benchStateFor({}, 2000, NOW), null); // no supremeCourt at all
});

test('benchStateFor prefers the band with the greatest start on overlap years', () => {
  const c = {
    supremeCourt: {
      benchControl: [
        { start: '2005', end: '2015', control: 'partial' },
        { start: '2015', end: 'present', control: 'aligned' },
      ],
    },
  };
  assert.equal(benchStateFor(c, 2015, NOW).control, 'aligned');
});

test('benchCellText includes seat counts only when both numbers are sourced', () => {
  assert.equal(
    benchCellText('Venezuela', 2016, { control: 'aligned', size: 32, fspAppointed: 32 }),
    'Venezuela 2016: aligned — 32 of 32 justices appointed under FSP-era governments'
  );
  // Qualitative-only band: no invented counts.
  assert.equal(benchCellText('Bolivia', 2015, { control: 'aligned', size: null, fspAppointed: null }), 'Bolivia 2015: aligned');
  assert.equal(benchCellText('Argentina', 2010, { control: 'aligned', size: null, fspAppointed: 4 }), 'Argentina 2010: aligned');
});

test('courtEventYears extracts 4-digit years ≥1990 from period strings', () => {
  // Naive year extraction; only ever called on packing/purge/reform periods
  // (never on "…(context)" composition entries), so pre-1990 filtering suffices.
  assert.deepEqual(courtEventYears('2015'), [2015]);
  assert.deepEqual(courtEventYears('2011 & 2017'), [2011, 2017]);
  assert.deepEqual(courtEventYears('2016–2017'), [2016, 2017]);
  assert.deepEqual(courtEventYears('1989 (pre-democracy)'), []); // below 1990 → filtered
});

test('fspLegControl counts majority, single-party and plurality as control', () => {
  const c = { legislativeControl: [
    { start: '2000', end: '2004', fspBloc: 'majority' },
    { start: '2004', end: '2008', fspBloc: 'plurality' },
    { start: '2008', end: '2012', fspBloc: 'minority' },
    { start: '2012', end: 'present', fspBloc: 'opposition' },
  ] };
  assert.equal(fspLegControl(c, 2002, NOW), 'majority');
  assert.equal(fspLegControl(c, 2006, NOW), 'plurality');
  assert.equal(fspLegControl(c, 2010, NOW), null); // minority is not "control"
  assert.equal(fspLegControl(c, 2020, NOW), null); // opposition is not "control"
  assert.equal(fspLegControl({}, 2020, NOW), null); // no bands → null
});

test('fspBenchMajority is true only for an aligned bench band', () => {
  const c = { supremeCourt: { benchControl: [
    { start: '2010', end: '2015', control: 'aligned' },
    { start: '2015', end: 'present', control: 'partial' },
  ] } };
  assert.equal(fspBenchMajority(c, 2012, NOW), true);
  assert.equal(fspBenchMajority(c, 2020, NOW), false); // partial → not a majority
  assert.equal(fspBenchMajority(c, 2005, NOW), false); // no band covers the year
  assert.equal(fspBenchMajority({}, 2012, NOW), false);
});
