import type { AIProvider } from './provider.js';
import type { Opportunity } from '../types.js';

export function createGeminiProvider(_apiKey?: string): AIProvider {
  void _apiKey;
  return {
    name: 'gemini',
    async enrich(opportunities: Opportunity[]) {
      // Stub: intentionally no network calls in v0.
      return opportunities;
    },
  };
}
