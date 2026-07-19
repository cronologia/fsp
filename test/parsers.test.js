'use strict';
// Tests for the zero-dep parsers/generators.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parse } = require('../scripts/parse-official-index.js');
const { norm } = require('../scripts/link-official-archives.js');
const catalog = require('../scripts/gen-catalog.js');
const {
  collectUrls,
  collectCountryUrls,
  loadCountryUrls,
} = require('../scripts/archive-refs.js');

test('parse-official-index extracts title, url, date and category', () => {
  const html = `
    <article>
    <span><a href="https://forodesaopaulo.org/category/documentos/declaraciones-finales/" rel="category tag">Declaraciones Finales</a></span>
    <h5 class="entry-title"><a href="https://forodesaopaulo.org/declaracion-final-del-xx-encuentro-del-foro-de-sao-paulo/" rel="bookmark"><span>Declaraci&#243;n Final del XX Encuentro</span></a></h5>
    <div class="post_meta"><span class="post_meta_item post_date"><a href="#">2 de septiembre de 2014</a></span></div>
    <h5 class="entry-title"><a href="https://forodesaopaulo.org/memoria-del-xx-encuentro-del-foro-de-sao-paulo/"><span>Memoria del XX Encuentro</span></a></h5>
    <div class="post_meta"><span class="post_date"><a href="#">16 de octubre de 2014</a></span></div>
    </article>`;
  const docs = parse(html);
  assert.equal(docs.length, 2);
  assert.equal(docs[0].title, 'Declaración Final del XX Encuentro');
  assert.equal(docs[0].category, 'declaration');
  assert.equal(docs[0].date, '2 de septiembre de 2014');
  assert.equal(docs[1].category, 'memoria');
});

test('parse-official-index de-duplicates repeated URLs', () => {
  const html = `
    <h5 class="entry-title"><a href="https://forodesaopaulo.org/x/"><span>One</span></a></h5><div class="post_date"><a>a</a></div>
    <h5 class="entry-title"><a href="https://forodesaopaulo.org/x/"><span>One again</span></a></h5><div class="post_date"><a>b</a></div>`;
  assert.equal(parse(html).length, 1);
});

test('link norm collapses scheme/port/trailing-slash/www', () => {
  assert.equal(norm('https://forodesaopaulo.org/x/'), 'forodesaopaulo.org/x');
  assert.equal(norm('http://forodesaopaulo.org:80/x'), 'forodesaopaulo.org/x');
  assert.equal(norm('https://www.forodesaopaulo.org/X/'), 'forodesaopaulo.org/x');
});

test('archive-refs collectCountryUrls walks nested source arrays', () => {
  const dossier = {
    fspMembershipSources: ['https://a.example/membership'],
    courtHistorySources: ['https://b.example/court', 'not-a-url'],
    supremeCourt: {
      benchControl: [
        { sources: ['https://c.example/bench', 'https://c.example/bench'] },
      ],
    },
    legislativeComposition: [
      { sources: ['http://d.example/comp'] },
      { sources: [] },
    ],
    // keys that are not source arrays must be ignored, even if URL-valued
    homepage: 'https://ignored.example',
  };
  const urls = new Set();
  collectCountryUrls(dossier, urls);
  assert.deepEqual(
    [...urls].sort(),
    [
      'http://d.example/comp',
      'https://a.example/membership',
      'https://b.example/court',
      'https://c.example/bench',
    ]
  );
});

test('archive-refs collectUrls merges country URLs and keeps official flag', () => {
  const data = {
    references: [
      { url: 'https://official.example', official: true },
      { url: 'https://shared.example' },
    ],
  };
  const countryUrls = new Set(['https://shared.example', 'https://country-only.example']);
  const merged = collectUrls(data, countryUrls);
  const byUrl = new Map(merged.map((e) => [e.url, e.official]));
  assert.equal(merged.length, 3); // shared.example de-duplicated
  assert.equal(byUrl.get('https://official.example'), true);
  assert.equal(byUrl.get('https://shared.example'), false);
  assert.equal(byUrl.get('https://country-only.example'), false);
});

test('archive-refs loadCountryUrls reads the real dossiers', () => {
  const urls = loadCountryUrls();
  assert.ok(urls.size > 50, `expected many country source URLs, got ${urls.size}`);
  for (const u of urls) assert.match(u, /^https?:\/\//);
});

test('gen-catalog produces markdown with the expected sections', () => {
  const md = catalog.generate();
  assert.match(md, /^# Reference catalog/);
  assert.match(md, /## Countries & FSP presidents/);
  assert.match(md, /## References/);
  assert.ok(md.length > 1000);
});
