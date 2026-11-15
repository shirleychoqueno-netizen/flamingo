import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, allowedOrigin } from '../src/worker.mjs';
import { OPENAI_URL, PROMO_INITIAL_MODEL, providerSettings, openAIPayload } from '../src/openai.mjs';
import { GROQ } from '../src/core.mjs';
import { publicFixtures, fixtureFetch, environment, S1, S2 } from './fixtures.mjs';

const files = await publicFixtures();
const input = { question: 'Compare the original oxygen values.', accession: 'PSI-98', test_uids: [S1, S2] };
const selection = { claims: [{ field: 'Percent O2', relation: 'listed_values', sources: [{ evidence_id: `row:${S1}`, raw: '21.5 - 21.7' }, { evidence_id: `row:${S2}`, raw: '~ 21.5' }] }], limitations: ['supplied_evidence_only'] };
function request() { return new Request('https://proxy.example/v1/answer', { method: 'POST', headers: { Origin: 'https://ignis-combustion-explorer.cheeky-vole-0211.chatgpt.site', 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' }, body: JSON.stringify(input) }); }
function configured(overrides = {}) { return environment({ AI_PROVIDER: 'openai', OPENAI_MODEL: 'gpt-6.1-terra', ENABLE_OPENAI: 'true', OPENAI_BILLING_APPROVED: 'true', OPENAI_API_KEY: 'unit-test-not-a-credential', ...overrides }); }
function completed(answer = selection) { return { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer) }] }], usage: { input_tokens: 3000, output_tokens: 500, total_tokens: 3500 } }; }
function fetcher(modelReply, trace = []) {
  const source = fixtureFetch(files);
  return async (url, options) => {
    if (url === GROQ) throw new Error('No automatic fallback is permitted');
    if (url !== OPENAI_URL) return source(url, options);
    trace.push(JSON.parse(options.body));
    assert.equal(options.redirect, 'manual');
    return modelReply instanceof Response ? modelReply.clone() : Response.json(modelReply);
  };
}
test('OpenAI Responses contract preserves raw oxygen and reports estimated standard usage cost', async () => {
  const trace = []; const body = await (await createHandler(fetcher(completed(), trace))(request(), configured())).json();
  assert.equal(body.provider, 'openai'); assert.equal(body.model, 'gpt-6.1-terra');
  assert.equal(body.status, 'generated_requires_source_review');
  assert.match(body.claims[0].text, /"~ 21.5"/); assert.equal(body.estimated_standard_cost_usd, 0.0055);
  assert.equal(trace.length, 1); assert.equal(trace[0].store, false);
  assert.equal(trace[0].max_output_tokens, 1200); assert.equal(trace[0].text.format.strict, true);
  assert.deepEqual(trace[0].tools, []); assert.deepEqual(trace[0].reasoning, { effort: 'none' });
  assert.equal(trace[0].service_tier, 'default');
  assert.equal(JSON.stringify(body).includes('unit-test-not-a-credential'), false);
});
test('OpenAI cannot repeat the failed Saffire interval transfer', async () => {
  const bad = structuredClone(selection); bad.claims[0].sources[1].raw = '21.5 - 21.7';
  const body = await (await createHandler(fetcher(completed(bad)))(request(), configured())).json();
  assert.equal(body.status, 'answer_rejected'); assert.equal(body.reason, 'numeric_or_raw_value_mismatch');
  assert.deepEqual(body.claims, []); assert.equal(body.evidence.length, 2);
});
test('OpenAI requires an explicit activation flag, spending approval and credential', async () => {
  for (const override of [{ ENABLE_OPENAI: 'false' }, { OPENAI_BILLING_APPROVED: 'false' }, { OPENAI_API_KEY: '' }, { OPENAI_MODEL: 'unapproved-model' }]) {
    const trace = []; const body = await (await createHandler(fetcher(completed(), trace))(request(), configured(override))).json();
    assert.equal(body.status, 'provider_unavailable'); assert.equal(trace.length, 0); assert.equal(body.evidence.length, 2);
  }
});
test('OpenAI quota errors return evidence without retries or Groq substitution', async () => {
  const trace = []; const body = await (await createHandler(fetcher(new Response('{}', { status: 429 }), trace))(request(), configured())).json();
  assert.equal(body.status, 'provider_unavailable'); assert.equal(body.reason, 'openai_quota_or_rate_limit');
  assert.equal(trace.length, 1); assert.equal(body.evidence.length, 2);
});
test('OpenAI refusal, truncation and unexpected tool actions are not shown as answers', async () => {
  const samples = [
    { status: 'incomplete', output: [] },
    { status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'No answer' }] }] },
    { status: 'completed', output: [{ type: 'function_call', name: 'send_secret' }] }
  ];
  for (const sample of samples) {
    const body = await (await createHandler(fetcher(sample))(request(), configured())).json();
    assert.equal(body.status, 'answer_rejected'); assert.deepEqual(body.claims, []);
  }
});
test('OpenAI malformed JSON and over-generalized limitations are rejected', async () => {
  const invalid = completed(); invalid.output[0].content[0].text = '{not json';
  const unsupported = completed({ claims: [], limitations: ['The entire NASA dataset contains no heat release data.'] });
  for (const sample of [invalid, unsupported]) {
    const body = await (await createHandler(fetcher(sample))(request(), configured())).json();
    assert.equal(body.status, 'answer_rejected'); assert.deepEqual(body.claims, []);
  }
});
test('only supported model choices fit the bounded strict-schema request', () => {
  const evidence = [{ evidence_id: 'E1', accession: 'PSI-98', cells: { oxygen: '~ 21.5' } }];
  assert.equal(openAIPayload(input, evidence, 'gpt-6-luna').model, 'gpt-6-luna');
  assert.throws(() => openAIPayload(input, evidence, 'arbitrary-model'));
  assert.throws(() => openAIPayload(input, [{ ...evidence[0], cells: { giant: 'x'.repeat(10000) } }], 'gpt-6.1-terra'));
});
test('IGNIS CORS permission is limited to its exact origin', () => {
  assert.equal(allowedOrigin('https://ignis-combustion-explorer.cheeky-vole-0211.chatgpt.site'), true);
  assert.equal(allowedOrigin('https://ignis-combustion-explorer.cheeky-vole-0211.chatgpt.site.attacker.example'), false);
  assert.equal(allowedOrigin('https://another-site.chatgpt.site'), false);
});
test('sharing-incentive mode requires the verified small-group snapshot and account confirmations', async () => {
  const ready = { OPENAI_MODEL: PROMO_INITIAL_MODEL, OPENAI_REQUIRE_PROMO_SMALL_GROUP: 'true', OPENAI_PROMO_PROJECT_CONFIRMED: 'true', OPENAI_BALANCE_CONFIRMED: 'true' };
  for (const override of [{ OPENAI_PROMO_PROJECT_CONFIRMED: 'false' }, { OPENAI_BALANCE_CONFIRMED: 'false' }, { OPENAI_MODEL: 'gpt-6.1-terra' }, { OPENAI_MODEL: 'gpt-6-luna' }]) {
    const trace = []; const body = await (await createHandler(fetcher(completed(), trace))(request(), configured({ ...ready, ...override }))).json();
    assert.equal(body.status, 'provider_unavailable'); assert.equal(trace.length, 0);
  }
  assert.equal(providerSettings(configured(ready)).enabled, true);
});
test('mini cost remains the standard-rate estimate, even when incentive mode is selected', async () => {
  const body = await (await createHandler(fetcher(completed()))(request(), configured({ OPENAI_MODEL: PROMO_INITIAL_MODEL }))).json();
  assert.equal(body.status, 'generated_requires_source_review');
  assert.equal(body.estimated_standard_cost_usd, 0.0045);
  assert.equal(body.model, PROMO_INITIAL_MODEL);
});
