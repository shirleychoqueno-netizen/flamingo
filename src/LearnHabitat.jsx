import React, {useMemo, useState} from 'react';
import {ArrowUpRight, Info, MousePointerClick, RotateCcw, Sparkles, Layers3, Gauge, FlaskConical, Expand, Tags, Box, Flame, Siren, CircleHelp as HelpCircle, Play, Pause} from 'lucide-react';
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

const headings = {
 habitat: ['01 · HÁBITATS 3D', 'Recorre el espacio', 'pieza por pieza.', 'Gira el modelo, toca un número y descubre de qué está hecha cada parte y qué tiene que ver con el fuego.'],
 lab: ['02 · LABORATORIO DE LLAMA', 'Cambia la gravedad.', 'Mira cómo cambia la llama.', 'Mueve los controles y compara una vela en la Tierra, en la Luna y en órbita.'],
 mission: ['03 · MISIÓN', '¡Suena la alarma!', 'Tú decides qué hacer.', 'Seis decisiones, puntos por cada acierto y una explicación en cada paso.'],
};

export default function LearnHabitat({navigate, onAsk}) {
 const [mode, setMode] = useState('habitat');
 const [paused, setPaused] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
 const choose = id => { setMode(id); requestAnimationFrame(() => document.getElementById('learn-activity')?.scrollIntoView({behavior: 'smooth', block: 'start'})); };
 const [eyebrow, title, accent, lead] = headings[mode];
 return <main className="research-home learn-page" lang="es">
  <section className="discovery-hero learn-hero">
   <div className="discovery-intro">
    <div className="home-eyebrow"><span/>APRENDE EXPLORANDO · SECUNDARIA</div>
    <h1>Fuego en el espacio.<br/><em>Aprende jugando.</em></h1>
    <p className="discovery-lead">Recorre una nave, una base lunar y un rover pieza por pieza.<br/>Juega con una llama cambiando la gravedad y ponte a prueba en una misión.</p>
    <div className="learn-hero-actions">{modes.map(([id, Icon, t, sub]) => <button key={id} className={`learn-hero-chip ${mode === id ? 'active' : ''}`} onClick={() => choose(id)}><Icon size={18}/><span><strong>{t}</strong><small>{sub}</small></span><ArrowUpRight size={15}/></button>)}</div>
   </div>
   <div className="discovery-visual">
    {paused ? <img src="/media/droplet-flame.jpg" alt=""/> : <video autoPlay muted loop playsInline preload="metadata" poster="/media/droplet-flame.jpg" onLoadedMetadata={e => { e.currentTarget.currentTime = 28; }} onTimeUpdate={e => { if (e.currentTarget.currentTime > 57) e.currentTarget.currentTime = 28; }} aria-label="Gota de combustible ardiendo en microgravedad, NASA FLEX-2"><source src="/media/flex-2.webm" type="video/webm"/></video>}
    <div className="discovery-video-caption"><div><strong>Sin “arriba”,<br/>la llama es una esfera.</strong><span>FLEX-2 · gota en órbita</span></div><button className="motion-toggle" onClick={() => setPaused(!paused)} aria-label={paused ? 'Reproducir video' : 'Pausar video'}>{paused ? <Play size={17}/> : <Pause size={17}/>}</button></div>
   </div>
  </section>

  <section className="home-proof learn-proof" aria-label="Lo que puedes explorar">
   <div><strong>3</strong><span>hábitats en 3D</span></div>
   <div><strong>18</strong><span>partes para descubrir</span></div>
   <div><strong>6</strong><span>decisiones en la misión</span></div>
   <div className="home-proof-source"><Info size={22}/><span>Herramienta educativa.<br/><strong>No es una simulación validada.</strong></span></div>
  </section>

  <nav className="learn-modes" role="tablist" aria-label="Actividades" id="learn-activity">
   {modes.map(([id, Icon, t, sub], i) => <button key={id} role="tab" aria-selected={mode === id} className={mode === id ? 'active' : ''} onClick={() => setMode(id)}><span className="learn-mode-index">0{i + 1}</span><Icon size={20}/><span><strong>{t}</strong><small>{sub}</small></span></button>)}
  </nav>

  <div className="home-section-heading learn-section-heading" key={mode}>
   <div><div className="home-eyebrow"><span/>{eyebrow}</div><h2>{title}<br/><em>{accent}</em></h2></div>
   <p>{lead}</p>
  </div>

  {mode === 'habitat' ? <HabitatExplorer onAsk={onAsk}/> : mode === 'lab' ? <FlameLab/> : <FireMission/>}

  <p className="learn-disclaimer" role="note"><Info size={15}/>{learnDisclaimer}</p>
  <section className="home-featured learn-next">
   <div className="home-section-heading"><div><div className="home-eyebrow">¿QUIERES IR MÁS LEJOS?</div><h2>Los experimentos reales<br/>están en la colección.</h2></div><button className="button secondary" onClick={() => navigate('explore')}>Ver todas las investigaciones<ArrowUpRight size={16}/></button></div>
  </section>
  <div className="home-independent"><strong>flamingo</strong><span>Aprende · fuego en el espacio para escolares</span><p>Hecho con investigaciones públicas de NASA. Herramienta educativa; no es una certificación de seguridad.</p></div>
 </main>;
}
