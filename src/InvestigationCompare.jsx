import React, {useState} from 'react';
import {ArrowLeft, ArrowUpRight, X, Plus, Database, FileText, HardDrive, BookOpen, Files, Info, Equal, Sparkles, Trophy, Columns2} from 'lucide-react';
import {investigations} from './investigation-catalog';
import {StudyOrb, Chip, fuelLook, platformLook, axisLook, lookFor, Meter} from './investigation-visuals';
import './compare.css';

const metrics = [
 ['available_rows', Database, 'Source rows', v => v.toLocaleString('en-US')],
 ['indexed_fragments', FileText, 'Indexed fragments', v => v.toLocaleString('en-US')],
 ['n_assets', Files, 'Remote NASA files', v => v.toLocaleString('en-US')],
 ['remote_bytes', HardDrive, 'Remote data (GB)', v => (v / 1e9).toLocaleString('en-US', {maximumFractionDigits: 1})],
 ['n_publications', BookOpen, 'Publication references', v => v.toLocaleString('en-US')],
];
const attributes = [
 ['platform', 'Platform', s => platformLook[s.platform]],
 ['fuel_state', 'Fuel state', s => fuelLook[s.fuel_state]],
 ['primary_axis', 'Research axis', s => axisLook[s.primary_axis]],
 ['study_type', 'Study type'],
 ['facility', 'Facility'],
 ['mission_contexts', 'Intended application'],
];
const text = v => Array.isArray(v) ? v.join(', ') : v || '';

export default function InvestigationCompare({selected, onRemove, navigate, onAsk}) {
 const chosen = selected.map(id => investigations.find(s => s.accession === id)).filter(Boolean);
 const [onlyDiff, setOnlyDiff] = useState(false);

 if (chosen.length < 2) return <main className="research-home compare-page">
  <section className="compare-empty">
   <div className="compare-empty-orbs">{investigations.slice(5, 8).map(s => <StudyOrb key={s.accession} study={s} size={78}/>)}</div>
   <div className="home-eyebrow"><span/>COMPARE INVESTIGATIONS</div>
   <h1>Pick two to four.<br/><em>See them side by side.</em></h1>
   <p className="discovery-lead">Use the <b>Compare</b> button on any investigation card. {chosen.length === 1 ? `You have ${chosen[0].acronym || chosen[0].accession} selected — add one more.` : ''}</p>
   <button className="button primary" onClick={() => navigate('explore')}>Choose investigations<ArrowUpRight size={16}/></button>
  </section>
 </main>;

 const rows = attributes.map(([key, label, look]) => {
  const values = chosen.map(s => text(s[key]));
  return {key, label, look, same: values.every(v => v === values[0])};
 }).filter(r => !onlyDiff || !r.same);
 const question = `Compare ${chosen.map(s => s.acronym || s.accession).join(' and ')}: what conditions and materials does each study, and how do they differ?`;

 return <main className="research-home compare-page">
  <button className="text-button compare-back" onClick={() => navigate('explore')}><ArrowLeft size={14}/>Explore investigations</button>
  <div className="home-section-heading compare-heading">
   <div><div className="home-eyebrow"><span/>COMPARE INVESTIGATIONS · {chosen.length}</div><h2>Side by side.<br/><em>{chosen.map(s => s.acronym || s.accession).join(' vs ')}</em></h2></div>
   <div className="compare-heading-actions"><button className="button secondary" onClick={() => onAsk?.(question)}><Sparkles size={15}/>Ask the guide to compare</button>{chosen.length < 4 && <button className="button secondary" onClick={() => navigate('explore')}><Plus size={15}/>Add another</button>}</div>
  </div>

  <section className="compare-columns" style={{'--cols': chosen.length}}>
   {chosen.map((s, i) => {
    const {color, label} = lookFor(s);
    return <article key={s.accession} className="compare-card" style={{'--accent': color, animationDelay: `${i * 120}ms`}}>
     <button className="icon-button compare-remove" onClick={() => onRemove(s.accession)} aria-label={`Remove ${s.accession} from comparison`}><X size={15}/></button>
     <StudyOrb study={s} size={96}/>
     <span className="compare-code">{s.accession} / {s.acronym || 'NASA PSI'}</span>
     <h3><a href={`#investigation/${s.accession}`}>{s.title}</a></h3>
     <div className="compare-chips"><Chip look={platformLook[s.platform]} value={s.platform}/><Chip look={fuelLook[s.fuel_state]} value={label}/>{s.primary_axis && <Chip look={axisLook[s.primary_axis]} value={s.primary_axis}/>}</div>
     <p>{s.summary}</p>
     <div className="compare-card-links"><a className="text-button" href={`#investigation/${s.accession}`}>Open dashboard<ArrowUpRight size={13}/></a><a className="text-button" href={s.psi_url} target="_blank" rel="noreferrer">NASA source<ArrowUpRight size={13}/></a></div>
    </article>;
   })}
  </section>

  <section className="compare-metrics">
   <div className="home-eyebrow"><span/>THE NUMBERS</div>
   <div className="compare-metric-grid">
    {metrics.map(([key, Icon, label, fmt]) => {
     const max = Math.max(...chosen.map(s => s[key] || 0));
     return <div key={key} className="compare-metric">
      <h3><Icon size={17}/>{label}</h3>
      {chosen.map(s => <div key={s.accession} className={`compare-metric-row ${max && s[key] === max ? 'lead' : ''}`}>
       <Meter label={<>{s.acronym || s.accession}{max && s[key] === max && <Trophy size={12}/>}</>} value={key === 'remote_bytes' ? (s[key] || 0) / 1e9 : s[key] || 0} max={key === 'remote_bytes' ? max / 1e9 : max} color={lookFor(s).color} display={fmt(s[key] || 0)}/>
      </div>)}
     </div>;
    })}
   </div>
  </section>

  <section className="compare-attributes">
   <div className="compare-attributes-head"><div className="home-eyebrow"><span/>CONDITIONS & CONTEXT</div><label className="compare-switch"><input type="checkbox" checked={onlyDiff} onChange={e => setOnlyDiff(e.target.checked)}/><span/>Only differences</label></div>
   <div className="compare-table-scroll"><table className="compare-table" style={{'--cols': chosen.length}}>
    <thead><tr><th/>{chosen.map(s => <th key={s.accession}><StudyOrb study={s} size={30}/>{s.acronym || s.accession}</th>)}</tr></thead>
    <tbody>{rows.map(r => <tr key={r.key} className={r.same ? 'same' : 'diff'}>
     <th>{r.label}<small>{r.same ? <><Equal size={12}/>Same</> : 'Differs'}</small></th>
     {chosen.map(s => <td key={s.accession}>{r.look ? <Chip look={r.look(s)} value={text(s[r.key])}/> : text(s[r.key]) || <em>Not recorded</em>}</td>)}
    </tr>)}</tbody>
   </table></div>
   {!rows.length && <p className="nasa-caption">These investigations share every attribute listed here.</p>}
  </section>

  <div className="compare-next">
   <div><h3><Columns2 size={18}/>Want to compare measurements?</h3><p>Open an investigation, mark original source rows with <b>Mark to compare</b>, then open Compare rows.</p></div>
   <button className="button secondary" onClick={() => navigate('rows')}>Compare source rows<ArrowUpRight size={15}/></button>
  </div>
  <p className="learn-disclaimer compare-note"><Info size={15}/>Catalogue metadata side by side. Matching fields or units do not establish scientific comparability; check fuel, geometry, atmosphere, gravity and flow in each source.</p>
 </main>;
}
