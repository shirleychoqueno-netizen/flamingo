import { ApiError, MAX_MODEL_BYTES, boundedJson, checkSelection, modelPayload } from './core.mjs';

export const OPENAI_URL = 'https://api.openai.com/v1/responses';
export const PROMO_INITIAL_MODEL = 'gpt-5.4-mini-2026-03-17';
export const OPENAI_MODELS = {
  'gpt-5.4-mini': { input_per_million_usd: 0.75, output_per_million_usd: 4.5 },
  'gpt-5.4-mini-2026-03-17': { input_per_million_usd: 0.75, output_per_million_usd: 4.5 },
  'gpt-6.1-terra': { input_per_million_usd: 1, output_per_million_usd: 5 },
  'gpt-6-luna': { input_per_million_usd: 0.1, output_per_million_usd: 0.5 }
};
export function providerSettings(env) {
  const provider = env.AI_PROVIDER || 'groq';
  if (provider === 'openai') {
    const model = env.OPENAI_MODEL || PROMO_INITIAL_MODEL;
    const promoRequired = env.OPENAI_REQUIRE_PROMO_SMALL_GROUP === 'true';
    const promoReady = !promoRequired || model === PROMO_INITIAL_MODEL && env.OPENAI_PROMO_PROJECT_CONFIRMED === 'true' && env.OPENAI_BALANCE_CONFIRMED === 'true';
    return { provider, model, enabled: Object.hasOwn(OPENAI_MODELS, model) && promoReady && env.ENABLE_OPENAI === 'true' && env.OPENAI_BILLING_APPROVED === 'true' && !!env.OPENAI_API_KEY };
  }
  return { provider, model: 'openai/gpt-oss-20b', enabled: provider === 'groq' && env.ENABLE_GROQ === 'true' && env.FREE_TIER_CONFIRMED === 'true' && !!env.GROQ_API_KEY };
}
export function openAIPayload(input, evidence, model) {
  if (!Object.hasOwn(OPENAI_MODELS, model)) throw new ApiError('unsupported_openai_model', 200);
  const messages = modelPayload(input, evidence).messages;
  const schema = {
    type: 'object', additionalProperties: false, required: ['claims', 'limitations'],
    properties: {
      claims: { type: 'array', items: {
        type: 'object', additionalProperties: false, required: ['field', 'relation', 'sources'],
        properties: {
          field: { type: 'string' }, relation: { type: 'string', enum: ['listed_values', 'identical_raw_values'] },
          sources: { type: 'array', items: {
            type: 'object', additionalProperties: false, required: ['evidence_id', 'raw'],
            properties: { evidence_id: { type: 'string' }, raw: { type: 'string' } }
          } }
        }
      } },
      limitations: { type: 'array', items: { type: 'string', enum: ['supplied_evidence_only', 'not_causal_comparison', 'source_review_required'] } }
    }
  };
  const payload = {
    model, input: messages, reasoning: { effort: 'none' }, max_output_tokens: 1200,
    store: false, stream: false, tools: [], service_tier: 'default',
    text: { format: { type: 'json_schema', name: 'nasa_source_selection', strict: true, schema } }
  };
  if (new TextEncoder().encode(JSON.stringify(payload)).byteLength > MAX_MODEL_BYTES) throw new ApiError('model_input_budget_exceeded', 200);
  return payload;
}
export async function generateOpenAI(input, evidence, env, fetcher) {
  const settings = providerSettings({ ...env, AI_PROVIDER: 'openai' });
  const base = { provider: 'openai', model: settings.model, claims: [] };
  if (!settings.enabled) return { ...base, status: 'provider_unavailable', reason: 'openai_not_configured_or_billing_not_approved' };
  try {
    const payload = openAIPayload(input, evidence, settings.model);
    const response = await fetcher(OPENAI_URL, {
      method: 'POST', headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(25000), redirect: 'manual'
    });
    if (!response.ok) return { ...base, status: 'provider_unavailable', reason: response.status === 429 ? 'openai_quota_or_rate_limit' : 'openai_request_failed' };
    const raw = await boundedJson(response, 100_000);
    if (raw.status !== 'completed') return { ...base, status: 'answer_rejected', reason: 'incomplete_model_output' };
    if (!Array.isArray(raw.output) || raw.output.some(item => !['message', 'reasoning'].includes(item.type))) return { ...base, status: 'answer_rejected', reason: 'unexpected_model_action' };
    const content = raw.output.filter(item => item.type === 'message').flatMap(item => item.content || []);
    if (content.some(item => item.type === 'refusal')) return { ...base, status: 'answer_rejected', reason: 'model_refusal' };
    const texts = content.filter(item => item.type === 'output_text');
    if (texts.length !== 1 || content.length !== 1 || typeof texts[0].text !== 'string') throw new ApiError('invalid_model_output_shape', 200);
    const claims = checkSelection(JSON.parse(texts[0].text), evidence);
    const inputTokens = raw.usage?.input_tokens;
    const outputTokens = raw.usage?.output_tokens;
    const pricing = OPENAI_MODELS[settings.model];
    const estimate = Number.isInteger(inputTokens) && inputTokens >= 0 && Number.isInteger(outputTokens) && outputTokens >= 0 ? (inputTokens * pricing.input_per_million_usd + outputTokens * pricing.output_per_million_usd) / 1_000_000 : null;
    return { ...base, status: claims.length ? 'generated_requires_source_review' : 'insufficient_evidence', claims,
      usage: { input_tokens: inputTokens ?? null, output_tokens: outputTokens ?? null, total_tokens: raw.usage?.total_tokens ?? null },
      estimated_standard_cost_usd: estimate, pricing_checked_date: '2026-11-15',
      validation_scope: 'Exact original source-cell values verified; scientific relevance and comparability still require review.' };
  } catch (error) {
    return { ...base, status: error instanceof ApiError && error.http === 200 || error instanceof SyntaxError ? 'answer_rejected' : 'provider_unavailable', reason: error instanceof ApiError ? error.code : error instanceof SyntaxError ? 'invalid_model_json' : 'openai_unreachable' };
  }
}
