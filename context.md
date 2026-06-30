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

- Every meeting since 1990 (edition, year, dates, host city/country).
- The parties and organizations involved, with key figures.
- References, each preserved in the Internet Archive as a fallback.

The project values **verifiability and neutrality** over completeness. It serves
readers across the political spectrum, so it must describe rather than advocate,
and flag what is uncertain.

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
include the **Progressive International** and **CELAC Social**. Keep these
distinctions intact in the data.

## Glossary

- **Encontro / Encuentro** — a Forum meeting/edition (numbered with roman numerals).
- **Declaração Final / Declaración Final** — the consensus declaration closing a meeting.
- **Grupo de Trabalho** — the Forum's Working Group.
- **Secretaria Executiva** — Executive Secretariat (implements plenary decisions).

## Known data gaps (see GitHub issues)

- The full list of the **48 founding organizations** (1990) is not yet sourced.
- **Exact dates** and some **edition numbers** vary between sources and are flagged.
- Member roster, per-meeting declarations, and organizational structure are
  partially documented and tracked as open tickets.

## Primary / key sources

The official site `forodesaopaulo.org` (best harvested via the Wayback Machine),
plus Wikipedia (EN/PT), the PT's official pages, and a spread of news/analysis
across the political spectrum. All cited sources live in
`data/forum.json` → `references[]`.
