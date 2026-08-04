'use strict';
/**
 * Every published claim that rests on the declaration corpus, re-checked.
 *
 * Why this test exists
 * --------------------
 * #210 found the corpus was a fifth of itself and one document unsearchable,
 * and a published claim-check drawn from it was wrong in both halves. It was
 * found because someone happened to re-open the question — not because
 * anything watched it. #212 asked whether other statements rested on the same
 * broken text. This is the answer, kept runnable: each claim below is stated
 * where the dataset states it, and asserted against `data/declarations/text/`
 * as it stands. If the corpus changes again, the claims are re-checked with it
 * rather than at whatever point someone next thinks to ask.
 *
 * The controls
 * ------------
 * `test/declaration-corpus.test.js` asserts the corpus is whole by shape.
 * This file re-asserts it by search, because that is the operation the claims
 * actually depend on: before any zero is trusted below, a probe drawn from the
 * 94% mark AND from the 60% mark of every one of the nineteen documents must
 * come back, in both accent-literal and accent-folded form. A control that
 * only proves a document is readable — `Cuba`, which is in all of them — would
 * have passed on the truncated corpus too. That distinction is the whole
 * lesson of #212: a positive control for an absence claim has to test
 * completeness, not legibility.
 *
 * Two search conventions, both load-bearing:
 *   - accented strings are searched LITERALLY. `Chávez` is not `Chavez`.
 *     A folded pass runs alongside to catch the case where the two disagree.
 *   - whitespace is normalised on both sides before matching, because the
 *     extracted text carries the PDF's line breaks mid-phrase.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(__dirname, '..', 'data', 'declarations', 'text');
const forum = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'forum.json'), 'utf8'));
const index = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'));

const DOCS = Object.entries(index.declarations)
  .filter(([, d]) => d.chars)
  .map(([n, d]) => ({
    n,
    year: d.year,
    text: fs.readFileSync(path.join(DIR, `${n}-${d.year}.txt`), 'utf8').replace(/\s+/g, ' ').trim(),
  }))
  .sort((a, b) => a.n.localeCompare(b.n));

const ns = (s) => s.replace(/\s+/g, ' ').trim();
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Years whose text contains `phrase`, accents matched literally. */
const yearsWith = (phrase) => DOCS.filter((d) => d.text.includes(ns(phrase))).map((d) => d.year);
/** Same, ignoring accents and case — a second opinion on every zero. */
const yearsWithFolded = (phrase) =>
  DOCS.filter((d) => fold(d.text).includes(fold(ns(phrase)))).map((d) => d.year);
/** Occurrences of `term` as a whole word, per year. Acronyms need this: a bare
 *  substring search reports MLN wherever FMLN appears. */
