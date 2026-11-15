import corpus from './generated/retrieval-corpus.json' with { type: 'json' };
import { ApiError } from './core.mjs';

export const EMBEDDING = Object.freeze(corpus.embedding);
export const CORPUS = Object.freeze({ version: corpus.version, chunks: corpus.chunks.length,
  accessions: [...new Set(corpus.chunks.map(c => c.accession))].sort((a,b) => Number(a.slice(4)) - Number(b.slice(4))),
  studies: new Set(corpus.chunks.map(c => c.accession)).size, coverage: corpus.coverage,
  namespace: `v-${corpus.version.slice(0, 16)}` });
const KINDS = new Set(['investigation_metadata', 'document_paragraph', 'workbook_cached_cell', 'source_table_row']);
const ROW_TYPES = new Set(['test', 'campaign', 'condition_summary', 'unknown']);
const STOP = new Set('a an the is are was were what which how does do can of in on for to and or with from that this between'.split(' '));
function terms(text) {
  return (text.toLowerCase().match(/[a-z]+[0-9]*(?:-[a-z0-9]+)*|[0-9]+(?:\.[0-9]+)?/g) || []).filter(t => !STOP.has(t));
}
// Immutable derived corpus data; no request-specific mutable state is shared.
const entries = corpus.chunks.map(chunk => {
  const tokens = terms(chunk.text + ' ' + chunk.source_filename);
  const counts = new Map();
  for (const token of tokens) counts.set(token, (counts.get(token) || 0) + 1);
  return { chunk, counts, length: tokens.length };
});
const byId = new Map(entries.map(e => [e.chunk.id, e.chunk]));
const frequency = new Map();
for (const entry of entries) for (const term of entry.counts.keys()) frequency.set(term, (frequency.get(term) || 0) + 1);
const averageLength = entries.reduce((n, e) => n + e.length, 0) / entries.length;
const studies = new Set(entries.map(e => e.chunk.accession));

