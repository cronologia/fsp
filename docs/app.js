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
