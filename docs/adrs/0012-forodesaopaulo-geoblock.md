# ADR-0012: Capturing forodesaopaulo.org requires a Brazilian IP

- **Status:** Accepted
- **Date:** 2026-07-14
- **Relates to:** ADR-0004 (Wayback archiving), ADR-0006 (Wayback pipeline on CI), ADR-0007 (declaration corpus), ADR-0008 (document vault)

## Context

The Forum's official site, `forodesaopaulo.org`, is our primary source for
declarations, "Memoria" pages, and member lists (ADR-0007). Our preservation
strategy assumes we can (a) read those pages and (b) get the Internet Archive to
snapshot them (ADR-0004), with the CI pipeline (ADR-0006) driving both from
GitHub's runners.

That assumption has broken. **`forodesaopaulo.org` now geoblocks non-Brazilian
IPs — US requests in particular are refused.** Because:

- GitHub Actions runners are US-based, so `archive-refs.js` /
  `fetch-declarations.js` (ADR-0006/0007) cannot reach the site.
- The Internet Archive's own crawlers are US-based, so **Save Page Now and the
  Wayback crawlers cannot capture the site either** — Wayback coverage
  effectively stops around **2024–2025**, and newer pages can't be archived on
  demand.
- This sandbox's egress is US-routed too (and policy-restricted), so it can't
  reach the site directly.

The net effect: the official site's recent content is neither readable nor
archivable through any US-based path, which is every path we had.

## Decision

Treat `forodesaopaulo.org` as reachable **only via a Brazilian IP**, and make the
**local document vault (ADR-0008) the primary preservation** for it — not the
Wayback Machine.

- To fetch or re-capture an official page, use a **Brazil-based egress**: a
  BR VPN/proxy, a self-hosted GitHub Actions runner in Brazil, or a manual
  capture performed from Brazil. Save the raw bytes into `data/archive/` and
  commit them; that committed copy — not a Wayback URL — is the citation of
  record when Wayback has no snapshot.
- When adding/refreshing an `official: true` reference on this host, do **not**
  rely on the CI Wayback step to preserve it (it will fail from the US). Capture
  it from Brazil and commit the vault copy in the same change.
- Prefer, where they exist, **already-archived** pre-2024 Wayback snapshots and
  the committed **declaration corpus / PDFs** (ADR-0007), which we captured while
  the site was still US-reachable.

## Consequences

- **Preservation still works**, but shifts from "Wayback snapshot" to "committed
  vault copy captured from Brazil" for this host. ADR-0008's vault becomes
  load-bearing rather than a redundancy for `forodesaopaulo.org`.
- **CI can't self-serve** official captures for this host (ADR-0006); the
  periodic official re-capture (#84) needs a Brazilian egress path to run at all.
  Until one exists, official-page refreshes are a **manual, from-Brazil** step.
- **No workarounds that defeat the geoblock's purpose or our own egress policy**:
  we do not route the sandbox around its proxy. A BR path is an owner-provided
  capability (their own VPN/runner), not something this agent arranges from a
  US-restricted environment.
- Data already recovered (the declaration corpus, existing vault copies, pre-2025
  Wayback snapshots) is unaffected and remains the backbone of the citations.
