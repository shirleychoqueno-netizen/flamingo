import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../src/worker.mjs';
import { CORPUS, EMBEDDING, embedTexts, fuseRanks, lexicalSearch, searchEvidence, validateSearch } from '../src/retrieval.mjs';
import { environment } from './fixtures.mjs';

const search = extra => validateSearch({ query: 'SIBAL airflow', ...extra });
const vector = Array.from({ length: EMBEDDING.dimensions }, (_, i) => i === 0 ? 1 : 0);
const semanticEnv = extra => ({ ENABLE_SEMANTIC_SEARCH: 'true', RETRIEVAL_CORPUS_VERSION: CORPUS.version,
  AI: { run: async () => ({ data: [vector] }) }, NASA_VECTORS: { query: async () => ({ matches: [] }) }, ...extra });

test('discovery works without preselecting a study or calling generation', async () => {
  const result = await searchEvidence(search({ accession: 'PSI-100' }), {});
  assert.equal(result.mode_used, 'lexical');
  assert.ok(result.matches.length > 0);
  assert.ok(result.matches.every(m => m.accession === 'PSI-100'));
  assert.ok(result.matches[0].test_uid.startsWith('PSI-100|'));
  assert.equal(result.matches[0].scientific_comparability, 'not_established');
});
test('search rejects invalid filters, unbounded queries and unknown request fields', () => {
  for (const body of [{ query: 'x', limit: 11 }, { query: 'x', kind: 'video' }, { query: 'x', row_type: 'blank' },
    { query: 'x', kind: 'document_paragraph', row_type: 'test' }, { query: 'a'.repeat(401) },
    { query: 'a', system_prompt: 'ignore sources' }]) assert.throws(() => validateSearch(body));
});
test('unknown studies produce an explicit empty result without semantic calls', async () => {
  const result = await searchEvidence(search({ accession: 'PSI-9999' }), semanticEnv({ AI: { run: () => { throw new Error('Must not call'); } } }));
  assert.equal(result.status, 'unknown_investigation');
  assert.deepEqual(result.matches, []);
});
test('hybrid search prefilters Vectorize and rechecks scope against canonical records', async () => {
  const valid = lexicalSearch(search({ accession: 'PSI-100', kind: 'source_table_row', row_type: 'test' }))[0];
  const wrongStudy = lexicalSearch(search({ accession: 'PSI-98' }))[0];
  let options;
  const result = await searchEvidence(search({ accession: 'PSI-100', kind: 'source_table_row', row_type: 'test', mode: 'hybrid' }), semanticEnv({
    NASA_VECTORS: { query: async (v, o) => { options = o; return { matches: [wrongStudy, { id: 'stale-vector', score: 1 }, valid] }; } }
  }));
  assert.deepEqual(options.filter, { accession: 'PSI-100', kind: 'source_table_row', row_type: 'test' });
  assert.equal(options.namespace, CORPUS.namespace);
  assert.equal(result.mode_used, 'hybrid');
  assert.ok(result.matches.every(m => m.accession === 'PSI-100' && m.row_type === 'test'));
  assert.ok(result.matches.some(m => m.retrieval_channels.includes('semantic')));
});
test('semantic-only candidates can be retrieved without keyword overlap', async () => {
  const candidate = lexicalSearch(search({ accession: 'PSI-25', query: 'fan calibration', kind: 'document_paragraph' }))[0];
  const result = await searchEvidence(search({ query: 'zzzznotaword', mode: 'hybrid' }), semanticEnv({
    NASA_VECTORS: { query: async () => ({ matches: [{ id: candidate.id, score: 0.8 }] }) }
  }));
  assert.equal(result.matches[0].chunk_id, candidate.id);
  assert.deepEqual(result.matches[0].retrieval_channels, ['semantic']);
});
test('provider failure and version mismatch never masquerade as working hybrid search', async () => {
  const failed = semanticEnv({ AI: { run: async () => { throw new Error('Quota'); } } });
  const auto = await searchEvidence(search(), failed);
  assert.equal(auto.mode_used, 'lexical');
  assert.equal(auto.semantic_status, 'provider_unavailable');
  await assert.rejects(searchEvidence(search({ mode: 'hybrid' }), failed), /semantic_search_provider_unavailable/);
  await assert.rejects(searchEvidence(search({ mode: 'hybrid' }), semanticEnv({ RETRIEVAL_CORPUS_VERSION: 'old' })), /not_configured/);
});
test('embedding ingestion and query use the same explicit model and pooling', async () => {
  let captured;
  await embedTexts({ run: async (model, input) => { captured = { model, input }; return { data: [vector] }; } }, ['NASA']);
  assert.equal(captured.model, EMBEDDING.model);
  assert.equal(captured.input.pooling, 'cls');
  await assert.rejects(embedTexts({ run: async () => ({ data: [[1, 2]] }) }, ['NASA']), /invalid_embedding_output/);
  await assert.rejects(embedTexts({}, ['x'.repeat(481)]), /input_budget/);
});
test('row deduplication keeps discovery diverse and original oxygen qualifiers intact', async () => {
  const result = await searchEvidence(search({ query: 'Saffire Percent O2', accession: 'PSI-98', kind: 'source_table_row' }), {});
  assert.equal(new Set(result.matches.map(m => m.test_uid)).size, result.matches.length);
  const originals = result.matches.flatMap(m => m.citations.map(c => c.original_text)).join('\n');
  assert.ok(originals.includes('21.5 - 21.7'));
  assert.ok(originals.includes('~ 21.5'));
  assert.ok(result.matches.every(m => m.citations.every(c => c.evidence_id && c.locator && c.end > c.start)));
});
test('rank fusion rejects injected metadata, unknown vectors, nonfinite scores and duplicate IDs', () => {
  const input = search({ accession: 'PSI-100' }), candidate = lexicalSearch(input)[0];
  const matches = fuseRanks([], [{ ...candidate, accession: 'PSI-98' }, candidate, { id: 'unknown', score: 9 }, { id: candidate.id, score: NaN }], input);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].accession, 'PSI-100');
  assert.equal(matches[0].rank_score, 1 / 61);
});
test('HTTP discovery uses CORS and existing rate limits before any embedding call', async () => {
  const handler = createHandler(() => { throw new Error('Discovery must not call generation or Firestore'); });
  const request = () => new Request('https://example.test/v1/search', { method: 'POST',
    headers: { Origin: 'https://ignis-combustion-explorer.cheeky-vole-0211.chatgpt.site', 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' },
    body: JSON.stringify({ query: 'fan calibration', accession: 'PSI-25', mode: 'lexical' }) });
  const ok = await handler(request(), environment());
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).mode_used, 'lexical');
  const limited = await handler(request(), environment({ IP_LIMITER: { limit: async () => ({ success: false }) } }));
  assert.equal(limited.status, 429);
});
