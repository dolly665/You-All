# Model and cost policy

Applies to every AI call in this repo, both runtime features and the development agent. Goal: cut cost while keeping quality by routing each module to the cheapest model that clears its quality bar.

## Core rule

1. Pick the model per module, not one global model.
2. Use the cheapest tier that meets the module's bar, and the lowest reasoning effort that still works.
3. Escalate only on failure: if a cheap model's output fails validation, retry with a stronger model.
4. Keep providers behind interfaces and model names in env config, never hard-coded.

## Runtime features

| Module | Task | Tier | Effort |
| --- | --- | --- | --- |
| Transcription + translation | audio -> Chinese + English | Gemini flash (`GEMINI_MODEL`) | n/a |
| Analysis | structured JSON extraction | cheap reasoning (gpt-4.1-mini / gpt-5-mini / o4-mini) | low |
| Content: YouTube / Substack / Medium | long creative prose | flagship/balanced (gpt-5 / gpt-4.1) | medium |
| Content: TikTok shorts | short independent clips | mini tier | low-medium |
| Embeddings (chunks + query) | vector encoding | embedding model | n/a |
| Search | cosine similarity in Node | no LLM | n/a |

Analysis is the main recurring cost: it runs on every source and is extraction, not prose, so keep it on a cheap model at low effort and validate with `AnalysisSchema` before escalating to a stronger model.

## Development agent (build side only)

The product never calls the build agent at runtime. This section is about the tool that writes the code, and it is optional, not a product dependency.

- Complex agentic coding (schema/migrations, multi-file refactors, debugging): Codex subscription (Codex models). A flat subscription usually costs less than per-token API for heavy agentic work.
- Cheaper default and bulk mechanical work (boilerplate, near-identical files, mass translation): DeepSeek API (`deepseek-flash`, or `deepseek-v4-pro` for harder logic). This is what the current cc-switch config points at.
- Selective high-quality review: GPT API (gpt-5, or a mini tier for targeted fixes).

Decision rule: you are not required to buy the Codex subscription. Stay on DeepSeek if you code occasionally or it keeps finishing the tasks. Buy Codex if you do heavy agentic work and either DeepSeek repeatedly fails on the complex parts, or your monthly DeepSeek spend approaches the plan price.

## Config convention

Use env vars, never hard-coded model names. Current wiring:

- `GEMINI_MODEL` (transcription, flash tier)
- `OPENAI_MODEL` (analysis primary) and `OPENAI_ANALYSIS_FALLBACK_MODEL` (escalation used only when the primary output fails parsing or validation)

Mirror them in `.env.example`. When content generation and embeddings are built, add `OPENAI_CONTENT_MODEL` / `OPENAI_CONTENT_EFFORT` and `GEMINI_EMBEDDING_MODEL` instead of reusing the analysis model.

## Verified model IDs and pricing

From official docs, checked 2026-10-06. USD per 1M tokens:

| Model | Input | Cached input | Output |
| --- | --- | --- | --- |
| gpt-4.1-mini | 0.40 | 0.10 | 1.60 |
| gpt-4.1 | 2.00 | 0.50 | 8.00 |
| gpt-5-mini | 0.25 | 0.025 | 2.00 |
| gpt-5-nano | 0.05 | 0.005 | 0.40 |
| gpt-5 / gpt-5.1 | 1.25 | 0.125 | 10.00 |

Reasoning effort (`reasoning.effort`) on the newest reasoning models: `low`, `medium` (default), `high`, `xhigh`, `max`; `none` and `minimal` are not supported. `gpt-4.1-mini` is not a reasoning model, so it takes no effort setting.

DeepSeek (official): `deepseek-flash` (V4.1-Flash) input cache-miss $0.15 off-peak / $0.30 peak, output $0.60 / $1.20; `deepseek-v4-pro` input $0.66 / $1.32, output $1.98 / $3.96.

Re-verify IDs, effort support, and pricing on the official OpenAI and DeepSeek API docs before changing `.env`; the tier structure above is stable even as names and prices change.

## When to pay

- Building and testing: nothing. Unit tests run without paid keys, and the build agent can run on the cheap DeepSeek API.
- First real run: an OpenAI API key (small credit top-up, $5 minimum) for analysis and generation, plus a Gemini API key for transcription and embeddings.
- Gemini has a free tier, but its traffic is used to improve Google's products, so do not send student-identifying material on it. Enable billing before real student cases.
- The Codex subscription is a build-side option only; the product never needs it.

## Cost estimate (one run)

Approximate, at the verified prices above, for one 60-minute video with 1 YouTube + 6 TikTok + 1 Substack + 1 Medium generated:

- Transcription ~$0.50 (video frames ~$0.28 + audio ~$0.12 + output ~$0.10)
- Analysis ~$0.01 (gpt-4.1-mini)
- Generation ~$0.20
- Embeddings ~$0.01
- Total ~$0.70 per video; ~$0.20 per article

Batch examples: 10 videos + 10 articles ~$9; 100 mixed sources ~$45-50.

Cheapest lever: the transcriber uploads the whole video, so Gemini bills video frames. Extracting audio before upload cuts a 60-minute video to roughly $0.40.
