import test from 'node:test';
import assert from 'node:assert/strict';
import { answerRag, validateRag, checkPassages, ragPayload } from '../src/rag.mjs';
import { createHandler } from '../src/worker.mjs';
import { environment, fixtureFetch, publicFixtures, S1, S2 } from './fixtures.mjs';
import demoAssets from '../src/generated/demo-assets.mjs';
const input = () => validateRag({ query: 'fan calibration zero flow voltage', accession: 'PSI-25', kind: 'workbook_cached_cell', mode: 'lexical' });
const noNetwork = () => { throw new Error('Unexpected network'); };
test('the actual IGNIS frontend can read health and the recorded evaluation cross-origin without allowing unrelated origins',async()=>{
 const handler=createHandler(noNetwork);const origin='https://ignis-combustion-explorer.cheeky-vole-0211.chatgpt.site';
 for(const path of ['/health','/demo-evaluation.json']){
  const r=await handler(new Request('https://backend.test'+path,{headers:{Origin:origin}}),{});assert.equal(r.status,200);assert.equal(r.headers.get('Access-Control-Allow-Origin'),origin);
  const denied=await handler(new Request('https://backend.test'+path,{headers:{Origin:'https://unrelated.example'}}),{});assert.equal(denied.headers.get('Access-Control-Allow-Origin'),null);
 }
});
test('every demo control referenced by its script exists and the replay is clearly labeled as a recorded private evaluation', () => {
  const html=demoAssets['/demo'].body, script=demoAssets['/demo.js'].body;
  const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
  for(const match of script.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.has(match[1]),'Missing demo control: '+match[1]);
  const recording=JSON.parse(demoAssets['/demo-evaluation.json'].body);
  assert.equal(recording.mode,'recorded_private_evaluation');assert.equal(recording.generated_live_on_this_click,false);
  assert.equal(recording.evaluation_summary.model_calls,7);assert.deepEqual(recording.evaluation_summary.partial_cases,['H5']);
  assert.ok(recording.passages.every(p=>p.evidence_id&&p.locator&&p.verification==='exact_contiguous_source_excerpt'));
});
test('dense workbook retrieval retains quotable context within the budget without sending hundreds of unusable numeric citations', () => {
  const matches = Array.from({ length: 6 }, (_, i) => ({ chunk_id: 'c'+i, accession:'PSI-25', kind:'workbook_cached_cell', review_flags:[], citations:[
    ...Array.from({length:50},(_,j)=>({evidence_id:'cell:'+'a'.repeat(64)+j,locator:'Original calibration workbook:sheet1.xml!A'+j,original_text:'0.0038'})),
    {evidence_id:'note'+i,locator:'sheet1.xml!D1',original_text:'Calibration depends on the restrictors and recorded configuration.'}
  ] }));
  const payload = ragPayload(input(),matches,'gpt-5.4-mini-2026-03-17');
  assert.ok(Buffer.byteLength(JSON.stringify(payload))<14000);
  assert.ok(JSON.stringify(payload).includes('Calibration depends on the restrictors'));
  assert.throws(()=>ragPayload(input(),[{...matches[0],citations:matches[0].citations.slice(0,50)}],'gpt-5.4-mini-2026-03-17'),/no_quotable_rag_passages/);
});
test('RAG evidence-only mode retrieves real cited context without invoking generation', async () => {
  const r = await answerRag(input(), {}, noNetwork);
  assert.equal(r.status, 'evidence_only'); assert.equal(r.generation.performed, false);
  assert.ok(r.retrieval.matches.some(m => m.citations.some(c => c.original_text.includes('3.8'))));
});
test('RAG activation is independently gated and ignores injected context', async () => {
  assert.throws(() => validateRag({ query: 'NASA', evidence: 'invented' }));
  assert.throws(() => validateRag({ query: 'NASA', generate: 'true' }));
  const r = await answerRag({ ...input(), generate: true }, environment(), noNetwork);
  assert.equal(r.status, 'generation_unavailable'); assert.equal(r.generation.performed, false);
});
test('RAG verifies each exact quote against its individual source, rejects changed numbers and crossed citations', async () => {
  const r = await answerRag(input(), {}); const m = r.retrieval.matches.find(m => m.citations.some(c => c.original_text.includes('3.8')));
  const c = m.citations.find(c => c.original_text.includes('3.8')); const p = { chunk_id: m.chunk_id, evidence_id: c.evidence_id, quote: c.original_text };
  assert.equal(checkPassages({ passages: [p] }, r.retrieval.matches)[0].verification, 'exact_contiguous_source_excerpt');
  assert.throws(() => checkPassages({ passages: [{ ...p, quote: p.quote.replace('3.8', '7.6') }] }, r.retrieval.matches));
  assert.throws(() => checkPassages({ passages: [{ ...p, evidence_id: 'unknown' }] }, r.retrieval.matches));
  assert.throws(() => checkPassages({ passages: [p,p] }, r.retrieval.matches));
});
function upstream(parsed) { return Response.json({ status: 'completed', output: [{ type:'message', content:[{type:'output_text',text:JSON.stringify(parsed)}] }],usage:{input_tokens:1000,output_tokens:100,total_tokens:1100} }); }
function activeEnv() { return { AI_PROVIDER:'openai',OPENAI_MODEL:'gpt-5.4-mini-2026-03-17',ENABLE_OPENAI:'true',OPENAI_BILLING_APPROVED:'true',ENABLE_RAG_GENERATION:'true',OPENAI_API_KEY:'fixture-not-a-credential' }; }
test('RAG private model transport preserves the exact context, strict schema and source verification', async () => {
  const pack = await answerRag(input(), {}); const m=pack.retrieval.matches[0], c=m.citations[0]; let requests=0;
  const r=await answerRag({...input(),generate:true},activeEnv(),async(url,options)=>{ requests++; const payload=JSON.parse(options.body);assert.equal(payload.text.format.strict,true);assert.deepEqual(payload.tools,[]);assert.equal(options.redirect,'manual'); return upstream({passages:[{chunk_id:m.chunk_id,evidence_id:c.evidence_id,quote:c.original_text}]}); });
  assert.equal(requests,1);assert.equal(r.status,'generated_excerpts_require_review');assert.equal(r.passages[0].quote,c.original_text);assert.ok(r.estimated_standard_cost_usd>0);
});
test('RAG provider quota does not retry or select another provider', async () => {
  let requests=0; const r=await answerRag({...input(),generate:true},activeEnv(),async()=>{requests++;return Response.json({error:{}},{status:429});});
  assert.equal(requests,1);assert.equal(r.reason,'openai_quota_or_rate_limit');assert.equal(r.passages.length,0);
});
test('RAG rejects model-authored false scientific prose and unsupported outputs', async () => {
  for (const body of [{passages:[],summary:'Safe for lunar use'},{passages:[{chunk_id:'unknown',evidence_id:'unknown',quote:'All conditions are safe on the Moon.'}]}]) {
    const r=await answerRag({...input(),generate:true},activeEnv(),async()=>upstream(body));assert.equal(r.status,'answer_rejected');assert.deepEqual(r.passages,[]);
  }
});
test('demo assets have a restrictive content policy and the server reports real generation state', async () => {
  const handler=createHandler(noNetwork), response=await handler(new Request('https://example.test/demo'),{});
  assert.equal(response.status,200);assert.ok((await response.text()).includes('Evidence Workbench'));assert.ok(response.headers.get('Content-Security-Policy').includes("script-src 'self'"));
  const health=await (await handler(new Request('https://example.test/health'),{})).json();assert.equal(health.rag_generation_enabled,false);assert.equal(health.retrieval.accessions.length,25);
});
test('deterministic comparison is available without any AI credential and preserves original qualifiers', async () => {
  const handler=createHandler(fixtureFetch(await publicFixtures()));
  const response=await handler(new Request('https://example.test/v1/compare',{method:'POST',headers:{Origin:'https://houston-groq-proxy.houston-groq-proxy.workers.dev','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'},body:JSON.stringify({test_uids:[S1,S2]})}),environment());
  const r=await response.json();assert.equal(response.status,200);assert.equal(r.status,'selected_source_rows');assert.equal(r.evidence[0].cells['Percent O2'],'21.5 - 21.7');assert.equal(r.evidence[1].cells['Percent O2'],'~ 21.5');assert.equal(r.generation_performed,false);
});
