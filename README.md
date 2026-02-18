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

Local note: **E2E is optional locally** — in minimal containers/VMs you may see missing shared-library errors (e.g. `libnspr4.so`).
CI installs the required OS deps via `playwright install --with-deps chromium`.
If you need local E2E, run it in GitHub Actions, or use a Playwright-ready environment (e.g. a container/image that already includes Playwright dependencies).

## Determinism
The sample dataset is committed at:
- `packages/core/src/sample/sample-data.json`

Dry-run mode loads this dataset to keep output stable for tests and CI.

## Optional AI enrichment (OFF by default)
See:
- `docs/ai-enrichment.md`
