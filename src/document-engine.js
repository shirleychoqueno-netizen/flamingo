import {taxonomy} from './taxonomy';
export const normalize = value => String(value??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/o₂/g,'oxygen');
const stop=new Set('que como para con del los las una por cual hay sobre necesito quiero investigaciones papers estudios base lunar marciana nave espacial estacion rover presurizado entorno un el en de la and usa usar este esta puede puedo son sus segun cuales me dime es se lo al tiene obtener saber what which how with from this that the and for are does can limits limitations'.split(' '));
const groups=[['oxigeno','oxigen','oxygen','oxidizer','o2'],['presion','pressure'],['humo','smoke','aerosol'],['hollin','soot','sooting'],['velocidad','velocity','speed'],['ventilacion','ventilation','airflow'],['flujo','flow','caudal'],['fuel','fuel'],['extincion','extinction','extinguish'],['supresion','suppression','suppressant'],['gota','gotas','droplet','droplets'],['agua','water'],['niebla','mist'],['nitrogeno','nitrogen'],['temperatura','temperature'],['esfera','esferica','spherical','sphere'],['diametro','diameter'],['sensor','sensores','detector','instrument'],['gravedad','gravity'],['fria','frio','cool'],['particulas','particle','particulate'],['materiales','materials'],['etileno','ethylene'],['metano','methane']];
export function queryTokens(query){return [...new Set(normalize(query).split(/[^a-z0-9]+/).filter(w=>w.length>2&&!stop.has(w)))];}
const matches=(text,token)=>(groups.find(g=>g.includes(token))||[token]).some(t=>text.includes(t));
export function searchStudy(study,query){const text=normalize([study.title,study.acronym,study.summary,study.tags.join(' '),...study.variables.map(v=>`${v.name} ${v.value??''} ${v.scope}`),...study.document.pages.map(p=>p.text)].join(' '));return queryTokens(query).filter(t=>matches(text,t));}
export function searchPages(study,query,limit=4){
  const tokens=queryTokens(query);if(!tokens.length)return [];
  return study.document.pages.map(page=>{
    const segments=page.text.replace(/\s+/g,' ').split(/(?<=[.!?])\s+(?=[A-Z•])/g);
    const ranked=segments.map(text=>({text:text.trim(),score:tokens.filter(t=>matches(normalize(text),t)).length})).filter(s=>s.score>0).sort((a,b)=>b.score-a.score);
    return {...page,score:ranked[0]?.score||0,excerpt:ranked.slice(0,2).map(s=>s.text).join(' ').slice(0,1100)};
  }).filter(p=>p.score>0).sort((a,b)=>b.score-a.score||a.number-b.number).slice(0,limit);
}
export function csvText(rows){if(!rows.length)return '';const cell=v=>{let text=v==null?'':String(v);if(/^[=+@-]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';};return '\uFEFF'+[Object.keys(rows[0]),...rows.map(r=>Object.values(r))].map(row=>row.map(cell).join(',')).join('\r\n');}
export function evidenceRows(selection){return selection.flatMap(s=>s.variables.map(v=>({document_id:s.id,document:s.title,is_example:false,category:taxonomy.find(c=>c.id===v.category).name,subcategory:v.subcategory,variable:v.name,extracted_value:v.value,unit:v.unit,data_kind:v.kind,pdf_page:v.pageNumber,scope:v.scope,note:v.note,source:s.source.url+(v.pageNumber?`#page=${v.pageNumber}`:''),document_sha256:s.document.sha256,original_test_id:null,review:'Initial extraction reviewed against cited pages'})));}
export function configurationRows(selection){return selection.flatMap(s=>s.configurations.map(c=>({record_id:c.id,document_id:s.id,investigation:c.experiment,record_type:'Illustrated configuration; no original test identifier',figure:c.figure,pdf_page:c.pageNumber,fuel:c.fuel,geometry:c.geometry,oxygen_percent:c.oxygen??null,oxygen_location:c.id==='guide-fig7'?'Mixture injected into the burner':'Example atmosphere',co2_percent:c.co2??null,nitrogen_percent:c.nitrogen??null,argon_percent:c.argon??null,pressure_atm:c.pressure??null,diameter_mm:c.size??null,flow_speed_cm_s:c.flow??null,droplet_translation_cm_s:c.translation??null,mass_flow_mg_s:c.massFlow??null,note:c.note,source:`${s.source.url}#page=${c.pageNumber}`,predictive_result:null})));}
export function answerDocument(study,question){
  const intent=normalize(question);
  if(/variables|extract|categories|extraer|categorias/.test(intent))return {text:`This profile contains ${study.variables.length} records across five categories. Each retains its type, scope and page. Figure configurations are exported separately.`,records:study.variables.filter(v=>v.value!==null).slice(0,4),citations:[]};
  if(/limits|limitations|lunar base|martian base|applicable|limites|limitaciones|base lunar|base marciana|aplicable/.test(intent))return {text:study.limitation,records:[],citations:[{number:study.id==='acme'?1:23,excerpt:study.document.pages[(study.id==='acme'?1:23)-1].text}]};
  if(/objective|summary|summarize|objetivo|resumen|resume/.test(intent))return {text:study.summary,records:[],citations:[{number:study.id==='acme'?1:3,excerpt:study.document.pages[(study.id==='acme'?1:3)-1].text}]};
  const tokens=queryTokens(question);
  const target=intent.match(/\b(bass|flex-2|flex|sofie|mdca|same|e-field|s-flame|bre|cld)\b/)?.[0];
  let candidates=study.variables.filter(v=>v.value!==null);
  if(target&&candidates.some(v=>normalize(v.scope).includes(target)))candidates=candidates.filter(v=>normalize(v.scope).includes(target));
  const topics=tokens.filter(t=>groups.some(g=>g.includes(t)));
  const direct=v=>normalize(`${v.name} ${v.value??''} ${v.subcategory}`);
  if(topics.length&&candidates.some(v=>topics.some(t=>matches(direct(v),t))))candidates=candidates.filter(v=>topics.some(t=>matches(direct(v),t)));
  const records=candidates.map(v=>({...v,score:tokens.reduce((score,t)=>score+(matches(direct(v),t)?3:0)+(matches(normalize(v.scope),t)?2:0)+(matches(normalize(v.note),t)?1:0),0)})).filter(v=>v.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
  const citedPages=new Map();
  for(const v of records)if(v.pageNumber&&!citedPages.has(v.pageNumber))citedPages.set(v.pageNumber,{number:v.pageNumber,excerpt:study.document.pages[v.pageNumber-1].text});
  for(const page of searchPages(study,question,2))if(!citedPages.has(page.number))citedPages.set(page.number,page);
  const citations=[...citedPages.values()].slice(0,2);
  return {text:citations.length||records.length?'These records and excerpts match your query. Original text is retained in English; review scope and source pages before combining values.':'No matching evidence found. Try an experiment name or variable. This is local PDF retrieval, not a generative answer.',records,citations};
}
