import { createGeminiProvider } from './gemini.js';
import { createOpenAIProvider } from './openai.js';
import { defaultAIConfigFromEnv, type AIProvider } from './provider.js';

export { defaultAIConfigFromEnv };
export type { AIProvider };

export function resolveProvider(): { enabled: boolean; provider?: AIProvider; reason?: string } {
  const cfg = defaultAIConfigFromEnv();
  if (!cfg.enabled) return { enabled: false, reason: 'AI enrichment disabled (AI_ENRICHMENT!=1)' };
  if (!cfg.apiKey) return { enabled: false, reason: 'Missing API key (OPENAI_API_KEY or GEMINI_API_KEY)' };
  const provider = cfg.provider === 'gemini' ? createGeminiProvider(cfg.apiKey) : createOpenAIProvider(cfg.apiKey);
  return { enabled: true, provider };
}
