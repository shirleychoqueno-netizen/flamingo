import React, { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Home, ArrowUpRight, ArrowRight, ArrowLeft, Search, SlidersHorizontal, X, Plus, Check, ChevronDown, ChevronRight, BookOpen, Bookmark, Columns2, Layers3, Orbit, Flame, ShieldCheck, FileText, Download, MessageSquare, Send, Sparkles, Database, ExternalLink, Info, PanelLeftClose, Menu, Microscope, CircleHelp, RotateCcw, CheckCheck, ListFilter, Sun, GraduationCap } from 'lucide-react';
import { habitats, taxonomy, studies, normalize, searchStudy, queryTokens, csvText, evidenceRows, configurationRows, searchPages } from './data';
import StudyDashboard from './StudyView';
import NasaWorkbench from './NasaWorkbench';
import InvestigationExplorer,{CoverageSummary} from './InvestigationExplorer';
import InvestigationDetail from './InvestigationDetail';
import RowComparison from './RowComparison';
import {investigations,rowSelection} from './investigation-catalog';
import ResearchHome from './ResearchHome';
import ResearchLibrary from './ResearchLibrary';
const ResearchAssistant=lazy(()=>import('./ResearchAssistant'));
const LearnHabitat=lazy(()=>import('./LearnHabitat'));
import DocumentReader from './DocumentReader';
import DocumentMetadata from './DocumentMetadata';
import {documentTypes,matchesDocumentFilters} from './catalogue-filters';
import PublicationRange from './PublicationRange';
import ResourceFilter from './ResourceFilter';
import {resourceCollections} from './resource-collections';
import './styles.css';
import './refresh.css';
import './experience.css';
import './flamingo.css';

const icons = { environment: Orbit, fuel: Layers3, fire: Flame, safety: ShieldCheck, evidence: FileText };
const presets = ['Oxygen and flame spread', 'Soot formation', 'Ventilation and solid materials'];
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const parseRoute = () => {
  const route = window.location.hash.slice(1).split('/');
  let id=route[1];
  try { id=decodeURIComponent(id||''); } catch { id=''; }
  return { accession:route[2]||'', view: ['home', 'explore', 'study', 'compare', 'saved', 'library', 'type', 'nasa', 'investigation', 'pdfs', 'document-saved', 'rows', 'learn'].includes(route[0]) ? route[0] : 'home', id };
};
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

