# KEYWORDS.md — search terms that work (and traps that don't)

Hand-maintained. The family's `core/tools/build-keywords.py` cannot generate a
mechanical half here (it reads `data/chronology.json`/`glossary.json`; this
repo's dataset is `data/forum.json`) — add entries as sources teach them.

## ASR / auto-caption traps

Auto-captioned video is a major source class for this subject, and the ASR
never writes the organization's name cleanly. Searching the clean form returns
**zero** in the affected transcripts; search the garbled variants.

- **English ASR** (e.g. the America's Survival TV episode, `olavo-astv-2015`):
  "São Paulo Forum" → `the s paulo forum`, `the saulo form`, `the S Pao forum`,
  `the S Paul Forum`, `s Pao forign`, `S Paulo forign`, `the some PA forign`.
  Grep `paulo for` and `pa for` and read contexts.
- **Portuguese ASR**: usually intact as `foro de São Paulo`, but also
  `for de São Paulo`, `fora de São Paulo`, `foro de Sao Paulo` and — accent
  trap — a single `.` in a regex never matches the two-byte `ã` (measured on
  the COF corpus: `Foro de S.o Paulo` scored 0 against a true 89; use `..` or
  match unaccented fragments).
- Proper-name garbles recurrent in this subject's videos: `ug Travis` /
  `ugo chaves` = Hugo Chávez · `fre Betto` = Frei Betto · `aana` = Havana ·
  `dma rusoff`/`Delma russof` = Dilma Rousseff · `Jose Carlos graa Wagner` =
  José Carlos Graça Wagner · `Global` (as a newspaper) = O Globo ·
  `Marco Antônio Vila` = Marco Antônio Villa · `the far`/`Fark` = FARC ·
  `Alo D Carval` and variants = Olavo de Carvalho.

## Substring traps

- `foro` alone matches `fórum`, `foros`, `aforo` in Spanish/Portuguese prose —
  use word boundaries.
- The Grupo de Puebla is **not** a renaming of the FSP (see the site's
  disambiguation section); text that says "the Forum renamed itself" is a
  claim to attribute, not a search synonym to adopt.

## Terms that sources actually use

- The Forum's own documents: `Foro de São Paulo`, `Encontro`/`Encuentro`,
  `Declaración Final`, `declaração final`, `memoria`.
- Critics' vocabulary worth searching alongside the name: `pátria grande`
  (used both by members and critics), `braço político`, `coordenação
  estratégica` (the PT-congress phrasing critics cite).
