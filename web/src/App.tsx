import { useMemo, useState } from 'react';
import './App.css';
import { runPipeline, toMarkdown, type RunInput, type RunResult } from '@ifrm/core';
import { DEFAULT_SOURCES } from './appTypes';
import { loadJson, saveJson } from './storage';
import { makeBrowserFetcher } from './fetcher';

type View = 'dashboard' | 'detail';

function downloadText(filename: string, text: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

const DEFAULT_INPUT: RunInput = {
  market: 'vtuber, content creator',
  window: { kind: 'lastDays', days: 7 },
  mode: 'dry',
  sources: DEFAULT_SOURCES,
};

export default function App() {
  const [input, setInput] = useState<RunInput>(() => loadJson('input', DEFAULT_INPUT));
  const [history, setHistory] = useState<Array<{ runId: string; createdAt: string; market: string; mode: 'dry' | 'live' }>>(() =>
    loadJson('history', []),
  );
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(0);

  const fetcher = useMemo(() => makeBrowserFetcher(), []);

  async function run() {
    setError(null);
    setRunning(true);
    try {
      saveJson('input', input);
      const res = await runPipeline(input, fetcher);
      setResult(res);
      const entry = { runId: res.runId, createdAt: res.createdAt, market: input.market, mode: input.mode };
      const next = [entry, ...history].slice(0, 20);
      setHistory(next);
      saveJson('history', next);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setRunning(false);
    }
  }

  const opportunities = (result?.opportunities ?? []).filter((o) => o.score >= minScore);
  const selected = selectedOppId ? result?.opportunities.find((o) => o.id === selectedOppId) : null;

  return (
    <div className="Shell">
      <header className="Header">
        <div>
          <div className="Title">Inspiration Finder Remastered</div>
          <div className="Subtitle">Deterministic opportunity mining with citations (no AI keys required for v0)</div>
        </div>
        <div className="HeaderRight">
          <button className={view === 'dashboard' ? 'Primary' : 'Secondary'} onClick={() => setView('dashboard')}>
            Dashboard
          </button>
          <button className={view === 'detail' ? 'Primary' : 'Secondary'} onClick={() => setView('detail')} disabled={!selected}>
            Detail
          </button>
        </div>
      </header>

      {error ? <div className="Error">{error}</div> : null}

      {view === 'dashboard' ? (
        <main className="Grid">
          <section className="Card">
            <h2>Inputs</h2>

            <label className="Field">
              Market area
              <input value={input.market} onChange={(e) => setInput({ ...input, market: e.target.value })} />
            </label>

            <div className="Row">
              <label className="Field">
                Time window
                <select
                  value={input.window.days}
                  onChange={(e) =>
                    setInput({ ...input, window: { kind: 'lastDays', days: Number(e.target.value) === 30 ? 30 : 7 } })
                  }
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                </select>
              </label>

              <label className="Field">
                Run mode
                <select
                  value={input.mode}
                  onChange={(e) => setInput({ ...input, mode: e.target.value === 'live' ? 'live' : 'dry' })}
                >
                  <option value="dry">Dry run (sample dataset)</option>
                  <option value="live">Live run (fetch sources)</option>
                </select>
              </label>
            </div>

            <label className="Field">
              Sources (v0: configured JSON)
              <textarea
                rows={6}
                value={JSON.stringify(input.sources, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setInput({ ...input, sources: parsed });
                  } catch {
                    // ignore while typing
                  }
                }}
              />
              <div className="Hint">Supported types: rss, html, reddit-rss. (No X.com scraping in v0.)</div>
            </label>

            <div className="Row" style={{ gap: 10 }}>
              <button onClick={run} disabled={running} data-testid="run-button">
                {running ? 'Running…' : 'Run'}
              </button>
              <button
                className="Secondary"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
              >
                Reset local data
              </button>
            </div>

            <div className="Divider" />

            <h3>Run history</h3>
            {history.length === 0 ? <div className="Hint">No runs yet.</div> : null}
            <ul className="List">
              {history.map((h) => (
                <li key={h.runId} className="ListItem">
                  <div className="Row" style={{ justifyContent: 'space-between' }}>
                    <span className="Mono">{h.runId}</span>
                    <span className="Hint">{new Date(h.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="Hint">{h.market} · {h.mode}</div>
                </li>
              ))}
            </ul>
          </section>

          <section className="Card">
            <div className="Row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Opportunities</h2>
              <label className="Inline">
                Min score
                <input type="number" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} style={{ width: 90 }} />
              </label>
            </div>

            {!result ? <div className="Hint">Run a dry-run to see deterministic sample output.</div> : null}

            {result ? (
              <div className="Row" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <button
                  className="Secondary"
                  onClick={() => downloadText(`report-${result.runId}.json`, JSON.stringify(result, null, 2), 'application/json')}
                  data-testid="export-json"
                >
                  Export JSON
                </button>
                <button
                  className="Secondary"
                  onClick={() => downloadText(`report-${result.runId}.md`, toMarkdown(result), 'text/markdown')}
                >
                  Export Markdown
                </button>
                <span className="Hint">Items: {result.stats.itemsFetched} · Clusters: {result.stats.clusters}</span>
              </div>
            ) : null}

            <div className="Cards" data-testid="opportunity-list">
              {opportunities.map((o) => (
                <button
                  key={o.id}
                  className={selectedOppId === o.id ? 'OppCard selected' : 'OppCard'}
                  onClick={() => {
                    setSelectedOppId(o.id);
                    setView('detail');
                  }}
                >
                  <div className="Row" style={{ justifyContent: 'space-between' }}>
                    <span className="Score">{o.score}</span>
                    <span className="Hint">{o.frequency.count} mentions</span>
                  </div>
                  <div className="OppTitle">{o.problemStatement}</div>
                  <div className="Hint">Buildability: {o.buildability.score0to10}/10 · Autopilot: {o.buildability.autopilot.ok ? 'yes' : 'no'}</div>
                </button>
              ))}
            </div>
          </section>
        </main>
      ) : (
        <main className="Card">
          {!selected ? (
            <div className="Hint">Select an opportunity from the Dashboard.</div>
          ) : (
            <div data-testid="opportunity-detail">
              <div className="Row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>{selected.problemStatement}</h2>
                <span className="Score">{selected.score}</span>
              </div>

              <div className="Hint" style={{ marginTop: 6 }}>
                Who: {selected.whoItAffects}
              </div>
              <div className="Hint">Frequency: {selected.frequency.count} · Most recent: {selected.frequency.mostRecent ?? '—'}</div>

              <div className="Divider" />
              <h3>Evidence (citations)</h3>
              <ul className="List">
                {selected.evidence.map((e) => (
                  <li key={e.url} className="ListItem">
                    <a href={e.url} target="_blank" rel="noreferrer">
                      {e.title}
                    </a>
                    <div className="Hint">{e.excerpt}</div>
                    <div className="Hint">Source: {e.sourceUrl}</div>
                  </li>
                ))}
              </ul>

              <div className="Divider" />
              <h3>Buildability</h3>
              <div className="Hint">
                {selected.buildability.score0to10}/10 — {selected.buildability.reasons.join(' · ')}
              </div>
              <div className="Hint">
                Autopilot: {selected.buildability.autopilot.ok ? 'yes' : 'no'} ({selected.buildability.autopilot.why})
              </div>

              <div className="Divider" />
              <h3>Room for improvement</h3>
              <div className="Hint">{selected.roomForImprovement}</div>
            </div>
          )}
        </main>
      )}

      <footer className="Footer">
        <span className="Hint">v0: deterministic extraction + clustering so CI is stable. Live fetching may be limited by CORS.</span>
      </footer>
    </div>
  );
}
