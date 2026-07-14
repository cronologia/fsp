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
    if (countEl) countEl.textContent = shown + ' of ' + rows.length + ' meetings';
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
  [['ptl-grid', 'ptl-caption'], ['cm-grid', 'cm-caption']].forEach(function (pair) {
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

/* Interactive tile-grid map: recolour countries as the year slider moves; a Play
 * button animates through the years. Server-rendered for the current year, so the
 * map still shows a snapshot with JS disabled. */
(function () {
  var grid = document.getElementById('atlas-grid');
  var raw = document.getElementById('atlas-data');
  var slider = document.getElementById('atlas-slider');
  var yearOut = document.getElementById('atlas-year');
  var cap = document.getElementById('atlas-caption');
  var play = document.getElementById('atlas-play');
  if (!grid || !raw || !slider) return;

  var data;
  try { data = JSON.parse(raw.textContent); } catch (e) { return; }
  var CLASS = { f: 'atlas-f', u: 'atlas-u', o: 'atlas-o', n: 'atlas-n', '.': 'atlas-nodata' };
  var STATES = 'f u o n .'.split(' ');
  var byCode = {};
  data.countries.forEach(function (c) { byCode[c.code] = c; });
  var tiles = Array.prototype.slice.call(grid.querySelectorAll('.atlas-tile'));

  function render(year) {
    var i = year - data.start;
    yearOut.textContent = year;
    var count = 0, electoral = 0;
    tiles.forEach(function (t) {
      var c = byCode[t.getAttribute('data-code')];
      if (!c) return;
      var st = c.states.charAt(i) || '.';
      STATES.forEach(function (s) { t.classList.remove(CLASS[s]); });
      t.classList.add(CLASS[st]);
      t.title = c.name + ' ' + year + ': ' + c.who[i];
      if (st !== 'o') electoral++;         // one-party states (Cuba) not in the electoral count
      if (st === 'f' || st === 'u') count++;
    });
    if (cap) cap.textContent = 'Showing ' + year + ' — ' + count + ' of ' + electoral +
      ' electoral countries FSP-governed (Cuba, one-party, shown separately). Hover a country for its president.';
  }

  slider.addEventListener('input', function () { stop(); render(Number(slider.value)); });

  // Hover/focus a country → show its detail for the current year.
  grid.addEventListener('pointerover', function (e) {
    var t = e.target.closest('.atlas-tile');
    if (t && cap) cap.textContent = t.title;
  });

  var timer = null;
  function stop() { if (timer) { clearInterval(timer); timer = null; play.textContent = '▶ Play'; } }
  function start() {
    play.textContent = '❚❚ Pause';
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
