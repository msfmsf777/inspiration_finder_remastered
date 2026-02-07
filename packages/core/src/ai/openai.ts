import type { AIProvider } from './provider.js';
import type { Opportunity } from '../types.js';

export function createOpenAIProvider(_apiKey?: string): AIProvider {
  void _apiKey;
  return {
    name: 'openai',
    async enrich(opportunities: Opportunity[]) {
      // Stub: intentionally no network calls in v0.
      // When implemented, use a cheap model for bulk extraction and a stronger model for topN rewrite.
      return opportunities;
    },
  };
}
