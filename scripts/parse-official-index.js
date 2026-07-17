#!/usr/bin/env node
'use strict';
/**
 * parse-official-index.js — extract the official document index from a saved copy
 * of forodesaopaulo.org/documentos/ (captured from Brazil; see ADR-0012 and the
 * vault at data/archive/official-site/). Zero-dependency (ADR-0001).
 *
 * The page is a WordPress listing: each item has an `entry-title` anchor (title +
 * URL), a `post_date`, and `category tag` links. We emit one record per document.
 *
 * Usage: node scripts/parse-official-index.js
 * Output: data/declarations/official-index.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'data', 'archive', 'official-site', 'documentos-forodesaopaulo-2026-07-14.html');
const OUT = path.join(ROOT, 'data', 'declarations', 'official-index.json');

const decode = (s) =>
  s.replace(/&#8211;/g, '–').replace(/&#8212;/g, '—').replace(/&#8217;/g, '’')
    .replace(/&#8220;|&#8221;/g, '"').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n))
    .replace(/&amp;/g, '&').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

function category(url, title) {
  const u = url.toLowerCase();
  if (/consenso-de-nuestra|consenso-de-nossa|declaracao-de-sao-paulo/.test(u)) return 'doctrine';
  if (/declaracao-final|declaracion-final|declaraciones-finales/.test(u) || /declaraci[oó]n final/i.test(title)) return 'declaration';
  if (/memoria/.test(u)) return 'memoria';
  if (/documento-base/.test(u)) return 'base-document';
  if (/nota-del-gt|del-gt|grupo-de-trabajo|reunion-del-grupo/.test(u)) return 'working-group';
  if (/resolucion|resolucao/.test(u)) return 'resolution';
  return 'other';
}

function parse(html) {
  const body = html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '');
  const items = [...body.matchAll(
    /<h5[^>]*entry-title[^>]*>\s*<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h5>([\s\S]*?)(?=<h5[^>]*entry-title|<\/article>|$)/gi
  )];
  const seen = new Set();
  const out = [];
  for (const m of items) {
    const url = m[1];
    if (seen.has(url)) continue;
    seen.add(url);
    const title = decode(m[2]);
    const dm = m[3].match(/post_date[\s\S]*?>([^<]{4,40})<\/a>/i) || m[3].match(/post_date[^>]*>([^<]{4,40})</i);
    out.push({ title, url, date: dm ? decode(dm[1]) : '', category: category(url, title) });
  }
  return out;
}

function main() {
  const html = fs.readFileSync(SRC, 'utf8');
  const docs = parse(html);
  const counts = docs.reduce((a, d) => ((a[d.category] = (a[d.category] || 0) + 1), a), {});
  const payload = {
    _meta: {
      source: 'https://forodesaopaulo.org/documentos/',
      captured: '2026-07-14',
      note: 'Captured from Brazil (issue #137); forodesaopaulo.org geoblocks non-BR IPs (ADR-0012). Titles/URLs/dates only — document full text is still geoblocked.',
      generatedBy: 'scripts/parse-official-index.js',
      count: docs.length,
      byCategory: counts,
    },
    documents: docs,
  };
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
  console.log(`Wrote ${OUT} — ${docs.length} documents`, counts);
}

if (require.main === module) main();
module.exports = { parse };
