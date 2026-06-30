# ADR-0001: Zero-dependency static site generator

- **Status:** Accepted
- **Date:** 2026-06-30

## Context

The deliverable is a "compiled static HTML website" presenting a chronology. The
content is small, structured, and grows by hand-curated edits. Options ranged
from authoring raw HTML by hand, to a full static-site framework (e.g. Astro,
Eleventy, Hugo), to a tiny custom generator.

Hand-authored HTML doesn't scale as the dataset grows and invites
copy-paste inconsistency. A full framework brings a dependency tree, a lockfile,
version churn, and a learning curve disproportionate to a single-page site —
and makes the project harder to pick up cold (including for AI agents).

## Decision

Build a **custom, zero-dependency generator** in a single Node script
(`build.js`) using only the standard library and template strings. It reads the
data files and emits static HTML/CSS into `docs/`. No `package.json`
dependencies, no build framework, no `npm install`.

## Consequences

- **Positive:** Clone-and-run with only Node installed; `node build.js` is the
  whole toolchain. Nothing to audit for supply-chain risk. Trivial to understand
  end to end.
- **Positive:** The output is plain static files hostable anywhere.
- **Negative:** No framework niceties (components, hot reload, asset hashing) —
  acquired by hand if ever needed.
- **Neutral:** Adding a runtime dependency now requires a deliberate, recorded
  decision (a new ADR), which is the intended friction.