function wordCounts(term) {
  const re = new RegExp(`(?<![A-Za-zÀ-ÿ0-9])${esc(term)}(?![A-Za-zÀ-ÿ0-9])`, 'g');
  const out = {};
  for (const d of DOCS) {
    const n = (d.text.match(re) || []).length;
    if (n) out[d.year] = n;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Controls first. Nothing below means anything until these pass.
// ---------------------------------------------------------------------------

test('CONTROL: every declaration answers a search at its middle and its end', () => {
  const fails = [];
  for (const d of DOCS) {
    for (const [where, frac] of [['60%', 0.6], ['94%', 0.94]]) {
      const probe = d.text.slice(Math.floor(d.text.length * frac))
        .replace(/^\S*\s/, '').slice(0, 40).replace(/\s+\S*$/, '');
      if (probe.length < 20) { fails.push(`${d.n}-${d.year}: no probe at ${where}`); continue; }
      if (!yearsWith(probe).includes(d.year)) fails.push(`${d.n}-${d.year}: literal probe at ${where} not found`);
      if (!yearsWithFolded(probe).includes(d.year)) fails.push(`${d.n}-${d.year}: folded probe at ${where} not found`);
    }
  }
  assert.deepStrictEqual(fails, [],
    `a document does not answer a search past its opening pages, so every ` +
    `absence asserted below is unsupported. This is the control the pre-#210 ` +
    `checks lacked: they used a term present in all nineteen files, which ` +
    `proves legibility and says nothing about completeness.\n${fails.join('\n')}`);
});

test('CONTROL: accents survive into the committed text', () => {
  // The claims below search accented strings literally. If an encoding step
  // ever strips accents, `Chávez` would return zero everywhere and read as a
  // finding rather than as a broken corpus.
  const flat = DOCS.filter((d) => !/[áéíóúñÁÉÍÓÚÑçãõâêô]/.test(d.text)).map((d) => `${d.n}-${d.year}`);
  assert.deepStrictEqual(flat, [], `declaration(s) carry no accented characters.\n${flat.join('\n')}`);
});

// ---------------------------------------------------------------------------
// data/forum.json → armedMovements.declarationCheck
// ---------------------------------------------------------------------------

test('the FARC is named in exactly one declaration, and it is 2013', () => {
  // The claim as published: "the FARC named just once in nineteen
  // declarations, in 2013 backing the Havana peace talks". The pre-#210
  // answer was "appears in none of the nineteen", which was an artefact.
  const counts = wordCounts('FARC');
  assert.deepStrictEqual(counts, { 2013: 1 },
    `armedMovements.declarationCheck says the FARC is named once, in 2013. ` +
    `Found: ${JSON.stringify(counts)}`);
  assert.deepStrictEqual(yearsWithFolded('Fuerzas Armadas Revolucionarias'), [],
    `the acronym is counted above; the expansion must also be checked, or a ` +
    `spelled-out mention would go unnoticed.`);
  assert.ok(/Diálogos de Paz/i.test(DOCS.find((d) => d.year === 2013).text),
    `the 2013 mention should sit in the passage backing the Havana talks.`);
});

test('the 2002 declaration names neither the FARC nor any absolution of it', () => {
  const d2002 = DOCS.find((d) => d.year === 2002);
  for (const term of ['FARC', 'Fuerzas Armadas Revolucionarias', 'FARC-EP']) {
    assert.ok(!fold(d2002.text).includes(fold(term)),
      `armedMovements.declarationCheck says the 2002 text does not name the ` +
      `FARC; "${term}" is in it.`);
  }
});

test('the 2002 declaration says what the claim-check reports it says', () => {
  // A negative is only half of that entry. The positive half is quoted, and if
  // the quoted passages ever stop matching, the entry is describing a document
  // the corpus no longer holds.
  const d2002 = DOCS.find((d) => d.year === 2002).text;
  assert.ok(d2002.includes('el diálogo y la negociación'),
    `2002 should call dialogue and negotiation the way out of the Colombian conflict.`);
  assert.ok(d2002.includes('es la única salida al conflicto colombiano'),
    `2002 should call that the ONLY way out — the claim-check says "only".`);
  assert.ok(d2002.includes('Rechazamos el Plan Colombia por constituir una estrategia de dominación estadounidense'),
    `2002 should reject Plan Colombia as a strategy of United States domination.`);
});

test('1997 and 1998 each accuse the Colombian state of terrorismo de Estado', () => {
  // Both passages lay beyond the truncation point, and 1998 was unsearchable
  // on top. Between them they are why the original answer was wrong.
  const d1997 = DOCS.find((d) => d.year === 1997).text;
  assert.ok(d1997.includes('en Colombia se profundiza la falta de garantías políticas por el avance del terrorismo de Estado'),
    `1997 should carry the state-terrorism passage quoted in armedMovements.declarationCheck.`);
  assert.ok(d1997.includes('paramlitarismo'),
    `1997 prints "paramlitarismo" — the source's own typo. A search for the ` +
    `correct spelling returns nothing, which is worth knowing before drawing ` +
    `a negative from it.`);
  assert.ok(/insurgentes[^.]*solución política/.test(d1997),
    `1997 should have the war worsening despite insurgent movements seeking a political solution.`);

  const d1998 = DOCS.find((d) => d.year === 1998).text;
  assert.ok(d1998.includes('el terrorismo de Estado -como el de Colombia-'),
    `1998 should name state terrorism "such as Colombia's" outright.`);
});

test('the published FARC claim-check still says what this file checks', () => {
  // Ties the assertions above to the prose they verify. If the entry is
  // rewritten, this fails and the rewrite gets re-checked rather than
  // inheriting a green test.
  const t = ns(forum.armedMovements.declarationCheck);
  for (const phrase of [
    'the FARC named just once in nineteen declarations',
    'neither names the FARC nor absolves anyone',
    'The 1998 declaration names',
  ]) {
    assert.ok(t.includes(phrase),
      `armedMovements.declarationCheck no longer contains "${phrase}". ` +
      `Re-run the check against the corpus and update this test with it.`);
  }
});

// ---------------------------------------------------------------------------
// data/forum.json → criticalPerspectives.works[] (Peña Esclusa, 2009)
// ---------------------------------------------------------------------------

test('the 1995 Montevideo declaration names neither Chávez nor Venezuela', () => {
  const d1995 = DOCS.find((d) => d.year === 1995);
  for (const term of ['Chávez', 'Venezuela']) {
    assert.ok(!d1995.text.includes(term), `1995 contains "${term}" (literal).`);
    assert.ok(!fold(d1995.text).includes(fold(term)), `1995 contains "${term}" (accent-folded).`);
  }
  // The control that makes those two zeros mean something: the same searches
  // return hits elsewhere, so the search itself works.
  assert.ok(yearsWith('Venezuela').length > 5, `"Venezuela" should be found in most later declarations.`);
  assert.ok(yearsWith('Chávez').length > 1, `"Chávez" should be found in more than one declaration.`);
});

test('the first declaration to name Chávez is 2000', () => {
  const literal = yearsWith('Chávez');
  const folded = yearsWithFolded('Chavez');
  assert.strictEqual(Math.min(...literal), 2000,
    `criticalPerspectives works[] dates the first mention to 2000. Found: ${literal.join(', ')}`);
  assert.deepStrictEqual(literal, folded,
    `the accented and unaccented spellings disagree, so one of them is ` +
    `returning a false zero somewhere: ${literal.join(',')} vs ${folded.join(',')}`);
  assert.ok(DOCS.find((d) => d.year === 2000).text.includes('bajo la conducción del presidente Hugo Chávez Frías'),
    `the 2000 mention should be the one greeting a president already in office.`);
});

// ---------------------------------------------------------------------------
// data/forum.json → meetings[]
// ---------------------------------------------------------------------------

test('the 2005 declaration corroborates the numbered sequence, Quito 2003 included', () => {
  // meetings[] records Quito 2003 as outside the official numbered sequence,
  // on the authority of the declarations book's chapter numbering. The 2005
  // declaration says so in its own voice: twelve encuentros in fifteen years,
  // and it lists them.
  const d2005 = DOCS.find((d) => d.year === 2005).text;
  assert.ok(d2005.includes('a través de los 12 encuentros'),
    `the XII declaration should count twelve encuentros to 2005 — which leaves ` +
    `no numbered meeting for 2003 or 2004.`);
  const roll = [
    ['Ciudad de México en 1991 (II Encuentro)', 'II', 1991],
    ['1998 (VIII)', 'VIII', 1998],
    ['Managua en 1992 (III)', 'III', 1992],
    ['2000 (IX)', 'IX', 2000],
    ['La Habana en 1993 (IV)', 'IV', 1993],
    ['2001 (X)', 'X', 2001],
    ['Montevideo en 1995 (V)', 'V', 1995],
    ['San Salvador en 1996 (VI)', 'VI', 1996],
    ['Porto Alegre en 1997 (VII)', 'VII', 1997],
    ['Antigua, Guatemala en 2002 (XI)', 'XI', 2002],
  ];
  for (const [quote, edition, year] of roll) {
    assert.ok(d2005.includes(quote), `2005 should list ${edition} = ${year}: "${quote}"`);
    const m = forum.meetings.find((x) => x.year === year && x.edition === edition);
    assert.ok(m, `forum.json records no ${edition} Encuentro in ${year}, but the 2005 declaration does.`);
  }
  const numbered2003 = forum.meetings.filter((m) => m.year === 2003 && m.edition && m.edition !== '—');
  assert.deepStrictEqual(numbered2003, [],
    `meetings[] gives 2003 a Roman-numeral edition the declarations do not.`);
});

// ---------------------------------------------------------------------------
// data/forum.json → membershipRosters[]
// ---------------------------------------------------------------------------

test('the founding roster reconciles with the 1990 declaration s own figure', () => {
  // The rosters come from Regalado, not from the declarations. Only the 1990
  // one claims to reconcile with a documented figure, and that figure is now
  // readable in the declaration itself.
  const founding = forum.membershipRosters.find((r) => r.year === 1990);
  const orgs = founding.byCountry.reduce((n, c) => n + c.orgs.length, 0);
  assert.strictEqual(orgs, 48, `the founding roster should hold 48 organizations; it holds ${orgs}.`);
  assert.strictEqual(founding.byCountry.length, 14,
    `the founding roster should span 14 countries; it spans ${founding.byCountry.length}.`);
  assert.ok(DOCS.find((d) => d.year === 1990).text.includes('representantes de 48 organizaciones, partidos y frentes de izquierda'),
    `the 1990 declaration should state the figure of 48 in its own opening.`);
});
