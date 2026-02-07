# Repo-local Rules (Inspiration Finder Remastered)

## Scope & Safety
- Work only inside this repository.
- Do **not** change VPS / firewall / SSH / system packages / Docker.
- Do **not** commit secrets. Never print tokens.

## Product goals (Lane A v0)
- Shippable, end-to-end tool that takes a market area + list of sources and outputs ranked opportunities with citations.
- Must run without external AI API keys; deterministic extraction/clustering for stable CI.
- Provide both UI and CLI.

## Verification
- GitHub Actions CI must run: lint + unit tests + build.
- Add Playwright E2E smoke tests for the web UI (dry-run) and upload artifacts on failure.
- Include a committed deterministic sample dataset; CI must not require internet.

## Iteration rules
- Work on branch `autopilot/lane-a-v0-2026-02-07`.
- Small commits.
- Open a PR early.
- Fix CI up to 5 cycles; if still failing, leave a draft PR with next steps.
