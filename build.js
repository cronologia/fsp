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

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data', 'forum.json');
const ARCHIVES_FILE = path.join(ROOT, 'data', 'archives.json');
const COUNTRIES_DIR = path.join(ROOT, 'data', 'countries');
const SRC_DIR = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'docs');

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

function renderMeetingsRows(meetings) {
  return meetings
    .map((m) => {
      const dates = m.dates
        ? `${esc(m.dates)}${m.datesVerified ? '' : ' <span class="flag" title="dates not verified against a primary source">?</span>'}`
        : '<span class="muted">year only</span>';
      const decl = m.declarationUrl
        ? `<a class="decl-link" href="${esc(m.declarationUrl)}" rel="noopener noreferrer" target="_blank" title="Final declaration (Internet Archive)">📄 declaration</a>`
        : '<span class="muted">—</span>';
      return `        <tr>
          <td class="edition">${esc(m.edition)}</td>
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

function renderReferences(refs, archives) {
  return refs
    .map((r) => {
      const snap = archives[r.url];
      const archiveLink = snap && snap.archiveUrl
        ? ` · <a class="archive-link" href="${esc(snap.archiveUrl)}" rel="noopener noreferrer" target="_blank" title="Internet Archive Wayback Machine snapshot">archived${
            snap.timestamp ? ` ${esc(formatArchiveTs(snap.timestamp))}` : ''
          }</a>`
        : '';
      return `        <li>
          <a href="${esc(r.url)}" rel="noopener noreferrer" target="_blank">${esc(r.title)}</a>
          <span class="ref-meta">${esc(r.publisher)} — ${esc(r.type)}${archiveLink}</span>
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

function renderFormation(f) {
  if (!f || !f.items || !f.items.length) return '';
  const cards = f.items
    .map((it) => {
      const flag = it.verified === false ? ' <span class="flag" title="reported / attributed, not independently sourced here">?</span>' : '';
      const src = (it.sources || [])
        .map((u) => `<a href="${esc(u)}" rel="noopener noreferrer" target="_blank">source</a>`)
        .join(' · ');
      return `      <article class="related-card">
        <h3>${esc(it.title)}${flag}</h3>
        <p>${esc(it.text)}</p>
        ${src ? `<p class="related-meta">${src}</p>` : ''}
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
      <h2>Court history since 1900</h2>
      <p class="section-intro">Structural changes to the court over time — foundings, size changes, court-packings, purges and reforms. <span class="ch-type ch-packing">packing</span>/<span class="ch-type ch-purge">purge</span> mark expansions and forced removals. ${src ? `Sources: ${src}.` : ''}</p>
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
    <section>
      <h2>High court — ${esc(sc.name || '')}</h2>
      <dl class="facts">
        ${sc.size ? `<dt>Seats</dt><dd>${esc(sc.size)}</dd>` : ''}
        <dt>Appointment</dt><dd>${esc(sc.appointmentMethod || '')}</dd>
        <dt>Changes (FSP era)</dt><dd>${esc(sc.fspEraChanges || '')}</dd>
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

function buildHtml(data, archives, codeByCountry) {
  const { meta, founding } = data;
  return `<!DOCTYPE html>
<html lang="${esc(meta.language || 'en')}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(meta.title)}</title>
  <meta name="description" content="${esc(meta.description)}" />
  <link rel="stylesheet" href="styles.css" />
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

  <main class="wrap">
    <div class="notice">
      <strong>Data quality note:</strong> ${esc(meta.dataQualityNote)}
    </div>

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
      <p class="section-intro">All recorded editions of the Forum. A <span class="flag">?</span> marks dates not yet verified against a primary source. Years with no meeting (1994, 1999, 2004, 2006, 2020–2022) are omitted.</p>
      <div class="table-scroll">
        <table class="meetings">
          <thead>
            <tr><th>Edition</th><th>Year</th><th>Dates</th><th>City</th><th>Country</th><th>Declaration</th><th>Notes</th></tr>
          </thead>
          <tbody>
${renderMeetingsRows(data.meetings)}
          </tbody>
        </table>
      </div>
    </section>

    <section id="parties">
      <h2>Parties &amp; organizations</h2>
      <p class="section-intro">A curated, non-exhaustive list of notable member parties. The Forum reports more than 100 participating parties and organizations today; the complete membership and the full list of the 48 founding organizations are still being compiled.</p>
      <div class="party-grid">
${renderParties(data.parties)}
      </div>
      <h3>Participating countries</h3>
      <p class="countries">${data.participatingCountries.map(esc).join(' · ')}</p>
    </section>

${renderMembersInGovernment(data.membersInGovernment, codeByCountry)}
    <section id="related">
      <h2>Related organizations</h2>
      <p class="section-intro">The Foro de São Paulo is often confused with newer left/progressive networks. It has <strong>not</strong> been renamed — these are distinct, coexisting organizations that sometimes coordinate or meet alongside it.</p>
      <div class="party-grid">
${renderRelated(data.relatedOrganizations)}
      </div>
    </section>

${renderCriticalPerspectives(data.criticalPerspectives)}
    <section id="references">
      <h2>References</h2>
      <p class="section-intro">Each reference links to the live source; where available, an <em>archived</em> link points to an Internet Archive snapshot as a permanent fallback (generated by <code>scripts/archive-refs.js</code>).</p>
      <ol class="references">
${renderReferences(data.references, archives)}
      </ol>
    </section>
  </main>

  <footer class="site-footer">
    <div class="wrap">
      <p>Compiled static site generated from <code>data/forum.json</code> by <code>build.js</code>. Open data — corrections welcome via pull request.</p>
    </div>
  </footer>
</body>
</html>
`;
}

function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const archives = loadArchives();
  const countries = loadCountries();
  const codeByCountry = Object.fromEntries(countries.map((c) => [c.country, c.code]));

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const html = buildHtml(data, archives, codeByCountry);
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html);

  // Per-country pages (presidential succession + high court).
  if (countries.length) {
    const cdir = path.join(OUT_DIR, 'countries');
    if (!fs.existsSync(cdir)) fs.mkdirSync(cdir, { recursive: true });
    for (const c of countries) {
      fs.writeFileSync(path.join(cdir, `${c.code}.html`), renderCountryPage(c));
    }
  }

  // Copy static assets (currently just the stylesheet).
  fs.copyFileSync(path.join(SRC_DIR, 'styles.css'), path.join(OUT_DIR, 'styles.css'));

  // Disable Jekyll processing on GitHub Pages.
  fs.writeFileSync(path.join(OUT_DIR, '.nojekyll'), '');

  const count = data.meetings.length;
  const archivedRefs = data.references.filter((r) => archives[r.url] && archives[r.url].archiveUrl).length;
  console.log(`Built docs/index.html (${count} meetings, ${data.parties.length} parties, ${data.references.length} references, ${archivedRefs} with archive fallback) + ${countries.length} country pages.`);
}

main();
