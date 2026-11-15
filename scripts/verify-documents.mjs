import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createServer} from 'vite';
const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true},appType:'custom'});
try{
 const {studies,corpus,searchStudy,searchPages,evidenceRows,configurationRows,answerDocument,csvText}=await server.ssrLoadModule('/src/data.js');
 assert.equal(Object.values(corpus).reduce((s,d)=>s+d.pageCount,0),75);
 assert.equal(evidenceRows(studies).length,47);assert.equal(configurationRows(studies).length,6);
 for(const study of studies){
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync('public'+study.source.url)).digest('hex'),study.document.sha256);
  for(const v of study.variables){
   if(v.value!==null)assert.ok(v.pageNumber>0&&v.pageNumber<=study.document.pageCount,`${study.id}/${v.id}: missing valid page`);
   if(v.anchor)assert.ok(study.document.pages[v.pageNumber-1].text.toLowerCase().includes(v.anchor.toLowerCase()),`${study.id}/${v.id}: source anchor missing`);
  }
  assert.ok(['Investigation','Paper','Test','Video'].includes(study.profile.kind));
  for(const page of [...study.profile.objectivePages,...study.profile.contributionPages])assert.ok(page>0&&page<=study.document.pageCount);
  for(const author of study.profile.authors)assert.ok(study.document.pages[study.profile.authorPage-1].text.includes(author));
  assert.ok(study.profile.objectives.length>100&&study.profile.contribution.length>100);
 }
 const acme=studies[0],guide=studies[1];
 const {taxonomy}=await server.ssrLoadModule('/src/taxonomy.js');
 const {buildVariableCatalog,variableCatalogRows}=await server.ssrLoadModule('/src/variable-catalog.js');
 const {publicationYear,matchesDocumentFilters}=await server.ssrLoadModule('/src/catalogue-filters.js');
 assert.equal(publicationYear(acme),null);assert.equal(publicationYear(guide),'2015');
 assert.ok(matchesDocumentFilters(guide,{kind:'Investigation',year:'2015'}));
 assert.ok(!matchesDocumentFilters(acme,{year:'2015'}));
 assert.ok(matchesDocumentFilters(acme,{year:'undated'}));
 assert.ok(!matchesDocumentFilters(guide,{kind:'Video'}));
 const future={...acme,profile:{...acme.profile,kind:'Paper',publicationDate:'2022-04-03'}};
 assert.ok(matchesDocumentFilters(future,{kind:'Paper',year:'2022'}));
 assert.ok(!matchesDocumentFilters(future,{kind:'Investigation',year:'2022'}));
 const {resourceCollections}=await server.ssrLoadModule('/src/resource-collections.js');
 assert.equal(resourceCollections.length,10);
 assert.ok(studies.every(s=>resourceCollections.some(c=>c.id===s.profile.resourceId)));
 assert.ok(matchesDocumentFilters(guide,{range:{minYear:2015,maxYear:2015,includeUndated:false}}));
 assert.ok(!matchesDocumentFilters(guide,{range:{minYear:2016,maxYear:2026,includeUndated:true}}));
 assert.ok(!matchesDocumentFilters(acme,{range:{minYear:2015,maxYear:2026,includeUndated:false}}));
 assert.ok(matchesDocumentFilters(acme,{range:{minYear:2015,maxYear:2026,includeUndated:true},resource:'nasa-combustion'}));
 assert.ok(!matchesDocumentFilters(acme,{resource:'apollo-1'}));
 assert.ok(matchesDocumentFilters(guide,{resource:'researchers-guide'}));
 assert.ok(!matchesDocumentFilters(guide,{resource:'nasa-combustion'}));
 for(const study of studies){
  const catalog=buildVariableCatalog(study);
  assert.equal(catalog.length,taxonomy.length);
  for(const cat of taxonomy)for(const sub of cat.subcategories)for(const field of sub.variables){
   assert.ok(catalog.find(c=>c.id===cat.id).subcategories.find(s=>s.name===sub.name).fields.some(f=>f.name===field),`${study.id}: missing ${field}`);
  }
  const entries=catalog.flatMap(c=>c.subcategories.flatMap(s=>s.fields.flatMap(f=>f.entries)));
  for(const record of study.variables)assert.ok(entries.some(v=>v.id===record.id),`${study.id}: lost record ${record.id}`);
  for(const entry of entries)if(entry.value!==null&&entry.sourceType==='document'){
   assert.ok(entry.pageNumber>0&&entry.pageNumber<=study.document.pageCount,`${study.id}/${entry.id}: missing source page`);
   if(entry.anchor)assert.ok(study.document.pages[entry.pageNumber-1].text.toLowerCase().replace(/\s+/g,' ').includes(entry.anchor.toLowerCase().replace(/\s+/g,' ')),`${study.id}/${entry.id}: missing anchor ${entry.anchor}`);
  }
  const rows=variableCatalogRows(study);
  assert.ok(rows.some(r=>r.variable==='Relative humidity'&&r.value===null));
  assert.ok(rows.every(r=>r.value!==undefined));
 }
 assert.equal(acme.profile.authors.length,0);assert.equal(acme.profile.publicationDate,null);
 assert.equal(guide.profile.authors.length,6);assert.equal(guide.profile.editorialYear,2015);
 for(const query of ['COMBUSTION','combustion','combustión']){
  assert.equal(studies.filter(study=>searchStudy(study,query).length>0).length,2,`${query}: expected both documents`);
  assert.ok(studies.every(study=>searchPages(study,query).length>0),`${query}: expected source excerpts`);
 }
 assert.ok(searchPages(guide,'niebla de agua',6).some(p=>p.number===26));
 assert.ok(searchPages(guide,'humo partículas',6).some(p=>[26,35].includes(p.number)));
 assert.ok(searchPages(acme,'caudal fuel',5).some(p=>p.number===11));
 assert.equal(searchPages(guide,'palabrainexistentezzz').length,0);
 assert.equal(answerDocument(guide,'palabrainexistentezzz').citations.length,0);
 const bassOxygen=answerDocument(guide,'¿Qué concentración de oxígeno aparece en BASS?');
 assert.equal(bassOxygen.records[0].value,17);assert.ok(bassOxygen.records.every(v=>v.scope.includes('BASS')));assert.equal(bassOxygen.citations[0].number,20);
 const configs=configurationRows(studies);assert.equal(configs.find(c=>c.record_id==='guide-fig7').oxygen_location,'Mixture injected into the burner');
 assert.equal(configs.find(c=>c.record_id==='guide-fig2').flow_speed_cm_s,null);
 assert.equal(configs.find(c=>c.record_id==='guide-fig2').droplet_translation_cm_s,3);
 assert.equal(evidenceRows(studies).find(r=>r.variable==='Cabin detector response time').extracted_value,null);
 assert.ok(csvText([{v:'=formula',x:'a,b"c',missing:null}]).includes('"\'=formula","a,b""c",""'));
 console.log('PASS: 75 pages; 47 evidence records; 6 figure configurations; source hashes and anchors; bilingual retrieval; no-result behavior; CSV escaping and missing values.');
}finally{await server.close();}
