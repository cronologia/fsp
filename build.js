#!/usr/bin/env node
/**
 * Foro de São Paulo — static site generator.
 *
 * Zero dependencies. Reads data/forum.json and compiles a self-contained
 * static website into docs/ (chosen so it can be served directly by GitHub
 * Pages from the `docs/` folder on the default branch).
 *
 * Usage: node build.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { write: writeCatalog } = require('./scripts/gen-catalog');

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data', 'forum.json');
const ARCHIVES_FILE = path.join(ROOT, 'data', 'archives.json');
const COUNTRIES_DIR = path.join(ROOT, 'data', 'countries');
const ARCHIVE_SRC = path.join(ROOT, 'data', 'archive');
const SRC_DIR = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'docs');

// Google Analytics (gtag.js). Injected into the <head> of every generated page.
// The measurement ID is a public identifier, not a secret.
const ANALYTICS = `  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-R9LV1QZHVE"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-R9LV1QZHVE');
  </script>`;

/** Load per-country files (presidential succession + high court). */
function loadCountries() {
  try {
    const index = JSON.parse(fs.readFileSync(path.join(COUNTRIES_DIR, 'index.json'), 'utf8'));
    return (index.countries || [])
      .map((c) => {
        try {
          return JSON.parse(fs.readFileSync(path.join(COUNTRIES_DIR, `${c.code}.json`), 'utf8'));
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

/** Format a 14-digit Wayback timestamp (YYYYMMDDhhmmss) as YYYY-MM-DD. */
function formatArchiveTs(ts) {
  if (!ts || ts.length < 8) return '';
  return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`;
}

/** Load the machine-generated Wayback snapshot cache (url -> snapshot). */
function loadArchives() {
  try {
    const parsed = JSON.parse(fs.readFileSync(ARCHIVES_FILE, 'utf8'));
    return (parsed && parsed.snapshots) || {};
  } catch {
    return {};
  }
}

/** Load the preserved-document manifest (data/archive/index.json): id -> entry. */
function loadArchiveDocs() {
  try {
    const parsed = JSON.parse(fs.readFileSync(path.join(ARCHIVE_SRC, 'index.json'), 'utf8'));
    return (parsed && parsed.docs) || {};
  } catch {
    return {};
  }
}

/** Recursively copy every file under src into dest, preserving structure. */
function copyTree(src, dest) {
  if (!fs.existsSync(src)) return 0;
  let n = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      n += copyTree(s, d);
    } else {
      fs.mkdirSync(dest, { recursive: true });
      fs.copyFileSync(s, d);
      n++;
    }
  }
  return n;
}

/** Minimal HTML escaper for text interpolated into the page. */
function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMeetingPage(m, archives, codeByCountry) {
  const isWb = !!m.declarationUrl && /web\.archive\.org/.test(m.declarationUrl);
  const snap = archives[m.declarationUrl];
  // Always surface a Wayback link: if the declaration link is a live/official
  // page, append its archived snapshot; if it is already a Wayback URL, it is
  // the archive.
  const archLink = snap && snap.archiveUrl && !isWb
    ? ` · <a href="${esc(snap.archiveUrl)}" rel="noopener noreferrer" target="_blank" title="Internet Archive Wayback Machine snapshot">🗄 archived${snap.timestamp ? ` ${esc(formatArchiveTs(snap.timestamp))}` : ''}</a>`
    : '';
  const declLive = m.declarationUrl
    ? `<a href="${esc(m.declarationUrl)}" rel="noopener noreferrer" target="_blank">📄 Final declaration${isWb ? ' (Internet Archive)' : ''}</a>${archLink}`
    : '<span class="muted">Not recovered yet — see issue tracker</span>';
  const code = codeByCountry && codeByCountry[m.country];
  const countryCell = code
    ? `<a href="../countries/${esc(code)}.html">${esc(m.country)}</a>`
    : esc(m.country);
  const unnumbered = m.numbered === false;
  const heading = unnumbered
    ? `Foro de São Paulo — ${esc(m.city)}, ${esc(m.year)}`
    : `${esc(m.edition)} Encontro — ${esc(m.city)}, ${esc(m.year)}`;
  const editionCell = unnumbered
    ? 'Not part of the official numbered series'
    : `${esc(m.edition)}${m.editionVerified ? '' : ' <span class="muted">(to verify)</span>'}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${unnumbered ? esc(m.city) : esc(m.edition)} ${esc(m.year)} — Foro de São Paulo</title>
  <link rel="stylesheet" href="../styles.css" />
${ANALYTICS}
</head>
<body>
  <header class="site-header">
    <div class="wrap">
      <p class="updated"><a href="../index.html#meetings" style="color:#fff">← Foro de São Paulo — Meetings</a></p>
      <h1>${heading}</h1>
      <p class="subtitle">${esc(m.country)}${m.dates ? ` · ${esc(m.dates)}` : ''}</p>
    </div>
  </header>
  <main class="wrap">
    <section>
      <h2>Meeting</h2>
      <dl class="facts">
        <dt>Edition</dt><dd>${editionCell}</dd>
        <dt>Year</dt><dd>${esc(m.year)}</dd>
        <dt>Dates</dt><dd>${m.dates ? esc(m.dates) + (m.datesVerified ? '' : ' (to verify)') : 'year only — to verify'}</dd>
        <dt>Host city</dt><dd>${esc(m.city)}</dd>
        <dt>Country</dt><dd>${countryCell}</dd>
        <dt>Final declaration</dt><dd>${declLive}</dd>
        ${(m.officialDocs && m.officialDocs.length) ? `<dt>Forum's own pages</dt><dd>${m.officialDocs.map((o) => `${esc(o.label || o.type)}: <a href="${esc(o.url)}" rel="noopener noreferrer" target="_blank">official</a>${o.archiveUrl ? ` · <a href="${esc(o.archiveUrl)}" rel="noopener noreferrer" target="_blank" title="Internet Archive snapshot">🗄 archived</a>` : ''}`).join(' · ')} <span class="muted">(the official site is geoblocked to non-Brazilian IPs — use the archived copy)</span></dd>` : ''}
        ${m.notes ? `<dt>Notes</dt><dd>${esc(m.notes)}</dd>` : ''}
      </dl>
    </section>
  </main>
  <footer class="site-footer">
    <div class="wrap"><p>Generated from <code>data/forum.json</code>. <a href="../index.html#meetings">Back to all meetings</a>.</p></div>
  </footer>
</body>
</html>
`;
}

function renderMeetingsRows(meetings, archives = {}) {
  return meetings
    .map((m) => {
      const dates = m.dates
        ? `${esc(m.dates)}${m.datesVerified ? '' : ' <span class="flag" title="dates not verified against a primary source">?</span>'}`
        : '<span class="muted">year only</span>';
      const dsnap = archives[m.declarationUrl];
      const dIsWb = !!m.declarationUrl && /web\.archive\.org/.test(m.declarationUrl);
      const dArch = dsnap && dsnap.archiveUrl && !dIsWb
        ? ` <a class="archive-link" href="${esc(dsnap.archiveUrl)}" rel="noopener noreferrer" target="_blank" title="Wayback Machine snapshot">🗄</a>`
        : '';
      const decl = m.declarationUrl
        ? `<a class="decl-link" href="${esc(m.declarationUrl)}" rel="noopener noreferrer" target="_blank" title="Final declaration">📄 declaration</a>${dArch}`
        : '<span class="muted">—</span>';
      const edLabel = m.numbered === false ? '—' : esc(m.edition);
      const edFlag = m.numbered === false || m.editionVerified
        ? ''
        : ' <span class="flag" title="edition not yet verified against a primary source">?</span>';
      return `        <tr data-country="${esc(m.country)}" data-year="${esc(m.year)}">
          <td class="edition"><a href="meetings/${esc(m.year)}.html">${edLabel}</a>${edFlag}</td>
          <td class="year">${esc(m.year)}</td>
          <td>${dates}</td>
          <td>${esc(m.city)}</td>
          <td>${esc(m.country)}</td>
          <td>${decl}</td>
          <td class="notes">${esc(m.notes)}</td>
        </tr>`;
    })
    .join('\n');
}

function renderMembershipRosters(rosters) {
  if (!rosters || !rosters.length) return '';
  const one = (r) => {
    const total = r.byCountry.reduce((n, c) => n + c.orgs.length, 0);
    const rows = r.byCountry
      .map((c) => `          <dt>${esc(c.country)} <span class="fo-n">${c.orgs.length}</span></dt><dd>${c.orgs.map(esc).join(' · ')}</dd>`)
      .join('\n');
    const heading = `${esc(r.title)} — ${total} organizations, ${r.byCountry.length} countries${cite(r.sources)}`;
    const body = `${r.note ? `<p class="section-intro">${esc(r.note)}</p>` : ''}
        <dl class="facts founding-orgs">
${rows}
        </dl>`;
    // The founding roster is shown open; the larger later snapshots collapse.
    return r.open
      ? `      <h4 class="roster-h">${heading}</h4>
        ${body}`
      : `      <details class="roster">
        <summary><strong>${heading}</strong></summary>
        ${body}
      </details>`;
  };
  return `      <h3>Membership over time</h3>
      <p class="section-intro">The Forum's membership at three documented points, per Regalado (2008). It grew from the 48 founding organizations (1990) across the Caribbean and Central America by 1993, then consolidated by 2007.</p>
${rosters.map(one).join('\n')}`;
}

function renderParties(parties) {
  return parties
    .map((p) => {
      const founding =
        p.founding === true
          ? '<span class="badge badge-founding">founding member</span>'
          : p.founding === false
          ? '<span class="badge badge-later">later member</span>'
          : '<span class="badge badge-unknown">status to verify</span>';
      const figures = (p.figures && p.figures.length)
        ? `<p class="figures"><strong>Key figures:</strong> ${esc(p.figures.join(', '))}</p>`
        : '';
      const notes = p.notes ? `<p class="party-notes">${esc(p.notes)}</p>` : '';
      return `      <article class="party-card">
        <h3>${esc(p.name)}${p.abbr ? ` <span class="abbr">(${esc(p.abbr)})</span>` : ''}</h3>
        <p class="country">${esc(p.country)} ${founding}</p>
        ${figures}
        ${notes}
      </article>`;
    })
    .join('\n');
}

function renderComparison(c) {
  if (!c || !c.rows || !c.rows.length) return '';
  const rows = c.rows
    .map(
      (r) => `        <tr>
          <td class="cmp-dim">${esc(r.dimension)}</td>
          <td>${esc(r.foro)}</td>
          <td>${esc(r.puebla)}</td>
        </tr>`
    )
    .join('\n');
  return `      <h3>Foro de São Paulo vs. Grupo de Puebla</h3>
      <div class="table-scroll">
        <table class="meetings">
          <thead><tr><th></th><th>Foro de São Paulo</th><th>Grupo de Puebla</th></tr></thead>
          <tbody>
${rows}
          </tbody>
        </table>
      </div>`;
}

function renderRelated(orgs) {
  if (!orgs || !orgs.length) return '';
  return orgs
    .map((o) => {
      const meta = [o.founded, o.place].filter(Boolean).map(esc).join(' · ');
      const link = o.url
        ? `<p class="related-link"><a href="${esc(o.url)}" rel="noopener noreferrer" target="_blank">${esc(o.url)}</a></p>`
        : '';
      return `      <article class="related-card">
        <h3>${esc(o.name)}</h3>
        ${meta ? `<p class="related-meta">${meta}</p>` : ''}
        ${o.composition ? `<p><strong>Composition:</strong> ${esc(o.composition)}</p>` : ''}
        ${o.relationToForum ? `<p><strong>Relation to the Foro:</strong> ${esc(o.relationToForum)}</p>` : ''}
        ${link}
      </article>`;
    })
    .join('\n');
}

function renderMembersInGovernment(mg, codeByCountry) {
  if (!mg || !mg.entries || !mg.entries.length) return '';
  const rows = mg.entries
    .map((e) => {
      const code = codeByCountry && codeByCountry[e.country];
      const countryCell = code
        ? `<a href="countries/${esc(code)}.html">${esc(e.country)}</a>`
        : esc(e.country);
      return `        <tr>
          <td>${countryCell}</td>
          <td>${esc(e.party)}</td>
          <td>${esc(e.fspStatus)}</td>
          <td class="heads">${esc(e.heads)}</td>
        </tr>`;
    })
    .join('\n');
  return `    <section id="government">
      <h2>Member parties in government</h2>
      <p class="section-intro">${esc(mg.note)}</p>
      <div class="table-scroll">
        <table class="meetings">
          <thead>
            <tr><th>Country</th><th>Party</th><th>FSP status</th><th>Heads of state (party)</th></tr>
          </thead>
          <tbody>
${rows}
          </tbody>
        </table>
      </div>
    </section>
`;
}

function renderCriticalPerspectives(cp) {
  if (!cp || !cp.works || !cp.works.length) return '';
  const cards = cp.works
    .map((w) => {
      const meta = [w.author, w.year, w.publisher].filter(Boolean).map(esc).join(' · ');
      const link = w.url
        ? `<p class="cp-link"><a href="${esc(w.url)}" rel="noopener noreferrer" target="_blank">${esc(w.url)}</a></p>`
        : '';
      return `      <article class="cp-card">
        <h3>${esc(w.work)}</h3>
        ${meta ? `<p class="cp-meta">${meta}</p>` : ''}
        ${w.thesis ? `<p>${esc(w.thesis)}</p>` : ''}
        ${link}
      </article>`;
    })
    .join('\n');
  return `    <section id="perspectives">
      <h2>Analyses &amp; perspectives</h2>
      <div class="notice notice-attribution">${esc(cp.note)}</div>
      <div class="party-grid">
${cards}
      </div>
    </section>
`;
}

function renderArmedMovements(am) {
  if (!am || !am.movements || !am.movements.length) return '';
  const cards = am.movements
    .map((m) => {
      const flag = m.verified === false
        ? ' <span class="flag" title="Forum participation / details not yet verified against a primary source">?</span>'
        : '';
      const row = (label, val) => (val ? `        <p class="am-row"><strong>${label}:</strong> ${esc(val)}</p>` : '');
      return `      <article class="am-card">
        <h3>${esc(m.name)}${m.abbr ? ` <span class="abbr">(${esc(m.abbr)})</span>` : ''}${flag}</h3>
        <p class="am-meta">${esc(m.country)}${m.period ? ` · ${esc(m.period)}` : ''}${cite(m.sources)}</p>
${row('Nature', m.nature)}
${row('Designation', m.designation)}
${row('Role in the Forum', m.fspRole)}
${row('Status today', m.currentStatus)}
      </article>`;
    })
    .join('\n');
  return `    <section id="armed">
      <h2>Armed &amp; guerrilla movements in the Forum</h2>
      <div class="notice notice-attribution">${esc(am.note)}</div>
      ${am.presidencyNote ? `<div class="notice">${esc(am.presidencyNote)}</div>` : ''}
      <div class="party-grid">
${cards}
      </div>
    </section>
`;
}

function renderRegionalBodies(rb) {
  if (!rb || !rb.items || !rb.items.length) return '';
  const cards = rb.items
    .map((b) => {
      const row = (label, val) => (val ? `        <p class="am-row"><strong>${label}:</strong> ${esc(val)}</p>` : '');
      return `      <article class="am-card">
        <h3>${esc(b.name)}${b.abbr ? ` <span class="abbr">(${esc(b.abbr)})</span>` : ''}</h3>
        <p class="am-meta">${b.founded ? esc(b.founded) : ''}${cite(b.sources)}</p>
${row('What it is', b.whatItIs)}
${row('Members', b.members)}
${row('Link to the Forum', b.fspLink)}
      </article>`;
    })
    .join('\n');
  return `    <section id="regional">
      <h2>Regional integration bodies</h2>
      <div class="notice notice-attribution">${esc(rb.note)}</div>
      <div class="party-grid">
${cards}
      </div>
      ${rb.seeAlso ? `<p class="section-intro">${esc(rb.seeAlso)}</p>` : ''}
    </section>
`;
}

/**
 * Reference registry: id -> { ref, n } (n = 1-based citation number, which is
 * also the item's position in the rendered References list). Populated in
 * main() before any page is rendered.
 */
let REFS_BY_ID = new Map();

function buildRefIndex(refs) {
  REFS_BY_ID = new Map(refs.map((r, i) => [r.id, { ref: r, n: i + 1 }]));
}

/**
 * Render superscript citation markers for a sources[] array. Entries are
 * either a reference id (linked to the anchored References list as [n]) or a
 * raw URL (linked externally as [web] — the migration path for older data).
 * `prefix` points at index.html from subpages ('' on the homepage).
 */
function cite(sources, prefix = '') {
  if (!sources || !sources.length) return '';
  const marks = sources
    .map((s) => {
      const hit = REFS_BY_ID.get(s);
      if (hit) {
        return `<a href="${prefix}#ref-${esc(s)}" title="${esc(hit.ref.title)}">[${hit.n}]</a>`;
      }
      if (/^https?:\/\//.test(s)) {
        return `<a href="${esc(s)}" rel="noopener noreferrer" target="_blank" title="external source">[web]</a>`;
      }
      return `<span class="flag" title="unknown source id: ${esc(s)}">[?]</span>`;
    })
    .join('');
  return `<sup class="cite">${marks}</sup>`;
}

function renderReferences(refs, archives, archiveDocs = {}) {
  return refs
    .map((r) => {
      const snap = archives[r.url];
      const archiveLink = snap && snap.archiveUrl
        ? ` · <a class="archive-link" href="${esc(snap.archiveUrl)}" rel="noopener noreferrer" target="_blank" title="Internet Archive Wayback Machine snapshot">archived${
            snap.timestamp ? ` ${esc(formatArchiveTs(snap.timestamp))}` : ''
          }</a>`
        : '';
      const doc = archiveDocs[r.id];
      const savedLink = doc && doc.state === 'ok' && doc.path
        ? ` · <a class="archive-link" href="archive/${esc(doc.path)}" title="Preserved copy stored in this repository">saved copy</a>`
        : '';
      return `        <li id="ref-${esc(r.id)}">
          <a href="${esc(r.url)}" rel="noopener noreferrer" target="_blank">${esc(r.title)}</a>
          <span class="ref-meta">${esc(r.publisher)} — ${esc(r.type)}${archiveLink}${savedLink}</span>
        </li>`;
    })
    .join('\n');
}

function renderTimeline(meetings) {
  return meetings
    .map(
      (m) => `        <li class="tl-item">
          <span class="tl-year">${esc(m.year)}</span>
          <span class="tl-edition">${esc(m.edition)}</span>
          <span class="tl-place">${esc(m.city)}, ${esc(m.country)}</span>
        </li>`
    )
    .join('\n');
}

function renderNav() {
  const items = [
    ['#atlas', 'Map'],
    ['#presidents-map', 'Presidential'],
    ['#legislative-map', 'Legislative'],
    ['#courts-map', 'Courts'],
    ['#origins', 'Origins'],
    ['#timeline', 'Timeline'],
    ['#meetings', 'Meetings'],
    ['#parties', 'Parties'],
    ['#armed', 'Armed movements'],
    ['#regional', 'Regional bodies'],
    ['#government', 'In government'],
    ['#organization', 'Structure'],
    ['#countries', 'Countries'],
    ['#perspectives', 'Analyses'],
    ['#references', 'References'],
  ];
  return `  <nav class="site-nav"><div class="wrap">${items
    .map(([href, label]) => `<a href="${href}">${esc(label)}</a>`)
    .join('')}</div></nav>`;
}

function renderOrganization(org) {
  if (!org || !org.bodies || !org.bodies.length) return '';
  const cards = org.bodies
    .map((b) => {
      const flag = b.verified === false ? ' <span class="flag" title="reported by the Forum / affiliated sources; to verify">?</span>' : '';
      let composition = '';
      if (b.composition && b.composition.length) {
        const rows = b.composition
          .map((c) => `            <dt>${esc(c.country)}</dt><dd>${esc(c.delegation)}</dd>`)
          .join('\n');
        const heading = `${esc(b.compositionTitle || 'Composition')} — ${b.composition.length} countries${cite(b.compositionSources)}`;
        composition = `
        <details class="roster wg-composition">
          <summary><strong>${heading}</strong></summary>
          ${b.compositionNote ? `<p class="section-intro">${esc(b.compositionNote)}</p>` : ''}
          <dl class="facts founding-orgs">
${rows}
          </dl>
        </details>`;
      }
      return `      <article class="related-card">
        <h3>${esc(b.name)}${flag}</h3>
        <p>${esc(b.detail)}</p>${composition}
      </article>`;
    })
    .join('\n');
  return `    <section id="organization">
      <h2>Organization &amp; structure</h2>
      <p class="section-intro">${esc(org.note)}${cite(org.sources)}</p>
      <div class="party-grid">
${cards}
      </div>
      ${org.scale ? `<p class="org-scale"><strong>Scale:</strong> ${esc(org.scale)}${org.scaleVerified === false ? ' <span class="flag" title="reported figures; to verify">?</span>' : ''}${cite(org.sources)}</p>` : ''}
    </section>
`;
}

// Year-by-year map of FSP presidential coverage — the "pink tide" (issue #104).
// Drives entirely off data/countries/*.json presidentialSuccession[] (start/end/fsp);
// no new data. Affiliations still flagged "to verify" render as a distinct state,
// never asserted as confirmed FSP.
function ptlYear(s, now) {
  return s === 'present' ? now : parseInt(s, 10);
}
function ptlStateFor(country, year, now) {
  // The president in office in a given year = the one with the greatest start ≤ year
  // whose term also spans it. Handles "present", gaps, and handover years.
  let best = null;
  for (const p of country.presidentialSuccession || []) {
    const s = ptlYear(p.start, now);
    const e = ptlYear(p.end, now);
    if (s <= year && year <= e && (!best || s >= ptlYear(best.start, now))) best = p;
  }
  if (!best) return { st: 'nodata', p: null };
  if (best.fsp) {
    // A one-party socialist state (Cuba) is FSP-governed but not by electoral
    // alternation — its own state, kept out of the "pink tide" tally (ADR-0010).
    if (country.oneParty) return { st: 'fsp-op', p: best };
    return { st: /verify/i.test(country.fspStatus || '') ? 'fsp-unv' : 'fsp', p: best };
  }
  return { st: 'non', p: best };
}

// Wrap the three headline visualizations in a tab interface. Progressive
// enhancement: the tablist is hidden and all panels are shown until app.js
// activates the tabs, so with JS off the panels simply stack.
function renderVizTabs(countries) {
  const tabs = [
    ['tab-presidents', 'presidents-map', 'Presidential'],
    ['tab-legislative', 'legislative-map', 'Legislative'],
    ['tab-courts', 'courts-map', 'Court interventions'],
  ];
  const buttons = tabs
    .map(([id, ctl, lbl], i) =>
      `<button type="button" class="viz-tab" role="tab" id="${id}" aria-controls="${ctl}" aria-selected="${i === 0 ? 'true' : 'false'}">${esc(lbl)}</button>`)
    .join('');
  return `    <div class="viz">
      <h2 class="viz-h">The grids, year by year</h2>
      <div class="viz-tabs" role="tablist" aria-label="Year-by-year grids" hidden>${buttons}</div>
${renderPresidentialTimeline(countries)}
${renderLegislativeGrid(countries)}
${renderCourtsGrid(countries)}
    </div>
`;
}

// Interactive tile-grid cartogram: the 16 tracked countries laid out in an
// approximate geographic arrangement, recoloured by a year slider (same FSP
// states as the timeline grid). A schematic tile map — not geographic outlines —
// so it stays zero-dependency and self-contained (ADR-0001/0010). Server-renders
// the current year so it works without JS; app.js adds the slider/animation.
const ATLAS_TILES = {
  MX: [1, 2], CU: [2, 3], DO: [2, 4],
  SV: [3, 1], HN: [3, 2],
  NI: [4, 2], VE: [4, 4],
  CO: [5, 3],
  EC: [6, 2], BR: [6, 5],
  PE: [7, 2], BO: [7, 4],
  PY: [8, 4],
  CL: [9, 3], AR: [9, 4], UY: [9, 5],
};
const ATLAS_ST = { fsp: 'f', 'fsp-unv': 'u', 'fsp-op': 'o', non: 'n', nodata: '.' };
function renderAtlas(countries) {
  if (!countries || !countries.length) return '';
  const now = new Date().getFullYear();
  const years = [];
  for (let y = 1990; y <= now; y++) years.push(y);
  const tracked = countries.filter((c) => ATLAS_TILES[c.code]);

  // Precompute, per country, a per-year state string + president labels.
  const data = tracked.map((c) => {
    const states = [];
    const who = [];
    for (const y of years) {
      const r = ptlStateFor(c, y, now);
      states.push(ATLAS_ST[r.st] || '.');
      who.push(r.p ? `${r.p.name} (${r.p.party})` : '—');
    }
    return { code: c.code, name: c.country, states: states.join(''), who };
  });

  const stClass = { f: 'atlas-f', u: 'atlas-u', o: 'atlas-o', n: 'atlas-n', '.': 'atlas-nodata' };
  const iNow = years.length - 1;

  // Inline the committed, public-domain Latin America SVG (real borders). Inject
  // hatch/cross-hatch patterns (to-verify / one-party), then server-render the
  // current year's colours + a11y attributes so the map works without JS.
  let svg = fs.readFileSync(path.join(SRC_DIR, 'latam.svg'), 'utf8');
  const defs = `<defs>
<pattern id="p-u" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="6" height="6" fill="#e79aa0"/><line x1="0" y1="0" x2="0" y2="6" stroke="#7a1418" stroke-width="2"/></pattern>
<pattern id="p-o" patternUnits="userSpaceOnUse" width="6" height="6"><rect width="6" height="6" fill="#b8252b"/><path d="M0,0L6,6M6,0L0,6" stroke="rgba(0,0,0,.45)" stroke-width="1.2"/></pattern>
</defs>`;
  svg = svg.replace(/(<svg\b[^>]*>)/, `$1\n${defs}`);
  const byCode = {};
  data.forEach((d) => { byCode[d.code] = d; });
  data.forEach((d) => {
    const cls = stClass[d.states[iNow]];
    const aria = `${d.name} ${now}: ${d.who[iNow]}`;
    svg = svg.replace(
      `<path id="ne-${d.code}" class="latam-c" data-code="${d.code}"`,
      `<path id="ne-${d.code}" class="latam-c ${cls}" data-code="${d.code}" tabindex="0" role="link" aria-label="${esc(aria)}"`
    );
  });

  const legend = [
    ['atlas-f', 'FSP-party president'],
    ['atlas-u', 'FSP affiliation to verify'],
    ['atlas-o', 'One-party state (PCC)'],
    ['atlas-n', 'Non-FSP'],
    ['atlas-nodata', 'No data'],
  ]
    .map(([k, l]) => `<span class="ptl-key"><span class="atlas-swatch ${k}"></span>${esc(l)}</span>`)
    .join('');

  const payload = JSON.stringify({ start: 1990, end: now, countries: data });
  return `    <section id="atlas">
      <h2>The map, year by year</h2>
      <p class="section-intro">The tracked countries on the map, coloured by who held the presidency that year. Drag the slider or press play to watch the spread — often called the “pink tide” — rise and recede. Same states as the grids above; one-party Cuba is marked distinctly and not part of the electoral counts. Neighbouring countries are shown greyed for context.</p>
      <div class="atlas-controls">
        <button type="button" id="atlas-play" class="atlas-btn" aria-label="Play through the years">▶ Play</button>
        <input type="range" id="atlas-slider" min="1990" max="${now}" value="${now}" step="1" aria-label="Year" />
        <output id="atlas-year" class="atlas-year">${now}</output>
      </div>
      <p class="ptl-caption" id="atlas-caption" aria-live="polite">Showing ${now}. Hover, tap or focus a country for its president that year.</p>
      <div class="atlas-map" id="atlas-map">
${svg}
      </div>
      <div class="ptl-legend">${legend}</div>
      <p class="atlas-credit">Map: Natural Earth (public domain).</p>
      <script type="application/json" id="atlas-data">${payload}</script>
    </section>
`;
}
function renderPresidentialTimeline(countries) {
  if (!countries || !countries.length) return '';
  const now = new Date().getFullYear();
  const years = [];
  for (let y = 1990; y <= now; y++) years.push(y);
  const nCols = years.length;

  // Order rows by when each country first had an FSP-party president, so the wave
  // reads as a diagonal; countries that never did fall to the bottom, then A–Z.
  const firstFsp = (c) => {
    const ys = (c.presidentialSuccession || []).filter((p) => p.fsp).map((p) => ptlYear(p.start, now));
    return ys.length ? Math.min(...ys) : Infinity;
  };
  // Electoral countries first (ordered by the wave), one-party states (Cuba) last.
  const rows = [...countries].sort((a, b) =>
    (a.oneParty ? 1 : 0) - (b.oneParty ? 1 : 0) ||
    firstFsp(a) - firstFsp(b) ||
    a.country.localeCompare(b.country));
  const electoral = rows.filter((c) => !c.oneParty);

  const label = {
    fsp: 'FSP-party president',
    'fsp-unv': 'FSP affiliation to verify',
    'fsp-op': 'One-party socialist state (PCC)',
    non: 'Non-FSP president',
    nodata: 'No data',
  };

  // Per-year tally (confirmed FSP + to-verify) for the bar strip — over the
  // electoral countries only; one-party states are shown but not counted.
  const denom = electoral.length;
  const tally = years.map((y) => {
    let fsp = 0, unv = 0;
    for (const c of electoral) {
      const st = ptlStateFor(c, y, now).st;
      if (st === 'fsp') fsp++;
      else if (st === 'fsp-unv') unv++;
    }
    return { y, fsp, unv, total: fsp + unv };
  });
  const peak = tally.reduce((m, t) => (t.total > m.total ? t : m), tally[0]);
  const opCountries = rows.filter((c) => c.oneParty).map((c) => c.country);

  // One cell per column throughout (uniform auto-flow, no explicit placement) so
  // the year header, tally bars and country cells stay column-aligned.
  // A lustrum tick (every 5th year) gives a vertical gridline so a year is
  // readable without counting cells.
  const tick = (y) => (y % 5 === 0 ? ' ptl-tick' : '');
  const header = years
    .map((y) => `<span class="ptl-yr${tick(y)}">${y % 5 === 0 ? y : ''}</span>`)
    .join('');

  const barRow = tally
    .map((t) => {
      const h = Math.round((t.total / denom) * 100);
      const d = `${t.y}: ${t.total} of ${denom} FSP-governed (${t.fsp} confirmed, ${t.unv} to verify)`;
      return `<span class="ptl-bar${tick(t.y)}" data-d="${esc(d)}" title="${esc(d)}"><span style="height:${h}%"></span></span>`;
    })
    .join('');

  const bodyRows = rows
    .map((c) => {
      const op = c.oneParty ? ' ptl-op' : '';
      const cells = years
        .map((y) => {
          const r = ptlStateFor(c, y, now);
          const who = r.p ? ` — ${r.p.name} (${r.p.party})` : '';
          const d = `${c.country} ${y}: ${label[r.st]}${who}`;
          return `<span class="ptl-c ptl-${r.st}${op}${tick(y)}" data-d="${esc(d)}" title="${esc(d)}"></span>`;
        })
        .join('');
      return `          <a class="ptl-lbl ptl-row${op}" href="countries/${esc(c.code)}.html">${esc(c.country)}</a>${cells}`;
    })
    .join('\n');

  const legend = ['fsp', 'fsp-unv', 'fsp-op', 'non', 'nodata']
    .map((k) => `<span class="ptl-key"><span class="ptl-c ptl-${k}"></span>${esc(label[k])}</span>`)
    .join('');

  const gridCols = `grid-template-columns: var(--ptl-lbl) repeat(${nCols}, var(--ptl-cell))`;
  return `    <section id="presidents-map" class="tab-panel" role="tabpanel" aria-labelledby="tab-presidents" tabindex="0">
      <h2>FSP presidential coverage, year by year</h2>
      <p class="section-intro">For each tracked country, the party in the presidency each year since 1990 — the geographic and temporal spread often called the “pink tide”. Rows are ordered by when a country first elected an FSP-party president, so the wave reads top-to-bottom. Affiliations still marked <em>to&nbsp;verify</em> (see the Countries dossiers and issue&nbsp;#4) are shown as a hatched state, not counted as confirmed. The raw grid is fact; “peak”, “wave” and “majority” are interpretive readings of it.</p>
      <p class="ptl-caption" id="ptl-caption" aria-live="polite">Hover, tap or focus a cell for the country, year and president. Each state is shown by both colour and fill, so it reads without colour.</p>
      <div class="table-scroll">
        <div class="ptl" id="ptl-grid" style="${gridCols}">
          <span class="ptl-corner">Year →</span>${header}
          <span class="ptl-lbl ptl-tally-lbl" data-d="Electoral countries with an FSP-party president that year (confirmed + to-verify), out of ${denom}" title="Electoral countries with an FSP-party president that year (confirmed + to-verify), out of ${denom}">FSP-governed</span>${barRow}
${bodyRows}
        </div>
      </div>
      <p class="ptl-note">Peak coverage: <strong>${peak.total} of ${denom}</strong> electoral countries in <strong>${peak.y}</strong>. ${opCountries.length ? `${esc(opCountries.join(', '))} — a one-party socialist state governed continuously by the PCC — ${opCountries.length === 1 ? 'is' : 'are'} shown separately (last row) and excluded from these counts. ` : ''}This maps ${rows.length} countries with a dossier here, not all of Latin America — read the per-year counts, not the absolute total. Companion to the sourced president count (issue&nbsp;#96).</p>
      <div class="ptl-legend">${legend}</div>
    </section>
`;
}

// Year-by-year grid of high-court interventions (packing / purge / reform), from
// each country's supremeCourt.courtHistory[]. Marks the years courts were
// restructured; "composition"/continuity entries are context, not events, so
// they are not marked. Reuses the .ptl grid layout for column alignment.
function courtEventYears(period) {
  return (String(period).match(/\d{4}/g) || []).map(Number).filter((y) => y >= 1990);
}
function renderCourtsGrid(countries) {
  if (!countries || !countries.length) return '';
  const now = new Date().getFullYear();
  const years = [];
  for (let y = 1990; y <= now; y++) years.push(y);
  const nCols = years.length;

  const TYPES = {
    packing: { label: 'Court-packing (seats added / allies installed)', glyph: 'P' },
    purge: { label: 'Purge / removal of justices', glyph: '×' },
    reform: { label: 'Structural reform', glyph: 'R' },
  };
  const prio = { reform: 1, purge: 2, packing: 3 };

  const rows = countries
    .map((c) => {
      const events = {}; // year -> { type, event }
      const ch = (c.supremeCourt && c.supremeCourt.courtHistory) || [];
      for (const h of ch) {
        if (!TYPES[h.type]) continue;
        for (const y of courtEventYears(h.period)) {
          if (!events[y] || prio[h.type] > prio[events[y].type]) events[y] = { type: h.type, event: h.event };
        }
      }
      const yrs = Object.keys(events).map(Number);
      return { c, events, n: yrs.length, first: yrs.length ? Math.min(...yrs) : Infinity };
    })
    .sort((a, b) => (b.n > 0) - (a.n > 0) || a.first - b.first || a.c.country.localeCompare(b.c.country));

  const withData = rows.filter((r) => r.n > 0).length;
  const tick = (y) => (y % 5 === 0 ? ' ptl-tick' : '');
  const header = years.map((y) => `<span class="ptl-yr${tick(y)}">${y % 5 === 0 ? y : ''}</span>`).join('');

  // Per-year count of interventions, for the bar strip.
  const counts = years.map((y) => rows.reduce((n, r) => n + (r.events[y] ? 1 : 0), 0));
  const maxCount = Math.max(1, ...counts);
  const barRow = years
    .map((y, i) => {
      const n = counts[i];
      const h = Math.round((n / maxCount) * 100);
      const d = `${y}: ${n} court intervention${n === 1 ? '' : 's'}`;
      return `<span class="ptl-bar${tick(y)}" data-d="${esc(d)}" title="${esc(d)}"><span style="height:${n ? h : 0}%"></span></span>`;
    })
    .join('');

  const bodyRows = rows
    .map(({ c, events }) => {
      const cells = years
        .map((y) => {
          const e = events[y];
          if (!e) return `<span class="cm-c${tick(y)}" data-d="${esc(`${c.country} ${y}: no recorded court change`)}" title="${esc(`${c.country} ${y}`)}"></span>`;
          const t = TYPES[e.type];
          const d = `${c.country} ${y} — ${t.label}: ${e.event}`;
          return `<span class="cm-c cm-${e.type}${tick(y)}" data-d="${esc(d)}" title="${esc(d)}">${esc(t.glyph)}</span>`;
        })
        .join('');
      return `          <a class="ptl-lbl ptl-row" href="countries/${esc(c.code)}.html">${esc(c.country)}</a>${cells}`;
    })
    .join('\n');

  const legend = Object.entries(TYPES)
    .map(([k, t]) => `<span class="ptl-key"><span class="cm-c cm-${k}">${esc(t.glyph)}</span>${esc(t.label)}</span>`)
    .join('');

  const gridCols = `grid-template-columns: var(--ptl-lbl) repeat(${nCols}, var(--ptl-cell))`;
  return `    <section id="courts-map" class="tab-panel" role="tabpanel" aria-labelledby="tab-courts" tabindex="0">
      <h2>High-court interventions, year by year</h2>
      <p class="section-intro">When each tracked country's <strong>high court was restructured</strong> — court-packing, purges, and structural reforms — from the court histories in the country dossiers. Continuity (normal turnover) is left blank; only documented interventions are marked, colour and glyph both. Interventions happen under governments of every stripe — the grid is a record, not a verdict. ${withData} countries have a compiled court history so far; the rest show blank (see the country epics).</p>
      <p class="ptl-caption" id="cm-caption" aria-live="polite">Hover, tap or focus a cell for the court change in that country and year.</p>
      <div class="table-scroll">
        <div class="ptl" id="cm-grid" style="${gridCols}">
          <span class="ptl-corner">Year →</span>${header}
          <span class="ptl-lbl ptl-tally-lbl" data-d="Number of high-court interventions across tracked countries that year" title="Interventions per year">Interventions</span>${barRow}
${bodyRows}
        </div>
      </div>
      <div class="ptl-legend">${legend}</div>
    </section>
`;
}

// The legislative bloc in force in a given year = the legislativeControl[] entry
// with the greatest start ≤ year that spans it. Mirrors ptlStateFor.
function legStateFor(country, year, now) {
  let best = null;
  for (const l of country.legislativeControl || []) {
    const s = ptlYear(l.start, now);
    const e = ptlYear(l.end, now);
    if (s <= year && year <= e && (!best || s >= ptlYear(best.start, now))) best = l;
  }
  return best;
}
// Year-by-year grid of the FSP-member party's standing in the lower house
// (issue #106/#107), from each country's legislativeControl[].
function renderLegislativeGrid(countries) {
  if (!countries || !countries.length) return '';
  const now = new Date().getFullYear();
  const years = [];
  for (let y = 1990; y <= now; y++) years.push(y);
  const nCols = years.length;

  const BLOCS = {
    majority: { label: 'FSP majority (party or its governing coalition)', glyph: 'M' },
    plurality: { label: 'FSP plurality (largest, no majority)', glyph: 'P' },
    minority: { label: 'FSP minority government', glyph: 'm' },
    opposition: { label: 'FSP in opposition', glyph: '' },
    'single-party': { label: 'One-party state', glyph: '1' },
  };

  const rows = countries
    .map((c) => {
      const lc = c.legislativeControl || [];
      const first = lc.length ? Math.min(...lc.map((l) => ptlYear(l.start, now))) : Infinity;
      return { c, has: lc.length > 0, first };
    })
    .sort((a, b) => (b.has ? 1 : 0) - (a.has ? 1 : 0) || a.first - b.first || a.c.country.localeCompare(b.c.country));

  const withNames = rows.filter((r) => r.has).map((r) => r.c.country);
  const withData = withNames.length;
  const tick = (y) => (y % 5 === 0 ? ' ptl-tick' : '');
  const header = years.map((y) => `<span class="ptl-yr${tick(y)}">${y % 5 === 0 ? y : ''}</span>`).join('');

  // Per-year count of countries where the FSP party/coalition holds a majority.
  const counts = years.map((y) => rows.reduce((n, r) => {
    const l = legStateFor(r.c, y, now);
    return n + (l && l.fspBloc === 'majority' ? 1 : 0);
  }, 0));
  const maxCount = Math.max(1, ...counts);
  const barRow = years
    .map((y, i) => {
      const n = counts[i];
      const h = Math.round((n / maxCount) * 100);
      const d = `${y}: ${n} ${n === 1 ? 'country' : 'countries'} with an FSP legislative majority`;
      return `<span class="ptl-bar${tick(y)}" data-d="${esc(d)}" title="${esc(d)}"><span style="height:${n ? h : 0}%"></span></span>`;
    })
    .join('');

  const bodyRows = rows
    .map(({ c }) => {
      const cells = years
        .map((y) => {
          const l = legStateFor(c, y, now);
          if (!l) return `<span class="lg-c${tick(y)}" data-d="${esc(`${c.country} ${y}: no data`)}" title="${esc(`${c.country} ${y}`)}"></span>`;
          const b = BLOCS[l.fspBloc] || { label: l.fspBloc, glyph: '' };
          const d = `${c.country} ${y} — ${b.label}${l.seats ? ` (${l.seats})` : ''}`;
          return `<span class="lg-c lg-${l.fspBloc}${tick(y)}" data-d="${esc(d)}" title="${esc(d)}">${esc(b.glyph)}</span>`;
        })
        .join('');
      return `          <a class="ptl-lbl ptl-row" href="countries/${esc(c.code)}.html">${esc(c.country)}</a>${cells}`;
    })
    .join('\n');

  const legend = Object.entries(BLOCS)
    .map(([k, b]) => `<span class="ptl-key"><span class="lg-c lg-${k}">${esc(b.glyph)}</span>${esc(b.label)}</span>`)
    .join('');

  const gridCols = `grid-template-columns: var(--ptl-lbl) repeat(${nCols}, var(--ptl-cell))`;
  return `    <section id="legislative-map" class="tab-panel" role="tabpanel" aria-labelledby="tab-legislative" tabindex="0">
      <h2>Legislative control, year by year</h2>
      <p class="section-intro">The FSP-member party's standing in the <strong>lower house</strong> each year — whether it (or its governing coalition) held a <strong>majority</strong>, a <strong>plurality</strong>, a <strong>minority</strong> government, or sat in <strong>opposition</strong>. A coalition majority is not a single-party majority (see each cell's detail). <strong>${withData}</strong> ${withData === 1 ? 'country' : 'countries'} compiled so far (${esc(withNames.join(', '))}); the rest are blank pending the country epics (#107).</p>
      <p class="ptl-caption" id="lg-caption" aria-live="polite">Hover, tap or focus a cell for the party's legislative standing that year.</p>
      <div class="table-scroll">
        <div class="ptl" id="lg-grid" style="${gridCols}">
          <span class="ptl-corner">Year →</span>${header}
          <span class="ptl-lbl ptl-tally-lbl" data-d="Countries with an FSP legislative majority that year" title="FSP legislative majorities per year">FSP majority</span>${barRow}
${bodyRows}
        </div>
      </div>
      <div class="ptl-legend">${legend}</div>
    </section>
`;
}

function renderCountryIndex(countries) {
  if (!countries || !countries.length) return '';
  const cards = countries
    .map((c) => {
      const n = (c.fspPresidents || []).length;
      return `      <a class="country-card" href="countries/${esc(c.code)}.html">
        <span class="cc-name">${esc(c.country)}</span>
        <span class="cc-party">${esc(c.fspParty)}</span>
        <span class="cc-count">${esc(n)} FSP president${n === 1 ? '' : 's'}</span>
      </a>`;
    })
    .join('\n');
  return `    <section id="countries">
      <h2>Countries</h2>
      <p class="section-intro">Per-country dossiers: presidential succession since 1990 (FSP presidents highlighted) and the Supreme Court history.</p>
      <div class="country-index">
${cards}
      </div>
    </section>
`;
}

function renderFormation(f) {
  if (!f || !f.items || !f.items.length) return '';
  const cards = f.items
    .map((it) => {
      const flag = it.verified === false ? ' <span class="flag" title="reported / attributed, not independently sourced here">?</span>' : '';
      return `      <article class="related-card">
        <h3>${esc(it.title)}${flag}</h3>
        <p>${esc(it.text)}${cite(it.sources)}</p>
      </article>`;
    })
    .join('\n');
  return `    <section id="origins">
      <h2>${esc(f.title || 'Origins & formative networks')}</h2>
      <p class="section-intro">${esc(f.note || '')}</p>
      <div class="party-grid">
${cards}
      </div>
    </section>
`;
}

function renderCourtHistory(sc) {
  if (!sc || !sc.courtHistory || !sc.courtHistory.length) return '';
  const rows = sc.courtHistory
    .map((h) => {
      const cls = h.fspRelated ? ' class="fsp-row"' : '';
      const flag = h.verified === false ? ' <span class="flag" title="broad characterization; verify against a primary source">?</span>' : '';
      const sizeCell = h.size != null ? `${esc(h.size)}` : '<span class="muted">—</span>';
      return `        <tr${cls}>
          <td>${esc(h.period)}</td>
          <td><span class="ch-type ch-${esc(h.type)}">${esc(h.type)}</span></td>
          <td>${esc(h.event)}${flag}</td>
          <td>${sizeCell}</td>
          <td class="notes">${esc(h.appointingGovernment || '')}</td>
        </tr>`;
    })
    .join('\n');
  const src = (sc.courtHistorySources || [])
    .map((u) => `<a href="${esc(u)}" rel="noopener noreferrer" target="_blank">source</a>`)
    .join(' · ');
  return `    <section>
      <h2>Court history (1990–present)</h2>
      <p class="section-intro">Structural changes to the court during the Foro de São Paulo era — size changes, court-packings, purges and reforms. <span class="ch-type ch-packing">packing</span>/<span class="ch-type ch-purge">purge</span> mark expansions and forced removals. ${src ? `Sources: ${src}.` : ''}</p>
      <div class="table-scroll">
        <table class="meetings">
          <thead><tr><th>Period</th><th>Type</th><th>Change</th><th>Seats</th><th>Government</th></tr></thead>
          <tbody>
${rows}
          </tbody>
        </table>
      </div>
    </section>
`;
}

function renderJustices(sc) {
  if (!sc || !sc.justices || !sc.justices.length) return '';
  const rows = sc.justices
    .map((j) => {
      const cls = j.fspAppointed ? ' class="fsp-row"' : '';
      const flag = j.fspAppointed ? ' <span class="fsp-badge">FSP</span>' : '';
      return `        <tr${cls}>
          <td>${esc(j.year)}</td>
          <td>${esc(j.name)}${flag}</td>
          <td>${esc(j.appointedBy)}${j.appointedParty ? ` <span class="muted">(${esc(j.appointedParty)})</span>` : ''}</td>
          <td>${esc(j.status || '')}</td>
          <td class="notes">${esc(j.background || '')}</td>
        </tr>`;
    })
    .join('\n');
  return `    <section>
      <h2>Court composition — by appointing government</h2>
      <p class="section-intro">Each justice with the president (and party) who appointed them; rows marked <span class="fsp-badge">FSP</span> were appointed by a Foro de São Paulo member/affiliated president. "Background" notes prior political/professional roles where notable — justices are not formal party members.</p>
      <div class="table-scroll">
        <table class="meetings">
          <thead><tr><th>Appt. year</th><th>Justice</th><th>Appointed by (party)</th><th>Status</th><th>Background</th></tr></thead>
          <tbody>
${rows}
          </tbody>
        </table>
      </div>
    </section>
`;
}

// Small inline source-link list for country pages (sources are raw URLs).
function srcLinks(arr) {
  if (!arr || !arr.length) return '';
  return ' <span class="src-links">(' + arr
    .map((u, i) => `<a href="${esc(u)}" rel="noopener noreferrer" target="_blank">source ${i + 1}</a>`)
    .join(', ') + ')</span>';
}

// Detailed per-election legislative composition on the country page (seats by
// party, and whether the governing coalition held a majority). Issue #106 detail.
function renderLegislativeComposition(c) {
  const comps = c.legislativeComposition || [];
  if (!comps.length) return '';
  const ALIGN = { government: 'Government', opposition: 'Opposition', mixed: 'Mixed / centrão', independent: 'Independent' };
  const blocks = comps
    .map((e) => {
      const prows = e.parties
        .map((pt) => {
          const fsp = pt.fsp ? ' <span class="fsp-badge">FSP</span>' : '';
          return `        <tr${pt.fsp ? ' class="fsp-row"' : ''}>
          <td><strong>${esc(pt.abbr || pt.name)}</strong>${fsp}</td>
          <td class="notes">${esc(pt.abbr ? pt.name || '' : '')}</td>
          <td>${esc(pt.seats)}</td>
          <td>${esc(ALIGN[pt.align] || pt.align || '')}</td>
        </tr>`;
        })
        .join('\n');
      const g = e.government || {};
      const maj = g.hasMajority ? 'commanded a working majority' : 'lacked a majority';
      // Sum the FSP member parties' own seats and contrast with the majority
      // threshold — to make explicit that the FSP bloc alone is not a majority
      // and that any governing majority is built with non-FSP coalition partners.
      const fspSeats = e.parties.filter((p) => p.fsp).reduce((n, p) => n + (p.seats || 0), 0);
      const thr = e.majorityThreshold;
      const pct = e.totalSeats ? Math.round((fspSeats / e.totalSeats) * 100) : 0;
      const gap = thr ? thr - fspSeats : 0;
      let tail;
      if (!g.fspInGovernment) tail = 'The FSP parties sat in opposition.';
      else if (thr && fspSeats >= thr) tail = 'The FSP bloc holds a majority in this chamber in its own right.';
      else if (g.hasMajority) tail = 'A working majority is assembled with non-FSP coalition partners.';
      else tail = 'The FSP party held the presidency but not a majority in this chamber.';
      const fspLine = fspSeats
        ? `      <p class="notice"><strong>FSP member parties together: ${fspSeats} of ${esc(e.totalSeats)}</strong> (${pct}%)${thr ? ` — ${fspSeats >= thr ? 'a majority on their own' : `${gap} seat${gap === 1 ? '' : 's'} short of the ${esc(thr)}-seat majority`}` : ''}. ${tail}</p>\n`
        : '';
      // Visual seat-share bar: parties ordered FSP → government ally → mixed →
      // opposition, with a marker at the majority threshold — so it's obvious at a
      // glance whether (and with whom) the governing bloc crosses the majority line.
      const rank = { fsp: 0, government: 1, mixed: 2, independent: 3, opposition: 4 };
      const grp = (p) => (p.fsp ? 'fsp' : (p.align || 'independent'));
      const segs = e.totalSeats
        ? [...e.parties].sort((a, b) => (rank[grp(a)] - rank[grp(b)]) || (b.seats - a.seats))
            .map((p) => `<span class="seatseg seatseg-${grp(p)}" style="width:${(p.seats / e.totalSeats * 100).toFixed(2)}%" title="${esc(`${p.abbr || p.name}: ${p.seats} — ${ALIGN[p.align] || p.align || ''}`)}"></span>`).join('')
        : '';
      const majMark = e.majorityThreshold && e.totalSeats
        ? `<span class="seatbar-maj" style="left:${(e.majorityThreshold / e.totalSeats * 100).toFixed(2)}%" title="Majority = ${esc(e.majorityThreshold)} of ${esc(e.totalSeats)}"></span>`
        : '';
      const seatbar = segs
        ? `      <div class="seatbar" role="img" aria-label="Seats by bloc for ${esc(e.year)}; majority line at ${esc(e.majorityThreshold || '')} of ${esc(e.totalSeats)}">${segs}${majMark}</div>\n`
        : '';
      return `      <h3>${esc(e.year)} — ${esc(e.chamber)} (${esc(e.totalSeats)} seats${e.majorityThreshold ? `; majority = ${esc(e.majorityThreshold)}` : ''})</h3>
${seatbar}      <div class="table-scroll">
        <table class="meetings">
          <thead><tr><th>Party</th><th>Full name</th><th>Seats</th><th>Alignment</th></tr></thead>
          <tbody>
${prows}
          </tbody>
        </table>
      </div>
${fspLine}      <p class="section-intro"><strong>Government:</strong> ${esc(g.led || '')} — ${maj}. FSP party in government: <strong>${g.fspInGovernment ? 'yes' : 'no'}</strong>.${g.note ? ` ${esc(g.note)}` : ''}${srcLinks(e.sources)}</p>`;
    })
    .join('\n');
  const fp = c.fspParties;
  const fspNote = fp
    ? `      <p class="notice">FSP member parties (highlighted <span class="fsp-badge">FSP</span>): <strong>${(fp.current || []).map(esc).join(', ')}</strong>.${fp.foundingOnly && fp.foundingOnly.length ? ` Also 1990 founding members: ${fp.foundingOnly.map(esc).join(', ')}.` : ''}${fp.note ? ` ${esc(fp.note)}` : ''}</p>\n`
    : '';
  return `    <section>
      <h2>Legislative composition</h2>
      <p class="section-intro">Seats by party for recent elections, and whether the governing coalition held a majority. In a fragmented system a governing majority is assembled across several parties — no party governs alone; a coalition majority is not a single-party majority. Each bar orders blocs left→right with a marker at the majority line.</p>
      <div class="seatbar-legend"><span class="ptl-key"><span class="seatseg-key seatseg-fsp"></span>FSP party</span><span class="ptl-key"><span class="seatseg-key seatseg-government"></span>Government ally</span><span class="ptl-key"><span class="seatseg-key seatseg-mixed"></span>Mixed / centrão</span><span class="ptl-key"><span class="seatseg-key seatseg-opposition"></span>Opposition</span><span class="ptl-key"><span class="seatbar-maj-key"></span>Majority line</span></div>
${fspNote}${blocks}
    </section>
`;
}

function renderCountryPage(c) {
  const rows = c.presidentialSuccession
    .map((p) => {
      const cls = p.fsp ? ' class="fsp-row"' : '';
      const flag = p.fsp ? '<span class="fsp-badge">FSP</span>' : '';
      return `        <tr${cls}>
          <td>${esc(p.start)}–${esc(p.end)}</td>
          <td>${esc(p.name)} ${flag}</td>
          <td>${esc(p.party)}</td>
          <td class="notes">${esc(p.notes || '')}</td>
        </tr>`;
    })
    .join('\n');
  const sc = c.supremeCourt || {};
  const js = sc.justices || [];
  const fspApp = js.filter((j) => j.fspAppointed).length;
  const benchTally = js.length
    ? `        <dt>Appointed under FSP-party govts</dt><dd><strong>${fspApp} of ${js.length}</strong> sitting justices${fspApp * 2 > js.length ? ' — a majority of the current bench' : fspApp * 2 === js.length ? ' — half the current bench' : ' — a minority of the current bench'}. <span class="muted">This is appointment provenance (who nominated each justice), <strong>not</strong> a claim about how they rule — justices serve independently.</span></dd>\n`
    : '';
  const sources = (c.sources || [])
    .map((u) => `        <li><a href="${esc(u)}" rel="noopener noreferrer" target="_blank">${esc(u)}</a></li>`)
    .join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(c.country)} — FSP presidents &amp; courts</title>
  <link rel="stylesheet" href="../styles.css" />
${ANALYTICS}
</head>
<body>
  <header class="site-header">
    <div class="wrap">
      <p class="updated"><a href="../index.html" style="color:#fff">← Foro de São Paulo — Cronologia</a></p>
      <h1>${esc(c.country)}</h1>
      <p class="subtitle">Presidential succession since 1990 &amp; the high court</p>
      <p class="lead">FSP party: <strong>${esc(c.fspParty)}</strong> (${esc(c.fspStatus)}). FSP presidents: ${esc((c.fspPresidents || []).join(', ') || '—')}.</p>
    </div>
  </header>
  <main class="wrap">
    <section>
      <h2>Presidential succession (1990–present)</h2>
      <p class="section-intro">Rows highlighted <span class="fsp-badge">FSP</span> mark presidents from a Foro de São Paulo member/affiliated party.</p>
      <div class="table-scroll">
        <table class="meetings">
          <thead><tr><th>Period</th><th>President</th><th>Party</th><th>Notes</th></tr></thead>
          <tbody>
${rows}
          </tbody>
        </table>
      </div>
    </section>
${renderLegislativeComposition(c)}
    <section>
      <h2>High court — ${esc(sc.name || '')}</h2>
      <dl class="facts">
        ${sc.size ? `<dt>Seats</dt><dd>${esc(sc.size)}</dd>` : ''}
        <dt>Appointment</dt><dd>${esc(sc.appointmentMethod || '')}</dd>
${benchTally}        <dt>Changes (FSP era)</dt><dd>${esc(sc.fspEraChanges || '')}</dd>
        <dt>How much remains</dt><dd>${esc(sc.stillServing || '')}</dd>
        <dt>Verified</dt><dd>${sc.verified ? 'yes — sourced' : 'no — to verify against primary sources'}</dd>
      </dl>
    </section>
${renderCourtHistory(sc)}
${renderJustices(sc)}
    <section>
      <h2>Sources</h2>
      <ol class="references">
${sources}
      </ol>
    </section>
  </main>
  <footer class="site-footer">
    <div class="wrap"><p>Generated from <code>data/countries/${esc(c.code)}.json</code>. <a href="../index.html">Back to the chronology</a>.</p></div>
  </footer>
</body>
</html>
`;
}

function buildHtml(data, archives, codeByCountry, countries, archiveDocs) {
  const { meta, founding } = data;
  return `<!DOCTYPE html>
<html lang="${esc(meta.language || 'en')}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(meta.title)}</title>
  <meta name="description" content="${esc(meta.description)}" />
  <link rel="stylesheet" href="styles.css" />
${ANALYTICS}
</head>
<body>
  <header class="site-header">
    <div class="wrap">
      <h1>${esc(meta.title)}</h1>
      <p class="subtitle">${esc(meta.subtitle)}</p>
      <p class="lead">${esc(meta.description)}</p>
      <p class="updated">Last updated: ${esc(meta.lastUpdated)}</p>
    </div>
  </header>
${renderNav()}

  <main class="wrap">
    <div class="notice">
      <strong>Data quality note:</strong> ${esc(meta.dataQualityNote)}
    </div>

${renderAtlas(countries)}
${renderVizTabs(countries)}
    <section id="founding">
      <h2>Founding</h2>
      <dl class="facts">
        <dt>First meeting</dt><dd>${esc(founding.date.replace('/', ' – '))}</dd>
        <dt>Place</dt><dd>${esc(founding.city)}, ${esc(founding.country)}</dd>
        <dt>Venue</dt><dd>${esc(founding.venue)}</dd>
        <dt>Convened by</dt><dd>${esc(founding.convenedBy)}</dd>
        <dt>Original name</dt><dd>${esc(founding.originalName)}</dd>
        <dt>Renamed</dt><dd>${esc(founding.renamed)}</dd>
        <dt>Context</dt><dd>${esc(founding.context)}</dd>
        <dt>Attendance</dt><dd>${esc(founding.attendance)}</dd>
      </dl>
    </section>

${renderFormation(data.formation)}
    <section id="timeline">
      <h2>Timeline at a glance</h2>
      <ol class="timeline">
${renderTimeline(data.meetings)}
      </ol>
    </section>

    <section id="meetings">
      <h2>Meetings (Encontros)</h2>
      <p class="section-intro">All recorded editions of the Forum. A <span class="flag">?</span> marks dates or edition numbers not yet verified against a primary source. Years with no meeting (1994, 1999, 2004, 2006, 2020–2022) are omitted.</p>
      <p class="notice">Edition numbers follow the Forum’s own numbered declarations${cite(['foro-declaraciones-libro'])}, which run <strong>XI = Antigua 2002 → XII = São Paulo 2005</strong> — the official series has <strong>no numbered encuentro for Quito 2003</strong>. Every edition number is confirmed against a primary source — the PDF book through 2013, and each meeting’s own final declaration for 2014–2024. The dates and edition sequence draw on the Forum’s official numbered declarations${cite(['foro-declaraciones-libro'])}, its per-meeting “Memoria” pages, and the chronology in Graça Salgueiro’s book${cite(['salgueiro-foro'])}. Where a declaration links to a live page, its Wayback snapshot is kept alongside it.</p>
      <div class="m-controls">
        <input type="search" id="m-search" placeholder="Search city, country, notes…" aria-label="Search meetings" />
        <select id="m-country" aria-label="Filter by country">
          <option value="">All countries</option>
${[...new Set(data.meetings.map((m) => m.country))].sort().map((c) => `          <option value="${esc(c)}">${esc(c)}</option>`).join('\n')}
        </select>
        <select id="m-sort" aria-label="Sort by year">
          <option value="asc">Year ↑</option>
          <option value="desc">Year ↓</option>
        </select>
        <span id="m-count" class="m-count"></span>
      </div>
      <div class="table-scroll">
        <table class="meetings" id="meetings-table">
          <thead>
            <tr><th>Edition</th><th>Year</th><th>Dates</th><th>City</th><th>Country</th><th>Declaration</th><th>Notes</th></tr>
          </thead>
          <tbody>
${renderMeetingsRows(data.meetings, archives)}
          </tbody>
        </table>
      </div>
    </section>

    <section id="parties">
      <h2>Parties &amp; organizations</h2>
      <p class="section-intro">A curated, non-exhaustive list of notable member parties. The Forum reports more than 100 participating parties and organizations today; the full <strong>membership rosters for 1990, 1993 and 2007 are listed below</strong> (from Regalado), and the current membership is still being compiled.</p>
      <div class="party-grid">
${renderParties(data.parties)}
      </div>
${renderMembershipRosters(data.membershipRosters)}
      <h3>Participating countries</h3>
      <p class="countries">${data.participatingCountries.map(esc).join(' · ')}</p>
    </section>

${renderArmedMovements(data.armedMovements)}
${renderMembersInGovernment(data.membersInGovernment, codeByCountry)}
${renderCountryIndex(countries)}
${renderOrganization(data.organization)}
    <section id="related">
      <h2>Related organizations</h2>
      <p class="section-intro">The Foro de São Paulo is often confused with newer left/progressive networks. It has <strong>not</strong> been renamed — these are distinct, coexisting organizations that sometimes coordinate or meet alongside it.</p>
      <div class="party-grid">
${renderRelated(data.relatedOrganizations)}
      </div>
${renderComparison(data.foroVsPuebla)}
    </section>

${renderRegionalBodies(data.regionalBodies)}
${renderCriticalPerspectives(data.criticalPerspectives)}
    <section id="references">
      <h2>References</h2>
      <p class="section-intro">Each reference links to the live source; where available, an <em>archived</em> link points to an Internet Archive snapshot as a permanent fallback (generated by <code>scripts/archive-refs.js</code>).</p>
      <ol class="references">
${renderReferences(data.references, archives, archiveDocs)}
      </ol>
    </section>
  </main>

  <footer class="site-footer">
    <div class="wrap">
      <p>Compiled static site generated from <code>data/forum.json</code> by <code>build.js</code>. Open data — corrections welcome via pull request.</p>
    </div>
  </footer>
  <script src="app.js" defer></script>
</body>
</html>
`;
}

function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const archives = loadArchives();
  const countries = loadCountries();
  const codeByCountry = Object.fromEntries(countries.map((c) => [c.country, c.code]));
  buildRefIndex(data.references);
  const archiveDocs = loadArchiveDocs();

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const html = buildHtml(data, archives, codeByCountry, countries, archiveDocs);
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html);

  // Per-country pages (presidential succession + high court).
  if (countries.length) {
    const cdir = path.join(OUT_DIR, 'countries');
    if (!fs.existsSync(cdir)) fs.mkdirSync(cdir, { recursive: true });
    for (const c of countries) {
      fs.writeFileSync(path.join(cdir, `${c.code}.html`), renderCountryPage(c));
    }
  }

  // Per-meeting detail pages.
  const mdir = path.join(OUT_DIR, 'meetings');
  if (!fs.existsSync(mdir)) fs.mkdirSync(mdir, { recursive: true });
  for (const m of data.meetings) {
    fs.writeFileSync(path.join(mdir, `${m.year}.html`), renderMeetingPage(m, archives, codeByCountry));
  }

  // Copy static assets (currently just the stylesheet).
  fs.copyFileSync(path.join(SRC_DIR, 'styles.css'), path.join(OUT_DIR, 'styles.css'));
  fs.copyFileSync(path.join(SRC_DIR, 'app.js'), path.join(OUT_DIR, 'app.js'));

  // Publish the preserved-document vault (data/archive/) under docs/archive/ so
  // the "saved copy" links resolve on the live site. Git dedupes the identical
  // blobs, so committing both paths costs no extra storage.
  const archivedDocs = copyTree(ARCHIVE_SRC, path.join(OUT_DIR, 'archive'));

  // Disable Jekyll processing on GitHub Pages.
  fs.writeFileSync(path.join(OUT_DIR, '.nojekyll'), '');

  // Regenerate the human-readable reference catalog from the same data, so it
  // never drifts (ADR-0002, ADR-0011).
  writeCatalog();

  const count = data.meetings.length;
  const archivedRefs = data.references.filter((r) => archives[r.url] && archives[r.url].archiveUrl).length;
  console.log(`Built docs/index.html (${count} meetings, ${data.parties.length} parties, ${data.references.length} references, ${archivedRefs} with archive fallback) + ${countries.length} country pages + ${archivedDocs} preserved documents.`);
}

main();
