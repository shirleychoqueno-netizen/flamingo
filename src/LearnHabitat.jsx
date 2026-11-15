import React, {useMemo, useState} from 'react';
import {ArrowUpRight, Info, MousePointerClick, RotateCcw, Sparkles, Layers3, Gauge, FlaskConical, Expand, Tags, Box, Flame, Siren, CircleHelp as HelpCircle} from 'lucide-react';
import {learnHabitats, learnDisclaimer} from './learn-habitats';
import {investigations} from './investigation-catalog';
import HabitatViewer from './HabitatViewer';
import FlameLab from './FlameLab';
import FireMission from './FireMission';
import './learn.css';

const byAccession = Object.fromEntries(investigations.map(s => [s.accession, s]));
const modes = [
 ['habitat', Box, 'Hábitats 3D', 'Explora las partes'],
 ['lab', Flame, 'Laboratorio de llama', 'Cambia la gravedad'],
 ['mission', Siren, 'Misión', '¡Humo en el módulo!'],
];

function HabitatExplorer({onAsk}) {
 const [habitatId, setHabitatId] = useState('station');
 const habitat = learnHabitats.find(h => h.id === habitatId);
 const [selectedId, setSelectedId] = useState(habitat.components[0].id);
 const [hoveredId, setHoveredId] = useState(null);
 const [exploded, setExploded] = useState(false);
 const [labels, setLabels] = useState(true);
 const [resetToken, setResetToken] = useState(0);
 const component = habitat.components.find(c => c.id === selectedId) || habitat.components[0];
 const index = habitat.components.indexOf(component);
 const hovered = habitat.components.find(c => c.id === hoveredId);
 const related = useMemo(() => component.related.map(id => byAccession[id]).filter(Boolean), [component]);
 const chooseHabitat = id => { const next = learnHabitats.find(h => h.id === id); setHabitatId(id); setSelectedId(next.components[0].id); setHoveredId(null); setExploded(false); };

 return <>
  <div className="learn-habitat-tabs" role="tablist" aria-label="Elige un hábitat">
   {learnHabitats.map(h => <button key={h.id} role="tab" aria-selected={h.id === habitatId} className={h.id === habitatId ? 'active' : ''} onClick={() => chooseHabitat(h.id)}><small>{h.kind}</small><strong>{h.name}</strong></button>)}
  </div>
  <section className="learn-layout">
   <div className="learn-stage">
    <HabitatViewer habitatId={habitatId} components={habitat.components} selected={component.id} onSelect={setSelectedId} onHover={setHoveredId} exploded={exploded} showLabels={labels} resetToken={resetToken}/>
    <div className="learn-stage-hint"><MousePointerClick size={14}/>{hovered ? hovered.name : 'Arrastra para girar · rueda para acercar · toca una parte'}</div>
    <div className="learn-stage-tools">
     <button className={`learn-tool ${exploded ? 'active' : ''}`} onClick={() => setExploded(v => !v)} aria-pressed={exploded}><Expand size={15}/>{exploded ? 'Unir partes' : 'Separar partes'}</button>
     <button className={`learn-tool ${labels ? 'active' : ''}`} onClick={() => setLabels(v => !v)} aria-pressed={labels}><Tags size={15}/>Números</button>
     <button className="learn-tool" onClick={() => setResetToken(t => t + 1)} aria-label="Volver a la vista inicial"><RotateCcw size={15}/></button>
    </div>
    <dl className="learn-environment">{habitat.environment.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
   </div>

   <aside className="learn-panel" aria-live="polite">
    <p className="learn-intro">{habitat.intro}</p>
    <div className="learn-component-list" role="listbox" aria-label="Partes del hábitat">
     {habitat.components.map((c, i) => <button key={c.id} role="option" aria-selected={c.id === component.id} className={c.id === component.id ? 'active' : ''} onClick={() => setSelectedId(c.id)} onMouseEnter={() => setHoveredId(c.id)} onMouseLeave={() => setHoveredId(null)}><b>{i + 1}</b>{c.name}</button>)}
    </div>
    <article className="learn-component" key={component.id}>
     <span className="learn-kicker">{habitat.name} · parte {index + 1}</span>
     <h2>{component.name}</h2>
     <h3><HelpCircle size={15}/>¿Qué es?</h3>
     <p>{component.what}</p>
     <h3><Layers3 size={15}/>¿De qué está hecho?</h3>
     <ul className="learn-materials">{component.materials.map(([name, note]) => <li key={name}><strong>{name}</strong><span>{note}</span></li>)}</ul>
     <h3><Gauge size={15}/>Condiciones a su alrededor</h3>
     <dl className="learn-conditions">{component.conditions.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
     <h3><Sparkles size={15}/>¿Y el fuego?</h3>
     <ul className="learn-notes">{component.fire.map(note => <li key={note}>{note}</li>)}</ul>
     <h3><FlaskConical size={15}/>Investigaciones reales</h3>
     {related.length ? <ul className="learn-related">{related.map(s => <li key={s.accession}><a href={`#investigation/${s.accession}`}><span className="library-study-code">{s.accession} / {s.acronym || 'NASA PSI'}</span><strong>{s.title}</strong><ArrowUpRight size={14}/></a></li>)}</ul> : <p className="nasa-caption">Ninguna investigación del catálogo trata directamente esta parte.</p>}
     {component.question && <button className="button secondary learn-ask" onClick={() => onAsk?.(component.question)}><Sparkles size={15}/>Preguntar a la guía</button>}
    </article>
   </aside>
  </section>
 </>;
}

export default function LearnHabitat({navigate, onAsk}) {
 const [mode, setMode] = useState('habitat');
 return <main className="utility-page learn-page" lang="es">
  <div className="page-title"><div><div className="eyebrow">APRENDE EXPLORANDO</div><h1>¿Cómo se comporta el fuego en el espacio?</h1><p>Recorre una nave, una base lunar y un rover pieza por pieza, juega con una llama cambiando la gravedad y pon a prueba lo aprendido en una misión.</p></div><span className="status-pill"><span/>Para escolares · secundaria</span></div>
  <div className="learn-modes" role="tablist" aria-label="Actividades">
   {modes.map(([id, Icon, title, sub]) => <button key={id} role="tab" aria-selected={mode === id} className={mode === id ? 'active' : ''} onClick={() => setMode(id)}><Icon size={22}/><span><strong>{title}</strong><small>{sub}</small></span></button>)}
  </div>
  <div className="learn-disclaimer" role="note"><Info size={16}/><p>{learnDisclaimer}</p></div>
  {mode === 'habitat' ? <HabitatExplorer onAsk={onAsk}/> : mode === 'lab' ? <FlameLab/> : <FireMission/>}
  <div className="learn-footer-actions"><button className="button primary" onClick={() => navigate('explore')}>Ver todas las investigaciones<ArrowUpRight size={15}/></button><button className="button secondary" onClick={() => navigate('library')}>Ir a la biblioteca</button></div>
 </main>;
}
