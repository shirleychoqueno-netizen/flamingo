import React, {useEffect, useMemo, useRef, useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {ArrowUpRight, Info, MousePointerClick, RotateCcw, Sparkles, Layers3, Gauge, FlaskConical} from 'lucide-react';
import {learnHabitats, learnDisclaimer} from './learn-habitats';
import {investigations} from './investigation-catalog';
import './learn.css';

const byAccession = Object.fromEntries(investigations.map(s => [s.accession, s]));
const HOVER = new THREE.Color('#2b2118');
const SELECT = new THREE.Color('#8a4316');

/* ---------- Scene building helpers ---------- */
function material(color, extra = {}) {
 return new THREE.MeshStandardMaterial({color, roughness: .62, metalness: .18, ...extra});
}
function part(group, id, geometry, color, position = [0, 0, 0], extra = {}, rotation) {
 const mesh = new THREE.Mesh(geometry, material(color, extra));
 mesh.position.set(...position);
 if (rotation) mesh.rotation.set(...rotation);
 mesh.userData.component = id;
 group.add(mesh);
 return mesh;
}
function stars(group, count = 500, radius = 60) {
 const positions = new Float32Array(count * 3);
 for (let i = 0; i < count; i++) {
  const v = new THREE.Vector3().randomDirection().multiplyScalar(radius * (.7 + Math.random() * .3));
  positions.set([v.x, v.y, v.z], i * 3);
 }
 const geometry = new THREE.BufferGeometry();
 geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
 group.add(new THREE.Points(geometry, new THREE.PointsMaterial({color: '#9fb3c8', size: .12, sizeAttenuation: true})));
}

function buildStation(g) {
 stars(g);
 const hull = part(g, 'hull', new THREE.CylinderGeometry(1.6, 1.6, 7, 48, 1, true), '#93a7bb', [0, 0, 0], {transparent: true, opacity: .2, side: THREE.DoubleSide, depthWrite: false}, [0, 0, Math.PI / 2]);
 hull.renderOrder = 2;
 for (const x of [-3.5, 3.5]) part(g, 'hull', new THREE.TorusGeometry(1.6, .07, 12, 48), '#b9c7d6', [x, 0, 0], {}, [0, Math.PI / 2, 0]);
 part(g, 'hull', new THREE.CircleGeometry(1.6, 48), '#6f8295', [-3.5, 0, 0], {side: THREE.DoubleSide, transparent: true, opacity: .55}, [0, Math.PI / 2, 0]);
 for (const z of [-1, 1]) {
  part(g, 'hull', new THREE.BoxGeometry(.12, .12, 2.2), '#6f8295', [-1.5, 0, z * 2.7]);
  part(g, 'hull', new THREE.BoxGeometry(2.4, .04, 2.6), '#2c4f7c', [-1.5, 0, z * 4.9], {metalness: .5, roughness: .35});
 }
 part(g, 'quarters', new THREE.BoxGeometry(1.25, 2.1, .7), '#c9b79a', [-2.5, 0, -.78]);
 part(g, 'quarters', new THREE.BoxGeometry(.9, .5, .05), '#6d5f4c', [-2.5, .3, -.41]);
 part(g, 'avionics', new THREE.BoxGeometry(1.05, 2.1, .7), '#4b5868', [-.95, 0, -.78]);
 for (let i = 0; i < 6; i++) part(g, 'avionics', new THREE.BoxGeometry(.8, .05, .03), i % 2 ? '#79d0a0' : '#5aa2e6', [-.95, -.8 + i * .32, -.42], {emissive: i % 2 ? '#1d5e3c' : '#1b4a78'});
 part(g, 'research', new THREE.BoxGeometry(1.05, 2.1, .7), '#6c7b8d', [.55, 0, -.78]);
 part(g, 'research', new THREE.CylinderGeometry(.32, .32, .7, 24), '#2b3440', [.55, .1, -.42], {}, [Math.PI / 2, 0, 0]);
 part(g, 'research', new THREE.SphereGeometry(.11, 20, 16), '#ffb36b', [.55, .1, -.05], {emissive: '#ff7a1a', emissiveIntensity: 1.6});
 for (let i = 0; i < 7; i++) {
  const x = -2.6 + i * .78;
  part(g, 'stowage', new THREE.BoxGeometry(.6, .5, .45), i % 2 ? '#e3d7bf' : '#cfc3aa', [x, -.55 + (i % 3) * .5, .95], {roughness: .9});
 }
 const duct = new THREE.CatmullRomCurve3([new THREE.Vector3(-3.3, 1.12, .2), new THREE.Vector3(0, 1.18, .1), new THREE.Vector3(3.3, 1.12, .2)]);
 part(g, 'ventilation', new THREE.TubeGeometry(duct, 40, .13, 12, false), '#7c95ad');
 for (const x of [-2, 1.6]) part(g, 'ventilation', new THREE.CylinderGeometry(.24, .24, .2, 24), '#a8bccd', [x, 1.13, .15]);
 part(g, 'cargo', new THREE.CylinderGeometry(.7, 1.1, .7, 32), '#b8a37b', [3.85, 0, 0], {}, [0, 0, Math.PI / 2]);
 part(g, 'cargo', new THREE.CylinderGeometry(1.15, 1.15, 2.8, 36), '#d6c49b', [5.6, 0, 0], {}, [0, 0, Math.PI / 2]);
 for (const z of [-1, 1]) part(g, 'cargo', new THREE.CylinderGeometry(1.1, 1.1, .04, 32), '#2c4f7c', [6.6, 0, z * 2.4], {metalness: .5, roughness: .35}, [Math.PI / 2, 0, 0]);
 return {camera: [5.5, 3.6, 8.5], target: [.8, 0, 0]};
}

function buildLunar(g) {
 stars(g, 400);
 const ground = new THREE.Mesh(new THREE.CircleGeometry(22, 64), material('#5d5f63', {roughness: 1}));
 ground.rotation.x = -Math.PI / 2;
 g.add(ground);
 for (const [x, z, r] of [[-9, -6, 1.6], [8, 7, 1.1], [10, -8, 2], [-7, 9, .9]]) {
  const crater = new THREE.Mesh(new THREE.TorusGeometry(r, .18, 8, 32), material('#6c6e72', {roughness: 1}));
  crater.rotation.x = -Math.PI / 2; crater.position.set(x, .02, z); crater.scale.z = .4; g.add(crater);
 }
 part(g, 'habitat', new THREE.CylinderGeometry(1.5, 1.5, 5, 40), '#dfe3e8', [0, 1.6, 0], {}, [0, 0, Math.PI / 2]);
 for (const x of [-2.5, 2.5]) part(g, 'habitat', new THREE.SphereGeometry(1.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), '#dfe3e8', [x, 1.6, 0], {}, [0, 0, x < 0 ? Math.PI / 2 : -Math.PI / 2]);
 for (let i = -2; i <= 2; i++) part(g, 'habitat', new THREE.TorusGeometry(1.52, .04, 8, 40), '#aab3bd', [i, 1.6, 0], {}, [0, Math.PI / 2, 0]);
 part(g, 'airlock', new THREE.CylinderGeometry(.85, .85, 1.7, 32), '#c8ced6', [-4.75, 1.3, 0], {}, [0, 0, Math.PI / 2]);
 part(g, 'airlock', new THREE.CylinderGeometry(.6, .6, .08, 32), '#e08a4c', [-5.62, 1.3, 0], {}, [0, 0, Math.PI / 2]);
 part(g, 'lab', new THREE.CylinderGeometry(.5, .5, 1.6, 24), '#c8ced6', [.8, 1.2, 2.1], {}, [Math.PI / 2, 0, 0]);
 part(g, 'lab', new THREE.CylinderGeometry(1.15, 1.15, 3.2, 36), '#e9ecef', [.8, 1.25, 4.1], {}, [0, 0, Math.PI / 2]);
 part(g, 'lab', new THREE.BoxGeometry(.9, .25, .25), '#5aa2e6', [.8, 2.25, 4.1], {emissive: '#1b4a78'});
 for (const [x, color] of [[2.6, '#e6e9ec'], [3.4, '#9fc2e8']]) part(g, 'atmosphere', new THREE.CylinderGeometry(.33, .33, 1.9, 24), color, [x, .95, -2.6]);
 part(g, 'atmosphere', new THREE.BoxGeometry(1.2, .8, .8), '#8b98a6', [1.4, .4, -2.6]);
 part(g, 'atmosphere', new THREE.CylinderGeometry(.06, .06, 1.3, 8), '#b0bac5', [1.6, 1, -1.9], {}, [Math.PI / 2, 0, 0]);
 part(g, 'power', new THREE.CylinderGeometry(.08, .1, 5, 10), '#aab3bd', [-6.5, 2.5, 5.5]);
 part(g, 'power', new THREE.BoxGeometry(3, .05, 1.8), '#2c4f7c', [-6.5, 5, 5.5], {metalness: .5, roughness: .3}, [-.5, 0, 0]);
 part(g, 'power', new THREE.BoxGeometry(1.4, .9, 1), '#6a7380', [-5.3, .45, 4.3]);
 part(g, 'power', new THREE.BoxGeometry(1.1, .05, .1), '#79d0a0', [-5.3, .7, 3.79], {emissive: '#1d5e3c'});
 const berm = part(g, 'shielding', new THREE.TorusGeometry(7.2, .9, 12, 64, Math.PI * 1.55), '#7b746a', [0, 0, 0], {roughness: 1}, [Math.PI / 2, 0, Math.PI * .72]);
 berm.scale.z = .6;
 return {camera: [9.5, 7.5, 11.5], target: [0, 1, .8], ground: true};
}

function buildRover(g) {
 stars(g, 300);
 const ground = new THREE.Mesh(new THREE.CircleGeometry(16, 48), material('#5d5f63', {roughness: 1}));
 ground.rotation.x = -Math.PI / 2;
 g.add(ground);
 const chassis = new THREE.Mesh(new THREE.BoxGeometry(4.2, .3, 2.3), material('#3d434b'));
 chassis.position.set(0, .85, 0); g.add(chassis);
 for (const x of [-1.5, 0, 1.5]) for (const z of [-1.25, 1.25]) {
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .35, 24), material('#23272d', {roughness: .9}));
  wheel.rotation.x = Math.PI / 2; wheel.position.set(x, .45, z); g.add(wheel);
 }
 for (const x of [-1, .9]) part(g, 'battery', new THREE.BoxGeometry(1.4, .3, 1.6), '#c7793d', [x, .55, 0]);
 part(g, 'cabin', new THREE.BoxGeometry(3.4, 1.4, 2.1), '#e9ecef', [-.2, 1.7, 0]);
 part(g, 'cabin', new THREE.CylinderGeometry(1.05, 1.05, 3.4, 32, 1, false, 0, Math.PI), '#e9ecef', [-.2, 2.4, 0], {}, [0, 0, Math.PI / 2]);
 part(g, 'window', new THREE.BoxGeometry(.1, .7, 1.7), '#5f8fbf', [1.53, 1.95, 0], {metalness: .7, roughness: .1, transparent: true, opacity: .85}, [0, 0, -.25]);
 part(g, 'window', new THREE.CylinderGeometry(.42, .42, .08, 28), '#9aa5b1', [1.53, 1.25, 0], {}, [0, 0, Math.PI / 2]);
 for (const z of [-.5, .5]) {
  part(g, 'suitports', new THREE.TorusGeometry(.32, .07, 12, 28), '#e08a4c', [-1.95, 1.75, z], {}, [0, Math.PI / 2, 0]);
  part(g, 'suitports', new THREE.CapsuleGeometry(.25, .7, 6, 12), '#f1f1ee', [-2.3, 1.55, z]);
 }
 part(g, 'lifesupport', new THREE.BoxGeometry(1.4, .3, 1.2), '#8b98a6', [-.6, 3.5, 0]);
 part(g, 'lifesupport', new THREE.BoxGeometry(1.8, .04, 1.9), '#cfd8e2', [.7, 3.5, 0], {metalness: .6, roughness: .25}, [0, 0, .08]);
 return {camera: [6.2, 4.4, 6.4], target: [0, 1.6, 0], ground: true};
}

