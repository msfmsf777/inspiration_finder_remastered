# Inspiration Finder Remastered (v0)

Deterministic opportunity mining with citations.

**Lane A v0 goals**:
- No external AI keys required
- End-to-end CLI + Web UI
- Deterministic scoring/clustering so CI output is stable
- Exports: JSON + Markdown
- Live mode supports RSS/Atom + HTML (best-effort; may be limited by CORS in the browser)

## Monorepo layout
- `packages/core` — deterministic pipeline (fetch → extract → cluster → score → report)
- `packages/cli` — `ifrm` CLI wrapper around the pipeline
- `web` — Vite + React UI + Playwright smoke test

## Setup
```bash
npm ci --include=dev
```

## Run (CLI)
Build first:
```bash
npm run build
```

Dry-run (uses committed sample dataset):
```bash
node packages/cli/dist/cli.js --mode=dry --out=out
```

Live run (fetch sources + cache responses):
```bash
node packages/cli/dist/cli.js \
  --mode=live \
  --days=7 \
  --sources=docs/sources.example.json \
  --cache=.cache \
  --out=out
```

Outputs:
- `out/report-<runId>.json`
- `out/report-<runId>.md`

## Run (Web)
```bash
npm -w web run dev
```
Then open the URL Vite prints.

Tip: use **Dry run** to get stable output without any network calls.

## Test
```bash
npm test
npm run lint
npm run build
```

E2E (Playwright):
```bash
npm run e2e
```
Note: locally you may need system dependencies for Chromium. CI installs them via `playwright install --with-deps`.

## Determinism
The sample dataset is committed at:
- `packages/core/src/sample/sample-data.json`

Dry-run mode loads this dataset to keep output stable for tests and CI.
