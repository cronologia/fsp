# ADR-0006: Run the Wayback harvesting pipeline on CI

- **Status:** Accepted
- **Date:** 2026-06-30

## Context

ADR-0004 established that references are preserved in the Wayback Machine, and we
also want to recover historical content from the Forum's official site
(`forodesaopaulo.org`), which survives mainly as Internet Archive captures. Both
tasks require outbound access to `archive.org` / `web.archive.org`.

In practice the development sandbox — and likely contributors' networks — block
those hosts by egress policy, so the collection cannot run there. We need a place
to run it that has open internet, on a schedule, without anyone's laptop being the
single point of execution.

## Decision

- Add `scripts/wayback-harvest.js`: a discovery step that queries the Wayback CDX
  API for captures of `forodesaopaulo.org` and writes an inventory
  (`data/wayback-inventory.json` + `docs-research/wayback-inventory.md`),
  high-value pages first. It does not scrape page bodies — it indexes what exists.
- Make the inventory **committed and incremental**: it is the raw harvested data,
  kept in the repo; each run merges only captures newer than a stored
  `latestCapture` watermark (via the CDX `from=` parameter). A full scan happens
  only on first run or with `--full`, so routine runs never repeat the whole
  harvest.
- Add `.github/workflows/wayback.yml`, the **Wayback collection** workflow, which
  runs harvest + reference archiving + build on GitHub-hosted runners:
  - `pull_request` → run and upload the inventory as an artifact (no commit);
  - `workflow_dispatch` / weekly `schedule` → run and commit refreshed inventory,
    archive cache, and rebuilt `docs/`.

The pipeline automates **discovery and preservation**; turning captures into
chronology facts remains a curated edit to `data/forum.json`.

## Consequences

- **Positive:** Collection runs reliably where the Internet Archive is reachable,
  on a cadence, independent of any contributor's environment.
- **Positive:** PR runs prove the pipeline works and surface counts without
  mutating the repo; scheduled runs keep data fresh.
- **Negative:** Adds a CI workflow and two generated artifacts to maintain; the CDX
  query is capped (default 10k URLs) and may need pagination for full coverage.
- **Neutral:** Save Page Now rate limits mean some references can fail a given run
  and get picked up on the next; the script exits non-zero so this is visible.
