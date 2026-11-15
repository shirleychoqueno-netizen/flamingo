import corpus from './documents.json';
import acmeBase from './acme-extraction.json';
import {documentProfiles} from './document-profiles';
export { corpus };
const v = (id,category,subcategory,name,value,unit,kind,pageNumber,scope,note,anchor='') => ({id,category,subcategory,name,value,unit,kind,pageNumber,page:pageNumber?`p. ${pageNumber}`:'—',scope,note,anchor});
const acme = {
  ...acmeBase, document:corpus.acme, fuelStates:['Gaseous'], type:'Project document',
  source:{label:'PDF ACME · 19 pages',url:corpus.acme.url,credit:'User-supplied PDF. Full text indexed with an initial structured extraction.'},
  limitation:'Historical descriptive document, not an experimental database. Page 1 first mentions five and then six investigations; that discrepancy is retained. Its dates and plans do not describe the current state. It does not validate lunar or Martian gravity predictions.',
  configurations:[],
  variables:acmeBase.variables.map(x=>({...x,pageNumber:Number(x.page.match(/\d+/)?.[0])||null,scope:x.id==='soot'?'CLD · resultados citados':'ACME · hardware description and objectives'})),
};
acme.variables.push(
  v('duration','environment','Confinement','Typical planned duration','0.5–2','min','Plan experimental',18,'ACME · operaciones','Planned duration, not a series of observed times.','0.5-2'),
  v('mesh-distance','environment','Confinement','Electrode mesh position','35 o 50','mm','Equipment configuration',18,'E-FIELD','Distancias aproximadas al quemador; el voltaje no equivale a intensidad de campo en V/m.','~35'),
  v('gases','fuel','Identity and composition','Combustibles s-Flame','Hydrogen, methane and ethylene','','Experimental design',6,'s-Flame','H₂ and CH₄ for non-sooting flames; ethylene for sooting flames.','hydrogen and methane'),
  v('bre','fuel','Sample geometry','BRE emulation burner','Placa porosa plana','','Experimental design',2,'BRE','Emulates solid and liquid fuels using gaseous fuel.','flat porous burner'),
  v('extinction','fire','Extinction','Extinction mechanisms investigated','Radiativo and convectivo','','Objective experimental',6,'s-Flame','No numerical limits published here.','radiative and convective'),
  v('cool','fire','Extinction','Cool flames investigadas','Quasi-steady spherical diffusion','','Objective experimental',6,'CFI-G','Proposed observations and kinetic-model comparisons; not a measured temperature.','quasi-steady'),
  v('mfc','evidence','Instrumentation','Mass-flow controllers',3,'','Equipment capability',11,'Gas supply','No equivale a tres mediciones independientes de cada ensayo.','three mass flow'),
  v('oh','evidence','Instrumentation','Length de onda OH*',310,'nm','Equipment capability',14,'LLL-UV','Filtro con banda de 10 nm.','310 nm'),
  v('ch','evidence','Instrumentation','Length de onda CH*',430,'nm','Equipment capability',14,'Filtered camera','10 nm bandpass filter; additional correction at 450 nm.','430-nm'),
  v('sic','evidence','Instrumentation','SiC filaments for pyrometry',5,'','Equipment capability',15,'TFP','Temperature diagnostics for flames without visible soot.','5 silicon carbide'),
  v('radiometer','evidence','Instrumentation','Radiometer spectral range','0.2–11','µm','Equipment capability',17,'Termopilas','Nominal equipment range, not measurement uncertainty.','0.2-11'),
  v('species','fire','Consumption and products','Especies analizadas','O₂, N₂, CO₂, CO and combustible','','Measurement method',18,'Chromatography','Before-and-after analysis; individual test concentrations are not published here.','chromatograph'),
);

