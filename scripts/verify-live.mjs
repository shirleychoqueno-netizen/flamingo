import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {nasaRequest,comparisonCsv,NASA_API_BASE} from '../src/nasa-client.js';
const siteOrigin='https://ignis-combustion-explorer.cheeky-vole-0211.chatgpt.site';
const checks=[];
for(const origin of [siteOrigin,'http://localhost:5173']){
 for(const path of ['/health','/demo-evaluation.json']){
  const response=await fetch(NASA_API_BASE+path,{headers:{Origin:origin}});
  assert.equal(response.status,200);assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
  const value=await response.json();if(path==='/health'){assert.equal(value.generation_enabled,false);assert.equal(value.rag_generation_enabled,false);}else assert.equal(value.mode,'recorded_private_evaluation');
  checks.push({origin,path,status:response.status});
 }
}
const withOrigin=(url,options)=>fetch(url,{...options,headers:{...options.headers,Origin:siteOrigin}});
const result=await nasaRequest('/v1/rag',{query:'Percent O2 S1 S2',accession:'PSI-98',kind:'source_table_row',mode:'hybrid',limit:6,generate:false},null,withOrigin);
assert.equal(result.status,'evidence_only');assert.equal(result.retrieval.mode_used,'hybrid');assert.equal(result.generation.performed,false);
const test_uids=['PSI-98|PSI-98_Experimental table_SAFFIRE-1.csv|1','PSI-98|PSI-98_Experimental table_SAFFIRE-1.csv|2'];
assert.ok(test_uids.every(uid=>result.retrieval.matches.some(m=>m.test_uid===uid)));
const comparison=await nasaRequest('/v1/compare',{test_uids},null,withOrigin);
assert.equal(comparison.status,'selected_source_rows');assert.equal(comparison.evidence[0].cells['Percent O2'],'21.5 - 21.7');assert.equal(comparison.evidence[1].cells['Percent O2'],'~ 21.5');assert.equal(comparison.generation_performed,false);
assert.ok(comparisonCsv(comparison.evidence).includes('~ 21.5'));
const preview=await fetch('http://localhost:5173/');assert.equal(preview.status,200);assert.ok((await preview.text()).includes('lang="en"'));
const catalog=JSON.parse(await readFile('src/investigation-catalog.json','utf8'));
let servedRows=0;
for(const study of catalog.investigations){const response=await fetch('http://localhost:5173'+study.rows_url);assert.equal(response.status,200);const text=await response.text();assert.equal(createHash('sha256').update(text).digest('hex'),study.rows_sha256);const rows=JSON.parse(text);servedRows+=rows.records.length;}
assert.equal(servedRows,2009);
const report={checked_utc:new Date().toISOString(),checks,mode:result.retrieval.mode_used,original_oxygen_values:comparison.evidence.map(e=>e.cells['Percent O2']),preview_status:200,served_row_snapshots:25,served_nonblank_rows:servedRows,new_OpenAI_requests:0,browser_visually_verified:false};
await writeFile('live-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
