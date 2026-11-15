import React, {useEffect, useMemo, useState} from 'react';
import {ArrowUpRight, Check, Plus, Search, BookOpen, FlaskConical, ChevronDown} from 'lucide-react';
import {investigations, normalizeCatalog} from './investigation-catalog';
import {fetchSourceRows} from './source-rows';
import {StudyOrb, Chip, fuelLook, platformLook} from './investigation-visuals';

const PAGE = 24;
const cache = new Map(); // accession -> records (shared across views)

/** Loads the published row snapshots for the given investigations. */
function useAllRows(studies) {
 const [state, setState] = useState(() => ({rows: null, loaded: 0, total: studies.filter(s => s.available_rows > 0).length, error: ''}));
 const key = studies.map(s => s.accession).join(',');
 useEffect(() => {
  const withRows = studies.filter(s => s.available_rows > 0);
  const controller = new AbortController();
  let loaded = 0;
  setState(s => ({...s, rows: null, loaded: 0, total: withRows.length, error: ''}));
  Promise.all(withRows.map(s => (cache.has(s.accession) ? Promise.resolve(cache.get(s.accession)) : fetchSourceRows(s, controller.signal).then(r => { cache.set(s.accession, r); return r; }))
   .then(records => { loaded++; if (!controller.signal.aborted) setState(st => ({...st, loaded})); return records.map(r => ({...r, study: s})); })))
   .then(all => {
    // Interleave investigations so the first screen shows variety, not one study.
    const mixed = [], lists = all.map(l => l.slice());
    for (let i = 0; lists.some(l => i < l.length); i++) for (const l of lists) if (i < l.length) mixed.push(l[i]);
    if (!controller.signal.aborted) setState(st => ({...st, rows: mixed}));
   })
   .catch(e => { if (!controller.signal.aborted) setState(st => ({...st, error: e.message})); });
  return () => controller.abort();
 }, [key]);
 return state;
}

