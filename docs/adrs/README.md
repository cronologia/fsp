# Architecture Decision Records

This directory records the significant architectural decisions for this project,
using lightweight [ADRs](https://adr.github.io/). Each record captures the
context, the decision, and its consequences so future contributors understand
*why* — not just *what*.

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [0001](0001-zero-dependency-static-site-generator.md) | Zero-dependency static site generator | Accepted |
| [0002](0002-json-as-single-source-of-truth.md) | JSON as the single source of truth | Accepted |
| [0003](0003-publish-via-github-pages-from-docs.md) | Publish via GitHub Pages from `docs/` | Accepted |
| [0004](0004-archive-references-in-wayback-machine.md) | Preserve references in the Wayback Machine | Accepted |
| [0005](0005-data-quality-and-sourcing-policy.md) | Data quality & sourcing policy | Accepted |
| [0006](0006-wayback-harvesting-pipeline-on-ci.md) | Run the Wayback harvesting pipeline on CI | Accepted |

## Adding an ADR

Copy [`0000-template.md`](0000-template.md) to the next number, fill it in, and
add a row to the table above. ADRs are immutable once Accepted: to change a
decision, add a new ADR that supersedes the old one (and mark the old one
`Superseded by ADR-NNNN`).
