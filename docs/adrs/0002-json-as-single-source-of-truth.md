# ADR-0002: JSON as the single source of truth

- **Status:** Accepted
- **Date:** 2026-06-30

## Context

The chronology data (meetings, parties, references) must be editable, reviewable
in diffs, and consumable by the generator. It is also enriched by a machine
process — archiving references to the Wayback Machine — which produces data of a
different nature (generated, refreshable) than the hand-curated facts.

Mixing hand-curated facts and machine-generated cache in one file would make
diffs noisy and risk a script overwriting human edits.

## Decision

- **`data/forum.json`** is the **single, hand-curated source of truth** for all
  facts. The generator and scripts read it; only humans (or reviewed edits)
  write it.
- **`data/archives.json`** is a **machine-generated cache** (URL → Wayback
  snapshot), written only by `scripts/archive-refs.js` and never by hand.
- `build.js` **merges** the two at compile time to render archived fallback
  links.

## Consequences

- **Positive:** Clean separation — curated facts and generated cache evolve
  independently; a re-archive run never touches curated data.
- **Positive:** Reviewable, human-readable diffs for factual changes.
- **Negative:** Two files to keep coherent; the merge key is the reference URL,
  so URLs must match exactly between the data and the cache.
- **Neutral:** A future JSON Schema can validate `forum.json` structure in CI.