function download(name, rows) {
  const blob = new Blob([csvText(rows)], { type: 'text/csv;charset=utf-8;' });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = href; anchor.download = name;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function SearchMatches({study,query,onRead}) {
  const pages = useMemo(() => searchPages(study,query,study.document.pageCount),[study,query]);
  if (!pages.length) return null;
  const preview = pages[0].excerpt.slice(0,340);
  const words = queryTokens(query);
  const pieces = words.length ? preview.split(new RegExp(`(${words.join('|')})`,'ig')) : [preview];
  return <div className="search-match">
    <div><span><Search size={13}/>{pages.length} {pages.length === 1 ? 'matching page' : 'matching pages'}</span><button onClick={() => onRead(pages[0].number)}>Read page {pages[0].number}<ArrowUpRight size={12}/></button></div>
    <p>{pieces.map((piece,index) => index % 2 ? <mark key={index}>{piece}</mark> : piece)}{pages[0].excerpt.length > 340 ? '…' : ''}</p>
  </div>;
}

export function App() {
  const [route, setRoute] = useState(parseRoute);
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [searchRequest, setSearchRequest] = useState(0);
  const resultsRef = useRef(null);
  const resultsHeadingRef = useRef(null);
  const [sourcePreview,setSourcePreview] = useState(null);
  const closeSourcePreview = useCallback(() => setSourcePreview(null),[]);
  const [habitat, setHabitat] = useState('All habitats');
  const [documentType,setDocumentType]=useState('all');
  const [publication,setPublication]=useState(null);
  const [resource,setResource]=useState('all');
  const [sort, setSort] = useState('relevance');
  const [saved, setSaved] = useState(() => load('ignis.saved', []).filter(id => studies.some(s => s.id === id)));
  const [selected, setSelected] = useState(() => load('ignis.selected', []).filter(id => studies.some(s => s.id === id)));
  const [savedInvestigations,setSavedInvestigations]=useState(()=>load('ignis.investigations.saved',[]).filter(id=>investigations.some(s=>s.accession===id)));
  const [selectedRows,setSelectedRows]=useState(()=>load('ignis.rows.selected',[]).filter(id=>typeof id==='string'&&investigations.some(s=>id.startsWith(s.accession+'|'))).slice(0,6));
  const [filterOpen, setFilterOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [guideOpen,setGuideOpen]=useState(false);
  const [guideSeed,setGuideSeed]=useState({id:0,question:''});
  const openGuide=(question='')=>{setGuideSeed(old=>({id:old.id+1,question:question.trim()}));setGuideOpen(true);};
  const theme='dark';
  useEffect(()=>{document.documentElement.dataset.theme='dark';},[]);

  useEffect(() => { const handler = () => setRoute(parseRoute()); window.addEventListener('hashchange', handler); return () => window.removeEventListener('hashchange', handler); }, []);
  useEffect(() => { save('ignis.saved', saved); }, [saved]);
  useEffect(()=>{save('ignis.investigations.saved',savedInvestigations);},[savedInvestigations]);
  useEffect(()=>{save('ignis.rows.selected',selectedRows);},[selectedRows]);
  useEffect(() => { save('ignis.selected', selected); }, [selected]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 4000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { document.title = route.view === 'study' ? `${studies.find(s => s.id === route.id)?.acronym || 'Study'} — flamingo` : route.view === 'type' ? `${route.id} — flamingo` : route.view === 'learn' ? 'Learn: space habitat — flamingo' : 'flamingo — Combustion Research'; window.scrollTo(0, 0); }, [route]);
  useEffect(() => {
    if(route.view !== 'type')return;
    setQuery('');setActiveQuery('');setDocumentType(route.id);setPublication(null);setResource('all');setFilterOpen(false);
  },[route.view,route.id]);
  useEffect(() => {
    if (!searchRequest || route.view !== 'pdfs') return;
    const frame = requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({block:'start',behavior:'instant'});
      resultsHeadingRef.current?.focus({preventScroll:true});
    });
    return () => cancelAnimationFrame(frame);
  },[searchRequest,route.view]);

  const navigate = view => { window.location.hash = view === 'home' ? '' : view; setFilterOpen(false); };
  const toggleSavedInvestigation = id=>setSavedInvestigations(old=>old.includes(id)?old.filter(v=>v!==id):[...old,id]);
  const toggleRow = uid=>setSelectedRows(old=>rowSelection(old,uid));
  const toggleSaved = id => setSaved(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  const toggleSelected = id => setSelected(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  const notify = text => setNotice(text);
  const exportStudies = list => { download('flamingo-document-evidence.csv', evidenceRows(list)); notify('Document evidence CSV exported.'); };
  const runSearch = (event, preset) => { event?.preventDefault(); const value = (preset ?? query).trim(); setQuery(value); setActiveQuery(value); setSearchRequest(count => count+1); if (route.view !== 'pdfs') navigate('pdfs'); };
  const reset = () => { setQuery('');setActiveQuery('');setDocumentType('all');setPublication(null);setResource('all');setHabitat(habitats[0]);if(route.view==='type')navigate('pdfs'); };
  const chooseDocumentType=value=>{setDocumentType(value);if(route.view==='type')navigate(value==='all'?'pdfs':`type/${encodeURIComponent(value)}`);};
  const activeType=route.view==='type'?route.id:documentType;
  const tokens = queryTokens(activeQuery);
  let visible = studies.filter(s=>matchesDocumentFilters(s,{kind:activeType,range:publication,resource})).filter(s => route.view !== 'document-saved' || saved.includes(s.id)).filter(s => !tokens.length || searchStudy(s, activeQuery).length > 0);
  visible.sort((a, b) => sort === 'name' ? a.title.localeCompare(b.title) : searchStudy(b, activeQuery).length - searchStudy(a, activeQuery).length);
  const current = studies.find(s => s.id === route.id);

  return <div className="app-shell" data-theme={theme}>
    <aside className="rail" aria-label="Main navigation">
      <a className="rail-logo" href="#" aria-label="flamingo home"><img src="/flamingo-mark.svg" width="30" height="30" alt="" aria-hidden="true" /></a>
      <div className="rail-group">
        {[['home', Home, 'Home'], ['explore', Search, 'Explore'], ['rows', Columns2, 'Compare rows'], ['saved', Bookmark, 'Saved'], ['library', Database, 'Library'], ['learn', GraduationCap, 'Aprende']].map(([view, Icon, label]) => <button key={view} className={`rail-link ${route.view === view || view === 'explore' && ['study','type','pdfs','investigation','document-saved'].includes(route.view) ? 'active' : ''}`} onClick={() => navigate(view)} aria-label={label} title={label} aria-current={route.view === view ? 'page' : undefined}><Icon size={20} strokeWidth={1.6} /><span>{label}</span>{view === 'rows' && selectedRows.length > 0 && <b className="rail-count">{selectedRows.length}</b>}</button>)}
      </div>
      <a className="rail-help" href="https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/" target="_blank" rel="noreferrer" aria-label="Open the Flame in Freefall challenge" title="About the challenge"><CircleHelp size={20} /></a>
      <div className="rail-avatar" title="Local workspace">FL</div>
    </aside>

    <div className="app-body">
      <header className="topbar">
        <a className="wordmark" href="#" title="Flame Learning &amp; Analysis in Microgravity: INsights for Gravity-Off missions">flamingo<span className="wordmark-dot">.</span><span className="wordmark-description">Flame Learning &amp; Analysis in Microgravity</span></a>
        <div className="header-actions"><button className="button secondary compact header-explore-button" onClick={()=>navigate('explore')}>Explore research<ArrowUpRight size={14}/></button><button className="button secondary compact header-documents-button" onClick={()=>navigate('library')}><BookOpen size={15}/><span>Library</span></button></div>
      </header>

      {route.view==='home'?<ResearchHome navigate={navigate} onAsk={openGuide}/> : ['explore','saved'].includes(route.view)?<InvestigationExplorer navigate={navigate} saved={savedInvestigations} onSave={toggleSavedInvestigation} onAsk={openGuide} savedOnly={route.view==='saved'}/> : route.view==='investigation'?<InvestigationDetail key={route.id} accession={route.id} navigate={navigate} saved={savedInvestigations.includes(route.id)} onSave={toggleSavedInvestigation} selected={selectedRows} onToggle={toggleRow} onAsk={openGuide}/> : route.view==='rows'?<RowComparison selected={selectedRows} onRemove={toggleRow} navigate={navigate}/> : route.view === 'nasa' ? <NasaWorkbench key={route.id+'|'+route.accession} initialQuery={route.id} initialAccession={route.accession} selectedRows={selectedRows} onSelectedRowsChange={setSelectedRows}/> : route.view === 'study' && current ? <StudyDashboard key={current.id} study={current} habitat={habitat} saved={saved.includes(current.id)} onSave={() => toggleSaved(current.id)} onBack={() => navigate('pdfs')} onExport={() => exportStudies([current])} selected={selected.includes(current.id)} onCompare={() => toggleSelected(current.id)} />
        : route.view === 'compare' ? <Compare selected={selected} onToggle={toggleSelected} onAdd={() => navigate('pdfs')} onExport={() => exportStudies(studies.filter(s => selected.includes(s.id)))} onOpen={id => navigate(`study/${id}`)} />
        : route.view === 'library' ? <ResearchLibrary onOpen={id=>navigate(`study/${id}`)} navigate={navigate}/>
        : route.view === 'learn' ? <Suspense fallback={<main className="utility-page"><p className="nasa-caption" role="status">Cargando Aprende…</p></main>}><LearnHabitat navigate={navigate} onAsk={openGuide}/></Suspense>
        : <main className={route.view === 'type'?'document-type-page':undefined}>
          {route.view === 'type'?<div className="breadcrumb type-breadcrumb"><button onClick={()=>navigate('explore')}><ArrowLeft size={14}/>Explore documents</button><span>/</span><span>{route.id}</span></div>:<div className="workspace"><div className="page-title"><div><div className="eyebrow">CURATED READING ROOM</div><h1>Read the source documents.</h1><p>Read full-text documents and page-cited evidence from our curated collection. All 25 NASA investigations remain available in the research catalog.</p></div><button className="button secondary" onClick={()=>navigate('explore')}>All investigations (25)<ArrowRight size={15}/></button></div><div className="investigation-actions"><button className="text-button" onClick={()=>navigate('compare')}>Compare PDF evidence<Columns2 size={14}/></button><button className="text-button" onClick={()=>navigate('document-saved')}>Saved PDFs<Bookmark size={14}/></button></div></div>}

          {route.view !== 'type'&&<section className="search-area" aria-label="Search investigations">
            <form className="search-box" onSubmit={runSearch}><Search size={21} strokeWidth={1.6} /><input aria-label="Your research question" value={query} onChange={e => setQuery(e.target.value)} placeholder="What do you need to investigate about fire safety?" /><button className="button primary" aria-label="Explore investigations by question" type="submit"><span>Explore</span><ArrowRight size={17} /></button></form>
            <div className="search-suggestions"><span>Try</span>{presets.map(p => <button key={p} onClick={() => runSearch(null, p)}>{p}<ArrowUpRight size={12} /></button>)}</div>
          </section>}

          <section className="workspace" ref={resultsRef} aria-labelledby="search-results-heading">
            <div className="workspace-heading"><div><span className="eyebrow muted">YOUR RESEARCH WORKSPACE</span><h2 id="search-results-heading" ref={resultsHeadingRef} tabIndex={-1}>{route.view === 'type' ? `Documents of type ${route.id}` : route.view === 'document-saved' ? 'Saved PDFs' : activeQuery ? 'PDF search results' : 'Source documents'} <span className="count">{visible.length}</span></h2>{activeQuery && <p className="search-summary" role="status">{visible.length} {visible.length === 1 ? 'document found' : 'documents found'} for «{activeQuery}»{activeType !== 'all' || publication !== null || resource !== 'all' ? ' with the selected filters' : ''}.</p>}</div><div className="heading-actions"><button className="button secondary mobile-filter" onClick={() => setFilterOpen(!filterOpen)} aria-expanded={filterOpen}><SlidersHorizontal size={15} />Filters</button><button className="text-button" onClick={() => exportStudies(visible)} disabled={!visible.length}><Download size={15} />Export catalogue</button></div></div>
            <div className="research-layout">
              <aside className={`filters ${filterOpen ? 'filters-open' : ''}`} aria-label="Research filters">
                <div className="filter-title"><span><SlidersHorizontal size={15} />REFINE SEARCH</span><button onClick={reset} title="Clear filters" aria-label="Clear filters"><RotateCcw size={14} /></button></div>
                <label className="field-label" htmlFor="habitat">Application habitat <Info size={12} /></label><div className="select-wrap"><select id="habitat" value={habitat} onChange={e => setHabitat(e.target.value)}>{habitats.map(h => <option key={h}>{h}</option>)}</select><ChevronDown size={14} /></div>
                <p className="filter-note">Question context; it does not change experimental gravity.</p>
                <div className="filter-section"><h3>Document type</h3>{['all',...documentTypes].map(type=><label key={type} className="radio-label"><input type="radio" name="document-type" checked={activeType===type} onChange={()=>chooseDocumentType(type)}/><span>{type==='all'?'All types':type}</span><small>{studies.filter(s=>type==='all'||s.profile.kind===type).length}</small></label>)}</div>
                <ResourceFilter studies={studies} value={resource} onChange={setResource}/>
                <PublicationRange studies={studies} value={publication} onApply={setPublication}/>
                <div className="context-box"><Orbit size={20} /><strong>From Earth to other worlds</strong><p>Always distinguish experimental conditions from the habitat where you intend to apply the findings.</p></div>
              </aside>

              <div className="results-column">
                <div className="result-toolbar"><span>{route.view === 'type' ? <>Document type: <strong>{route.id}</strong></> : activeQuery ? <>Results for <strong>«{activeQuery}»</strong></> : 'A first look at the available evidence'}{resource!=='all'&&<span className="context-tag resource-active">{resourceCollections.find(c=>c.id===resource)?.short}</span>}{habitat !== habitats[0] && <span className="context-tag">{habitat}</span>}</span><label>Sort <select aria-label="Sort investigations" value={sort} onChange={e => setSort(e.target.value)}><option value="relevance">Topic relevance</option><option value="name">Name</option></select><ChevronDown size={12} /></label></div>
                <div className="result-list" aria-live="polite">{visible.length ? <table className="document-results-table"><thead><tr><th scope="col">Documents <span>({visible.length})</span></th><th scope="col">Experimental objectives</th><th scope="col">What does it contribute?</th></tr></thead><tbody>{visible.map((s, i) => <tr className="document-result-row" key={s.id}><td className="document-main-cell"><article className="study-card">
                  <div className="card-heading"><div className="study-id"><span className="study-number">{String(i + 1).padStart(2, '0')}</span><span className="acronym">{s.acronym}</span><span className="doc-type">{s.type}</span></div><button className={`icon-button ${saved.includes(s.id) ? 'is-saved' : ''}`} onClick={() => toggleSaved(s.id)} aria-label={`${saved.includes(s.id) ? 'Unsave' : 'Save'} ${s.acronym}`} title="Save study"><Bookmark size={17} fill={saved.includes(s.id) ? 'currentColor' : 'none'} /></button></div>
                  <h3><a href={`#study/${s.id}`}>{s.title}<ArrowUpRight size={18} /></a></h3>
                  <DocumentMetadata study={s} onRead={page=>setSourcePreview({study:s,page})}/>
                  {activeQuery && <SearchMatches study={s} query={activeQuery} onRead={page => setSourcePreview({study:s,page})}/>}
                  <details className="relevance-details"><summary><Sparkles size={13} />Why might this be relevant?<ChevronDown size={12} /></summary><p>{s.relevance}{habitat !== habitats[0] && ` Selected context: ${habitat}. Applicability requires reviewing the conditions.`}</p></details>
                  <div className="card-footer"><label className="compare-checkbox"><input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleSelected(s.id)} /><Columns2 size={14} />Compare</label><button className="button open-study" onClick={() => navigate(`study/${s.id}`)}>Open study <ArrowRight size={15} /></button></div>
                </article></td><td className="document-insight-cell"><h4>Experimental objectives</h4><span className="insight-context">{s.profile.objectiveContext}</span><p>{s.profile.objectives}</p></td><td className="document-insight-cell"><h4>What does it contribute?</h4><span className="insight-context">{s.profile.contributionContext}</span><p>{s.profile.contribution}</p></td></tr>)}</tbody></table> : <div className="empty-state"><Search size={30} strokeWidth={1.4} /><h3>{route.view === 'document-saved' && !saved.length ? 'Your next reference starts here' : 'No matches in these documents'}</h3><p>{route.view === 'document-saved' && !saved.length ? 'Bookmark a study to find it later.' : 'Try another search or clear the filters. This search covers the full text of the two PDFs.'}</p><button className="button secondary" onClick={() => { reset(); if (['document-saved','type'].includes(route.view)) navigate('pdfs'); }}>View all documents<ArrowRight size={15} /></button></div>}</div>
                <div className="results-bottom"><span><CheckCheck size={14} />You have reached the end of the documents</span><span>{visible.reduce((total, study) => total + study.variables.length, 0)} extracted records · 6 figure configurations</span></div>
              </div>
            </div>
          </section>
        </main>}

      <footer className="footer"><span>flamingo<span className="footer-separator">/</span>Science for safety in space</span><span>Flame in Freefall <span className="footer-dot">•</span> 2026</span></footer>
    </div>
    {selected.length > 0 && ['pdfs','type','document-saved'].includes(route.view) && <div className="selection-bar"><div><Columns2 size={17} /><strong>{selected.length} {selected.length === 1 ? 'selected study' : 'selected studies'}</strong><button className="text-button" onClick={() => setSelected([])}>Clear</button></div><button className="button primary" onClick={() => navigate('compare')}>Compare selection<ArrowRight size={16} /></button></div>}
    {selectedRows.length>0&&['explore','saved','investigation','library'].includes(route.view)&&<div className="catalog-selection-bar"><strong>{selectedRows.length}/6 original rows selected</strong><button className="text-button" onClick={()=>setSelectedRows([])}>Clear</button><button className="button primary" disabled={selectedRows.length<2} onClick={()=>navigate('rows')}>Compare original rows<Columns2 size={15}/></button></div>}
    <button className="guide-fab" onClick={()=>openGuide()} aria-label="Open AI research guide"><Sparkles size={21}/><span>Research guide</span></button>
    {guideSeed.id>0&&<Suspense fallback={<p className="guide-opening" role="status">Opening research guide…</p>}><ResearchAssistant open={guideOpen} onClose={()=>setGuideOpen(false)} seed={guideSeed} navigate={navigate} accession={route.view==='investigation'?route.id:route.view==='nasa'?route.accession:''}/></Suspense>}
    <div className={`toast ${notice ? 'show' : ''}`} role="status">{notice && <><Check size={16} />{notice}</>}</div>
    {sourcePreview && <DocumentReader study={sourcePreview.study} initialPage={sourcePreview.page} onClose={closeSourcePreview}/>}
  </div>;
}

function Compare({ selected, onToggle, onAdd, onExport, onOpen }) {
  const [category, setCategory] = useState('all');
  const chosen = studies.filter(s => selected.includes(s.id));
  const names = [...new Set(chosen.flatMap(s => s.variables.filter(v => category === 'all' || v.category === category).map(v => v.id)))];
  return <main className="utility-page"><div className="page-title"><div><div className="eyebrow"><span className="blue-line" />EVIDENCE IN PERSPECTIVE</div><h1>Compare PDF evidence</h1><p>Find similarities, differences and limits before combining data.</p></div><button className="button secondary" onClick={onAdd}><Plus size={15} />Add studies</button></div>{!chosen.length ? <div className="empty-state"><Columns2 size={34} strokeWidth={1.3} /><h2>Compare the incorporated PDF evidence.</h2><p>Select documents in the full-text PDF collection to compare their extracted evidence here.</p><button className="button primary" onClick={onAdd}>Explore full-text PDFs<ArrowRight size={16} /></button></div> : <><div className="demo-notice"><Info size={16} /><span>Comparison of the incorporated documents. Equipment capabilities and experimental results retain distinct labels.</span></div><div className="comparison-controls"><label>Category<select value={category} onChange={e => setCategory(e.target.value)}><option value="all">All categories</option>{taxonomy.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label><button className="button secondary" onClick={onExport}><Download size={15} />Export evidence CSV</button></div><div className="comparison-table-wrap"><table className="comparison-table"><thead><tr><th>Variable / attribute</th>{chosen.map(s => <th key={s.id}><div><span>{s.acronym}</span><button className="icon-button" onClick={() => onToggle(s.id)} aria-label={`Remove ${s.acronym} from comparison`}><X size={15} /></button></div><button className="text-button" onClick={() => onOpen(s.id)}>Open study<ArrowUpRight size={12} /></button></th>)}</tr></thead><tbody><tr><th>Experimental environment</th>{chosen.map(s => <td key={s.id}>{s.gravity}<small>{s.platform}</small></td>)}</tr><tr><th>Fuel</th>{chosen.map(s => <td key={s.id}>{s.fuelState}</td>)}</tr>{names.map(id => { const first = chosen.flatMap(s => s.variables).find(v => v.id === id); return <tr key={id}><th>{first.name}</th>{chosen.map(s => { const v = s.variables.find(v => v.id === id); return <td key={s.id}>{v ? <><span className={v.value === null ? 'missing-value' : ''}>{v.value ?? 'Not reported'}{v.value !== null && v.unit ? ` ${v.unit}` : ''}</span><small>{v.kind} · {v.page}</small><p>{v.note}</p></> : <span className="missing-value">Not recorded in this profile</span>}</td>; })}</tr>; })}</tbody></table></div><div className="inline-note"><Info size={16} /><p>Shared microgravity does not establish comparability. Review fuel, geometry, atmosphere, ventilation and measurement method.</p></div></>}</main>;
}

if (typeof document !== 'undefined') createRoot(document.getElementById('root')).render(<App />);
