# ADR-0007: Recover and extract the declaration corpus

- **Status:** Accepted
- **Date:** 2026-07-13

## Context

The Forum's final declarations are the primary source for each meeting's edition
number, dates, and content. The live pages on `forodesaopaulo.org` are
client-side-rendered shells (a server-side fetch returns markup with no article
text), and older Wayback captures of the declaration slugs are often JS-era
navigation shells too. We needed a durable, machine-readable corpus to verify
dates and edition numbers rather than trusting secondary sources.

Mining the Wayback inventory found the Forum's own book — *Declaração Final dos
Encontros do Foro de São Paulo (1990–2013)* (Pomar & Regalado, Fundação Perseu
Abramo, 2013) — published as **19 numbered chapter PDFs**. These are clean,
text-based, and immune to the HTML-shell problem.

## Decision

- Curate `data/declarations/official-pdfs.json` — the canonical snapshot URLs for
  book chapters 01–19, one per declaration 1990–2013.
- `scripts/fetch-declarations.js` downloads the PDFs to `data/declarations/pdf/`
  (binary, `%PDF` magic check) and the archived HTML bodies to
  `data/declarations/<year>.html`, mining alternate captures when a body is a
  shell. It also targets recent meetings (2018+) that lack a recorded URL.
- `scripts/extract-declarations.js` is a **zero-dependency** PDF-to-text
  extractor (Node's built-in `zlib` for FlateDecode + a linear content-stream
  scanner for the `Tj`/`'`/`"`/`TJ` operators; CP1252 decoding). It writes the
  plain-text corpus to `data/declarations/text/` and mines each declaration's own
  header for its **date** and **Roman-numeral edition**, cross-checked against the
  book chapter number. It also generates `data/declarations/pdf/README.md`.
- **Key finding, recorded in the data:** the official chapter numbering **skips
  Quito 2003** (XI = Antigua 2002 → XII = São Paulo 2005). `meetings[].edition`
  was corrected to match; Quito 2003 is marked `numbered: false`.

## Consequences

- **Positive:** Editions and most dates are now verifiable against the Forum's
  own texts; the corpus is diffable and searchable in-repo without the binaries.
- **Positive:** Stays within ADR-0001 (no runtime dependencies) — the PDF parser
  is hand-rolled on `zlib`.
- **Negative:** Fetching needs `archive.org` access, so it runs on the Wayback
  Action (ADR-0006), not the egress-restricted sandbox. Extraction is offline.
- **Neutral:** The parser handles these text-based Distiller/Word PDFs, not
  scanned or CID-font PDFs — sufficient for this corpus.
