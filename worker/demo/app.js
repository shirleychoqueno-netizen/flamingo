const $ = id => document.getElementById(id);
let lastInput = null, lastResult = null, comparison = null, lastAnswer = null, busy = false, readyGeneration = false;
const selected = new Set();
const examples = {
  calibration: { query: 'Why should I avoid the zero-flow point near 3.8 volts?', accession: 'PSI-25', kind: 'workbook_cached_cell' },
  flames: { query: 'Normal and inverse diffusion flames using ethylene or methane', accession: '', kind: '' },
  saffire: { query: 'Percent O2 S1 S2', accession: 'PSI-98', kind: 'source_table_row' }
};
function node(tag, text, className) { const n = document.createElement(tag); if (text != null) n.textContent = text; if (className) n.className = className; return n; }
function status(text) { $('status').textContent = text; }
function controls() { $('search').disabled = busy; $('compare').disabled = busy || selected.size < 2; $('compare').textContent = 'Compare selected rows (' + selected.size + ')'; $('generate').disabled = busy || !readyGeneration || !lastInput; }
async function post(path, body) {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(35000) });
  if (r.status === 429) throw new Error('Request limit reached. Wait ' + (r.headers.get('Retry-After') || '60') + ' seconds, then try again.');
  const result = await r.json();
  if (!r.ok) throw new Error(result.status || 'Request failed.');
  return result;
}
function renderSources(retrieval) {
  selected.clear(); $('results').replaceChildren(); comparison = null; $('comparison').replaceChildren(); lastAnswer = null; $('answer-section').hidden = true;
  $('result-meta').textContent = 'Mode used: ' + (retrieval.mode_used || 'none') + ' · Semantic status: ' + (retrieval.semantic_status || 'not queried') + ' · Rank indicates relevance, not scientific validity.';
  if (!retrieval.matches.length) $('results').append(node('p', 'No evidence was returned for this request. Try another question or a broader source filter.'));
  for (const match of retrieval.matches) {
    const card = node('article', null, 'evidence'), top = node('div', null, 'source-heading');
    top.append(node('h3', match.accession + ' / ' + match.source_filename), node('span', match.kind.replaceAll('_', ' '), 'tag')); card.append(top);
    for (const citation of match.citations) card.append(node('blockquote', citation.original_text));
    const detail = node('details'); detail.append(node('summary', 'Provenance and review status'), node('pre', JSON.stringify({ citations: match.citations.map(({ original_text, ...c }) => c), source_sha256: match.source_sha256, channels: match.retrieval_channels, row_type: match.row_type, review_flags: match.review_flags, coverage: match.coverage }, null, 2))); card.append(detail);
    if (match.psi_url && new URL(match.psi_url).origin === 'https://psi.nasa.gov') { const a = node('a', 'Open NASA investigation ↗'); a.href = match.psi_url; a.target = '_blank'; a.rel = 'noopener noreferrer'; card.append(a); }
    if (match.test_uid) { const label = node('label', null, 'row-select'), checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.addEventListener('change', () => { if (checkbox.checked && selected.size >= 6) { checkbox.checked = false; status('Select at most six original rows.'); return; } checkbox.checked ? selected.add(match.test_uid) : selected.delete(match.test_uid); controls(); }); label.append(checkbox, document.createTextNode('Select this original ' + match.row_type + ' row')); card.append(label); }
    $('results').append(card);
  }
  $('export').disabled = false; controls();
}
$('search-form').addEventListener('submit', async e => {
  e.preventDefault(); if (busy) return; busy = true; controls(); status('Retrieving source evidence…');
  const input = { query: $('query').value.trim(), mode: $('mode').value, limit: 6, generate: false };
  if ($('accession').value) input.accession = $('accession').value;
  if ($('kind').value) input.kind = $('kind').value;
  try { const result = await post('/v1/rag', input); lastInput = input; lastResult = result; renderSources(result.retrieval); status('Retrieved ' + result.retrieval.matches.length + ' source candidates. Inspect the excerpts before drawing conclusions.'); }
  catch (error) { status(error.message); }
  finally { busy = false; controls(); }
});
document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => { const example = examples[button.dataset.example]; $('query').value = example.query; $('accession').value = example.accession; $('kind').value = example.kind; status('Example loaded. Select “Find evidence” to run a real search.'); }));
$('compare').addEventListener('click', async () => {
  if (busy || selected.size < 2) return; busy = true; controls(); status('Loading original source cells…');
  try {
    comparison = await post('/v1/compare', { test_uids: [...selected] });
    if (comparison.status !== 'selected_source_rows') throw new Error('Some selected source rows could not be loaded. Status: ' + comparison.status);
    const table = document.createElement('table'), head = document.createElement('tr'); head.append(node('th', 'Original field'));
    for (const row of comparison.evidence) head.append(node('th', row.accession + ' / ' + (row.test_id_raw || row.test_uid)));
    const thead = document.createElement('thead'); thead.append(head); table.append(thead);
    const tbody = document.createElement('tbody'), fields = [...new Set(comparison.evidence.flatMap(e => Object.keys(e.cells)))];
    for (const field of fields) { const tr = document.createElement('tr'); tr.append(node('td', field)); for (const row of comparison.evidence) tr.append(node('td', Object.hasOwn(row.cells, field) ? row.cells[field] : 'Not recorded in this supplied row')); tbody.append(tr); }
    table.append(tbody); $('comparison').replaceChildren(table); status('Original source values loaded. Scientific comparability is not established.');
  } catch (error) { status(error.message); }
  finally { busy = false; controls(); }
});
$('generate').addEventListener('click', async () => {
  if (busy || !readyGeneration || !lastInput) return; busy = true; controls(); status('Selecting source-grounded passages with GPT…');
  try { lastAnswer = await post('/v1/rag', { ...lastInput, generate: true }); $('answer').replaceChildren(); $('answer-section').hidden = false;
    for (const p of lastAnswer.passages) { $('answer').append(node('blockquote', p.quote), node('p', p.accession + ' / ' + p.locator, 'fine')); }
    $('answer').append(node('p', lastAnswer.status + '. Original wording is verified; relevance and scientific interpretation require review.', 'notice')); status('Source-grounded request completed.');
  } catch (error) { status(error.message); } finally { busy = false; controls(); }
});
$('export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ exported_utc: new Date().toISOString(), request: lastInput, retrieval: lastResult, comparison, grounded_answer: lastAnswer }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'ignis-evidence-session.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('recorded').addEventListener('click', async () => {
  if (busy) return;
  busy = true; controls(); status('Loading the recorded private GPT evaluation; no new model request…');
  try {
    const response = await fetch('/demo-evaluation.json'); if (!response.ok) throw new Error('Recorded evaluation unavailable.');
    const recorded = await response.json();
    lastAnswer = recorded; $('answer-section').hidden = false; $('answer').replaceChildren();
    $('answer').append(node('p', 'RECORDED GPT EVALUATION — ' + new Date(recorded.recorded_utc).toLocaleString('en-US'), 'notice'), node('h3', recorded.question), node('p', recorded.scope_notice, 'fine'));
    for (const p of recorded.passages) $('answer').append(node('blockquote', p.quote), node('p', p.accession + ' / ' + p.locator, 'fine'));
    $('export').disabled = false;
    status('Recorded GPT output loaded. Search and comparisons remain live; this button made no new generation request.');
    $('answer-section').scrollIntoView({ behavior:'smooth', block:'start' });
  } catch (error) { status(error.message); } finally { busy = false; controls(); }
});
async function initialize() {
  try { const r = await fetch('/health'); if (!r.ok) throw new Error('Health check unavailable'); const health = await r.json();
    $('studies').textContent = health.retrieval.studies; $('chunks').textContent = health.retrieval.chunks.toLocaleString('en-US'); $('retriever').textContent = health.retrieval.semantic_enabled ? 'Hybrid' : 'Words only';
    for (const accession of health.retrieval.accessions) { const option = node('option', accession); option.value = accession; $('accession').append(option); }
    readyGeneration = health.rag_generation_enabled === true;
    $('generation-status').textContent = readyGeneration ? 'GPT source selection is connected. Generated excerpts still require source review.' : 'Live public GPT generation is disabled. A recorded private GPT run is available below; evidence search and comparisons are live.';
    $('accession').value = 'PSI-25'; $('kind').value = 'workbook_cached_cell'; controls();
  } catch { status('Could not connect to the evidence service. Reload the page to try again.'); $('generation-status').textContent = 'Generation availability could not be checked.'; }
}
initialize();
