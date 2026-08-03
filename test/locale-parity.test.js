'use strict';
// Locale parity tests (#197): the compiler emits three page trees from one
// dataset, and until now nothing in the suite asserted anything about es/pt —
// a regression that dropped a locale, broke a redirect stub or silently
// un-translated a page would have gone green. Two of those failure modes have
// already bitten the family (the hub's stale "fsp has no locale tree" special
// case, cronologia.github.io#25; rcc's gazetteer lookup against the localized
// string, core#3), so these assertions run against the committed docs/ trees
// and the committed dictionaries, independent of how the dicts are produced.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const I18N = require('../i18n');

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const BASE = I18N.BASE; // https://cronologia.github.io/fsp/
const NON_EN = I18N.LOCALES.filter((l) => l !== 'en');

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'forum.json'), 'utf8'));
const countryFiles = fs
  .readdirSync(path.join(ROOT, 'data', 'countries'))
  .filter((f) => f.endsWith('.json') && f !== 'index.json');
const countries = countryFiles.map((f) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'countries', f), 'utf8'))
);
const countriesIndex = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data', 'countries', 'index.json'), 'utf8')
);

/** Every route the build emits per locale ('' is the index page). */
const ROUTES = [''].concat(
  data.meetings.map((m) => `meetings/${m.year}.html`),
  countries.map((c) => `countries/${c.code}.html`)
);

const pageFile = (lang, route) => path.join(DOCS, lang, route === '' ? 'index.html' : route);
const stubFile = (route) => path.join(DOCS, route === '' ? 'index.html' : route);

const relHtmlFiles = (dir) => {
  const out = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) out.push(path.relative(dir, p));
    }
  };
  walk(dir);
  return out.sort();
};

// ---------------------------------------------------------------------------
// Tree parity
// ---------------------------------------------------------------------------

test('locale trees are complete and structurally identical', () => {
  const enPages = relHtmlFiles(path.join(DOCS, 'en'));
  assert.equal(enPages.length, ROUTES.length, 'docs/en/ page count matches the dataset-derived route list');
  for (const lang of NON_EN) {
    assert.deepEqual(relHtmlFiles(path.join(DOCS, lang)), enPages, `docs/${lang}/ mirrors docs/en/ path-for-path`);
  }
  for (const route of ROUTES) {
    for (const lang of I18N.LOCALES) {
      assert.ok(fs.existsSync(pageFile(lang, route)), `missing page: ${lang}/${route || 'index.html'}`);
    }
  }
});

// ---------------------------------------------------------------------------
// Redirect stubs (pre-i18n URLs stay alive)
// ---------------------------------------------------------------------------

test('every pre-i18n URL resolves to a redirect stub into the locale trees', () => {
  for (const route of ROUTES) {
    const f = stubFile(route);
    assert.ok(fs.existsSync(f), `missing redirect stub: ${route || 'index.html'}`);
    const html = fs.readFileSync(f, 'utf8');
    assert.ok(
      html.includes(`<link rel="canonical" href="${BASE}en/${route}">`),
      `stub ${route || '/'} canonicalizes to the /en/ page`
    );
    assert.ok(
      html.includes('var supported = ["en","es","pt"]'),
      `stub ${route || '/'} carries the locale-picking redirect script`
    );
    for (const lang of I18N.LOCALES) {
      assert.ok(
        html.includes(`hreflang="${lang}" href="${BASE}${lang}/${route}">`),
        `stub ${route || '/'} lists the ${lang} alternate`
      );
    }
  }
});

// ---------------------------------------------------------------------------
// Disclaimer and hreflang/canonical cluster on every locale page
// ---------------------------------------------------------------------------

test('non-English pages carry the disclaimer; English pages do not', () => {
  for (const route of ROUTES) {
    const en = fs.readFileSync(pageFile('en', route), 'utf8');
    assert.ok(!en.includes('i18n-disclaimer'), `en/${route || 'index.html'} must not carry a disclaimer`);
    for (const lang of NON_EN) {
      const html = fs.readFileSync(pageFile(lang, route), 'utf8');
      assert.ok(html.includes('class="i18n-disclaimer"'), `${lang}/${route || 'index.html'} carries the disclaimer`);
      assert.ok(html.includes(I18N.UI[lang].disclaimer), `${lang}/${route || 'index.html'} carries its own locale's wording`);
    }
  }
});

test('every locale page carries a self-canonical and the full hreflang cluster', () => {
  for (const route of ROUTES) {
    for (const lang of I18N.LOCALES) {
      const html = fs.readFileSync(pageFile(lang, route), 'utf8');
      assert.ok(
        html.includes(`<link rel="canonical" href="${BASE}${lang}/${route}">`),
        `${lang}/${route || 'index.html'} has a self-referential canonical`
      );
      for (const l of I18N.LOCALES) {
        assert.ok(
          html.includes(`<link rel="alternate" hreflang="${l}" href="${BASE}${l}/${route}">`),
          `${lang}/${route || 'index.html'} lists the ${l} alternate`
        );
      }
      assert.ok(
        html.includes(`<link rel="alternate" hreflang="x-default" href="${BASE}${route}">`),
        `${lang}/${route || 'index.html'} lists the x-default alternate (the redirect stub)`
      );
    }
  }
});

// ---------------------------------------------------------------------------
// Dictionary health
// ---------------------------------------------------------------------------

