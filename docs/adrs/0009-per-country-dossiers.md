# ADR-0009: Per-country dossiers as separate data files

- **Status:** Accepted
- **Date:** 2026-07-14

## Context

The Forum's story is partly national: which countries elected presidents from
member/affiliated parties, and what happened to each country's high court during
those governments. Cramming that per-country detail into the single
`data/forum.json` would make one very large file that mixes the Forum-level
record (meetings, parties, declarations) with country-level records that grow
independently and are worked on one country at a time (the country "epics").

We also needed a stable set of countries to drive both the per-country pages and
the aggregate views (the country index and the year-by-year timeline map,
ADR-0010) — a set that is deliberately **not** an exhaustive list of Latin
America, only the countries we have compiled and sourced.

## Decision

Model each country as its own file, `data/countries/<CODE>.json` (ISO-3166-1
alpha-2 code), discovered through `data/countries/index.json`. Each file carries:

- `country`, `code`, `fspParty`, `fspStatus` — the country and its FSP-aligned
  party, with `fspStatus` recording whether the affiliation is confirmed or
  still *to verify*.
- `presidentialSuccession[]` — every president since 1990 (`name`, `party`,
  `start`, `end` where `end` may be `"present"`, `fsp` boolean, optional
  `notes`). The `fsp` flag is only `true` where the party's FSP membership is
  sourced; unsourced cases are left `false` with a note rather than counted.
- `supremeCourt` — the high court, with `verified` and optional `courtHistory[]`
  / `justices[]`.

`scripts/validate-data.js` validates every file listed in `index.json`.
`build.js` renders a page per country and feeds the same data into the country
index and the timeline map. The set of files is the definition of the **tracked
countries**; adding a country is adding a file + an index entry.

## Consequences

- **Easier:** countries can be added and deepened independently (one file, one
  PR, one epic) without touching the Forum-level data; aggregate views pick up a
  new country automatically once it validates.
- **Easier:** the honesty rule has a natural home — `fspStatus` per country and
  `fsp` per president keep "confirmed" and "to verify" distinct, which the map
  and catalog render as different states.
- **Neutral:** "tracked ≠ exhaustive." Every surface that counts countries must
  say so (the map footnote, the catalog header) to avoid implying the set is all
  of Latin America.
- **Harder:** per-country and Forum-level facts can disagree (e.g. a party's
  affiliation) and must be reconciled (tracked under the roster/affiliation
  issues). The validator enforces shape, not cross-file consistency.
