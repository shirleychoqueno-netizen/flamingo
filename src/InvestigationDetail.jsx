import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,Search,Bookmark,Columns2,Download,Info,Sparkles,Database,Layers,Files,HardDrive,BookOpen,FlaskConical,Check,Plus} from 'lucide-react';
import {StudyOrb,Chip,Kpi,Meter,CompareToggle,lookFor,fuelLook,platformLook,axisLook} from './investigation-visuals';
import {investigations,evidenceRoute} from './investigation-catalog';
import {CoverageBadges} from './InvestigationExplorer';
import {fetchSourceRows,filterSourceRows} from './source-rows';
import {CellTiles,fieldLook,rowTitle} from './AllRecords';
import './nasa.css';
/* Charts of the real measured values across this investigation's tests. */
const num=v=>{const m=String(v??'').replace(',', '.').match(/-?\d+(\.\d+)?/);return m?parseFloat(m[0]):NaN;};
function chartFields(records){
 const keys=[...new Set(records.flatMap(r=>Object.keys(r.cells)))];
 const picked=[],kinds=new Set();
 for(const k of keys){
  const look=fieldLook(k);if(look.kind==='Value'||look.kind==='Fuel'||kinds.has(look.kind)||/#\s*$|date|gmt/i.test(k))continue;
  const vals=records.map(r=>num(r.cells[k])).filter(Number.isFinite);
  if(vals.length<Math.max(3,records.length*.4)||new Set(vals).size<2)continue;
  picked.push({key:k,look,vals});kinds.add(look.kind);if(picked.length>=3)break;
 }
 return picked;
}
function RowCharts({records,study}){
 const charts=chartFields(records);
 if(!charts.length)return null;
 return <section className="row-charts" aria-label="Measured values across tests"><div className="row-charts-head"><span className="home-eyebrow"><span/>WHAT THE TESTS MEASURED</span><small>Each bar is one test from {study.acronym||study.accession}. Values exactly as written in the NASA table.</small></div><div className="row-charts-grid">{charts.map(({key,look,vals})=>{const min=Math.min(...vals),max=Math.max(...vals),avg=vals.reduce((a,b)=>a+b,0)/vals.length,shown=vals.slice(0,80),{Icon,color}=look;const fmt=v=>Math.abs(v)>=100?Math.round(v).toLocaleString('en-US'):v.toLocaleString('en-US',{maximumFractionDigits:3});return <article key={key} className="row-chart" style={{'--f':color}}>
  <header><span className="cell-icon"><Icon size={15}/></span><div><strong>{look.kind}</strong><small title={key}>{key}</small></div></header>
  <svg viewBox={`0 0 ${shown.length*6} 60`} preserveAspectRatio="none" role="img" aria-label={`${key}: from ${fmt(min)} to ${fmt(max)}`}>{shown.map((v,i)=>{const h=max===min?30:6+((v-min)/(max-min))*52;return <rect key={i} x={i*6+.8} y={60-h} width={4.4} height={h} rx={1.5}/>;})}<line x1="0" x2={shown.length*6} y1={60-(max===min?30:6+((avg-min)/(max-min))*52)} y2={60-(max===min?30:6+((avg-min)/(max-min))*52)}/></svg>
  <dl><div><dt>Min</dt><dd>{fmt(min)}</dd></div><div><dt>Average</dt><dd>{fmt(avg)}</dd></div><div><dt>Max</dt><dd>{fmt(max)}</dd></div><div><dt>Tests</dt><dd>{vals.length}</dd></div></dl>
 </article>;})}</div></section>;
}
function SourceRows({study,selected,onToggle,navigate}){
 const [records,setRecords]=useState(null),[error,setError]=useState(''),[query,setQuery]=useState(''),[table,setTable]=useState('all'),[type,setType]=useState('all'),[page,setPage]=useState(0),[retry,setRetry]=useState(0);const active=useRef(null);
 useEffect(()=>{const controller=new AbortController();active.current=controller;setRecords(null);setError('');fetchSourceRows(study,AbortSignal.any([controller.signal,AbortSignal.timeout(35000)])).then(value=>{if(!controller.signal.aborted)setRecords(value);}).catch(e=>{if(!controller.signal.aborted)setError(e.message);});return()=>controller.abort();},[study,retry]);
 useEffect(()=>setPage(0),[query,table,type]);
 const visible=filterSourceRows(records||[],{query,table,type}),pageCount=Math.ceil(visible.length/20),currentPage=Math.min(page,Math.max(0,pageCount-1));
 return <section className="source-row-browser"><div className="section-header"><h2>Browse original source rows</h2><button className="button secondary" disabled={selected.length<2} onClick={()=>navigate('rows')}><Columns2 size={15}/>Compare selected ({selected.length}/6)</button></div><p className="nasa-caption">{study.available_rows} nonblank rows · {study.source_tables} source tables. Row labels are supplied annotations, not validated experiment counts. Empty source rows are excluded from this browsing snapshot.</p>
 <div className="source-row-filters"><label>Find a source value<input value={query} onChange={e=>setQuery(e.target.value)} maxLength={400} placeholder="S1, PMMA, oxygen or a test ID"/></label><label>Source table<select value={table} onChange={e=>setTable(e.target.value)}><option value="all">All source tables</option>{[...new Set((records||[]).map(r=>r.source_filename))].map(v=><option key={v}>{v}</option>)}</select></label><label>Supplied row label<select value={type} onChange={e=>setType(e.target.value)}><option value="all">All labels</option>{[...new Set((records||[]).map(r=>r.row_type))].map(v=><option key={v}>{v}</option>)}</select></label></div>
 {error?<p className="nasa-error" role="alert">{error} <button className="text-button" onClick={()=>setRetry(v=>v+1)}>Try loading again</button></p>:!records?<p role="status">Loading source rows…</p>:<><RowCharts records={records} study={study}/><p className="nasa-caption" role="status">{visible.length} matching rows{visible.length?` · page ${currentPage+1} of ${pageCount}`:''}</p><div className="source-row-list row-grid">{visible.slice(currentPage*20,(currentPage+1)*20).map(row=><article className={`source-row-card row-card ${selected.includes(row.test_uid)?'marked':''}`} key={row.test_uid} style={{'--accent':lookFor(study).color}}><div className="row-card-head"><StudyOrb study={study} size={38}/><div><span className="record-study">{study.acronym||study.accession} · {row.row_type}</span><strong>{rowTitle({...row,study})}</strong></div><button className={`row-mark ${selected.includes(row.test_uid)?'active':''}`} aria-pressed={selected.includes(row.test_uid)} disabled={!selected.includes(row.test_uid)&&selected.length>=6} onClick={()=>onToggle(row.test_uid)}>{selected.includes(row.test_uid)?<><Check size={14}/>Marked</>:<><Plus size={14}/>Mark to compare</>}</button></div><CellTiles cells={row.cells} max={6}/><details><summary>All {Object.keys(row.cells).length} values and source</summary><dl className="raw-cell-list icon-cells">{Object.entries(row.cells).map(([field,value])=>{const {Icon,color}=fieldLook(field);return <div key={field} style={{'--f':color}}><dt><Icon size={13}/>{field}</dt><dd>{value||<em>Empty source cell</em>}</dd></div>;})}</dl><p className="nasa-caption">{row.source_filename}</p><p className="nasa-caption">{row.locator}</p><p className="nasa-caption">SHA-256: {row.source_sha256||'Not available in this retrieval snapshot'}</p><p className="nasa-caption">Review flags: {row.review_flags.length?row.review_flags.join('; '):'No supplied flags; scientific validity is not established'}</p></details></article>)}</div>{!visible.length&&<div className="empty-state"><Search size={25}/><h3>No source rows match these filters</h3><p>Try another value or select all tables and labels.</p></div>}<div className="source-pagination"><button className="button secondary" disabled={!currentPage} onClick={()=>setPage(currentPage-1)}>Previous</button><span>{visible.length?`${currentPage+1} / ${pageCount}`:'0 rows'}</span><button className="button secondary" disabled={!pageCount||currentPage>=pageCount-1} onClick={()=>setPage(currentPage+1)}>Next</button></div></>}
 </section>;
}
const coverageLabels={source_table_row:'Source table rows',workbook_cached_cell:'Workbook cells',document_paragraph:'Document excerpts',investigation_metadata:'Metadata'};
function DetailDashboard({study,saved,onSave,comparing,onCompare,navigate}){
 const {color,label}=lookFor(study);
 const isComparing=comparing.includes(study.accession);
 return <>
  <section className="detail-hero" style={{'--accent':color}}>
   <div className="detail-hero-orb"><StudyOrb study={study} size={160}/></div>
   <div className="detail-hero-copy">
    <div className="home-eyebrow"><span/>{study.accession} · {study.acronym||'NASA PSI'}</div>
    <h1>{study.title}</h1>
    <div className="detail-hero-chips"><Chip look={platformLook[study.platform]} value={study.platform}/><Chip look={fuelLook[study.fuel_state]} value={label}/>{study.primary_axis&&<Chip look={axisLook[study.primary_axis]} value={study.primary_axis}/>}{study.facility&&<Chip look={{Icon:FlaskConical}} value={study.facility}/>}</div>
    <p>{study.summary}</p>
    <div className="detail-hero-actions">
     {onCompare&&<CompareToggle active={isComparing} disabled={comparing.length>=4} onToggle={()=>onCompare(study.accession)}/>}
     <button className={`compare-toggle ${saved?'active':''}`} onClick={()=>onSave(study.accession)}><Bookmark size={15} fill={saved?'currentColor':'none'}/>{saved?'Saved':'Save'}</button>
     {isComparing&&comparing.length>=2&&<button className="button primary" onClick={()=>navigate('versus')}>Open comparison ({comparing.length})<Columns2 size={15}/></button>}
    </div>
   </div>
  </section>
 </>;
}
const sections=[['investigation-overview','Overview'],['investigation-rows','Source data'],['investigation-files','Files & coverage'],['investigation-publications','Publications']];
/** Section tabs that highlight the section currently on screen. */
function SectionNav(){
 const [active,setActive]=useState(sections[0][0]);
 const lock=useRef(0);
 useEffect(()=>{
  const onScroll=()=>{
   if(Date.now()<lock.current)return;
   const line=window.innerHeight*.3;let current=sections[0][0];
   for(const [id] of sections){const el=document.getElementById(id);if(el&&el.getBoundingClientRect().top<=line)current=id;}
   if(window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-4)current=sections[sections.length-1][0];
   setActive(current);
  };
  onScroll();window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onScroll);
  return()=>{window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll);};
 },[]);
 const go=id=>{setActive(id);lock.current=Date.now()+900;document.getElementById(id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});};
 return <nav className="detail-section-nav" aria-label="Investigation sections">{sections.map(([id,label])=><button key={id} className={active===id?'active':''} aria-current={active===id?'location':undefined} onClick={()=>go(id)}>{label}</button>)}</nav>;
}
export default function InvestigationDetail({accession,navigate,saved,onSave,selected,onToggle,onAsk,comparing=[],onCompare}){
 const study=investigations.find(s=>s.accession===accession);
 if(!study)return <main className="utility-page"><h1>Investigation not found</h1><button className="button secondary" onClick={()=>navigate('explore')}>Back to investigations</button></main>;
 return <main className="utility-page investigation-detail"><button className="text-button" onClick={()=>navigate('explore')}><ArrowLeft size={14}/>Explore investigations</button><DetailDashboard study={study} saved={saved} onSave={onSave} comparing={comparing} onCompare={onCompare} navigate={navigate}/>
 <SectionNav/><div className="investigation-actions"><button className="button secondary" onClick={()=>onAsk?.()}><Sparkles size={15}/>Ask about this investigation</button><button className="button primary" onClick={()=>navigate(evidenceRoute(study.accession,study.acronym||study.title))}>Search this investigation<ArrowRight size={15}/></button><a className="button secondary" href={study.psi_url} target="_blank" rel="noreferrer">Open NASA source and files<ArrowUpRight size={15}/></a>{study.doi&&<a className="text-button" href={`https://doi.org/${study.doi}`} target="_blank" rel="noreferrer">Investigation DOI<ArrowUpRight size={13}/></a>}</div>
 <dl id="investigation-overview" className="investigation-facts">{[['Platform',study.platform],['Facility',study.facility],['Study type',study.study_type],['Fuel state',study.fuel_state],['Research axis',study.primary_axis],['Intended application',(study.mission_contexts||[]).join(', ')],['License',study.license]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value||'Not recorded in this snapshot'}</dd></div>)}</dl>
 <div className="inline-note"><Info size={15}/><p>Intended applications do not change experimental gravity. Shared metadata or matching units do not establish scientific comparability.</p></div>
 {study.catalog_status!=='complete'&&<p className="nasa-error">Inventory gap: {study.gap_note||'Remote inventory incomplete'}. Available local evidence remains accessible below.</p>}
 <div id="investigation-rows">{study.available_rows>0?<SourceRows key={study.accession} study={study} selected={selected} onToggle={onToggle} navigate={navigate}/>:<section className="source-row-browser"><h2>No local source table rows in this snapshot</h2><p>Search the available indexed metadata or excerpts, or open the NASA source. A missing local table does not mean the investigation has no experimental data.</p></section>}</div>
 <section id="investigation-files" className="remote-coverage"><div className="section-header"><h2>Remote files and indexed coverage</h2><a className="text-button" href={study.rows_url} download={`${study.accession}-source-rows.json`}><Download size={14}/>Source-row snapshot JSON</a></div><div className="investigation-facts"><div><strong>{study.n_assets.toLocaleString('en-US')}</strong><p>Remote asset references</p></div><div><strong>{(study.remote_bytes/1e9).toLocaleString('en-US',{maximumFractionDigits:2})} GB</strong><p>Declared remote size; not downloaded</p></div><div><strong>{study.indexed_fragments}</strong><p>Indexed text fragments</p></div></div><p className="nasa-caption">NASA hosts the original files. This site links to the investigation source; it does not proxy or process the remote media automatically. Full-text PDF access is not claimed for every publication or remote file.</p><div className="coverage-badges">{(study.assets_by_ext||[]).map(([ext,count])=><span key={ext}>{ext.toUpperCase()}: {count.toLocaleString('en-US')} remote references</span>)}</div><details><summary>Snapshot provenance</summary><pre className="snapshot-provenance">{JSON.stringify({metadata_source:study.metadata_source,metadata_sha256:study.metadata_source_sha256,rows_sha256:study.rows_sha256,indexed_fragments_by_kind:study.coverage,catalog_status:study.catalog_status},null,2)}</pre></details></section>
 <section id="investigation-publications" className="publication-references"><h2>Publication references ({study.publications.length})</h2><p className="nasa-caption">Bibliographic entries from the supplied catalog. Their full texts have not all been acquired or indexed.</p>{study.publications.length?<div>{study.publications.map((p,i)=><article key={i}><h3>{p.title||'Title not supplied'}</h3><p>{p.authors||'Authors not supplied'}</p>{p.doi?<a className="text-button" href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer">Publication DOI<ArrowUpRight size={13}/></a>:<span className="nasa-caption">No DOI supplied</span>}</article>)}</div>:<p>No publication entries supplied.</p>}</section>
 </main>;
}
