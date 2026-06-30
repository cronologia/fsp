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
│   ├── forum.json            # SINGLE SOURCE OF TRUTH — all dates, parties, references
│   ├── archives.json         # machine-generated Wayback snapshot cache (do not hand-edit)
│   └── wayback-inventory.json # machine-generated index of forodesaopaulo.org captures
├── src/
│   └── styles.css            # stylesheet (copied into the build)
├── scripts/
│   ├── archive-refs.js       # archives references to the Wayback Machine + refreshes cache
│   └── wayback-harvest.js    # indexes archived captures of the official FSP site
├── .github/workflows/
│   └── wayback.yml           # runs the harvesting pipeline on GitHub's runners
├── docs-research/            # generated research outputs (Wayback inventory, etc.)
├── build.js                  # compiler: data/{forum,archives}.json -> docs/
├── docs/                     # COMPILED OUTPUT (served by GitHub Pages)
│   ├── index.html
│   ├── styles.css
│   ├── adrs/                 # Architecture Decision Records
│   └── .nojekyll
├── AGENTS.md                 # how AI agents/humans should work in this repo
├── context.md                # domain background
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

## Archiving references (Wayback Machine)

Links rot. To keep the chronology verifiable, every reference is preserved in the
Internet Archive **Wayback Machine**, and the site shows an **archived fallback link**
next to each live reference.

```bash
node scripts/archive-refs.js              # archive any reference missing a snapshot, update cache
node scripts/archive-refs.js --dry-run    # report what would be archived; write nothing
node scripts/archive-refs.js --save-all   # force a fresh snapshot of every reference
```

The script reads reference URLs from `data/forum.json`, checks the Wayback
availability API, triggers **Save Page Now** for anything not yet archived, and
writes the resulting snapshot URLs + timestamps into `data/archives.json`.
`build.js` merges that cache so the rendered References section gains
"archived YYYY-MM-DD" fallback links. Re-running is idempotent.

> **Network requirement:** the script needs outbound access to `archive.org` /
> `web.archive.org`. Some sandboxed/CI environments block these by egress policy
> (the call fails fast and the URL is reported as not archived) — run it from an
> environment that can reach the Internet Archive. Behind a proxy on Node ≥ 22.21,
> run with `NODE_USE_ENV_PROXY=1`. Save Page Now is rate-limited for anonymous
> use, so the script paces its requests.

## Harvesting historical content (the pipeline)

The Forum's official site (`forodesaopaulo.org`) is the richest primary source, but
older versions survive mainly in the Internet Archive. A pipeline recovers and
preserves this material. Because some environments block `archive.org` by egress
policy, the pipeline is designed to run on **GitHub's runners** (open internet) via
[`.github/workflows/wayback.yml`](.github/workflows/wayback.yml).

**Two stages, run together:**

1. **Discovery** — [`scripts/wayback-harvest.js`](scripts/wayback-harvest.js) queries
   the Wayback **CDX API** for every archived capture of `forodesaopaulo.org`, dedupes
   by URL, records capture counts and first/last timestamps, and flags **high-value
   pages** (meeting declarations, member lists, history) first. Outputs
   `data/wayback-inventory.json` and `docs-research/wayback-inventory.md`.
2. **Preservation** — [`scripts/archive-refs.js`](scripts/archive-refs.js) (above)
   snapshots every reference and refreshes `data/archives.json`; `build.js` renders the
   fallback links.

```bash
node scripts/wayback-harvest.js                 # incremental update (full scan the first time)
node scripts/wayback-harvest.js --full          # force a complete re-scan
node scripts/wayback-harvest.js --limit=20000   # widen the CDX page size
```

The inventory `data/wayback-inventory.json` is **committed and updated
incrementally**: each run loads it, asks the CDX API only for captures newer than
the last one recorded (a `latestCapture` watermark), and merges the delta. A full
re-scan only happens the first time or with `--full`, so routine runs are cheap and
don't repeat the whole harvest.

**How the workflow runs:**

| Trigger | When | Behavior |
| --- | --- | --- |
| `pull_request` | a PR touches the scripts/workflow | runs the pipeline, uploads the inventory as an **artifact** + job summary; does **not** commit |
| `workflow_dispatch` | **Actions → Wayback collection → Run workflow** | runs the pipeline and **commits** refreshed inventory/cache + rebuilt `docs/` |
| `schedule` | weekly (Mon 04:17 UTC) | same as dispatch — keeps snapshots fresh |

The inventory is a **discovery index, not the final dataset.** Turning high-value
captures into chronology facts (declarations, exact dates, founding members) is a
follow-up step done by editing `data/forum.json`.

## Data quality

This is a **work in progress** compiled from public secondary sources. Host cities and years
are well attested; exact dates and edition numbers vary between sources and are flagged as
unverified where appropriate. The complete list of the 48 founding organizations is not yet
fully sourced. **Corrections against primary sources are welcome** — open an issue or a PR.

## License

[MIT](LICENSE)
