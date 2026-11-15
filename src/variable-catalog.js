import {taxonomy} from './taxonomy';

// Explicit associations avoid matching a hardware limit to a trial measurement.
const recordFields={
 acme:{gravity:'Gravity level',volume:'Free volume',field:'Applied electric field','oxygen-trials':'O₂ concentration',fuel:'Physical state',gases:'Fuel name',bre:'Shape',soot:'Soot',cool:'Cool flames',detector:'Response time',camera:'Sampling frequency',radiometer:'Range',uncertainty:'Uncertainty'},
 guide:{gravity:'Gravity level','mdca-pressure':'Total pressure','mdca-oxygen':'O₂ concentration','flex-oxygen':'O₂ concentration','flex2-pressure':'Total pressure','bass-oxygen':'O₂ concentration','bass-flow':'Air speed','fabric-flow':'Air speed','sofie-oxygen':'O₂ concentration','sofie-pressure':'Total pressure',fuel:'Physical state','droplet-size':'Diameter','bass-size':'Diameter',cool:'Cool flames','water-mist':'Extinguishing agent',nitrogen:'Extinguishing agent','smoke-size':'Detected variable','detector-signatures':'Detected variable',sams:'Sensor',uncertainty:'Uncertainty'},
};
// These notes are qualitative unless an explicit value/unit is supplied.
// A page anchor is checked by scripts/verify-documents.mjs.
const e=(category,field,value,pageNumber,kind,scope,anchor,note='',unit='')=>({category,field,value,pageNumber,kind,scope,anchor,note,unit,sourceType:'document'});
const supplemental={
 acme:[
  e('environment','Residual acceleration','Measurement mediante SAMS-II en la ISS',18,'Measurement method','ACME / ISS','SAMS-II','The measurement system is identified; numerical acceleration per test is not supplied here.'),
  e('environment','Diluent gas','Helium, CO₂ and nitrogen',11,'Equipment capability','Gas supply','helium or carbon dioxide','The supply allows fuel or oxidizer dilution, not both simultaneously.'),
  e('environment','Flow regime','Laminar and no premezclado',1,'Contexto experimental','ACME','laminar gaseous non-premixed','Equipment capability for premixed mixtures does not imply use in the described experiments.'),
  e('environment','Boundary conditions','Constant-volume chamber; pressure increase is limited',18,'Plan experimental','Operaciones ACME','constant volume','This does not mean constant pressure is maintained.'),
  e('fuel','Composition','Mezclas de fuel and gas inerte',6,'Plan experimental','s-Flame','fuel/inert gas mixture','Composition changes across investigations and tests; there is no single project mixture.'),
  e('fuel','Shape','Porous spherical burner',6,'Experimental design','s-Flame / CFI-G','porous spherical burner'),
  e('fuel','Support','Burners mounted along the chamber axis',11,'Equipment configuration','ACME','on the chamber axis'),
  e('fire','Ignition source','Retractable resistance-heated igniter',11,'Equipment capability','ACME','resistively heated igniter'),
  e('fire','Flame temperature','Color-ratio pyrometry, SiC filaments and thermocouples',15,'Measurement method','ACME diagnostics','Thin Filament Pyrometry','The document describes methods; numerical temperatures per test are not available here.'),
  e('fire','Oscillation','Investigar inestabilidades pulsantes and su inicio',6,'Objective experimental','s-Flame','pulsating instabilities','This is not a measured amplitude or frequency.'),
  e('fire','CO','Species included in chromatography analysis',18,'Measurement method','ACME','chromatograph','No per-test concentration is recorded in this profile.'),
  e('fire','CO₂','Species included in chromatography analysis',18,'Measurement method','ACME','chromatograph','No per-test concentration is recorded in this profile.'),
  e('safety','Safety function','Fire prevention and spacecraft material screening',1,'Objective experimental','ACME','screening and selection of materials'),
  e('safety','Equipment informed by the finding','Material flammability evaluation methods',2,'Objective experimental','BRE','existing flammability test methods','The method is assessed; no safety equipment is certified.'),
  e('evidence','Modified variables','Diluents in the fuel and atmosphere',6,'Plan experimental','s-Flame','various inert diluents','Retain the investigation and injection side for each mixture.'),
  e('evidence','Constant variables','Constant chamber volume, approximately 90 L',18,'Plan experimental','ACME','constant volume'),
  e('evidence','Comparison group','Resultados CLD en microgravedad and gravedad normal',4,'Summarized finding','CLD','five to eight','Do not generalize this comparison to all ACME experiments.'),
  e('evidence','Measured quantity','Visible imaging, CH*/OH* emission, temperature and soot volume fraction',12,'Equipment capability','Sistemas de imagen ACME','soot volume fraction'),
  e('evidence','Resolution','1360 × 1024 pixels; 12 bits',13,'Equipment capability','Digital color camera','1360','Camera specification, not result uncertainty.'),
  e('evidence','Calibration','In-flight characterization with a TFP array including platinum wire',16,'Characterization method','Soot volume fraction','platinum wire','The text does not supply calibration uncertainty here.'),
  e('evidence','Application domain','Llamas gaseosas laminares no premezcladas en microgravedad',1,'Contexto experimental','ACME','laminar gaseous non-premixed'),
 ],
 guide:[
  e('environment','Residual acceleration','Measurement vibratoria con SAMS and cuasiestacionaria con MAMS',43,'Measurement method','ISS','tri-axis accelerometers','Residual acceleration per test is not published here.'),
  e('environment','Diluent gas','N₂, CO₂, helium or xenon',12,'Experimental design','FLEX','helium or xenon','The diluents belong to different configurations.'),
  e('environment','Flow direction','Flujo opuesto',20,'Illustrated condition','BASS · figure 12','opposed flow'),
  e('fuel','Fuel name','n-heptano and metanol',12,'Experimental design','FLEX','heptane and methanol'),
  e('fuel','Fuel name','Etanol',12,'Illustrated condition','FLEX-2 · figure 3','ethanol burning'),
  e('fuel','Fuel name','Acrylic and cotton-fiberglass fabric',20,'Condiciones ilustradas','BASS · figuras 11 and 12','cotton-fiberglass'),
  e('fuel','Composition','70 % CO₂, 21 % O₂ and balance N₂ in the atmosphere',12,'Illustrated condition','FLEX · figure 2','70 percent carbon dioxide','Calculated balance N₂ is 9 %; it is not combined with the s-Flame burner gases.'),
  e('fuel','Shape','Liquid droplet',12,'Illustrated condition','FLEX / FLEX-2','droplet'),
  e('fuel','Shape','Esfera and tira de tela',20,'Condiciones ilustradas','BASS · figuras 11 and 12','acrylic sphere'),
  e('fuel','Support','Gotas libres o sostenidas por fibra',12,'Equipment capability','MDCA','fiber supported'),
  e('fire','Flammability criterion','Comparison with NASA-STD-6001 Test 1 and upward spread at 1 g',22,'Objective described in the guide','SoFIE / flammability correlation','NASA-STD-6001','Historical reference from this edition, not current verification of the standard.'),
  e('fire','Oxygen limit','Study the flammability limit when adding inert gases',12,'Objective experimental','FLEX','flammability limit','A decrease in reduced gravity is summarized, without a universal numerical limit.'),
  e('fire','Spread rate','Flame response and spread are observed as flow changes',20,'Observation method','BASS · figure 12','spread rate','Spread speed has not been digitized from the photographs.'),
  e('fire','Oscillation','Near-extinction oscillations in candles and droplets',33,'Summarized finding','Estudios de estabilidad','flame oscillations','The guide covers distinct studies; there is no single frequency.'),
  e('fire','Soot','Soot formation is delayed as O₂ decreases from 21 % to 17 %',20,'Hallazgo descrito en figure','BASS · figure 11','soot formation is delayed'),
  e('fire','Particle size','Smoke size distributions from materials',26,'Research variable','SAME','particle-size distribution','No extracted numerical distribution is included.'),
  e('safety','Detector type','Device combining particles and chemical species',35,'Technology development described','Detection de incendios','chemical species simultaneously'),
  e('safety','False alarms','Improved false-alarm rejection in the described joint tests',35,'Hallazgo cualitativo resumido','Detection device / FAA','outperformed','Rejection rates or percentages are not published in this summary.'),
  e('safety','Location','The effect depends on geometry, distance and scattering angle',22,'Experimental consideration','Suppression en microgravedad','dispersion angle','No universal discharge location is defined.'),
  e('safety','Safety function','Prevention, detection and suppression in crewed habitats',35,'Review context','Seguridad contra incendios','mandatory suppression systems'),
  e('safety','Equipment informed by the finding','Portable water-mist extinguishers and future smoke detectors',26,'Technology development described','Mist / SAME / DAFT','portable fire extinguishers','The description reflects the time of the guide.'),
  e('safety','Validation evidence','Joint FAA tests: event detection and false-alarm rejection',35,'Qualitative validation described','Detection device','Federal Aviation','No numerical performance matrix is supplied.'),
  e('safety','Transfer limitations','Inert suppressants do not provide the same margin in reduced gravity as in 1 g',12,'Summarized finding','FLEX','same margin of safety','Requires the original study conditions; this is not an operational dose.'),
  e('evidence','Modified variables','Air speed; nitrogen applied to selected flames',22,'Experimental design','BASS','airflow speed is the main variable'),
  e('evidence','Constant variables','In the comparative hypothesis: equal pressure, O₂ and temperature',21,'Experimental hypothesis','BASS','other conditions being identical','This does not mean all tests in the guide share those conditions.'),
  e('evidence','Comparison group','Material in microgravity compared with the same material in normal gravity',21,'Experimental hypothesis','BASS','same material in normal gravity'),
  e('evidence','Application domain','Reduced-gravity combustion and spacecraft and human-habitat safety',9,'Review context','NASA GUIDE','human habitats'),
 ],
};