const builders = {station: buildStation, lunar: buildLunar, rover: buildRover};

/* ---------- 3D viewport ---------- */
function HabitatViewport({habitatId, selected, onSelect, onHover, resetToken}) {
 const mountRef = useRef(null);
 const stateRef = useRef({});
 const onSelectRef = useRef(onSelect); onSelectRef.current = onSelect;
 const onHoverRef = useRef(onHover); onHoverRef.current = onHover;

 useEffect(() => {
  const mount = mountRef.current;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({antialias: true, alpha: false}); }
  catch { stateRef.current.failed = true; mount.dataset.failed = 'true'; return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor('#0a0f16');
  mount.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#0a0f16', 30, 70);
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 200);
  scene.add(new THREE.HemisphereLight('#c8dcff', '#1a1410', .9));
  const sun = new THREE.DirectionalLight('#fff3e2', 2.2); sun.position.set(8, 12, 6); scene.add(sun);
  const rim = new THREE.DirectionalLight('#7fb2ff', .6); rim.position.set(-8, 4, -6); scene.add(rim);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = .08; controls.minDistance = 3; controls.maxDistance = 30;
  controls.autoRotate = true; controls.autoRotateSpeed = .6;
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down = null, hovered = null;
  const pick = event => {
   const rect = renderer.domElement.getBoundingClientRect();
   pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
   raycaster.setFromCamera(pointer, camera);
   const hit = raycaster.intersectObjects(stateRef.current.meshes || [], false)[0];
   return hit?.object.userData.component || null;
  };
  const onMove = event => {
   const id = pick(event);
   if (id !== hovered) { hovered = id; stateRef.current.hovered = id; renderer.domElement.style.cursor = id ? 'pointer' : 'grab'; onHoverRef.current(id); stateRef.current.paint?.(); }
  };
  const onDown = event => { down = [event.clientX, event.clientY]; };
  const onUp = event => {
   if (!down) return;
   const moved = Math.hypot(event.clientX - down[0], event.clientY - down[1]); down = null;
   if (moved < 5) { const id = pick(event); if (id) onSelectRef.current(id); }
  };
  const onLeave = () => { hovered = null; stateRef.current.hovered = null; onHoverRef.current(null); stateRef.current.paint?.(); };
  renderer.domElement.addEventListener('pointermove', onMove);
  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('pointerup', onUp);
  renderer.domElement.addEventListener('pointerleave', onLeave);
  const resize = () => {
   const {clientWidth: w, clientHeight: h} = mount;
   if (!w || !h) return;
   renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize); observer.observe(mount); resize();
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) controls.autoRotate = false;
  let frame;
  const loop = () => { controls.update(); renderer.render(scene, camera); frame = requestAnimationFrame(loop); };
  loop();
  Object.assign(stateRef.current, {renderer, scene, camera, controls});
  return () => {
   cancelAnimationFrame(frame); observer.disconnect(); controls.dispose();
   stateRef.current.group && disposeGroup(stateRef.current.group);
   renderer.dispose(); renderer.domElement.remove();
   stateRef.current = {};
  };
 }, []);

 // Build or swap the habitat model.
 useEffect(() => {
  const s = stateRef.current;
  if (!s.scene) return;
  if (s.group) { s.scene.remove(s.group); disposeGroup(s.group); }
  const group = new THREE.Group();
  const view = builders[habitatId](group);
  s.scene.add(group);
  s.group = group; s.view = view;
  s.meshes = []; group.traverse(o => { if (o.isMesh && o.userData.component) s.meshes.push(o); });
  s.paint = () => {
   for (const mesh of s.meshes) {
    const id = mesh.userData.component;
    const m = mesh.material;
    if (!m.userData.base) m.userData.base = m.emissive.clone();
    m.emissive.copy(id === s.selected ? SELECT : id === s.hovered ? HOVER : m.userData.base);
    if (id === s.selected && m.userData.base.getHex()) m.emissive.add(m.userData.base);
   }
  };
  s.controls.maxPolarAngle = view.ground ? Math.PI * .47 : Math.PI;
  s.camera.position.set(...view.camera); s.controls.target.set(...view.target); s.controls.update();
  s.paint();
 }, [habitatId]);

 useEffect(() => { const s = stateRef.current; s.selected = selected; s.paint?.(); }, [selected, habitatId]);

 useEffect(() => {
  const s = stateRef.current;
  if (!resetToken || !s.view) return;
  s.camera.position.set(...s.view.camera); s.controls.target.set(...s.view.target); s.controls.update();
 }, [resetToken]);

 return <div className="learn-viewport" ref={mountRef} role="img" aria-label="Interactive 3D habitat model. Use the component list to select parts with the keyboard.">
  <p className="learn-viewport-fallback">3D view unavailable in this browser. Use the component list to explore.</p>
 </div>;
}

