import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true},appType:'custom'});
try{
 const {askResearchGuide}=await server.ssrLoadModule('/src/research-guide.js');
 const fetcher=(url,options)=>fetch(url,{...options,headers:{...options.headers,Origin:'http://localhost:5173'}});
 const cases=[];
 for(const test of [
  {question:'Saffire S1 S2 Percent O2',expected:'PSI-98'},
  {question:'BASS-II fan calibration airflow',scope:'PSI-25',expected:'PSI-25'},
  {question:'FLEX-2 liquid droplet flame extinction',expected:'PSI-68'},
 ]){
  const answer=await askResearchGuide(test.question,{scope:test.scope,fetcher});
  assert.equal(answer.status,'matched');assert.ok(answer.recommendations.some(r=>r.accession===test.expected));
  assert.ok(answer.recommendations.every(r=>r.route.startsWith('investigation/PSI-')&&r.quote&&r.evidenceRoute.startsWith('nasa/')));
  cases.push({...test,mode:answer.mode,recommended:answer.recommendations.map(r=>({accession:r.accession,route:r.route,quote:r.quote,locator:r.locator})),expected_present:true});
 }
 await writeFile('guide-live-verification.json',JSON.stringify({checked_utc:new Date().toISOString(),cases,development_checks_only:true,new_embedding_queries:3,new_OpenAI_requests:0,browser_interaction_verified:false},null,2)+'\n');
 console.log('PASS: three real guide queries return expected source-backed investigation links; no OpenAI generation.');
}finally{await server.close();}