export function buildVariableCatalog(study){
 const groups=taxonomy.map(c=>({...c,subcategories:c.subcategories.map(s=>({...s,fields:s.variables.map(name=>({name,entries:[],additional:false}))}))}));
 const add=(category,subcategory,name,entry)=>{
  const sub=groups.find(c=>c.id===category)?.subcategories.find(s=>s.name===subcategory);
  if(!sub)throw new Error(`Unknown subcategory ${category}/${subcategory}`);
  let field=sub.fields.find(f=>f.name===name);
  if(!field){field={name,entries:[],additional:true};sub.fields.push(field);}
  field.entries.push(entry);
 };
 for(const record of study.variables){
  add(record.category,record.subcategory,recordFields[study.id]?.[record.id]||record.name,{...record,sourceType:'document'});
 }
 for(const [index,entry] of (supplemental[study.id]||[]).entries()){
  const sub=taxonomy.find(c=>c.id===entry.category)?.subcategories.find(s=>s.variables.includes(entry.field));
  if(!sub)throw new Error(`Unknown field ${entry.category}/${entry.field}`);
  add(entry.category,sub.name,entry.field,{...entry,id:`supplement-${index}`,name:entry.field});
 }
 const meta=(field,value,note='')=>add('evidence','Traceability',field,{id:`metadata-${field}`,name:field,value,unit:'',kind:'Catalogue metadata',scope:study.acronym,note,pageNumber:null,sourceType:'catalogue'});
 meta('DOI or URL',study.source.url,'Link to the incorporated original PDF; no unverified DOI was assigned.');
 meta('Document',study.title);
 meta('Page',`${study.document.pageCount} pages in the PDF file`);
 add('evidence','Experimental design','Objective',{id:'profile-objective',name:'Objective',value:study.profile.objectives,unit:'',kind:'Document synthesis',scope:study.profile.objectiveContext,pageNumber:study.profile.objectivePages[0],sourceType:'document'});
 for(const [index,[name,value,page]] of study.methods.entries())add('evidence','Instrumentation','Sensor',{id:`method-${index}`,name,value,unit:'',kind:'Instrumentation described',scope:study.acronym,pageNumber:Number(page.match(/\d+/)?.[0])||null,sourceType:'document'});
 return groups;
}

export function variableCatalogRows(study){
 return buildVariableCatalog(study).flatMap(c=>c.subcategories.flatMap(s=>s.fields.flatMap(f=>(f.entries.length?f.entries:[{value:null,unit:'',kind:'No extracted data',scope:'',pageNumber:null,note:'Field without a value in the available extraction; this does not prove absence from the PDF.',sourceType:'catalogue'}]).map(v=>({document:study.title,category:c.name,subcategory:s.name,variable:f.name,record:v.name||f.name,value:v.value,unit:v.unit,data_kind:v.kind,scope:v.scope,pdf_page:v.pageNumber,note:v.note||'',provenance:v.sourceType,source:study.source.url+(v.pageNumber?`#page=${v.pageNumber}`:'')})))));
}
