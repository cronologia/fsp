# ADR-0004: Preserve references in the Wayback Machine

- **Status:** Accepted (extended by ADR-0008)
- **Date:** 2026-06-30

## Context

The chronology's credibility rests on its references, but web links rot —
especially the Forum's own site and news articles that get reorganized or
removed. The richest primary source (`forodesaopaulo.org`) survives mainly as
older captures in the Internet Archive. We need references to remain verifiable
even after the live page disappears.

## Decision

- Add `scripts/archive-refs.js`: for every reference URL, query the Wayback
  **availability API**, and trigger **Save Page Now** for anything not yet
  archived; cache the resulting snapshot URL + timestamp in `data/archives.json`.
- `build.js` renders an **"archived YYYY-MM-DD" fallback link** next to each live
  reference when a snapshot exists.
- Re-running is idempotent; the script paces requests to respect rate limits and
  exits non-zero if any URL cannot be archived (CI-gating friendly).

## Consequences

- **Positive:** References gain a permanent fallback; the work survives link rot.
- **Positive:** Same mechanism can later harvest historical content from the
  archived official site.
- **Negative:** The script needs outbound access to `archive.org`, which some
  sandboxed/CI environments block by egress policy — in those it must be run
  elsewhere (locally or via a GitHub Action).
- **Neutral:** Save Page Now is rate-limited for anonymous use, so large batches
  are slow by design.
