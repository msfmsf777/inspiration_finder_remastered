export type SourceType = 'rss' | 'html' | 'reddit-rss';

export type SourceConfig = {
  type: SourceType;
  url: string;
  tags?: string[];
  maxItems?: number;
};

export type RunMode = 'dry' | 'live';

export type TimeWindow = {
  kind: 'lastDays';
  days: 7 | 30;
};

export type RunInput = {
  market: string;
  window: TimeWindow;
  mode: RunMode;
  sources: SourceConfig[];
};

export type Evidence = {
  title: string;
  excerpt: string;
  url: string;
  publishedAt?: string;
  sourceUrl: string;
  tags: string[];
};

export type Opportunity = {
  id: string;
  score: number;
  problemStatement: string;
  whoItAffects: string;
  frequency: {
    count: number;
    mostRecent?: string;
  };
  evidence: Evidence[];
  competitorNotes: { label: string; url: string }[];
  roomForImprovement: string;
  buildability: {
    score0to10: number;
    reasons: string[];
    autopilot: { ok: boolean; why: string };
  };
  tags: string[];
};

export type RunResult = {
  runId: string;
  createdAt: string;
  input: RunInput;
  opportunities: Opportunity[];
  stats: {
    itemsFetched: number;
    clusters: number;
  };
};
