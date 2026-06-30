# ADR-0005: Data quality & sourcing policy

- **Status:** Accepted
- **Date:** 2026-06-30

## Context

The subject is politically contested, and sources disagree — on exact meeting
dates, edition numbers, membership, and framing. An uncritical merge of sources
would produce confident but wrong claims and invite accusations of bias. The
project must be trustworthy to readers across the political spectrum.

## Decision

Adopt an explicit, machine-and-human-enforceable policy:

1. **Cite everything.** Facts trace to entries in `references[]`; prefer primary
   or high-quality secondary sources.
2. **Flag uncertainty rather than guess.** Use explicit markers in the data
   (`datesVerified: false`, `founding: null`) and surface them in the UI (a `?`
   flag, "to verify" badges, a data-quality banner). Honest-but-flagged beats
   confident-but-wrong.
3. **Preserve real distinctions.** Notably, the Foro de São Paulo is **not** the
   Grupo de Puebla; do not conflate organizations.
4. **Stay neutral.** Describe; do not advocate. Include sources from across the
   spectrum.

## Consequences

- **Positive:** The site is defensible and transparent about what is and isn't
  verified.
- **Positive:** Gives contributors (including AI agents) a clear rule for
  ambiguous data: flag it.
- **Negative:** Visible "to verify" markers make gaps obvious — accepted as
  honesty, and a backlog of sourcing tickets tracks closing them.
- **Neutral:** Enables a future CI schema check to enforce required source fields.