const guide={
  id:'guide',acronym:'NASA GUIDE',title:'A Researcher’s Guide to: Combustion Science',
  subtitle:'Fundamentals, investigations and reduced-gravity facilities',type:'Research guide · 2015',
  platform:'ISS · CIR · MSG · drop towers',gravity:'Microgravity and 1 g references',
  fuelState:'Solid · liquid · gaseous',fuelStates:['Solid','Liquid','Gaseous'],
  tags:['FLEX / FLEX-2','BASS','ACME','SAME','Detection','Suppression'],document:corpus.guide,
  summary:'A 56-page guide to droplet combustion, gaseous flames, solid flammability and fire safety. It brings together historical findings, proposed projects and facilities, including specific conditions in figure captions.',
  relevance:'Relates prevention, detection and suppression to oxygen, pressure, flow, materials and combustion products. Includes BASS and FLEX examples and aerosol characterization to define research variables.',
  limitation:'Historical guide covering several investigations, not a single test. Extracted configurations belong to different experiments. SoFIE plans and facility status reflect that edition, not current verification. This guide alone does not provide a validated prediction dataset.',
  application:'Helps select variables for researching materials, smoke detection and extinguishing agents. Illustrated conditions support finding original sources and must not be pooled as measurements from one campaign.',
  source:{label:'NASA · NP-2015-10-034-JSC · 56 pages',url:corpus.guide.url,credit:'User-supplied PDF. Pages follow the file numbering. Full text is available.'},
  methods:[['MDCA en CIR','Gotas de 1–5 mm; hasta 40 % O₂; rango de 0–3 atm','p. 12'],['BASS image sequences','Growth, flame-to-sample separation and solid regression','p. 20'],['SAME and DAFT','Particle size de humo and aerosoles de fondo','p. 26'],['SAMS and MAMS','Vibratory and quasi-steady acceleration','p. 43'],['CIR and MSG','Instalaciones and recintos con funciones distintas','pp. 44–45']],
  variables:[
    v('gravity','environment','Gravity','Environments described','Microgravity and comparison with 1 g','','Review context',9,'Guide · figure 1','Brings together different facilities and experiments.','comparison flames'),
    v('mdca-pressure','environment','Atmosphere','MDCA operating pressure','0–3','atm','Equipment capability',12,'MDCA','Apparatus range, not the pressure of each test.','0-3 atm'),
    v('mdca-oxygen','environment','Atmosphere','MDCA maximum oxygen',40,'% vol.','Equipment capability',12,'MDCA','Apparatus capability; distinguish it from figure conditions.','40 percent'),
    v('flex-oxygen','environment','Atmosphere','FLEX configuration oxygen',21,'% vol.','Illustrated condition',12,'FLEX · figure 2','70 % CO₂, 21 % O₂ and balance N₂; 3 cm/s is droplet translation.','70 percent'),
    v('flex2-pressure','environment','Atmosphere','FLEX-2 configuration pressure',2.4,'atm','Illustrated condition',12,'FLEX-2 · figure 3','Ethanol and 30 % O₂; comparison of several diluents.','2.4 atm'),
    v('bass-oxygen','environment','Atmosphere','Oxygen in the BASS sequence',17,'% vol.','Illustrated condition',20,'BASS · figure 11','2 cm acrylic sphere, 12 cm/s flow.','17 percent oxygen'),
    v('bass-flow','environment','Ventilation','Velocidad de flujo BASS',12,'cm/s','Illustrated condition',20,'BASS · figure 11','La foto de la p. 2 indica 10 cm/s and corresponde a otra imagen; no mezclar.','12 cm/s'),
    v('fabric-flow','environment','Ventilation','Variable flow over fabric','10 a <1','cm/s','Serie ilustrada',20,'BASS · figure 12','Flujo opuesto reducido por escalones; no constante.','less than 1'),
    v('sofie-oxygen','environment','Atmosphere','Planned SoFIE oxygen','10–40','% vol.','Plan experimental',19,'SoFIE · edition design','No convertir un rango planificado en resultado ejecutado.','10 percent to 40'),
    v('sofie-pressure','environment','Atmosphere','Planned SoFIE pressure','0.2–1.5','atm','Plan experimental',19,'SoFIE · edition design','Mantener separado de BASS and FLEX.','0.2 and 1.5'),
    v('cir-volume','environment','Confinement','Volumen nominal CIR',100,'L','Equipment capability',44,'CIR · nominal chamber','No equivale al volumen libre de 90 L con inserto ACME.','100-liter'),
    v('msg-volume','environment','Confinement','Volumen de trabajo MSG',255,'L','Equipment capability',45,'MSG · recinto de trabajo','A different enclosure from the CIR chamber.','255-liter'),
    v('fuel','fuel','Identity and composition','Combustibles cubiertos','Liquids, solids and gases','','Review context',6,'Guide · contents','Each family has its own conditions and geometries.'),
    v('droplet-size','fuel','Sample geometry','Diameter de gota admitido MDCA','1–5','mm','Equipment capability',12,'MDCA','Gotas libres o soportadas por fibra.','1 to 5 mm'),
    v('bass-size','fuel','Sample geometry','Acrylic sphere diameter',2,'cm','Illustrated condition',20,'BASS · figure 11','Original 2 cm, equivalente a 20 mm.','2-cm diameter'),
    v('ethylene-flow','fuel','Preparation','Ethylene mass flow rate',1.51,'mg/s','Illustrated condition',17,'Flame Design · figure 6','100 % ethylene into air at atmospheric pressure in a drop tower.','1.51 mg/s'),
    v('spread','fire','Spread and stability','Spread quantities','Growth, flame-to-sample distance and regression','','Observation method',20,'BASS · figure 11','No digitized results table is available here.','regression rate'),
    v('cool','fire','Extinction','Combustion after visible extinction','Lower-temperature cool flame','','Summarized finding',33,'FLEX · gotas de alcanos','The disappearance of the visible flame does not prove complete extinction.','cool flame'),
    v('water-mist','safety','Suppression','Suppression agent studied','Niebla de agua','','Investigation de seguridad',26,'Mist','Variables include droplet diameter and water concentration; no universal dose.','water droplet diameter'),
    v('nitrogen','safety','Suppression','Agente aplicado en BASS','Nitrogen','','Experimental method',22,'BASS','A localized jet can entrain oxygen and strengthen the flame; this is a finding, not an operating instruction.','entrainment of oxygen'),
    v('smoke-size','safety','Detection','Smoke characterization','Particle-size distribution','','Research variable',26,'SAME','DAFT estudia aerosoles de fondo; SAME, humo de materiales.','particle-size distribution'),
    v('detector-signatures','safety','Detection','Combined detection signals','Particles and chemical species','','Technology application described',35,'Detection development','No numerical false-alarm rate is published in this summary.','simultaneously'),
    v('sams','evidence','Instrumentation','Acceleration measurement','SAMS and MAMS','','Measurement method',43,'ISS','MAMS mide perturbaciones de frecuencia inferior a 0,01 Hz.','0.01 hertz'),
    v('interval','evidence','Instrumentation','BASS image interval',1.5,'s','Recording configuration',20,'BASS · figure 11','Approximate; do not confuse with a 30 fps camera.','1.5 sec'),
    v('uncertainty','evidence','Quality and limits','Configuration uncertainty',null,'','Not reported',null,'Pies de figuras','The extracted captions do not publish uncertainty per configuration.'),
  ],
  configurations:[
    {id:'guide-fig2',experiment:'FLEX',figure:'2',pageNumber:12,fuel:'n-heptane',geometry:'Droplet',oxygen:21,co2:70,nitrogen:9,translation:3,note:'N₂ calculated as balance 100−70−21. 3 cm/s is droplet translation; diameter and pressure are not specified in the caption.'},
    {id:'guide-fig3',experiment:'FLEX-2',figure:'3',pageNumber:12,fuel:'Ethanol',geometry:'Droplet',oxygen:30,pressure:2.4,note:'Comparison of several diluents; do not treat as a single composition.'},
    {id:'guide-fig6',experiment:'Flame Design',figure:'6',pageNumber:17,fuel:'Ethylene 100 %',geometry:'Porous spherical burner',massFlow:1.51,note:'Air at atmospheric pressure with no numerical pressure in the caption. 2.2 s drop tower.'},
    {id:'guide-fig7',experiment:'s-Flame',figure:'7',pageNumber:17,fuel:'Propane 25 %',geometry:'Porous spherical burner',oxygen:2,nitrogen:24,argon:49,note:'2 % O₂ belongs to the mixture injected by the burner, not to the chamber atmosphere.'},
    {id:'guide-fig11',experiment:'BASS',figure:'11',pageNumber:20,fuel:'Acrylic',geometry:'Sphere',oxygen:17,size:20,flow:12,note:'Original diameter 2 cm, normalized to 20 mm. Photos ~1.5 s apart; results were not digitized.'},
    {id:'guide-fig12',experiment:'BASS',figure:'12',pageNumber:20,fuel:'Cotton-fiberglass fabric',geometry:'20 mm wide strip',flow:'10 to <1',note:'Stepped opposed flow. Photos every 1.25 s; total burning time 90 s according to the caption.'},
  ],
};
export const studies=[acme,guide].map(study=>({...study,profile:documentProfiles[study.id]}));
