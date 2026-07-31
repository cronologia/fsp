'use strict';
/* Progressive enhancement for the meetings table: free-text search, country
 * filter, and year sort. With JS disabled the full table renders normally. */
(function () {
  var table = document.getElementById('meetings-table');
  var search = document.getElementById('m-search');
  var country = document.getElementById('m-country');
  var sort = document.getElementById('m-sort');
  var countEl = document.getElementById('m-count');
  if (!table) return;
  var tbody = table.tBodies[0];
  var rows = Array.prototype.slice.call(tbody.rows);
  var countFmt = (countEl && countEl.getAttribute('data-fmt')) || '{n} of {m} meetings';

  function apply() {
    var q = (search && search.value || '').trim().toLowerCase();
    var c = (country && country.value) || '';
    var shown = 0;
    rows.forEach(function (r) {
      var matchesText = !q || r.textContent.toLowerCase().indexOf(q) !== -1;
      var matchesCountry = !c || r.getAttribute('data-country') === c;
      var show = matchesText && matchesCountry;
      r.style.display = show ? '' : 'none';
      if (show) shown++;
    });
    if (countEl) countEl.textContent = countFmt.replace('{n}', shown).replace('{m}', rows.length);
  }

  function applySort() {
    if (!sort) return;
    var dir = sort.value === 'desc' ? -1 : 1;
    var sorted = rows.slice().sort(function (a, b) {
      return (Number(a.getAttribute('data-year')) - Number(b.getAttribute('data-year'))) * dir;
    });
    sorted.forEach(function (r) { tbody.appendChild(r); });
  }

  if (search) search.addEventListener('input', apply);
  if (country) country.addEventListener('change', apply);
  if (sort) sort.addEventListener('change', function () { applySort(); apply(); });
  apply();
})();

/* Year grids (presidential coverage, court interventions): mirror the
 * hovered/tapped cell's detail into a live caption, so mouse and touch users get
 * the info that is otherwise only in the title tooltip. Purely additive — titles
 * still work with JS disabled. */
(function () {
  [['ptl-grid', 'ptl-caption'], ['lg-grid', 'lg-caption'], ['cm-grid', 'cm-caption']].forEach(function (pair) {
    var grid = document.getElementById(pair[0]);
    var cap = document.getElementById(pair[1]);
    if (!grid || !cap) return;
    var base = cap.textContent;
    function show(e) {
      var t = e.target.closest('[data-d]');
      if (t) cap.textContent = t.getAttribute('data-d');
    }
    function reset() { cap.textContent = base; }
    grid.addEventListener('pointerover', show);
    grid.addEventListener('pointerdown', show); // touch: taps don't fire pointerover reliably
    grid.addEventListener('focusin', show);
    grid.addEventListener('pointerleave', reset);
  });
})();

/* Visualization tabs: turn the stacked panels (Pink tide / Map / Courts) into a
 * tab interface. With JS disabled the tablist stays hidden and the panels simply
 * stack, so nothing is lost. ARIA tab pattern + arrow-key navigation. */
(function () {
  var tablist = document.querySelector('.viz-tabs');
  if (!tablist) return;
  var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
  var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
  if (!tabs.length) return;
  tablist.hidden = false;

  function select(idx, focus) {
    tabs.forEach(function (t, i) {
      var on = i === idx;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (panels[i]) panels[i].hidden = !on;
    });
    if (focus) tabs[idx].focus();
  }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(i); });
    t.addEventListener('keydown', function (e) {
      var n;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabs.length - 1;
      else return;
      e.preventDefault();
      select(n, true);
    });
  });

  // Nav links pointing at a panel activate its tab (then the anchor scroll runs).
  Array.prototype.forEach.call(document.querySelectorAll('.site-nav a'), function (a) {
    var href = a.getAttribute('href') || '';
    var idx = panels.findIndex(function (p) { return p && '#' + p.id === href; });
    if (idx >= 0) a.addEventListener('click', function () { select(idx); });
  });

  select(0);
})();

/* Interactive Latin America map: recolour country paths as the year slider moves;
 * a Play button animates through the years. Server-rendered for the current year,
 * so the map still shows a snapshot with JS disabled. */
(function () {
  var map = document.getElementById('atlas-map');
  var raw = document.getElementById('atlas-data');
  var slider = document.getElementById('atlas-slider');
  var yearOut = document.getElementById('atlas-year');
  var cap = document.getElementById('atlas-caption');
  var play = document.getElementById('atlas-play');
  if (!map || !raw || !slider) return;
  // Localized label formats, emitted by build.js; fall back to the English strings.
  var capFmt = (cap && cap.getAttribute('data-fmt')) ||
    'Showing {year} — {count} of {total} electoral countries FSP-governed (Cuba, one-party, shown separately). Hover or tap a country for its president.';
  var playLbl = (play && play.getAttribute('data-play')) || '▶ Play';
  var pauseLbl = (play && play.getAttribute('data-pause')) || '❚❚ Pause';

  var data;
  try { data = JSON.parse(raw.textContent); } catch (e) { return; }
  var CLASS = {
    f: 'atlas-f', u: 'atlas-u', o: 'atlas-o', n: 'atlas-n', '.': 'atlas-nodata',
    L: 'atlas-leg', C: 'atlas-court', B: 'atlas-both',
  };
  var STATES = 'f u o n . L C B'.split(' ');
  var byCode = {};
  data.countries.forEach(function (c) { byCode[c.code] = c; });
  var paths = Array.prototype.slice.call(map.querySelectorAll('.latam-c'));

  function label(c, year, i) { return c.name + ' ' + year + ': ' + c.who[i]; }

  function render(year) {
    var i = year - data.start;
    yearOut.textContent = year;
    var count = 0, electoral = 0;
    paths.forEach(function (t) {
      var c = byCode[t.getAttribute('data-code')];
      if (!c) return;
      var st = c.states.charAt(i) || '.';
      STATES.forEach(function (s) { t.classList.remove(CLASS[s]); });
      t.classList.add(CLASS[st]);
      var l = label(c, year, i);
      t.setAttribute('aria-label', l);
      if (st !== 'o') electoral++;         // one-party states (Cuba) not in the electoral count
      if (st === 'f' || st === 'u') count++;
    });
    if (cap) cap.textContent = capFmt.replace('{year}', year).replace('{count}', count).replace('{total}', electoral);
  }

  slider.addEventListener('input', function () { stop(); render(Number(slider.value)); });

  // Hover/focus a country → show its detail; click/Enter → open its dossier.
  function detail(e) {
    var t = e.target.closest('.latam-c');
    if (t && cap) cap.textContent = t.getAttribute('aria-label');
  }
  function go(code) { if (code) window.location.href = 'countries/' + code + '.html'; }
  map.addEventListener('pointerover', detail);
  map.addEventListener('focusin', detail);
  map.addEventListener('click', function (e) {
    var t = e.target.closest('.latam-c');
    if (t) go(t.getAttribute('data-code'));
  });
  map.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = e.target.closest('.latam-c');
    if (t) { e.preventDefault(); go(t.getAttribute('data-code')); }
  });

  var timer = null;
  function stop() { if (timer) { clearInterval(timer); timer = null; play.textContent = playLbl; } }
  function start() {
    play.textContent = pauseLbl;
    var y = Number(slider.value);
    if (y >= data.end) y = data.start;
    timer = setInterval(function () {
      y++;
      if (y > data.end) { stop(); return; }
      slider.value = y; render(y);
    }, 600);
  }
  if (play) play.addEventListener('click', function () { timer ? stop() : start(); });

  render(Number(slider.value));
})();