// Pick the few cells a student or researcher looks for first.
const priorities = [
 [/material|fuel|propellant/i, 'Fuel / sample'],
 [/o2|oxygen/i, 'Oxygen'],
 [/pressure|atm/i, 'Pressure'],
 [/flow|velocity|air display|fan/i, 'Flow'],
 [/diameter|size|thickness|width/i, 'Size'],
 [/temp/i, 'Temperature'],
 [/gravity|g-level/i, 'Gravity'],
];
function highlights(cells) {
 // Skip counters and IDs ("Sample #", "Test #") so the card shows real conditions.
 const entries = Object.entries(cells).filter(([k, v]) => v && String(v).trim() && String(v).length < 80 && !/#\s*$|^test\b|^run\b|frames|display|gain|restrictor/i.test(k.trim()));
 const out = [], used = new Set();
 for (const [re] of priorities) {
  const hit = entries.find(([k]) => re.test(k) && !used.has(k));
  if (hit) { out.push(hit); used.add(hit[0]); }
  if (out.length >= 4) break;
 }
 for (const e of entries) { if (out.length >= 4) break; if (!used.has(e[0]) && !/^(pi|date|gmt|notes?|comments?)$/i.test(e[0])) { out.push(e); used.add(e[0]); } }
 return out;
}
function rowTitle(r) {
 const id = Object.entries(r.cells).find(([k, v]) => /^(test\s*#?|test id|run|point|case)/i.test(k) && v);
 return id ? `${id[0].replace(/\s*#$/, '')} ${id[1]}` : `Row ${r.data_row_1based}`;
}

export function TestsList({studies, query, navigate, selectedRows = [], onToggleRow}) {
 const {rows, loaded, total, error} = useAllRows(studies);
 const [limit, setLimit] = useState(PAGE);
 useEffect(() => setLimit(PAGE), [query, studies.length]);
 const terms = normalizeCatalog(query).split(/\s+/).filter(Boolean);
 const visible = useMemo(() => !rows ? [] : rows.filter(r => !terms.length || terms.every(t => normalizeCatalog([r.study.accession, r.study.acronym, r.row_type, ...Object.keys(r.cells), ...Object.values(r.cells)].join(' ')).includes(t))), [rows, query]);
 if (error) return <p className="nasa-error" role="alert">{error}</p>;
 if (!rows) return <div className="records-loading" role="status"><div className="records-loading-bar"><i style={{width: `${total ? (loaded / total) * 100 : 5}%`}}/></div>Loading tests from {total} investigations… {loaded}/{total}</div>;
 return <>
  <div className="result-toolbar"><span role="status">{visible.length.toLocaleString('en-US')} {visible.length === 1 ? 'test' : 'tests'} · each one is a single source row</span></div>
  <div className="records-grid">{visible.slice(0, limit).map(r => {
   const marked = selectedRows.includes(r.test_uid);
   return <article key={r.test_uid} className={`record-card ${marked ? 'marked' : ''}`} style={{'--accent': (fuelLook[r.study.fuel_state] || {}).color || '#ff8a3d'}}>
    <div className="record-head"><StudyOrb study={r.study} size={40}/><div><a className="record-study" href={`#investigation/${r.study.accession}`}>{r.study.accession} · {r.study.acronym || 'NASA PSI'}</a><h3>{rowTitle(r)}</h3></div></div>
    <dl className="record-cells">{highlights(r.cells).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
    <div className="record-foot"><span className="record-type">{r.row_type}</span>
     {onToggleRow && <button className={`row-mark ${marked ? 'active' : ''}`} aria-pressed={marked} disabled={!marked && selectedRows.length >= 6} onClick={() => onToggleRow(r.test_uid)}>{marked ? <><Check size={14}/>Marked</> : <><Plus size={14}/>Mark to compare</>}</button>}
    </div>
   </article>;
  })}</div>
  {!visible.length && <div className="empty-state"><Search size={30}/><h3>No tests match</h3><p>Try another value, like PMMA, 0.21 or heptane.</p></div>}
  {visible.length > limit && <button className="button secondary records-more" onClick={() => setLimit(l => l + PAGE * 2)}>Show more tests ({(visible.length - limit).toLocaleString('en-US')} left)<ChevronDown size={15}/></button>}
 </>;
}

export function PublicationsList({studies, query}) {
 const [limit, setLimit] = useState(PAGE);
 useEffect(() => setLimit(PAGE), [query, studies.length]);
 const all = useMemo(() => studies.flatMap(s => (s.publications || []).map((p, i) => ({...p, study: s, key: `${s.accession}-${i}`}))), [studies]);
 const terms = normalizeCatalog(query).split(/\s+/).filter(Boolean);
 const visible = all.filter(p => !terms.length || terms.every(t => normalizeCatalog([p.title, p.authors, p.doi, p.study.accession, p.study.acronym].join(' ')).includes(t)));
 return <>
  <div className="result-toolbar"><span role="status">{visible.length} {visible.length === 1 ? 'publication' : 'publications'} · bibliographic references from NASA PSI</span></div>
  <div className="records-grid pubs">{visible.slice(0, limit).map(p => <article key={p.key} className="record-card pub" style={{'--accent': (fuelLook[p.study.fuel_state] || {}).color || '#ff8a3d'}}>
   <div className="record-head"><span className="pub-icon"><BookOpen size={18}/></span><a className="record-study" href={`#investigation/${p.study.accession}`}>{p.study.accession} · {p.study.acronym || 'NASA PSI'}</a></div>
   <h3>{p.title || 'Title not supplied'}</h3>
   <p className="pub-authors">{p.authors || 'Authors not supplied'}</p>
   <div className="record-foot">{p.status && <span className="record-type">{p.status}</span>}{p.doi ? <a className="text-button" href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer">Read (DOI)<ArrowUpRight size={13}/></a> : <span className="nasa-caption">No DOI supplied</span>}</div>
  </article>)}</div>
  {!visible.length && <div className="empty-state"><Search size={30}/><h3>No publications match</h3></div>}
  {visible.length > limit && <button className="button secondary records-more" onClick={() => setLimit(l => l + PAGE * 2)}>Show more publications ({visible.length - limit} left)<ChevronDown size={15}/></button>}
 </>;
}
