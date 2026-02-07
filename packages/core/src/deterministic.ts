export function stableId(parts: string[]): string {
  // Deterministic non-crypto hash -> hex
  const s = parts.join('|');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `id_${(h >>> 0).toString(16)}`;
}

export function stableSortBy<T>(arr: T[], key: (t: T) => string): T[] {
  return [...arr]
    .map((v, i) => ({ v, i, k: key(v) }))
    .sort((a, b) => (a.k < b.k ? -1 : a.k > b.k ? 1 : a.i - b.i))
    .map((x) => x.v);
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => t.length >= 2);
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function pickTopKeywords(tokens: string[], topN: number): string[] {
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, topN)
    .map(([k]) => k);
}
