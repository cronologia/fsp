# ADR-0008: Preserve full local copies of every reference (document vault)

- **Status:** Accepted
- **Date:** 2026-07-13
- **Extends:** ADR-0004

## Context

ADR-0004 preserves references by caching their Wayback **snapshot URL** in
`data/archives.json` and rendering an "archived" fallback link. That protects
against link rot only as long as the Internet Archive keeps the capture and
stays reachable. For a politically contested subject whose sources include sites
that get taken down or altered (the Forum's own pages, party/guerrilla sites,
defunct outlets like Rádio Vox), a link to an archive is weaker than holding the
document itself. We also want the preserved sources viewable on the published
site, not just referenced.

## Decision

- Add `scripts/archive-docs.js`: for every reference, download a copy into
  **`data/archive/<type>/<id>.<ext>`** — the Wayback raw (`id_`) capture when one
  exists, else the live URL — organised into type subfolders, with a generated
  `README.md` provenance table and an `index.json` manifest.
- `build.js` copies the vault to **`docs/archive/`** (git deduplicates identical
  blobs, so no extra storage) and renders a **"saved copy"** link next to each
  reference, so preserved documents are both in-repo and on the live site.
- Add an **`official: true`** flag on references (the Forum's own pages,
  party/government sites): `archive-refs.js` forces a **fresh** Save Page Now
  capture the first time it sees them — rather than accepting a years-old
  snapshot — and marks the capture `fresh` so later runs stay idempotent.
- The collect job (ADR-0006) runs `archive-docs.js` and commits `data/archive/`;
  its push rebase-retries so a run isn't lost to a moved `master`.

## Consequences

- **Positive:** Sources survive even if both the live page and the Wayback
  capture disappear; the vault is browsable in-repo and on the site.
- **Positive:** `official: true` guarantees a capture of the content *as cited*.
- **Negative:** Adds a few MB of committed binaries/HTML; some hosts block Save
  Page Now / bot fetches (e.g. certain publisher pages) and can't be vaulted —
  those are logged as failed and re-tried, or the URL is repointed.
- **Neutral:** Fetching needs `archive.org`/open internet, so it runs on the
  Action, consistent with ADR-0006. Periodic re-capture of `official` pages is
  tracked separately (issue #84).
