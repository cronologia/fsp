'use strict';
// Tests for the zero-dep parsers/generators.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parse } = require('../scripts/parse-official-index.js');
const { norm } = require('../scripts/link-official-archives.js');
const catalog = require('../scripts/gen-catalog.js');

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

test('gen-catalog produces markdown with the expected sections', () => {
  const md = catalog.generate();
  assert.match(md, /^# Reference catalog/);
  assert.match(md, /## Countries & FSP presidents/);
  assert.match(md, /## References/);
  assert.ok(md.length > 1000);
});
