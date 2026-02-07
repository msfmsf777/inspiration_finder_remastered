import type { Opportunity } from '../types.js';

export type AIProviderName = 'openai' | 'gemini';

export type AIEnrichmentConfig = {
  enabled: boolean;
  provider: AIProviderName;
  apiKey?: string;
  // Budget knobs
  bulkModel: string;
  finalModel: string;
  topN: number;
};

export interface AIProvider {
  name: AIProviderName;
  enrich(opportunities: Opportunity[]): Promise<Opportunity[]>;
}

export function defaultAIConfigFromEnv(): AIEnrichmentConfig {
  const enabled = process.env.AI_ENRICHMENT === '1';
  const provider = (process.env.AI_PROVIDER === 'gemini' ? 'gemini' : 'openai') as AIProviderName;
  return {
    enabled,
    provider,
    apiKey: provider === 'gemini' ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY,
    bulkModel: process.env.AI_BULK_MODEL ?? (provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini'),
    finalModel: process.env.AI_FINAL_MODEL ?? (provider === 'gemini' ? 'gemini-1.5-pro' : 'gpt-4o'),
    topN: Number(process.env.AI_TOP_N ?? 10),
  };
}
