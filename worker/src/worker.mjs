import { ApiError, MODEL, GROQ, MAX_BODY, LIMITATIONS, validateInput, boundedJson, checkSelection, modelPayload } from './core.mjs';
import { buildEvidence } from './firestore.mjs';
import { providerSettings, generateOpenAI } from './openai.mjs';
import { CORPUS, searchEvidence, semanticEnabled, validateSearch } from './retrieval.mjs';
import { answerRag, validateRag } from './rag.mjs';
import demoAssets from './generated/demo-assets.mjs';

export function allowedOrigin(origin) {
  if (['https://flame-in-freefall-aqp.web.app', 'https://ignis-combustion-explorer.cheeky-vole-0211.chatgpt.site', 'https://houston-groq-proxy.houston-groq-proxy.workers.dev', 'https://flamingo.houston-groq-proxy.workers.dev'].includes(origin)) return true;
  try { const url = new URL(origin); return url.protocol === 'http:' && url.hostname === 'localhost' && url.origin === origin; } catch { return false; }
}
function response(body, http = 200, origin = null, extra = {}) {
  return new Response(JSON.stringify(body), { status: http, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Origin', ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}), ...extra } });
}
function result(status, pack, additions = {}) {
  return { status, model: pack.model || MODEL, provider: pack.provider || 'groq', claims: [], limitations: LIMITATIONS, evidence: pack.evidence,
    selection: { source_status: pack.source_status, missing_test_uids: pack.missing_test_uids || [], missing_raw_cells: pack.missing_raw_cells || [], coverage: pack.coverage }, ...additions };
}
export async function answer(input, env, fetcher = (...args) => globalThis.fetch(...args)) {
  const settings = providerSettings(env);
  let pack;
  try { pack = await buildEvidence(input, fetcher); }
  catch (error) { return { body: result('evidence_unavailable', { evidence: [], source_status: 'source_request_failed', ...settings }, { reason: error instanceof ApiError ? error.code : 'source_transport_failed' }), http: 503 }; }
  pack = { ...pack, ...settings };
  if (pack.source_status !== 'selected_source_rows') return { body: result('insufficient_evidence', pack), http: 200 };
  if (!settings.enabled) return { body: result('provider_unavailable', pack, { reason: settings.provider === 'openai' ? 'openai_not_configured_or_billing_not_approved' : 'provider_not_enabled_for_verified_free_account' }), http: 200 };
  if (settings.provider === 'openai') {
    const generated = await generateOpenAI(input, pack.evidence, env, fetcher);
    return { body: result(generated.status, pack, generated), http: 200 };
  }
  let payload;
  try { payload = modelPayload(input, pack.evidence); }
  catch (error) { return { body: result('provider_unavailable', pack, { reason: error.code }), http: 200 }; }
  try {
    const upstream = await fetcher(GROQ, { method: 'POST', headers: { Authorization: `Bearer ${env.GROQ_API_KEY}`, 'Content-Type': 'application/json', 'User-Agent': 'Houston-Demo/0.2' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(25000), redirect: 'manual' });
    if (!upstream.ok) return { body: result('provider_unavailable', pack, { reason: upstream.status === 429 ? 'free_provider_quota_or_rate_limit' : 'provider_request_failed' }), http: 200 };
    const raw = await boundedJson(upstream, 100_000);
    const choice = raw.choices?.[0];
    if (choice?.finish_reason !== 'stop') return { body: result('answer_rejected', pack, { reason: 'incomplete_model_output' }), http: 200 };
    let parsed;
    try { parsed = JSON.parse(choice.message.content); } catch { throw new ApiError('invalid_model_json', 200); }
    const claims = checkSelection(parsed, pack.evidence);
    return { body: result(claims.length ? 'generated_requires_source_review' : 'insufficient_evidence', pack, { claims, usage: { prompt_tokens: raw.usage?.prompt_tokens ?? null, completion_tokens: raw.usage?.completion_tokens ?? null, total_tokens: raw.usage?.total_tokens ?? null }, validation_scope: 'Exact raw-cell selection and deterministic rendering; scientific interpretation and relevance still require review.' }), http: 200 };
  } catch (error) {
    return { body: result(error instanceof ApiError && error.http === 200 ? 'answer_rejected' : 'provider_unavailable', pack, { reason: error instanceof ApiError ? error.code : 'provider_unreachable' }), http: 200 };
  }
}
export function createHandler(fetcher = (...args) => globalThis.fetch(...args)) {
  return async function handle(request, env) {
    const url = new URL(request.url);
    const asset = demoAssets[url.pathname === '/demo/' ? '/demo' : url.pathname];
    if (asset && request.method === 'GET') return new Response(asset.body, { headers: { 'Content-Type': asset.type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'", 'Referrer-Policy': 'no-referrer', 'Vary':'Origin', ...(asset.type.startsWith('application/json') && allowedOrigin(request.headers.get('Origin')) ? {'Access-Control-Allow-Origin':request.headers.get('Origin')} : {}) } });
    if (url.pathname === '/health' && request.method === 'GET') { const settings = providerSettings(env); const origin=request.headers.get('Origin'); return response({ status: 'ok', service: 'houston-research-proxy', model: settings.model, provider: settings.provider, generation_enabled: settings.enabled, rag_generation_enabled: env.ENABLE_RAG_GENERATION === 'true' && settings.provider === 'openai' && settings.enabled, retrieval: { corpus_version: CORPUS.version, chunks: CORPUS.chunks, studies: CORPUS.studies, accessions: CORPUS.accessions, semantic_enabled: semanticEnabled(env) } },200,allowedOrigin(origin)?origin:null); }
    if (!['/v1/answer', '/v1/search', '/v1/rag', '/v1/compare'].includes(url.pathname)) return response({ status: 'not_found' }, 404);
    const origin = request.headers.get('Origin');
    if (!allowedOrigin(origin)) return response({ status: 'origin_not_allowed' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600', 'Vary': 'Origin' } });
    if (request.method !== 'POST') return response({ status: 'method_not_allowed' }, 405, origin);
    if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return response({ status: 'json_required' }, 415, origin);
    try {
      if (!env.IP_LIMITER?.limit || !env.GLOBAL_LIMITER?.limit) return response({ status: 'limiter_unavailable' }, 503, origin);
      const ip = request.headers.get('CF-Connecting-IP');
      if (!ip) return response({ status: 'client_identity_unavailable' }, 503, origin);
      if (!(await env.IP_LIMITER.limit({ key: `answer:${ip}` })).success || !(await env.GLOBAL_LIMITER.limit({ key: 'answer:all' })).success) return response({ status: 'rate_limited', claims: [], limitations: LIMITATIONS, evidence: [] }, 429, origin, { 'Retry-After': '60' });
      if (Number(request.headers.get('Content-Length')) > MAX_BODY) throw new ApiError('request_too_large', 413);
      let body;
      try { body = await boundedJson(request, MAX_BODY); }
      catch (error) { throw new ApiError(error.code === 'upstream_response_too_large' ? 'request_too_large' : 'invalid_request_json', error.code === 'upstream_response_too_large' ? 413 : 400); }
      if (url.pathname === '/v1/search') return response(await searchEvidence(validateSearch(body), env), 200, origin);
      if (url.pathname === '/v1/rag') return response(await answerRag(validateRag(body), env, fetcher), 200, origin);
      if (url.pathname === '/v1/compare') {
        if (!body || Object.keys(body).some(k => k !== 'test_uids') || !Array.isArray(body.test_uids) || body.test_uids.length < 2) throw new ApiError('select_two_to_six_original_rows');
        const input = validateInput({ question: 'Compare the selected original source cells.', test_uids: body.test_uids });
        const pack = await buildEvidence(input, fetcher);
        return response({ status: pack.source_status, evidence: pack.evidence, missing_test_uids: pack.missing_test_uids || [], limitations: LIMITATIONS, scientific_comparability: 'not_established', generation_performed: false }, 200, origin);
      }
      const input = validateInput(body);
      const output = await answer(input, env, fetcher);
      return response(output.body, output.http, origin);
    } catch (error) {
      return response({ status: error instanceof ApiError ? error.code : 'request_failed', claims: [], evidence: [] }, error instanceof ApiError ? error.http : 503, origin);
    }
  };
}
export default { fetch: createHandler() };
