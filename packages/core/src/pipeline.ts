/* eslint-disable @typescript-eslint/no-explicit-any */
import { XMLParser } from 'fast-xml-parser';
import { detectPainLabels, excerpt, stripHtml } from './extract.js';
import { jaccard, pickTopKeywords, stableId, stableSortBy, tokenize } from './deterministic.js';
import type { Evidence, Opportunity, RunInput, RunResult, SourceConfig } from './types.js';

export type RawItem = {
  sourceUrl: string;
  title: string;
  url: string;
  publishedAt?: string;
  content: string;
  tags?: string[];
};

export type Fetcher = {
  fetchText(url: string): Promise<string>;
};

export async function loadDryRunItems(): Promise<RawItem[]> {
  // Deterministic dataset committed to repo.
  // - In the browser build, bundlers can inline JSON via dynamic import.
  // - In Node, read from disk to avoid JSON import assertion issues.
  if (typeof window === 'undefined') {
    const fs = await import('node:fs/promises');
    const url = new URL('./sample/sample-data.json', import.meta.url);
    const raw = await fs.readFile(url, 'utf8');
    return (JSON.parse(raw) as { items: RawItem[] }).items;
  }

  const mod = (await import('./sample/sample-data.json')) as unknown as { default: { items: RawItem[] } };
  return mod.default.items;
}

export async function fetchSourceItems(fetcher: Fetcher, src: SourceConfig): Promise<RawItem[]> {
  const max = src.maxItems ?? 50;
  const tags = src.tags ?? [];
  if (src.type === 'html') {
    const html = await fetcher.fetchText(src.url);
    const text = stripHtml(html);
    return [
      {
        sourceUrl: src.url,
        title: src.url,
        url: src.url,
        content: text,
        tags,
      },
    ];
  }

  // RSS / Atom / reddit-rss
  const xml = await fetcher.fetchText(src.url);
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const doc = parser.parse(xml) as any;

  const entries: any[] =
    doc?.rss?.channel?.item ??
    doc?.feed?.entry ??
    // Some feeds wrap items differently
    [];

  const items: RawItem[] = [];
  for (const e of Array.isArray(entries) ? entries : [entries]) {
    const title = String(e?.title?.['#text'] ?? e?.title ?? '').trim();
    const link = String(e?.link?.href ?? e?.link ?? e?.guid ?? '').trim();
    const content = String(
      e?.['content:encoded'] ?? e?.content?.['#text'] ?? e?.content ?? e?.summary ?? e?.description ?? '',
    );
    const publishedAt = String(e?.pubDate ?? e?.published ?? e?.updated ?? '').trim() || undefined;

    if (!title && !link) continue;
    items.push({
      sourceUrl: src.url,
      title: title || link,
      url: link || src.url,
      publishedAt,
      content: stripHtml(content),
      tags,
    });
    if (items.length >= max) break;
  }

  return items;
}

export type Cluster = {
  id: string;
  itemIds: string[];
  keywords: string[];
  tags: string[];
};

