import type { RunInput, RunResult, SourceConfig } from '@ifrm/core';

export type UIState = {
  input: RunInput;
  lastResult?: RunResult;
  runHistory: { runId: string; createdAt: string; market: string; mode: string }[];
};

export const DEFAULT_SOURCES: SourceConfig[] = [
  {
    type: 'rss',
    url: 'https://example.com/vtuber-tools.rss',
    tags: ['sample'],
    maxItems: 20,
  },
];
