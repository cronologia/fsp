# Foro de São Paulo — Cronologia

A **compiled static website** documenting the chronology of the **Foro de São Paulo**
(São Paulo Forum) — the conference of left-wing political parties and organizations of
Latin America and the Caribbean, founded in 1990.

The site presents:

- The **founding** (July 1990, São Paulo) and historical context.
- A **chronology of every meeting** (1990–present): edition, year, dates, host city and country.
- A curated list of **member parties and organizations** with key figures.
- **References** to public sources.

## How it works

This repo is a tiny, **zero-dependency static site generator**. A single JSON file is the
source of truth; a Node script compiles it into plain HTML/CSS that can be hosted anywhere
(GitHub Pages, Netlify, S3, or just opened from disk).

```
fsp/
├── data/
│   └── forum.json      # SINGLE SOURCE OF TRUTH — all dates, parties, references
├── src/
│   └── styles.css      # stylesheet (copied into the build)
├── build.js            # compiler: data/forum.json -> docs/
├── docs/               # COMPILED OUTPUT (served by GitHub Pages)
│   ├── index.html
│   ├── styles.css
│   └── .nojekyll
└── README.md
```

### Build

```bash
node build.js
```

This regenerates `docs/index.html` and copies static assets. No `npm install` needed.

### Preview

Open `docs/index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server -d docs 8000   # then visit http://localhost:8000
```

### Publish (GitHub Pages)

In repository **Settings → Pages**, set the source to the **`docs/` folder** on the default
branch. The site is published as-is; `.nojekyll` disables Jekyll processing.

## Editing the data

All content lives in [`data/forum.json`](data/forum.json). To add or correct a meeting,
party, or reference, edit that file and re-run `node build.js`. The data model:

- `meetings[]` — `edition`, `year`, `dates`, `city`, `country`, `datesVerified`, `notes`.
  When `datesVerified` is `false`, the site shows a `?` flag next to the date.
- `parties[]` — `country`, `name`, `abbr`, `founding` (`true`/`false`/`null` = to verify),
  `figures[]`, `notes`.
- `references[]` — `title`, `url`, `publisher`, `type`.

## Data quality

This is a **work in progress** compiled from public secondary sources. Host cities and years
are well attested; exact dates and edition numbers vary between sources and are flagged as
unverified where appropriate. The complete list of the 48 founding organizations is not yet
fully sourced. **Corrections against primary sources are welcome** — open an issue or a PR.

## License

[MIT](LICENSE)