export function clusterItems(items: RawItem[]): Cluster[] {
  // Deterministic: stable sort then greedy cluster on token Jaccard.
  const enriched = items.map((it) => {
    const full = `${it.title} ${it.content}`;
    const toks = tokenize(full);
    return { it, toks, set: new Set(toks), id: stableId([it.sourceUrl, it.url, it.title]) };
  });

  const sorted = stableSortBy(enriched, (x) => `${x.it.publishedAt ?? ''}|${x.it.url}|${x.it.title}`);

  const clusters: { items: typeof sorted; rep: Set<string> }[] = [] as any;
  const threshold = 0.22;

  for (const x of sorted) {
    let bestIdx = -1;
    let best = 0;
    for (let i = 0; i < clusters.length; i++) {
      const sim = jaccard(x.set, clusters[i].rep);
      if (sim > best) {
        best = sim;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0 && best >= threshold) {
      (clusters[bestIdx].items as any).push(x);
      // Update representative set: union but cap size deterministically
      const union = new Set([...clusters[bestIdx].rep, ...x.set]);
      const top = pickTopKeywords([...union], 50);
      clusters[bestIdx].rep = new Set(top);
    } else {
      clusters.push({ items: [x] as any, rep: x.set });
    }
  }

  return clusters.map((c, idx) => {
    const allTokens = c.items.flatMap((x: any) => x.toks);
    const keywords = pickTopKeywords(allTokens, 8);
    const tags = [...new Set(c.items.flatMap((x: any) => x.it.tags ?? []))].sort();
    return {
      id: stableId(['cluster', String(idx), keywords.join(',')]),
      itemIds: c.items.map((x: any) => x.id),
      keywords,
      tags,
    };
  });
}

function buildOpportunityFromCluster(cluster: Cluster, itemsById: Map<string, { raw: RawItem; pain: string[] }>): Opportunity {
  const raws = cluster.itemIds
    .map((id) => itemsById.get(id))
    .filter(Boolean)
    .map((x) => x!);

  const mostRecent = raws
    .map((r) => r.raw.publishedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  const evidence: Evidence[] = raws.slice(0, 4).map((r) => ({
    title: r.raw.title,
    excerpt: excerpt(r.raw.content),
    url: r.raw.url,
    publishedAt: r.raw.publishedAt,
    sourceUrl: r.raw.sourceUrl,
    tags: (r.raw.tags ?? []).slice().sort(),
  }));

  const painLabels = [...new Set(raws.flatMap((r) => r.pain))].sort();
  const who = 'Creators in the target market (streamers / content creators)';

  const problemStatement = `People report ${painLabels.length ? painLabels.join(' + ') : 'recurring friction'} around: ${cluster.keywords
    .slice(0, 5)
    .join(', ')}`;

  const buildabilityReasons = [
    'Data is public and can be processed deterministically',
    'MVP can start with a simple workflow + exports',
  ];
  const buildabilityScore = Math.max(3, Math.min(10, 6 + (painLabels.includes('bug') ? 1 : 0) - (painLabels.includes('cost') ? 1 : 0)));

  const score = Math.round(
    100 * (0.55 * Math.min(1, raws.length / 6) + 0.25 * (mostRecent ? 1 : 0.5) + 0.2 * (painLabels.length ? 1 : 0.6)),
  );

  return {
    id: stableId(['opp', cluster.id, problemStatement]),
    score,
    problemStatement,
    whoItAffects: who,
    frequency: { count: raws.length, mostRecent },
    evidence,
    competitorNotes: [],
    roomForImprovement: 'Existing tools feel fragmented; opportunity for a focused, workflow-first experience.',
    buildability: {
      score0to10: buildabilityScore,
      reasons: buildabilityReasons,
      autopilot: {
        ok: true,
        why: 'Frontend + deterministic analysis + local exports; no external keys required for v0.',
      },
    },
    tags: cluster.tags,
  };
}

export function rankOpportunities(opps: Opportunity[]): Opportunity[] {
  return [...opps].sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
}

export function toMarkdown(result: RunResult): string {
  const lines: string[] = [];
  lines.push(`# Inspiration Finder Remastered — Report`);
  lines.push('');
  lines.push(`Market: **${result.input.market}**`);
  lines.push(`Window: **last ${result.input.window.days} days**`);
  lines.push(`Mode: **${result.input.mode}**`);
  lines.push('');
  for (const opp of result.opportunities) {
    lines.push(`## (${opp.score}) ${opp.problemStatement}`);
    lines.push('');
    lines.push(`- Who: ${opp.whoItAffects}`);
    lines.push(`- Frequency: ${opp.frequency.count} mentions` + (opp.frequency.mostRecent ? ` (most recent: ${opp.frequency.mostRecent})` : ''));
    lines.push(`- Buildability: ${opp.buildability.score0to10}/10 — ${opp.buildability.reasons.join('; ')}`);
    lines.push('');
    lines.push('Evidence:');
    for (const e of opp.evidence) {
      lines.push(`- [${e.title}](${e.url}) — ${e.excerpt}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export async function runPipeline(input: RunInput, fetcher: Fetcher): Promise<RunResult> {
  const createdAt = new Date().toISOString();
  const runId = stableId([createdAt, input.market, input.mode, String(input.window.days)]);

  const items: RawItem[] = [];
  if (input.mode === 'dry') {
    items.push(...(await loadDryRunItems()));
  } else {
    for (const s of input.sources) {
      items.push(...(await fetchSourceItems(fetcher, s)));
    }
  }

  const itemPain = items.map((raw) => ({
    id: stableId([raw.sourceUrl, raw.url, raw.title]),
    raw,
    pain: detectPainLabels(`${raw.title} ${raw.content}`),
  }));
  const itemsById = new Map(itemPain.map((x) => [x.id, { raw: x.raw, pain: x.pain }]));

  const clusters = clusterItems(items);
  const opps = clusters.map((c) => buildOpportunityFromCluster(c, itemsById));

  const ranked = rankOpportunities(opps);

  return {
    runId,
    createdAt,
    input,
    opportunities: ranked,
    stats: { itemsFetched: items.length, clusters: clusters.length },
  };
}
