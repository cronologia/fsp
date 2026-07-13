# Project context

Domain background for anyone (human or AI) working on this repository. Pair this
with [`AGENTS.md`](AGENTS.md) (how to work) and [`docs/adrs/`](docs/adrs/) (why
the architecture is what it is).

## The subject: Foro de São Paulo

The **Foro de São Paulo** (Portuguese; Spanish/English: *São Paulo Forum*) is a
conference of **left-wing political parties and organizations of Latin America
and the Caribbean**.

- **Founded:** 1–4 July 1990, at the Hotel Danúbio in São Paulo, Brazil.
- **Convened by:** the Brazilian Workers' Party (*Partido dos Trabalhadores*, PT),
  on the initiative of Luiz Inácio Lula da Silva.
- **Original name:** *Encontro de Partidos e Organizações de Esquerda da América
  Latina e do Caribe*. Renamed "Foro de São Paulo" from the 1991 Mexico City
  meeting, after the city of the first gathering.
- **Context:** organized after the fall of the Berlin Wall and the collapse of
  the Soviet bloc, to coordinate the regional left and debate alternatives to
  neoliberal policies.
- **Cadence:** annual or biennial **Encontros** (meetings) hosted in rotating
  countries; each closes with a **Declaração Final** (final declaration).
- **Scale today:** the Forum reports 100+ participating parties and
  organizations (the PT cites ~123 across 27 countries). *(to verify)*

## Project goal

Produce an **open, source-referenced chronology** as a static website:

- Every meeting since 1990 (edition, year, dates, host city/country) — verified
  against the Forum's own declarations (see ADR-0007).
- The parties and organizations involved, with key figures — including the
  **armed/guerrilla movements** and the **regional integration bodies** (Mercosur,
  ALBA, UNASUR, CELAC, BRICS) in the Forum's orbit.
- Both **critical** analyses and the Forum's own **insider** scholarship, so the
  same event is describable from more than one side.
- References, each preserved in the Internet Archive **and** as a full local copy
  in the document vault (ADR-0004, ADR-0008).

The project values **verifiability and neutrality** over completeness. It serves
readers across the political spectrum, so it must describe rather than advocate,
and flag what is uncertain: contested claims are **attributed to their authors**,
never asserted in the site's own voice.

## Important disambiguation: Foro de São Paulo ≠ Grupo de Puebla

A common error is to claim the Foro de São Paulo was *renamed* the **Grupo de
Puebla**. It was not. They are distinct, coexisting organizations:

| | Foro de São Paulo | Grupo de Puebla |
|---|---|---|
| Founded | 1990, São Paulo | July 2019, Puebla (Mexico) |
| Members | political **parties** & movements | individual **leaders** (presidents, ministers, intellectuals) |
| Venezuela/Cuba/Bolivia | included | largely excluded |
| Status | active | active |

Both met side by side in Tegucigalpa in June 2024. Related allied networks
include the **World Social Forum** (the movement/civil-society counterpart, born
in Porto Alegre in 2001), the **Progressive International** and **CELAC Social**.
Keep these distinctions intact in the data.

## Glossary

- **Encontro / Encuentro** — a Forum meeting/edition (numbered with roman numerals).
- **Declaração Final / Declaración Final** — the consensus declaration closing a meeting.
- **Grupo de Trabalho** — the Forum's Working Group.
- **Secretaria Executiva** — Executive Secretariat (implements plenary decisions).

## Known data gaps (see GitHub issues)

Meeting **editions and dates are now verified** (1990–2024); Quito 2003 is
recorded as unnumbered (not in the official series). Remaining open work is
tracked as GitHub issues:

- The **48 founding organizations** (1990) — the source is now located (Regalado,
  *Encuentros y desencuentros*, pp. 264–265); needs transcription (#2).
- The full **member roster** + ambiguous affiliations (#4); verifying each
  **armed group's** Forum participation (#95); **regional-bodies** primary docs
  and the **World Social Forum** connection (#93); a standing **data-quality
  audit** of every `verified:false`/attributed claim (#97).

Recovery work starts from `data/wayback-inventory.json` (the generated index of
archived `forodesaopaulo.org` pages) and the declaration corpus in
`data/declarations/` (ADR-0007).

## Primary / key sources

- **The Forum's own texts:** its numbered final-declarations book (Pomar &
  Regalado, Fundação Perseu Abramo, 2013 — the corpus in `data/declarations/`),
  Regalado's *Encuentros y desencuentros…* (Ocean Sur, 2008), and the official
  site `forodesaopaulo.org` (best read via the Wayback Machine).
- **Cross-spectrum:** Wikipedia (EN/PT), party/government sites, and news &
  analysis from across the political spectrum, including critical works (Salgueiro,
  Carvalho / Mídia Sem Máscara, De Paola).
- All cited sources live in `data/forum.json` → `references[]`, each preserved as a
  Wayback snapshot and a local copy in `data/archive/`.
