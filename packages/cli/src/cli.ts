#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { runPipeline, toMarkdown, type Fetcher, type RunInput, type SourceConfig } from '@ifrm/core';

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v === undefined) args[k] = true;
      else args[k] = v;
    }
  }
  return args;
}

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

function cacheKey(url: string) {
  return url.replace(/[^a-z0-9]+/gi, '_').slice(0, 120);
}

function makeFetcher(cacheDir: string): Fetcher {
  return {
    async fetchText(url: string) {
      const key = cacheKey(url);
      const fp = path.join(cacheDir, key + '.txt');
      try {
        return await fs.readFile(fp, 'utf8');
      } catch {
        const res = await fetch(url, { headers: { 'user-agent': 'ifrm/0.0.0' } });
        if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
        const text = await res.text();
        await fs.writeFile(fp, text, 'utf8');
        return text;
      }
    },
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const market = String(args.market ?? 'vtuber, content creator');
  const days = Number(args.days ?? 7) === 30 ? 30 : 7;
  const mode = (String(args.mode ?? 'dry') === 'live' ? 'live' : 'dry') as 'dry' | 'live';
  const sourcesPath = args.sources ? String(args.sources) : '';

  const sources: SourceConfig[] = sourcesPath
    ? (JSON.parse(await fs.readFile(sourcesPath, 'utf8')) as SourceConfig[])
    : [
        {
          type: 'rss',
          url: 'https://example.com/vtuber-tools.rss',
          tags: ['sample'],
          maxItems: 10,
        },
      ];

  const input: RunInput = {
    market,
    window: { kind: 'lastDays', days: days as 7 | 30 },
    mode,
    sources,
  };

  const outDir = path.resolve(process.cwd(), String(args.out ?? 'out'));
  const cacheDir = path.resolve(process.cwd(), String(args.cache ?? '.cache'));
  await ensureDir(outDir);
  await ensureDir(cacheDir);

  const fetcher = makeFetcher(cacheDir);
  const result = await runPipeline(input, fetcher);

  const jsonPath = path.join(outDir, `report-${result.runId}.json`);
  const mdPath = path.join(outDir, `report-${result.runId}.md`);

  await fs.writeFile(jsonPath, JSON.stringify(result, null, 2), 'utf8');
  await fs.writeFile(mdPath, toMarkdown(result), 'utf8');

  process.stdout.write(`Wrote:\n- ${jsonPath}\n- ${mdPath}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
