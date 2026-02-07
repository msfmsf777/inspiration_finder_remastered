# Ship checklist — Lane A v0

## Must be true to declare SHIP_READY
- [ ] CLI works end-to-end in **dry-run** mode using committed sample dataset
- [ ] CLI works end-to-end in **live** mode for at least RSS + HTML sources (best-effort; not required in CI)
- [ ] Web UI works end-to-end in dry-run: create run, show progress, results list renders, detail view works, export JSON works
- [ ] Deterministic scoring + clustering (stable across runs)
- [ ] Output includes citations/excerpts and source links
- [ ] Export: Markdown + JSON
- [ ] Caching prevents refetching on repeated live runs
- [ ] GitHub Actions CI: lint + unit tests + build + Playwright smoke test
- [ ] Playwright artifacts uploaded on failure (report, traces, screenshots)
- [ ] README has setup, run, test, and notes about deterministic dataset
