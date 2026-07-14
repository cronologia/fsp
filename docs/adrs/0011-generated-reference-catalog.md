# ADR-0011: Generated reference catalog (`CATALOG.md`)

- **Status:** Accepted
- **Date:** 2026-07-14

## Context

As the dataset grew — 15 country dossiers, member parties, three membership
rosters, armed movements, regional bodies, related organizations, and ~45
references — there was no single place to read *everything* at once. The website
presents it section by section across many pages; contributors and reviewers
wanted one flat, greppable reference of every country, party, and association.

Writing such a document by hand would immediately drift from the JSON single
source of truth (ADR-0002): every data change would need a parallel manual edit,
and the two would silently diverge.

## Decision

Generate the reference as `CATALOG.md` at the repo root from the same data, via a
zero-dependency script `scripts/gen-catalog.js` (ADR-0001). It emits: countries
+ FSP presidents (with the tracked-≠-exhaustive caveat, ADR-0009), member
parties, parties in government, the full membership rosters (collapsible),
armed/guerrilla movements, regional bodies, related organizations, and the full
reference list.

`build.js` calls the generator on every build, so `CATALOG.md` is regenerated
whenever the site is built and cannot drift from the data. The file carries a
"generated — do not edit by hand" banner and the regeneration command. It lives
at the repo root (a contributor/reviewer reference), not under `docs/`, so it is
not published as part of the site.

## Consequences

- **Easier:** one authoritative, greppable overview of the whole dataset that is
  always current; reviewers can scan coverage and spot gaps without clicking
  through pages.
- **Neutral:** it reflects the data verbatim, including `to verify` states — it
  is a mirror, not a second source. Fixes belong in the JSON, never in
  `CATALOG.md`.
- **Harder / watch-outs:** the CI drift-check guards `docs/`, not the repo root,
  so a stale `CATALOG.md` would not fail CI on its own. Because `build.js`
  regenerates it and PRs commit build output, it stays current in practice;
  contributors who change data must rebuild (or run `node scripts/gen-catalog.js`)
  and commit the result.
