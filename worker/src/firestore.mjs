import { ApiError, FIRESTORE, boundedJson, decodeFields, rankRows, sourceEvidence } from './core.mjs';

export async function buildEvidence(input, fetcher = (...args) => globalThis.fetch(...args)) {
  let requests = 0;
  async function read(path, options = {}) {
    requests++;
    const response = await fetcher(FIRESTORE + path, { ...options, headers: { 'Accept': 'application/json', ...(options.headers || {}) }, signal: AbortSignal.timeout(15000), redirect: 'manual' });
    if (!response.ok) throw new ApiError(`evidence_source_http_${response.status}`, 503);
    return boundedJson(response);
  }
  const indexDoc = await read('/meta/index?mask.fieldPaths=dataset&mask.fieldPaths=investigations');
  const index = decodeFields(indexDoc.fields || {});
  const known = new Set((index.investigations || []).map(i => i.accession));
  if (input.studies.some(study => !known.has(study))) return { evidence: [], source_status: 'unknown_investigation', selected_test_uids: input.test_uids, missing_test_uids: input.test_uids, firestore_requests: requests };
  const evidence = []; const missing = []; const missingCells = []; let partial = false;
  for (const accession of input.studies) {
    const studyDoc = await read(`/investigations/${accession}?mask.fieldPaths=accession&mask.fieldPaths=summary_en&mask.fieldPaths=doi&mask.fieldPaths=psi_url`);
    const investigation = decodeFields(studyDoc.fields || {});
    const result = await read(':runQuery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'tests' }], where: { fieldFilter: { field: { fieldPath: 'accession' }, op: 'EQUAL', value: { stringValue: accession } } }, limit: 5 } }) });
    if (!Array.isArray(result)) throw new ApiError('invalid_evidence_source_shape', 502);
    const documents = result.filter(r => r.document).map(r => r.document);
    if (documents.length > 4) { partial = true; continue; }
    const wanted = input.test_uids.filter(uid => uid.startsWith(accession + '|'));
    const candidates = [];
    for (const document of documents) {
      if (document.fields?.accession?.stringValue !== accession) throw new ApiError('study_scope_mismatch', 502);
      for (const wrapped of document.fields.rows?.arrayValue?.values || []) {
        const typed = wrapped.mapValue?.fields;
        if (!typed) continue;
        if (wanted.length && !wanted.includes(typed.test_uid?.stringValue)) continue;
        const row = decodeFields(typed);
        if (row.accession !== accession) throw new ApiError('row_study_mismatch', 502);
        if (row.row_type === 'blank') continue;
        candidates.push({ row, documentName: document.name });
      }
    }
    const ordered = wanted.length ? wanted.map(uid => candidates.find(c => c.row.test_uid === uid)).filter(Boolean) : rankRows(candidates.map(c => c.row), input.question).slice(0, 6).map(row => candidates.find(c => c.row === row));
    for (const uid of wanted) if (!ordered.some(c => c.row.test_uid === uid)) missing.push(uid);
    for (const candidate of ordered) {
      if (evidence.length >= 6) { partial = true; break; }
      const item = sourceEvidence(candidate.row, candidate.documentName, investigation);
      if (!Object.keys(item.cells).length) { missingCells.push(item.test_uid); continue; }
      evidence.push(item);
    }
  }
  return { evidence, source_status: partial ? 'source_budget_exceeded' : missing.length || missingCells.length ? 'selection_incomplete' : evidence.length ? 'selected_source_rows' : 'no_source_rows', selected_test_uids: input.test_uids, missing_test_uids: missing, missing_raw_cells: missingCells, firestore_requests: requests, coverage: 'Public English Firestore source_cells only; not the full NASA media/document corpus.' };
}
