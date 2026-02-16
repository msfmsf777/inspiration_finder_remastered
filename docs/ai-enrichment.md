# Optional AI enrichment (OFF by default)

Lane A v0 works end-to-end **without any AI keys**.

This repo includes a *stubbed* AI enrichment interface that can later improve:
- extraction quality
- cluster labels
- final writeups for the top N opportunities

## Safety defaults
- AI enrichment is **disabled** unless `AI_ENRICHMENT=1`.
- It must never be required for core functionality.
- CI should run with AI enrichment **disabled**.

## Environment variables
- `AI_ENRICHMENT=1` to enable
- `AI_PROVIDER=openai|gemini` (default: `openai`)
- `OPENAI_API_KEY=` (leave empty until configured)
- `GEMINI_API_KEY=` (leave empty until configured)

## Cost control strategy (intended design)
When implemented (not in v0):
- Use a cheap model for bulk tasks: `gpt-4o-mini` / `gemini-1.5-flash`
- Use a stronger model only for the top N cards: `gpt-4o` / `gemini-1.5-pro`

## Fallback behavior
If enabled but the API key is missing, enrichment should auto-disable with a clear reason.

## Rate limits
Provider rate limits vary; implement backoff + batching before enabling this for real workflows.
