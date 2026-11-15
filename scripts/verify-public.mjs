import assert from 'node:assert/strict';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const local=process.argv.includes('--local');
const base=local?'http://127.0.0.1:8793':'https://flamingo.houston-groq-proxy.workers.dev';
const api='https://houston-groq-proxy.houston-groq-proxy.workers.dev';
const hash=data=>createHash('sha256').update(data).digest('hex');
const results=[];
const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,options)=>{try{return await originalFetch(url,options);}catch(error){throw new Error('Transport failed for '+url+' ('+(error.cause?.code||error.message)+')',{cause:error});}};
async function exact(path){const response=await fetch(base+path);assert.equal(response.status,200,path);const bytes=Buffer.from(await response.arrayBuffer());assert.equal(hash(bytes),hash(await readFile('dist'+path)),path);return bytes;}
const home=await fetch(base+'/');assert.equal(home.status,200);const html=await home.text();assert.equal(html,await readFile('dist/index.html','utf8'));assert.ok(html.includes('flamingo — Microgravity Research'));assert.ok(!html.includes('<title>IGNIS'));
results.push({case:'Public home matches the flamingo production build',passed:true});
for(const name of await readdir('dist/assets'))await exact('/assets/'+name);
const catalog=JSON.parse(await readFile('src/investigation-catalog.json','utf8'));
let rows=0;for(const study of catalog.investigations){const bytes=await exact(study.rows_url);assert.equal(hash(bytes),study.rows_sha256);rows+=JSON.parse(bytes.toString()).records.length;}
assert.equal(rows,2009);results.push({case:'All script/style chunks and 25 row snapshots have exact build hashes; 2009 source rows',passed:true});
await exact('/documents/acme.pdf');await exact('/documents/combustion-science-guide.pdf');
const clip=await fetch(base+'/media/flex-2.webm',{headers:{Range:'bytes=0-1023'}});assert.ok([200,206].includes(clip.status));const clipBytes=Buffer.from(await clip.arrayBuffer());const originalClip=await readFile('dist/media/flex-2.webm');assert.equal(hash(clipBytes),hash(clip.status===206?originalClip.subarray(0,1024):originalClip));results.push({case:'Original PDFs and NASA video served unchanged',video_response_status:clip.status,passed:true});
if(!local){
 const headers={Origin:base};
 for(const path of ['/health','/demo-evaluation.json']){const response=await fetch(api+path,{headers});assert.equal(response.status,200);assert.equal(response.headers.get('Access-Control-Allow-Origin'),base);const data=await response.json();if(path==='/health'){assert.equal(data.generation_enabled,false);assert.equal(data.rag_generation_enabled,false);assert.equal(data.retrieval.semantic_enabled,true);}else assert.equal(data.mode,'recorded_private_evaluation');}
 const preflight=await fetch(api+'/v1/rag',{method:'OPTIONS',headers:{Origin:base,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}});assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),base);
 const rejected=await fetch(api+'/v1/rag',{method:'OPTIONS',headers:{Origin:base+'.evil.example'}});assert.equal(rejected.status,403);
 const post=async(path,body)=>{const response=await fetch(api+path,{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(response.status,200,path);assert.equal(response.headers.get('Access-Control-Allow-Origin'),base);return response.json();};
 const rag=await post('/v1/rag',{query:'BASS-II fan calibration airflow',accession:'PSI-25',mode:'auto',limit:6,generate:false});assert.equal(rag.status,'evidence_only');assert.equal(rag.retrieval.mode_used,'hybrid');assert.ok(rag.retrieval.matches.some(m=>m.accession==='PSI-25'&&m.citations.some(c=>c.original_text)));assert.equal(rag.generation.performed,false);
 const comparison=await post('/v1/compare',{test_uids:['PSI-98|PSI-98_Experimental table_SAFFIRE-1.csv|1','PSI-98|PSI-98_Experimental table_SAFFIRE-1.csv|2']});assert.equal(comparison.status,'selected_source_rows');assert.equal(comparison.evidence[0].cells['Percent O2'],'21.5 - 21.7');assert.equal(comparison.evidence[1].cells['Percent O2'],'~ 21.5');assert.equal(comparison.generation_performed,false);
 results.push({case:'Exact flamingo-origin CORS, live hybrid guide evidence, raw S1/S2 comparison, recorded evaluation and paid-generation gates',passed:true});
}
const report={checked_utc:new Date().toISOString(),url:base,scope:local?'Cloudflare local static runtime':'public deployed frontend and existing API',checks:results,new_OpenAI_requests:0,new_embedding_queries:local?0:1,browser_visual_interaction_qa:false};
await writeFile(local?'cloudflare-local-verification.json':'public-deployment-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
