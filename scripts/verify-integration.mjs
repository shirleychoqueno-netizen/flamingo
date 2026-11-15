import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true},appType:'custom'});
const checks=[];
try{
 globalThis.window={location:{hash:''}};
 const {App}=await server.ssrLoadModule('/src/main.jsx');
 const DocumentReader=(await server.ssrLoadModule('/src/DocumentReader.jsx')).default;
 const {studies}=await server.ssrLoadModule('/src/data.js');
 const reader=renderToStaticMarkup(React.createElement(DocumentReader,{study:studies[0],initialPage:1,onClose:()=>{}}));
 assert.ok(reader.includes('ORIGINAL DOCUMENT'));assert.ok(reader.includes('Search this PDF'));assert.ok(reader.includes('Close reader'));
 for(const route of ['','#home','#explore','#library','#compare','#saved','#pdfs','#document-saved','#type/Investigation','#study/acme','#study/guide','#investigation/PSI-98','#investigation/PSI-68','#investigation/PSI-60','#investigation/UNKNOWN','#rows','#nasa','#nasa/oxygen/PSI-25']){
  window.location.hash=route;
  const html=renderToStaticMarkup(React.createElement(App));
  assert.ok(html.includes('Open AI research guide'),route+': missing research-guide entry');
  assert.ok(html.includes('flamingo'),route+': missing current brand');
  assert.ok(!html.includes('header-guide-button'),route+': redundant header guide');
  assert.ok(!html.includes('Full-text PDF collection (2)'),route+': misleading collection headline');
  assert.ok(!html.includes('Explorar documentos'),route+': untranslated navigation');
  const text=html.replace(/<[^>]*>/g,' ');
  const leftovers=text.match(/\b(?:páginas|Página|documentos|consulta|ensayos|entorno|seleccionados|Configuraciones|condiciones|investigaciones|por definir)\b/gi)||[];
  assert.deepEqual(leftovers,[],route+': untranslated interface copy');
  if(route==='#nasa')assert.equal((html.match(/class="nasa-catalog-row"/g)||[]).length,25);
  if(route===''){assert.ok(html.includes('Small flames.'));assert.ok(html.includes('ASK YOUR RESEARCH GUIDE'));assert.ok(!html.includes('Full-text PDFs (2)'));}
  if(route==='#explore'){assert.equal((html.match(/class="investigation-card"/g)||[]).length,25);assert.ok(html.includes('Source rows available'));assert.ok(!html.includes('Reading room'),'#explore: reading-room shortcut removed');assert.ok(html.includes('Find an investigation by title, topic or accession'),'#explore: search keeps an accessible label');}
  if(route==='#library'){assert.equal((html.match(/class="library-study-code"/g)||[]).length,25);assert.ok(html.includes('Curated reading room'));assert.ok(!html.includes('2 incorporated PDFs'));}
  if(route==='#investigation/PSI-68')assert.ok(html.includes('Inventory gap:'));
  if(route==='#investigation/PSI-60')assert.ok(html.includes('No local source table rows'));
  if(route==='#investigation/UNKNOWN')assert.ok(html.includes('Investigation not found'));
  if(route==='#nasa/oxygen/PSI-25')assert.ok(html.includes('value="PSI-25" selected=""'));
  if(route==='#study/acme')assert.ok(html.includes('Advanced Combustion via Microgravity Experiments'));
  checks.push({route:route||'home',rendered:true});
 }
 const {nasaRequest,comparisonCsv}=await server.ssrLoadModule('/src/nasa-client.js');
 let requests=0;const fixture={status:'evidence_only',retrieval:{matches:[]}};
 assert.deepEqual(await nasaRequest('/v1/rag',{query:'oxygen'},null,async(url,options)=>{requests++;assert.ok(url.startsWith('https://houston-groq-proxy.'));assert.deepEqual(JSON.parse(options.body),{query:'oxygen'});assert.equal(options.headers.Authorization,undefined);return Response.json(fixture);}),fixture);
 assert.equal(requests,1);
 await assert.rejects(nasaRequest('/v1/rag',{query:'oxygen'},null,async()=>Response.json({}, {status:429,headers:{'Retry-After':'60'}})),/Wait 60 seconds/);
 await assert.rejects(nasaRequest('/unapproved',null,null,async()=>{throw new Error('Must not request');}),/Unsupported/);
 const csv=comparisonCsv([{test_uid:'PSI-98|a.csv|1',cells:{'Percent O2':'21.5 - 21.7','Flow':'-0.28','Note':'=formula'},locator:'a.csv:row=1',classification_status:'provisional'},{test_uid:'PSI-98|a.csv|2',cells:{'Percent O2':'~ 21.5'},locator:'a.csv:row=2',classification_status:'provisional'}]);
 assert.ok(csv.includes('"21.5 - 21.7"'));assert.ok(csv.includes('"~ 21.5"'));assert.ok(csv.includes('"-0.28"'));assert.ok(csv.includes("\"'=formula\""));
 checks.push({case:'API scope, no browser credential, no retry, explicit quota error and raw-value CSV',passed:true});
 const {investigations,snapshot,filterInvestigations,catalogRows,rowSelection}=await server.ssrLoadModule('/src/investigation-catalog.js');
 const {fetchSourceRows,filterSourceRows}=await server.ssrLoadModule('/src/source-rows.js');
 assert.equal(investigations.length,25);assert.equal(catalogRows(investigations).length,25);
 assert.equal(filterInvestigations(investigations,{query:'psi-98'})[0].accession,'PSI-98');
 assert.equal(filterInvestigations(investigations,{query:'unavailable-random-value'}).length,0);
 assert.deepEqual(filterInvestigations(investigations,{coverage:'gaps'}).map(s=>s.accession),['PSI-68']);
 const allRows=[];
 for(const study of investigations){
  const bytes=await readFile('public'+study.rows_url);assert.equal(createHash('sha256').update(bytes).digest('hex'),study.rows_sha256);
  const records=await fetchSourceRows(study,null,async()=>Response.json(JSON.parse(bytes.toString())));
  assert.equal(filterSourceRows(records).length,study.available_rows);allRows.push(...records);
 }
 assert.equal(allRows.length,2009);assert.equal(new Set(allRows.map(r=>r.test_uid)).size,2009);
 assert.equal(investigations.reduce((n,s)=>n+s.indexed_fragments,0),3152);
 assert.equal(investigations.reduce((n,s)=>n+s.n_assets,0),52742);
 assert.equal(investigations.reduce((n,s)=>n+s.publications.length,0),364);
 assert.equal(new Set(allRows.map(r=>r.source_filename)).size,22);
 const saffire=allRows.filter(r=>r.accession==='PSI-98');assert.equal(saffire[0].cells['Percent O2'],'21.5 - 21.7');assert.equal(saffire[1].cells['Percent O2'],'~ 21.5');
 assert.equal(filterSourceRows(saffire,{query:'sibal s1'}).length,1);
 assert.equal(filterSourceRows(allRows,{table:saffire[0].source_filename}).length,saffire.length);
 assert.ok(allRows.some(r=>Object.values(r.cells).some(value=>/^-[0-9]/.test(value))),'Signed source values are retained');
 const six=allRows.slice(0,6).map(r=>r.test_uid);assert.equal(rowSelection(six,allRows[6].test_uid).length,6);assert.equal(rowSelection(six,six[0]).length,5);
 await assert.rejects(fetchSourceRows(investigations[0],null,async()=>Response.json({accession:'WRONG',records:[]})),/does not match/);
 await assert.rejects(fetchSourceRows(investigations[0],null,async()=>Response.json({}, {status:503})),/HTTP 503/);
 checks.push({case:'Unified catalog, 25 integrity-checked row snapshots, 2009 distinct rows, 22 tables, coverage filters, selection limit and exact oxygen/signed source strings',passed:true});
 await writeFile('integration-verification.json',JSON.stringify({checked_utc:new Date().toISOString(),checks,browser_verified:false,network_calls_in_this_test:0},null,2)+'\n');
 console.log('PASS: 18 routes; research home; 25 investigations; 2009 exact source rows across 22 tables; filters, scoped search, source provenance, API failures, selection limits and CSV.');
}finally{delete globalThis.window;await server.close();}
