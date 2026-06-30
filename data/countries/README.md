# Country files — presidential succession & high courts

One JSON file per Latin American country that has had a **Foro de São Paulo (FSP)**
member/affiliated president. Each file documents:

- the **presidential succession since 1990**, with FSP presidents flagged (`fsp: true`);
- the **Supreme / high court**: its name, size, appointment method, and the
  **changes made during (or after) the FSP era**, plus how much of that survives.

See [`index.json`](index.json) for the list. Files are named by ISO country code
(e.g. `BR.json`).

## Schema (per file)

```jsonc
{
  "country": "Brazil",
  "code": "BR",
  "fspParty": "Partido dos Trabalhadores (PT)",
  "fspStatus": "founding member",
  "fspPresidents": ["Luiz Inácio Lula da Silva", "Dilma Rousseff"],
  "presidentialSuccession": [
    { "name": "...", "party": "...", "start": "1990", "end": "2003",
      "fsp": false, "notes": "..." }
  ],
  "supremeCourt": {
    "name": "...", "size": 11,
    "appointmentMethod": "...",
    "fspEraChanges": "What changed (and by whom).",
    "stillServing": "How much of it remains.",
    "verified": false
  },
  "sources": ["https://..."]
}
```

## Data quality

- **Presidential successions** are compiled from public records and are well
  attested.
- **Supreme-court sections** summarise *documented* episodes (e.g. Venezuela’s
  2004 TSJ expansion, Mexico’s 2024 elected-judges reform, El Salvador’s 2021
  purge). Exact **current composition** and **"how many appointees still serve"**
  are marked `"verified": false` and still need primary-source confirmation.
- **Attribution matters:** some dramatic court changes were made *after* the FSP
  era by non-FSP governments (e.g. El Salvador’s 2021 purge was Bukele’s, not the
  FMLN’s; Argentina’s 1990 court-packing was Menem’s, pre-Kirchner). These are
  flagged in the text rather than attributed to FSP presidents.
- **FSP affiliation** of some parties (Morena, Argentine Peronism, Chilean PS/PC,
  Alianza PAIS) is itself still being verified — see the main `parties` list and
  the open issues.

## Note

`Bolivia` (MAS) lost power in 2025 (Rodrigo Paz, non-FSP, inaugurated Nov 2025),
so its succession ends the FSP era. These files are a first pass — corrections
against primary sources are welcome.
