# ADR-0003: Publish via GitHub Pages from `docs/`

- **Status:** Accepted
- **Date:** 2026-06-30

## Context

The site needs hosting that is free, low-maintenance, and tied to the
repository. GitHub Pages can serve either a branch root, a `docs/` folder, or a
GitHub Actions artifact. We also want the published output to be inspectable in
the repo and the publish step to require no extra infrastructure initially.

## Decision

Compile the site into a committed **`docs/`** folder and serve it via **GitHub
Pages → Settings → Pages → source: `docs/` folder** on the default branch. A
`.nojekyll` file disables Jekyll processing so the raw files are served as-is.

The compiled output is committed alongside the source data so Pages can serve it
without a build step.

## Consequences

- **Positive:** Zero-infrastructure publishing; no CI required to go live.
- **Positive:** The exact published output is visible and diffable in the repo.
- **Negative:** `docs/` must be rebuilt and committed whenever `data/` changes;
  forgetting leaves the site stale. A CI drift-check or auto-deploy (future ADR)
  can enforce this.
- **Neutral:** If we later prefer CI-built artifacts, this can be superseded by
  an Actions-based Pages deployment that drops committed output.
