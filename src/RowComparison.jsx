import React,{useRef,useState,useEffect} from 'react';
import {ArrowLeft,ArrowUpRight,Download,Columns2,X,Info,Layers,Sparkles} from 'lucide-react';
import {comparisonCsv} from './nasa-client';
import {investigations} from './investigation-catalog';
import {fetchSourceRows} from './source-rows';
import {StudyOrb,Kpi} from './investigation-visuals';
import './compare.css';
export function SourceComparisonTable({comparison}){
 const fields=[...new Set(comparison.evidence.flatMap(e=>Object.keys(e.cells)))];
 const download=()=>{const url=URL.createObjectURL(new Blob([comparisonCsv(comparison.evidence)],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='flamingo-original-row-comparison.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return <section className="nasa-comparison"><div className="section-header"><h2>Original source-cell comparison</h2><button className="button secondary" onClick={download}><Download size={14}/>Export comparison CSV</button></div><p className="nasa-caption">Source strings, original units, ranges and approximation markers are retained. The published adapter normalizes surrounding whitespace. No scientific equivalence is inferred.</p><div className="nasa-table-scroll"><table><thead><tr><th>Original field</th>{comparison.evidence.map(e=><th key={e.test_uid}>{e.test_uid}</th>)}</tr></thead><tbody>{fields.map(field=><tr key={field}><th>{field}</th>{comparison.evidence.map(e=><td key={e.test_uid}>{Object.hasOwn(e.cells,field)?(e.cells[field]||'Empty source cell'):'Not recorded in this row'}</td>)}</tr>)}<tr><th>Source locator</th>{comparison.evidence.map(e=><td key={e.test_uid}>{e.locator}</td>)}</tr></tbody></table></div><div className="inline-note"><Info size={15}/><p>Scientific comparability is not established. Check fuel, geometry, atmosphere, gravity, flow and calibration before interpreting differences.</p></div></section>;
}
// Builds the comparison from the published source-row snapshots, so it works
// on any host without calling the research API.
async function compareLocally(uids,signal){
 const byStudy={};
 for(const uid of uids){const acc=uid.split('|')[0];(byStudy[acc]||=[]).push(uid);}
 const evidence=[];
 for(const [acc,list] of Object.entries(byStudy)){
  const study=investigations.find(s=>s.accession===acc);
  if(!study)throw new Error(`Unknown investigation ${acc}.`);
  const records=await fetchSourceRows(study,signal);
  for(const uid of list){const r=records.find(x=>x.test_uid===uid);if(!r)throw new Error(`Row ${uid} is not in the ${acc} snapshot.`);evidence.push({test_uid:uid,cells:r.cells,locator:r.locator,row:r.data_row_1based,study});}
 }
 return {status:'selected_source_rows',evidence:uids.map(u=>evidence.find(e=>e.test_uid===u))};
}
function RowTable({comparison}){
 const [onlyDiff,setOnlyDiff]=useState(false);
 const fields=[...new Set(comparison.evidence.flatMap(e=>Object.keys(e.cells)))];
 const norm=v=>(v??'').trim();
 const rows=fields.map(f=>{const vals=comparison.evidence.map(e=>Object.hasOwn(e.cells,f)?norm(e.cells[f]):null);return{f,vals,diff:new Set(vals).size>1};}).filter(r=>!onlyDiff||r.diff);
 const diffCount=fields.filter(f=>new Set(comparison.evidence.map(e=>Object.hasOwn(e.cells,f)?norm(e.cells[f]):null)).size>1).length;
 const download=()=>{const url=URL.createObjectURL(new Blob([comparisonCsv(comparison.evidence)],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='flamingo-original-row-comparison.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return <section className="nasa-comparison">
  <div className="detail-kpis rowcmp-kpis"><Kpi Icon={Columns2} value={comparison.evidence.length} label="Rows compared"/><Kpi Icon={Layers} value={fields.length} label="Source fields"/><Kpi Icon={Sparkles} value={diffCount} label="Fields that differ"/></div>
  <div className="compare-attributes-head"><div className="home-eyebrow"><span/>ORIGINAL SOURCE CELLS</div><div style={{display:'flex',gap:14,alignItems:'center',flexWrap:'wrap'}}><label className="compare-switch"><input type="checkbox" checked={onlyDiff} onChange={e=>setOnlyDiff(e.target.checked)}/><span/>Only differences</label><button className="button secondary" onClick={download}><Download size={14}/>Export CSV</button></div></div>
  <div className="compare-table-scroll"><table className="compare-table rowcmp-table"><thead><tr><th>Original field</th>{comparison.evidence.map(e=><th key={e.test_uid}>{e.study&&<StudyOrb study={e.study} size={28}/>}{e.study?.acronym||e.test_uid.split('|')[0]} · row {e.row??''}</th>)}</tr></thead>
  <tbody>{rows.map(r=><tr key={r.f} className={r.diff?'diff':'same'}><th>{r.f}</th>{r.vals.map((v,i)=><td key={i}>{v===null?<em>Not recorded in this row</em>:v||<em>Empty source cell</em>}</td>)}</tr>)}
  <tr><th>Source locator</th>{comparison.evidence.map(e=><td key={e.test_uid}><small>{e.locator}</small></td>)}</tr></tbody></table></div>
  <p className="compare-note"><Info size={15}/>Source strings, original units, ranges and approximation markers are retained. Scientific comparability is not established: check fuel, geometry, atmosphere, gravity, flow and calibration before interpreting differences.</p>
 </section>;
}
export default function RowComparison({selected,onRemove,navigate}){
 const [comparison,setComparison]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');const selection=selected.join('\n');
 useEffect(()=>{
  setComparison(null);setError('');
  if(selected.length<2)return;
  const controller=new AbortController();setBusy(true);
  compareLocally(selected,AbortSignal.any([controller.signal,AbortSignal.timeout(35000)])).then(v=>{if(!controller.signal.aborted)setComparison(v);}).catch(e=>{if(!controller.signal.aborted)setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setBusy(false);});
  return()=>controller.abort();
 },[selection]);
 return <main className="research-home compare-page">
  <button className="text-button compare-back" onClick={()=>navigate('explore')}><ArrowLeft size={14}/>Explore investigations</button>
  <div className="home-section-heading compare-heading"><div><div className="home-eyebrow"><span/>COMPARE ORIGINAL NASA ROWS · {selected.length}/6</div><h2>Measurement by measurement.<br/><em>Straight from the source tables.</em></h2></div><p>Mark rows inside any investigation with <b>Mark to compare</b>. Differences are highlighted automatically.</p></div>
  {selected.length?<div className="rowcmp-chips">{selected.map((uid,i)=>{const acc=uid.split('|')[0];const s=investigations.find(x=>x.accession===acc);return <div className="rowcmp-chip" key={uid} style={{animationDelay:`${i*60}ms`}}>{s&&<StudyOrb study={s} size={32}/>}<span><strong>{s?.acronym||acc}</strong><small>{uid.split('|').slice(1).join(' · ')||uid}</small></span><button className="icon-button" aria-label={`Remove ${uid}`} onClick={()=>onRemove(uid)}><X size={14}/></button></div>;})}</div>
  :<div className="compare-empty" style={{minHeight:'40vh'}}><p className="discovery-lead">No rows marked yet. Open an investigation and use <b>Mark to compare</b> on two to six source rows.</p><button className="button primary" onClick={()=>navigate('explore')}>Choose an investigation<ArrowUpRight size={15}/></button></div>}
  {selected.length===1&&<p className="nasa-caption">Mark at least one more row to compare.</p>}
  {busy&&<p role="status" className="nasa-caption">Loading source cells…</p>}
  {error&&<p className="nasa-error" role="alert">{error}</p>}
  {comparison&&<RowTable comparison={comparison}/>}
 </main>;
}