export function validateSearch(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !['query', 'accession', 'kind', 'row_type', 'limit', 'mode'].includes(k))) throw new ApiError('invalid_search_request');
  if (typeof body.query !== 'string' || !body.query.trim() || new TextEncoder().encode(body.query.trim()).length > 400) throw new ApiError('query_required_maximum_400_utf8_bytes');
  if (body.accession != null && (typeof body.accession !== 'string' || !/^PSI-[1-9][0-9]{0,3}$/.test(body.accession))) throw new ApiError('invalid_accession');
  if (body.kind != null && !KINDS.has(body.kind)) throw new ApiError('invalid_evidence_kind');
  if (body.row_type != null && !ROW_TYPES.has(body.row_type)) throw new ApiError('invalid_row_type');
  if (body.row_type != null && body.kind != null && body.kind !== 'source_table_row') throw new ApiError('incompatible_search_filters');
  if (body.limit != null && (!Number.isInteger(body.limit) || body.limit < 1 || body.limit > 10)) throw new ApiError('invalid_search_limit');
  if (body.mode != null && !['auto', 'lexical', 'hybrid'].includes(body.mode)) throw new ApiError('invalid_search_mode');
  return { query: body.query.trim(), accession: body.accession ?? null, kind: body.kind ?? null,
    row_type: body.row_type ?? null, limit: body.limit ?? 6, mode: body.mode ?? 'auto' };
}
function inScope(chunk, input) {
  return (!input.accession || chunk.accession === input.accession) && (!input.kind || chunk.kind === input.kind) && (!input.row_type || chunk.row_type === input.row_type);
}
export function lexicalSearch(input, limit = 50) {
  const queryTerms = [...new Set(terms(input.query))];
  return entries.filter(e => inScope(e.chunk, input)).map(e => {
    let score = 0;
    for (const term of queryTerms) {
      const tf = e.counts.get(term) || 0;
      if (!tf) continue;
      const idf = Math.log(1 + (entries.length - (frequency.get(term) || 0) + 0.5) / ((frequency.get(term) || 0) + 0.5));
      score += idf * tf * 2.2 / (tf + 1.2 * (0.25 + 0.75 * e.length / averageLength));
    }
    return { id: e.chunk.id, score };
  }).filter(e => e.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, limit);
}
export function semanticEnabled(env) {
  return env.ENABLE_SEMANTIC_SEARCH === 'true' && env.RETRIEVAL_CORPUS_VERSION === CORPUS.version && !!env.AI?.run && !!env.NASA_VECTORS?.query;
}
export function validateEmbeddingOutput(output, count) {
  if (output?.pooling !== undefined && output.pooling !== EMBEDDING.pooling) throw new ApiError('embedding_pooling_mismatch', 502);
  if (!Array.isArray(output?.data) || output.data.length !== count || output.data.some(v => !Array.isArray(v) || v.length !== EMBEDDING.dimensions || v.some(n => typeof n !== 'number' || !Number.isFinite(n)) || !v.some(n => n !== 0))) throw new ApiError('invalid_embedding_output', 502);
  return output.data;
}
export async function embedTexts(ai, texts) {
  if (!texts.length || texts.length > 16 || texts.some(t => typeof t !== 'string' || !t || new TextEncoder().encode(t).length > EMBEDDING.max_input_bytes)) throw new ApiError('embedding_input_budget_exceeded');
  // No fallback model: stored and query vectors must use identical embeddings.
  return validateEmbeddingOutput(await ai.run(EMBEDDING.model, { text: texts, pooling: EMBEDDING.pooling }), texts.length);
}
export function fuseRanks(lexical, semantic, input) {
  const scores = new Map();
  for (const [channel, list] of [['lexical', lexical], ['semantic', semantic]]) {
    const seen = new Set();
    for (let rank = 0; rank < list.length; rank++) {
      const match = list[rank], chunk = byId.get(match.id);
      // Resolve against the current canonical corpus; never trust index metadata.
      if (!chunk || !inScope(chunk, input) || seen.has(match.id) || !Number.isFinite(match.score)) continue;
      seen.add(match.id);
      const current = scores.get(match.id) || { chunk, score: 0, channels: [] };
      current.score += 1 / (60 + rank + 1);
      current.channels.push(channel);
      scores.set(match.id, current);
    }
  }
  const ranked = [...scores.values()].sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id));
  const identities = new Set(), matches = [];
  for (const entry of ranked) {
    const chunk = entry.chunk;
    const identity = chunk.test_uid || `${chunk.source_id}|${chunk.parts[0].evidence_id}`;
    if (identities.has(identity)) continue;
    identities.add(identity);
    matches.push({ chunk_id: chunk.id, accession: chunk.accession, kind: chunk.kind, text: chunk.text,
      test_uid: chunk.test_uid, row_type: chunk.row_type, fuel: chunk.fuel,
      source_filename: chunk.source_filename, source_sha256: chunk.source_sha256,
      psi_url: chunk.psi_url || null, doi: chunk.doi || null,
      citations: chunk.parts.map(p => ({ evidence_id: p.evidence_id, locator: p.locator,
        start: p.start, end: p.end, original_text: p.text })),
      review_flags: chunk.review_flags, coverage: chunk.coverage,
      rank_score: entry.score, retrieval_channels: entry.channels,
      scientific_comparability: 'not_established' });
    if (matches.length >= input.limit) break;
  }
  return matches;
}
export async function searchEvidence(input, env) {
  if (input.accession && !studies.has(input.accession)) return { status: 'unknown_investigation', matches: [], corpus_version: CORPUS.version };
  const lexical = lexicalSearch(input);
  let semantic = [], semanticStatus = input.mode === 'lexical' ? 'not_requested' : 'not_configured';
  if (input.mode !== 'lexical' && semanticEnabled(env)) {
    try {
      const [vector] = await embedTexts(env.AI, [EMBEDDING.query_prefix + input.query]);
      const filter = Object.fromEntries(['accession', 'kind', 'row_type'].filter(k => input[k]).map(k => [k, input[k]]));
      const result = await env.NASA_VECTORS.query(vector, { namespace: CORPUS.namespace, topK: 50, returnValues: false,
        returnMetadata: 'none', ...(Object.keys(filter).length ? { filter } : {}) });
      if (!Array.isArray(result?.matches) || result.matches.length > 50) throw new Error('Invalid index output');
      semantic = result.matches;
      semanticStatus = 'queried';
    } catch {
      semanticStatus = 'provider_unavailable';
    }
  }
  if (input.mode === 'hybrid' && semanticStatus !== 'queried') throw new ApiError(`semantic_search_${semanticStatus}`, 503);
  return { status: 'search_results', mode_requested: input.mode,
    mode_used: semanticStatus === 'queried' ? 'hybrid' : 'lexical', semantic_status: semanticStatus,
    corpus_version: CORPUS.version, coverage: CORPUS.coverage,
    ranking_notice: 'Retrieval rank measures relevance, not scientific validity or confidence. Open the original source and select exact rows before numerical comparison.',
    matches: fuseRanks(lexical, semantic, input) };
}
