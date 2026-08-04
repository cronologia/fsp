'use strict';
/**
 * The declaration corpus is complete enough to draw a negative from.
 *
 * Why this test exists
 * --------------------
 * `data/declarations/text/` is the project's primary source for questions of
 * the form "does the Foro de São Paulo ever say X?". Answering those means
 * reporting an ABSENCE, and an absence is only worth anything if the corpus is
 * whole. It was not.
 *
 * The extractor located each stream's end by searching for the next
 * `endstream`. Those bytes occur by chance inside FlateDecode output, so the
 * first stream ended early, the scan resumed inside compressed data and never
 * re-synced to the next object. Every document was page one and nothing after
 * it — 69,898 characters where there are 340,593, about 20% — and each file
 * ended mid-sentence with no error raised anywhere. A published claim-check
 * ("the FARC appears in none of the nineteen declarations") was drawn from that
 * corpus and was wrong: it appears in 2013.
 *
 * A second defect had the same shape. The 1998 declaration stores every glyph
 * twice — DDEECCLLAARRAACCIIOONN — with single spaces between words. It reads
 * fine to a human skimming it, and it made that whole document unsearchable,
 * because `FARC` is stored as `FFAARRCC`. Its header date and edition were also
 * unmineable, so it silently sat in the index with neither.
 *
 * Both failures were invisible: no exception, no empty file, no obviously
 * broken output. So the checks below are about SHAPE rather than content —
 * truncation and doubling each leave a signature, and this asserts neither is
 * present.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(__dirname, '..', 'data', 'declarations', 'text');
const index = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'));
const entries = Object.entries(index.declarations)
  .filter(([, d]) => d.chars)
  .map(([n, d]) => ({ n, ...d, file: path.join(DIR, `${n}-${d.year}.txt`) }));

test('the corpus was found, and every declaration is in it', () => {
  assert.strictEqual(entries.length, 19,
    `expected 19 extracted declarations, found ${entries.length} — ` +
    `a short corpus makes every absence question unanswerable`);
});

test('no declaration is truncated mid-document', () => {
  // Truncation leaves a sentence hanging. A complete declaration closes on
  // terminal punctuation, a page number, or its own place-and-date line.
  const cut = [];
  for (const d of entries) {
    const t = fs.readFileSync(d.file, 'utf8').replace(/\s+/g, ' ').trim();
    if (!/[.!?"'”’)\]\d]$/.test(t)) cut.push(`${d.n}-${d.year}: …${t.slice(-60)}`);
  }
  assert.deepStrictEqual(cut, [],
    `declaration(s) end mid-sentence, which is what partial PDF extraction ` +
    `looks like. Re-run scripts/extract-declarations.js and check the stream ` +
    `count against the PDF's page count.\n${cut.join('\n')}`);
});

test('every declaration yielded more than one content stream', () => {
  // The truncation bug produced exactly one usable stream per document — page
  // one. Every one of these PDFs is longer than a single page.
  const thin = entries.filter((d) => !(d.contentStreams > 1))
    .map((d) => `${d.n}-${d.year}: ${d.contentStreams} stream(s)`);
  assert.deepStrictEqual(thin, [],
    `a multi-page declaration that yields one content stream is page one and ` +
    `nothing else.\n${thin.join('\n')}`);
});

test('the corpus is the size a corpus of nineteen declarations should be', () => {
  // A floor, not a target. The broken corpus was 69,898 characters; the whole
  // one is 340,593. Anything near the former is the bug returning.
  const total = entries.reduce((n, d) => n + d.chars, 0);
  assert.ok(total > 250000,
    `corpus is ${total} characters across ${entries.length} declarations. ` +
    `The complete corpus is ~340k; the truncated one was ~70k.`);
  const runts = entries.filter((d) => d.chars < 8000)
    .map((d) => `${d.n}-${d.year}: ${d.chars}`);
  assert.deepStrictEqual(runts, [],
    `declaration(s) far shorter than any real final declaration.\n${runts.join('\n')}`);
});

test('no declaration has glyph doubling left in it', () => {
  // Doubling is stored text, not a rendering artifact: it defeats every search
  // over the document while looking correct to a reader. Background rate in a
  // clean file is 1.0-1.4%; a doubled file is 100%.
  const doubled = [];
  for (const d of entries) {
    const t = fs.readFileSync(d.file, 'utf8').replace(/\s+/g, '');
    let same = 0;
    const pairs = Math.floor(t.length / 2);
    for (let i = 0; i < pairs * 2; i += 2) if (t[i] === t[i + 1]) same++;
    const ratio = same / Math.max(1, pairs);
    if (ratio > 0.5) doubled.push(`${d.n}-${d.year}: ${(ratio * 100).toFixed(0)}% doubled pairs`);
  }
  assert.deepStrictEqual(doubled, [],
    `glyph doubling survives in the committed text, so searches over these ` +
    `documents return nothing however many times the term occurs.\n${doubled.join('\n')}`);
});

test('no declaration has doubled one-letter words left in it', () => {
  // The document-wide doubling check above measures a ratio, and a ratio can
  // sit comfortably under threshold while a specific, damaging residue
  // survives. It did: undoubling first ran only on tokens of four characters
  // or more, so the 1998 declaration kept 301 doubled one-letter words — "aa",
  // "yy", "oo", "ee" for a, y, o, e. That reads fine and passes every check
  // above, and it silently breaks any multi-word phrase search that crosses a
  // conjunction, which is most of them: "guerra sucia y el terrorismo de
  // Estado" is stored with "yy" and returns nothing.
  //
  // Doubled UPPERCASE pairs are legitimate here — EE.UU., and Roman numerals
  // like XX, II, VII — so only lowercase is asserted on. No Spanish or
  // Portuguese word is a doubled single lowercase letter.
  const residue = [];
  for (const d of entries) {
    const t = fs.readFileSync(d.file, 'utf8').replace(/\s+/g, ' ');
    const hits = t.match(/(?<![A-Za-zÀ-ÿ])([a-zà-ÿ])\1(?![A-Za-zÀ-ÿ])/g) || [];
    if (hits.length) {
      residue.push(`${d.n}-${d.year}: ${hits.length} × ${[...new Set(hits)].join(', ')}`);
    }
  }
  assert.deepStrictEqual(residue, [],
    `doubled one-letter words survive in the committed text. Phrase searches ` +
    `over these documents return false negatives wherever the phrase crosses ` +
    `one. Check the per-document token floor in undouble().\n${residue.join('\n')}`);
});

test('every declaration carries the header date it was mined for', () => {
  // The reason the corpus exists (#28 phase 2 → #3). 1997 and 2000 genuinely
  // print no dateline in the PDF; everything else must have one, and 1998 only
  // gained its date once the doubling was undone.
  const NO_DATELINE_IN_PDF = new Set(['07', '09']);
  const undated = entries
    .filter((d) => !d.headerDate && !NO_DATELINE_IN_PDF.has(d.n))
    .map((d) => `${d.n}-${d.year}`);
  assert.deepStrictEqual(undated, [],
    `declaration(s) with no mined header date. If the PDF really prints none, ` +
    `add the number to NO_DATELINE_IN_PDF with that reason; otherwise the ` +
    `extraction is damaged upstream of the dateline.\n${undated.join('\n')}`);
});