function disposeGroup(group) {
 group.traverse(o => { o.geometry?.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); });
}

/* ---------- Page ---------- */
export default function LearnHabitat({navigate, onAsk}) {
 const [habitatId, setHabitatId] = useState('station');
 const habitat = learnHabitats.find(h => h.id === habitatId);
 const [selectedId, setSelectedId] = useState(habitat.components[0].id);
 const [hoveredId, setHoveredId] = useState(null);
 const [resetToken, setResetToken] = useState(0);
 const component = habitat.components.find(c => c.id === selectedId) || habitat.components[0];
 const hovered = habitat.components.find(c => c.id === hoveredId);
 const related = useMemo(() => component.related.map(id => byAccession[id]).filter(Boolean), [component]);

 const chooseHabitat = id => { const next = learnHabitats.find(h => h.id === id); setHabitatId(id); setSelectedId(next.components[0].id); setHoveredId(null); };

 return <main className="utility-page learn-page">
  <div className="page-title"><div><div className="eyebrow">LEARN BY EXPLORING</div><h1>Step inside a space habitat.</h1><p>Rotate a spacecraft, a lunar base or a pressurized rover. Select any component to see its materials, the conditions around it and the NASA investigations that help explain how fire could behave there.</p></div><span className="status-pill"><span/>Educational tool</span></div>

  <div className="learn-disclaimer" role="note"><Info size={16}/><p>{learnDisclaimer}</p></div>

  <div className="learn-habitat-tabs" role="tablist" aria-label="Choose a habitat">
   {learnHabitats.map(h => <button key={h.id} role="tab" aria-selected={h.id === habitatId} className={h.id === habitatId ? 'active' : ''} onClick={() => chooseHabitat(h.id)}><small>{h.kind}</small><strong>{h.name}</strong></button>)}
  </div>

  <section className="learn-layout">
   <div className="learn-stage">
    <HabitatViewport habitatId={habitatId} selected={component.id} onSelect={setSelectedId} onHover={setHoveredId} resetToken={resetToken}/>
    <div className="learn-stage-hint"><MousePointerClick size={14}/>{hovered ? hovered.name : 'Drag to rotate · scroll to zoom · click a component'}</div>
    <button className="learn-reset icon-button" onClick={() => setResetToken(t => t + 1)} aria-label="Reset view" title="Reset view"><RotateCcw size={16}/></button>
    <dl className="learn-environment">{habitat.environment.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
   </div>

   <aside className="learn-panel" aria-live="polite">
    <p className="learn-intro">{habitat.intro}</p>
    <div className="learn-component-list" role="listbox" aria-label="Habitat components">
     {habitat.components.map(c => <button key={c.id} role="option" aria-selected={c.id === component.id} className={c.id === component.id ? 'active' : ''} onClick={() => setSelectedId(c.id)} onMouseEnter={() => setHoveredId(c.id)} onMouseLeave={() => setHoveredId(null)}>{c.name}</button>)}
    </div>

    <article className="learn-component">
     <span className="learn-kicker">{habitat.name} / component</span>
     <h2>{component.name}</h2>
     <p>{component.summary}</p>

     <h3><Layers3 size={15}/>Materials</h3>
     <ul className="learn-materials">{component.materials.map(([name, note]) => <li key={name}><strong>{name}</strong><span>{note}</span></li>)}</ul>

     <h3><Gauge size={15}/>Environmental conditions</h3>
     <dl className="learn-conditions">{component.conditions.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>

     <h3><Sparkles size={15}/>Why it matters for fire</h3>
     <ul className="learn-notes">{component.notes.map(note => <li key={note}>{note}</li>)}</ul>

     <h3><FlaskConical size={15}/>Related investigations</h3>
     {related.length ? <ul className="learn-related">{related.map(s => <li key={s.accession}><a href={`#investigation/${s.accession}`}><span className="library-study-code">{s.accession} / {s.acronym || 'NASA PSI'}</span><strong>{s.title}</strong><ArrowUpRight size={14}/></a></li>)}</ul> : <p className="nasa-caption">No catalogue investigation applies directly to this component.</p>}

     {component.question && <button className="button secondary learn-ask" onClick={() => onAsk?.(component.question)}><Sparkles size={15}/>Ask the research guide about this</button>}
    </article>
   </aside>
  </section>

  <div className="learn-footer-actions"><button className="button primary" onClick={() => navigate('explore')}>Explore all investigations<ArrowUpRight size={15}/></button><button className="button secondary" onClick={() => navigate('library')}>Back to the library</button></div>
 </main>;
}
