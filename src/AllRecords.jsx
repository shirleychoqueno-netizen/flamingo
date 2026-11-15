import React, {useEffect, useMemo, useState} from 'react';
import {ArrowUpRight, ArrowRight, Check, Plus, Search, BookOpen, FlaskConical, ChevronDown, Layers, Flame, Gauge, Wind, Thermometer, Ruler, Orbit, Atom, Beaker, Columns2} from 'lucide-react';
import {investigations, normalizeCatalog} from './investigation-catalog';
import {fetchSourceRows} from './source-rows';
import {StudyOrb, Chip, fuelLook, platformLook, axisLook, CompareToggle} from './investigation-visuals';

const PAGE = 24;
const cache = new Map(); // accession -> records (shared across pages)

/** Loads the published row snapshots for the given investigations. */
export function useAllRows(studies) {
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

/* ---------- Field identity: icon + colour per kind of measurement ---------- */
const fieldKinds = [
 [/material|fuel|propellant|sample.*type|ambient gas/i, Flame, '#ff8a3d', 'Fuel'],
 [/o2|oxygen/i, Atom, '#5ad7ff', 'Oxygen'],
 [/pressure|atm|kpa|psi/i, Gauge, '#c89bff', 'Pressure'],
 [/flow|velocity|air display|fan/i, Wind, '#4fd1c5', 'Flow'],
 [/temp/i, Thermometer, '#ff6b6b', 'Temperature'],
 [/diameter|size|thickness|width|length/i, Ruler, '#ffc857', 'Size'],
 [/gravity|g-level/i, Orbit, '#7aa7ff', 'Gravity'],
 [/co2|co\b|ppm|concentration|fraction|mixture|dilu/i, Beaker, '#9be37a', 'Gas'],
];
export function fieldLook(key) {
 for (const [re, Icon, color, kind] of fieldKinds) if (re.test(key)) return {Icon, color, kind};
 return {Icon: Layers, color: '#9faab5', kind: 'Value'};
}
// Skip counters and IDs ("Sample #", "Test #") so cards show real conditions.
const skipKey = /#\s*$|^test\b|^run\b|frames|display|gain|restrictor|^pi$|^date$|^gmt$|notes?|comments?/i;
export function highlights(cells, max = 4) {
 const entries = Object.entries(cells).filter(([k, v]) => v && String(v).trim() && String(v).length < 80 && !skipKey.test(k.trim()));
 const out = [], used = new Set();
 for (const [re] of fieldKinds) {
  const hit = entries.find(([k]) => re.test(k) && !used.has(k));
  if (hit) { out.push(hit); used.add(hit[0]); }
  if (out.length >= max) break;
 }
 for (const e of entries) { if (out.length >= max) break; if (!used.has(e[0])) { out.push(e); used.add(e[0]); } }
 return out;
}
export function rowTitle(r) {
 const id = Object.entries(r.cells).find(([k, v]) => /^(test\s*#?|test id|run|point|case)/i.test(k) && v);
 return id ? `${id[0].replace(/\s*#$/, '')} ${id[1]}` : `Row ${r.data_row_1based}`;
}
export function CellTiles({cells, max = 4}) {
 return <dl className="record-cells">{highlights(cells, max).map(([k, v]) => { const {Icon, color} = fieldLook(k); return <div key={k} style={{'--f': color}}><span className="cell-icon"><Icon size={14}/></span><span><dt title={k}>{k}</dt><dd>{v}</dd></span></div>; })}</dl>;
}

/* ---------- Cards ---------- */
const typeLook = {
 test: {Icon: FlaskConical, label: 'Test', color: '#ff8a3d'},
 investigation: {Icon: Layers, label: 'Investigation', color: '#7aa7ff'},
 publication: {Icon: BookOpen, label: 'Publication', color: '#c89bff'},
};
function TypeBadge({type}) { const {Icon, label, color} = typeLook[type]; return <span className="type-badge" style={{'--t': color}}><Icon size={13}/>{label}</span>; }

export function TestCard({r, selectedRows = [], onToggleRow}) {
 const marked = selectedRows.includes(r.test_uid);
 return <article className={`record-card ${marked ? 'marked' : ''}`} style={{'--accent': (fuelLook[r.study.fuel_state] || {}).color || '#ff8a3d'}}>
  <TypeBadge type="test"/>
  <div className="record-head"><StudyOrb study={r.study} size={40}/><div><a className="record-study" href={`#investigation/${r.study.accession}`}>{r.study.accession} · {r.study.acronym || 'NASA PSI'}</a><h3>{rowTitle(r)}</h3></div></div>
  <CellTiles cells={r.cells}/>
  <div className="record-foot"><a className="text-button" href={`#investigation/${r.study.accession}`}>Investigation<ArrowUpRight size={13}/></a>
   {onToggleRow && <button className={`row-mark ${marked ? 'active' : ''}`} aria-pressed={marked} disabled={!marked && selectedRows.length >= 6} onClick={() => onToggleRow(r.test_uid)}>{marked ? <><Check size={14}/>Marked</> : <><Plus size={14}/>Mark to compare</>}</button>}
  </div>
 </article>;
}
function PubCard({p}) {
 return <article className="record-card pub" style={{'--accent': (fuelLook[p.study.fuel_state] || {}).color || '#ff8a3d'}}>
  <TypeBadge type="publication"/>
  <div className="record-head"><span className="pub-icon"><BookOpen size={18}/></span><a className="record-study" href={`#investigation/${p.study.accession}`}>{p.study.accession} · {p.study.acronym || 'NASA PSI'}</a></div>
  <h3>{p.title || 'Title not supplied'}</h3>
  <p className="pub-authors">{p.authors || 'Authors not supplied'}</p>
  <div className="record-foot">{p.status && <span className="record-type">{p.status}</span>}{p.doi ? <a className="text-button" href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer">Read (DOI)<ArrowUpRight size={13}/></a> : <span className="nasa-caption">No DOI supplied</span>}</div>
 </article>;
}
function StudyCard({s, comparing = [], onCompare, navigate}) {
 return <article className="record-card study" style={{'--accent': (fuelLook[s.fuel_state] || {}).color || '#ff8a3d'}}>
  <TypeBadge type="investigation"/>
  <div className="record-head"><StudyOrb study={s} size={52}/><div><span className="record-study">{s.accession} · {s.acronym || 'NASA PSI'}</span><h3><a href={`#investigation/${s.accession}`}>{s.title}</a></h3></div></div>
  <p className="pub-authors">{s.summary}</p>
  <div className="investigation-context"><Chip look={platformLook[s.platform]} value={s.platform}/><Chip look={fuelLook[s.fuel_state]} value={s.fuel_state}/></div>
  <div className="record-foot">{onCompare ? <CompareToggle compact active={comparing.includes(s.accession)} disabled={comparing.length >= 4} onToggle={() => onCompare(s.accession)}/> : <span/>}<button className="button open-study" onClick={() => navigate(`investigation/${s.accession}`)}>Open<ArrowRight size={14}/></button></div>
 </article>;
}

/* ---------- One mixed feed: tests, investigations and publications together ---------- */
export const feedFilters = [['all', 'All'], ['tests', 'Tests'], ['investigations', 'Investigations'], ['publications', 'Publications']];

export function UnifiedFeed({studies, query, filter = 'all', navigate, selectedRows, onToggleRow, comparing, onCompare}) {
 const {rows, loaded, total, error} = useAllRows(studies);
 const [limit, setLimit] = useState(PAGE);
 useEffect(() => setLimit(PAGE), [query, filter, studies.length]);
 const terms = normalizeCatalog(query).split(/\s+/).filter(Boolean);
 const match = text => !terms.length || terms.every(t => normalizeCatalog(text).includes(t));
 const pubs = useMemo(() => studies.flatMap(s => (s.publications || []).map((p, i) => ({...p, study: s, key: `${s.accession}-p${i}`}))), [studies]);
 const items = useMemo(() => {
  const st = filter === 'all' || filter === 'investigations' ? studies.filter(s => match([s.accession, s.acronym, s.title, s.summary, s.fuel_state, s.platform].join(' '))).map(s => ({type: 'investigation', key: s.accession, s})) : [];
  const ts = filter === 'all' || filter === 'tests' ? (rows || []).filter(r => match([r.study.accession, r.study.acronym, r.row_type, ...Object.keys(r.cells), ...Object.values(r.cells)].join(' '))).map(r => ({type: 'test', key: r.test_uid, r})) : [];
  const ps = filter === 'all' || filter === 'publications' ? pubs.filter(p => match([p.title, p.authors, p.doi, p.study.accession, p.study.acronym].join(' '))).map(p => ({type: 'publication', key: p.key, p})) : [];
  // Pattern: investigation, test, test, publication, test, test… so everything appears together.
  const out = []; let i = 0, t = 0, p = 0;
  while (i < st.length || t < ts.length || p < ps.length) {
   if (i < st.length) out.push(st[i++]);
   for (let k = 0; k < 2 && t < ts.length; k++) out.push(ts[t++]);
   if (p < ps.length) out.push(ps[p++]);
   for (let k = 0; k < 2 && t < ts.length; k++) out.push(ts[t++]);
  }
  return {list: out, counts: {investigation: st.length, test: ts.length, publication: ps.length}};
 }, [rows, pubs, studies, query, filter]);
 const {list, counts} = items;
 return <>
  <div className="result-toolbar"><span role="status">{list.length.toLocaleString('en-US')} results · {counts.test.toLocaleString('en-US')} tests · {counts.investigation} investigations · {counts.publication} publications</span></div>
  {!rows && !error && (filter === 'all' || filter === 'tests') && <div className="records-loading" role="status"><div className="records-loading-bar"><i style={{width: `${total ? (loaded / total) * 100 : 5}%`}}/></div>Loading tests from {total} investigations… {loaded}/{total}</div>}
  {error && <p className="nasa-error" role="alert">{error}</p>}
  <div className="records-grid">{list.slice(0, limit).map(it => it.type === 'test' ? <TestCard key={it.key} r={it.r} selectedRows={selectedRows} onToggleRow={onToggleRow}/> : it.type === 'publication' ? <PubCard key={it.key} p={it.p}/> : <StudyCard key={it.key} s={it.s} comparing={comparing} onCompare={onCompare} navigate={navigate}/>)}</div>
  {rows && !list.length && <div className="empty-state"><Search size={30}/><h3>Nothing matches</h3><p>Try another word, like PMMA, heptane, oxygen or Saffire.</p></div>}
  {list.length > limit && <button className="button secondary records-more" onClick={() => setLimit(l => l + PAGE * 2)}>Show more ({(list.length - limit).toLocaleString('en-US')} left)<ChevronDown size={15}/></button>}
 </>;
}
