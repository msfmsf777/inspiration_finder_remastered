/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import { clusterItems, rankOpportunities } from './pipeline.js';

const items = [
  {
    sourceUrl: 's1',
    title: 'Need a better clip workflow',
    url: 'u1',
    publishedAt: '2026-02-05T00:00:00Z',
    content: 'I struggle to clip highlights quickly during stream.',
    tags: ['a'],
  },
  {
    sourceUrl: 's2',
    title: 'Clipping is hard',
    url: 'u2',
    publishedAt: '2026-02-04T00:00:00Z',
    content: "It's difficult to clip moments and organize them.",
    tags: ['b'],
  },
];

describe('deterministic clustering', () => {
  it('clusters deterministically', () => {
    const c1 = clusterItems(items as any);
    const c2 = clusterItems(items as any);
    expect(c1).toEqual(c2);
  });

  it('ranking is stable', () => {
    const opps = [
      { id: 'b', score: 10 },
      { id: 'a', score: 10 },
      { id: 'c', score: 12 },
    ] as any;
    expect(rankOpportunities(opps).map((o: any) => o.id)).toEqual(['c', 'a', 'b']);
  });
});