test('es and pt dictionaries have identical keysets, no empty values, valid _meta', () => {
  const parsed = {};
  for (const lang of NON_EN) {
    parsed[lang] = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'i18n', `${lang}.json`), 'utf8'));
    const meta = parsed[lang]._meta;
    assert.ok(meta && typeof meta === 'object', `${lang}.json has a _meta object`);
    assert.equal(meta.targetLang, lang, `${lang}.json _meta.targetLang matches its filename`);
    for (const [k, v] of Object.entries(parsed[lang].strings)) {
      assert.ok(typeof v === 'string' && v.trim() !== '', `${lang}.json value for ${JSON.stringify(k.slice(0, 60))} is a non-empty string`);
    }
  }
  assert.deepEqual(
    Object.keys(parsed.es.strings).sort(),
    Object.keys(parsed.pt.strings).sort(),
    'es and pt cover exactly the same keys'
  );
});

// ---------------------------------------------------------------------------
// Untranslated-record report against the committed baseline (zero), and the
// exact-key discipline: the dictionaries contain ONLY keys that are live
// translatable strings — in the dataset (TRANSLATABLE_KEYS walk, references
// and roster org-lists excluded exactly as localizeDeep excludes them) or in
// build.js's own T()/P() editorial-chrome literals.
// ---------------------------------------------------------------------------

/** Collect the translatable dataset strings, mirroring localizeDeep's walk. */
function collectDatasetStrings(value, out) {
  const walk = (v, k) => {
    if (k === 'references') return;
    if (k === 'membershipRosters' && Array.isArray(v)) {
      for (const r of v) {
        if (r && typeof r === 'object') {
          if (typeof r.title === 'string' && r.title.trim()) out.add(r.title);
          if (typeof r.note === 'string' && r.note.trim()) out.add(r.note);
        }
      }
      return;
    }
    if (Array.isArray(v)) { for (const x of v) walk(x, k); return; }
    if (v && typeof v === 'object') { for (const kk of Object.keys(v)) walk(v[kk], kk); return; }
    if (typeof v === 'string' && I18N.TRANSLATABLE_KEYS.has(k) && v.trim()) out.add(v);
  };
  walk(value, null);
}

/** Extract the string literals build.js routes through T() / P(). */
function collectCompilerLiterals(out) {
  const src = fs.readFileSync(path.join(ROOT, 'build.js'), 'utf8');
  for (const m of src.matchAll(/\b[TP]\('((?:[^'\\]|\\.)*)'/g)) out.add(m[1].replace(/\\'/g, "'"));
  for (const m of src.matchAll(/\b[TP]\(`([^`]*)`/g)) out.add(m[1]);
}

test('dictionary misses stay at the committed baseline of zero, with no dead keys', () => {
  const expected = new Set();
  collectDatasetStrings(data, expected);
  collectDatasetStrings(countries, expected);
  collectDatasetStrings(countriesIndex, expected);
  collectCompilerLiterals(expected);
  assert.ok(expected.size > 400, `sanity: the walk found ${expected.size} translatable strings (a collapse here means the walk broke, not that translation is done)`);

  for (const lang of NON_EN) {
    const dict = I18N.loadDict(lang);
    const misses = [...expected].filter((s) => !Object.prototype.hasOwnProperty.call(dict, s));
    assert.deepEqual(
      misses,
      [],
      `${lang}: ${misses.length} translatable string(s) missing from data/i18n/${lang}.json — new English prose entered ` +
      `the compiler without a translation (ADR: dictionaries are updated in the same commit as the English they translate)`
    );
    const dead = Object.keys(dict).filter((k) => !expected.has(k));
    assert.deepEqual(
      dead,
      [],
      `${lang}: ${dead.length} dead key(s) in data/i18n/${lang}.json — keys must be exact live dataset values or ` +
      `build.js T()/P() literals; prune (or fix) them in the same commit that changed the English`
    );
  }
});

// ---------------------------------------------------------------------------
// Localization-walk invariants: what must NEVER be localized
// ---------------------------------------------------------------------------

test('references, roster org-lists, names and the countries↔forum join key are byte-identical across locales', () => {
  for (const lang of NON_EN) {
    const dict = I18N.loadDict(lang);
    const ldata = I18N.localizeDeep(data, dict);
    const lcountries = I18N.localizeDeep(countries, dict);

    assert.deepEqual(ldata.references, data.references, `${lang}: references[] pass through verbatim`);
    ldata.membershipRosters.forEach((r, i) => {
      assert.deepEqual(r.orgs, data.membershipRosters[i].orgs, `${lang}: roster ${i} org list untouched`);
    });
    ldata.parties.forEach((p, i) => {
      assert.equal(p.name, data.parties[i].name, `${lang}: party name untouched (${data.parties[i].name})`);
    });
    lcountries.forEach((c, i) => {
      assert.equal(c.country, countries[i].country, `${lang}: country join key untouched (${countries[i].country})`);
      assert.equal(c.code, countries[i].code, `${lang}: country code untouched (${countries[i].code})`);
    });
    // The join build.js actually performs: every meeting host resolves to the
    // same dossier (or none) in every locale — the rcc gazetteer trap.
    const codeByCountry = Object.fromEntries(countries.map((c) => [c.country, c.code]));
    ldata.meetings.forEach((m, i) => {
      assert.equal(m.country, data.meetings[i].country, `${lang}: meeting ${m.year} host name untouched`);
      assert.equal(
        codeByCountry[m.country],
        codeByCountry[data.meetings[i].country],
        `${lang}: meeting ${m.year} resolves to the same country dossier`
      );
    });
  }
});
