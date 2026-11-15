import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, allowedOrigin } from '../src/worker.mjs';
import { validateInput, GROQ, FIRESTORE } from '../src/core.mjs';
import { buildEvidence } from '../src/firestore.mjs';
import { publicFixtures, fixtureFetch, environment, S1, S2 } from './fixtures.mjs';

const files = await publicFixtures();
const input = { question: 'What conditions differ between Saffire-I S1 and S2?', accession: 'PSI-98', test_uids: [S1, S2] };
const selected = { claims: [{ field: 'Percent O2', relation: 'listed_values', sources: [{ evidence_id: `row:${S1}`, raw: '21.5 - 21.7' }, { evidence_id: `row:${S2}`, raw: '~ 21.5' }] }], limitations: ['supplied_evidence_only'] };
function request(body = input, origin = 'https://flame-in-freefall-aqp.web.app') {
  return new Request('https://houston.example/v1/answer', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' }, body: JSON.stringify(body) });
}
test('public Firestore typed values preserve source identity, ranges and approximations', async () => {
  const pack = await buildEvidence(validateInput(input), fixtureFetch(files));
  assert.equal(pack.source_status, 'selected_source_rows');
  assert.equal(pack.evidence.length, 2);
  assert.equal(pack.evidence[0].cells['Percent O2'], '21.5 - 21.7');
  assert.equal(pack.evidence[1].cells['Percent O2'], '~ 21.5');
  assert.ok(pack.evidence.every(e => e.accession === 'PSI-98' && e.locator.includes('data_row=')));
});
test('successful contract uses server-rendered raw values and never returns the key', async () => {
  const trace = [];
  const response = await createHandler(fixtureFetch(files, selected, trace))(request(), environment());
  const body = await response.json();
  assert.equal(body.status, 'generated_requires_source_review');
  assert.equal(body.claims[0].numeric_check.status, 'passed_exact_raw');
  assert.equal(body.evidence.length, 2);
  assert.equal(trace.filter(t => t.url === GROQ).length, 1);
  assert.ok(trace.filter(t => t.url.startsWith(FIRESTORE)).every(t => t.method === 'GET' || t.url.endsWith(':runQuery')));
  assert.equal(JSON.stringify(body).includes('fixture-not-a-real-credential'), false);
});
test('Groq quota, authentication and server failures return evidence with no retry', async () => {
  for (const status of [401, 403, 429, 500]) {
    const trace = [];
    const response = await createHandler(fixtureFetch(files, new Response('no body logged', { status }), trace))(request(), environment());
    const body = await response.json();
    assert.equal(body.status, 'provider_unavailable'); assert.equal(body.evidence.length, 2);
    assert.equal(body.claims.length, 0); assert.equal(trace.filter(t => t.url === GROQ).length, 1);
  }
});
test('unknown study and missing selected UID do not trigger any generation', async () => {
  for (const body of [{ question: 'What happened?', accession: 'PSI-999' }, { ...input, test_uids: ['PSI-98|missing.csv|1'] }]) {
    const trace = [];
    const response = await createHandler(fixtureFetch(files, selected, trace))(request(body), environment());
    assert.equal((await response.json()).status, 'insufficient_evidence');
    assert.equal(trace.some(t => t.url === GROQ), false);
  }
});
test('a changed source value invalidates the old model answer', async () => {
  const changed = structuredClone(files);
  changed.get('tests/PSI-98__0').fields.rows.arrayValue.values[0].mapValue.fields.source_cells.mapValue.fields['Percent O2'].stringValue = '22.0';
  const body = await (await createHandler(fixtureFetch(changed, selected))(request(), environment())).json();
  assert.equal(body.status, 'answer_rejected'); assert.equal(body.reason, 'numeric_or_raw_value_mismatch');
});
test('missing secret or disabled/free-unconfirmed configuration never calls Groq', async () => {
  for (const overrides of [{ GROQ_API_KEY: '' }, { ENABLE_GROQ: 'false' }, { FREE_TIER_CONFIRMED: 'false' }]) {
    const trace = [];
    const body = await (await createHandler(fixtureFetch(files, selected, trace))(request(), environment(overrides))).json();
    assert.equal(body.status, 'provider_unavailable'); assert.equal(body.evidence.length, 2);
    assert.equal(trace.some(t => t.url === GROQ), false);
  }
});
test('limits run before Firestore and fail closed when bindings are missing', async () => {
  for (const overrides of [{ IP_LIMITER: null }, { GLOBAL_LIMITER: null }, { IP_LIMITER: { limit: async () => ({ success: false }) } }]) {
    const trace = [];
    const response = await createHandler(fixtureFetch(files, selected, trace))(request(), environment(overrides));
    assert.ok([429, 503].includes(response.status)); assert.equal(trace.length, 0);
  }
});
test('CORS only admits the exact public app and http localhost origins', async () => {
  assert.ok(allowedOrigin('http://localhost:8787')); assert.ok(allowedOrigin('http://localhost'));
  for (const origin of ['https://flame-in-freefall-aqp.web.app.evil.test', 'https://localhost', 'http://127.0.0.1', 'null', null]) {
    assert.equal(allowedOrigin(origin), false);
    const response = await createHandler(fixtureFetch(files))(request(input, origin), environment());
    assert.equal(response.status, 403); assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
  }
  const preflight = await createHandler()(new Request('https://houston.example/v1/answer', { method: 'OPTIONS', headers: { Origin: 'http://localhost:3000' } }), environment());
  assert.equal(preflight.status, 204);
});
test('oversized request never reaches Firestore', async () => {
  const trace = [];
  const response = await createHandler(fixtureFetch(files, selected, trace))(request({ ...input, question: 'x'.repeat(5000) }), environment());
  assert.equal(response.status, 413); assert.equal(trace.length, 0);
});

test('flamingo public frontend origin is allowed exactly, including health and API preflight', async()=>{
 const origin='https://flamingo.houston-groq-proxy.workers.dev';
 assert.equal(allowedOrigin(origin),true);
 assert.equal(allowedOrigin(origin+'.evil.example'),false);
 const handle=createHandler();
 const health=await handle(new Request('https://houston.example/health',{headers:{Origin:origin}}),environment());
 assert.equal(health.status,200);assert.equal(health.headers.get('Access-Control-Allow-Origin'),origin);
 const preflight=await handle(new Request('https://houston.example/v1/rag',{method:'OPTIONS',headers:{Origin:origin}}),environment());
 assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),origin);
});
test('default transport retains the Workers global fetch receiver', async () => {
  const previous = globalThis.fetch;
  const fake = fixtureFetch(files, selected);
  globalThis.fetch = function (...args) {
    assert.equal(this, globalThis, 'Workers fetch must retain its global receiver');
    return fake(...args);
  };
  try {
    const body = await (await createHandler()(request(), environment())).json();
    assert.equal(body.status, 'generated_requires_source_review');
  } finally { globalThis.fetch = previous; }
});
test('transport uses Workers-compatible manual redirects and rejects upstream redirects', async () => {
  const base = fixtureFetch(files, selected);
  const fetcher = (url, options) => {
    assert.equal(options.redirect, 'manual');
    return base(url, options);
  };
  const good = await (await createHandler(fetcher)(request(), environment())).json();
  assert.equal(good.status, 'generated_requires_source_review');
  const redirected = async (url, options) => url === GROQ ? new Response(null, { status: 302, headers: { Location: 'https://untrusted.example' } }) : fetcher(url, options);
  const bad = await (await createHandler(redirected)(request(), environment())).json();
  assert.equal(bad.status, 'provider_unavailable'); assert.equal(bad.evidence.length, 2);
});
