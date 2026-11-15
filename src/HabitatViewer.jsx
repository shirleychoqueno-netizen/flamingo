import React, {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';

function sunSprite() {
 const c = document.createElement('canvas'); c.width = c.height = 256;
 const g = c.getContext('2d'), grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
 grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(.08, 'rgba(255,250,235,1)'); grad.addColorStop(.2, 'rgba(255,220,170,.55)'); grad.addColorStop(.5, 'rgba(255,170,90,.12)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
 g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
 const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
 const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: t, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false}));
 sp.scale.set(16, 16, 1);
 return sp;
}
import {builders, disposeTextureCache} from './learn-scenes';

const HOVER = new THREE.Color('#3a2412');
const SELECT = new THREE.Color('#ff6a00');

function disposeObject(obj) {
 obj.traverse(o => {
  o.geometry?.dispose();
  if (o.material) [].concat(o.material).forEach(m => m.dispose());
 });
}

/**
 * Interactive 3D habitat.
 * components: ordered [{id,name}] used for numbered labels.
 */
export default function HabitatViewer({habitatId, components, selected, onSelect, onHover, exploded, showLabels, resetToken, callout}) {
 const mountRef = useRef(null);
 const labelsRef = useRef(null);
 const calloutRef = useRef(null);
 const s = useRef({}).current;
 const cb = useRef({onSelect, onHover}); cb.current = {onSelect, onHover};

 // One-time renderer setup.
 useEffect(() => {
  const mount = mountRef.current;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({antialias: true, powerPreference: 'high-performance'}); }
  catch { mount.dataset.failed = 'true'; return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  mount.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#02040a');
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .45;
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 600);
  const sun = new THREE.DirectionalLight('#fff4e6', 3.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 120});
  sun.shadow.bias = -.0004; sun.shadow.normalBias = .02;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight('#9fb8e6', '#1a1612', .35));
  const fill = new THREE.DirectionalLight('#6f9cff', .45); fill.position.set(-15, 6, -10); scene.add(fill);

  const sunDisc = sunSprite(); scene.add(sunDisc);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), .32, .45, 1.6);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, {enableDamping: true, dampingFactor: .07, minDistance: 4, maxDistance: 45, autoRotate: !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, autoRotateSpeed: .45});
  controls.addEventListener('start', () => { controls.autoRotate = false; s.focus = null; });

  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  const pick = e => {
   const r = renderer.domElement.getBoundingClientRect();
   ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
   ray.setFromCamera(ptr, camera);
   const hit = ray.intersectObjects(s.meshes || [], false)[0];
   return hit?.object.userData.component || null;
  };
  let down = null;
  const el = renderer.domElement;
  const onMove = e => { const id = pick(e); if (id !== s.hovered) { s.hovered = id; el.style.cursor = id ? 'pointer' : 'grab'; cb.current.onHover(id); s.paint?.(); } };
  const onDown = e => { down = [e.clientX, e.clientY]; };
  const onUp = e => { if (!down) return; const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]); down = null; if (moved < 6) { const id = pick(e); if (id) cb.current.onSelect(id); } };
  const onLeave = () => { s.hovered = null; cb.current.onHover(null); s.paint?.(); };
  el.addEventListener('pointermove', onMove); el.addEventListener('pointerdown', onDown); el.addEventListener('pointerup', onUp); el.addEventListener('pointerleave', onLeave);

  const resize = () => { const w = mount.clientWidth, h = mount.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); camera.aspect = w / h; camera.fov = camera.aspect < 1.1 ? 58 : 38; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(mount); resize();

  const v = new THREE.Vector3();
  let frame;
  const loop = () => {
   // Smooth exploded-view animation.
   if (s.groups) for (const [id, g] of Object.entries(s.groups)) {
    const target = s.explodeOffsets?.[id];
    if (target) g.position.lerp(s.exploded ? target : v.set(0, 0, 0), .09);
   }
   // Soft pulse on the selected component.
   const pulse = (Math.sin(performance.now() / 380) + 1) / 2;
   if (s.meshes && Math.abs(pulse - (s.pulse || 0)) > .04) { s.pulse = pulse; s.paint?.(); }
   // Gentle camera focus on the selected component.
   if (s.focus) { controls.target.lerp(s.focus, .06); if (controls.target.distanceTo(s.focus) < .02) s.focus = null; }
   controls.update();
   composer.render();
   // Numbered labels follow their component.
   const box = labelsRef.current;
   if (box && s.anchors) {
    const w = mount.clientWidth, h = mount.clientHeight;
    for (const node of box.children) {
     const id = node.dataset.id, a = s.anchors[id], g = s.groups?.[id];
     if (!a || !g) { node.style.display = 'none'; continue; }
     v.copy(a).add(g.position).project(camera);
     const visible = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
     node.style.display = visible ? '' : 'none';
     node.style.transform = `translate(${(v.x * .5 + .5) * w}px, ${(-v.y * .5 + .5) * h}px) translate(-50%, -50%)`;
    }
   }
   // Short info card follows the selected part (docked at the bottom on narrow screens).
   const card = calloutRef.current;
   if (card && s.selected && s.anchors?.[s.selected] && s.groups?.[s.selected]) {
    const w = mount.clientWidth, h = mount.clientHeight;
    if (w < 700) { card.style.transform = ''; card.dataset.docked = 'true'; }
    else {
     card.dataset.docked = 'false';
     v.copy(s.centers[s.selected]).add(s.groups[s.selected].position).project(camera);
     const px = (v.x * .5 + .5) * w, py = (-v.y * .5 + .5) * h;
     const cw = card.offsetWidth, ch = card.offsetHeight, gap = 46;
     let x = px + gap; if (x + cw > w - 16) x = px - gap - cw;
     x = Math.max(16, Math.min(w - cw - 16, x));
     const y = Math.max(64, Math.min(h - ch - 72, py - ch / 2));
     card.style.transform = `translate(${x}px, ${y}px)`;
     const line = card.querySelector('.learn-callout-line');
     if (line) { const right = x > px; const lx = right ? 0 : cw; const dx = px - (x + lx), dy = py - (y + ch / 2); line.style.width = `${Math.hypot(dx, dy)}px`; line.style.left = `${lx}px`; line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`; }
    }
   }
   frame = requestAnimationFrame(loop);
  };
  loop();
  Object.assign(s, {renderer, scene, camera, controls, sun, sunDisc, composer});
  return () => {
   cancelAnimationFrame(frame); ro.disconnect(); controls.dispose();
   if (s.root) disposeObject(s.root);
   disposeTextureCache(); scene.environment?.dispose(); pmrem.dispose(); composer.dispose(); sunDisc.material.map.dispose(); sunDisc.material.dispose(); renderer.dispose(); el.remove();
   for (const k of Object.keys(s)) delete s[k];
  };
 }, []);

 // Build or swap the habitat.
 useEffect(() => {
  if (!s.scene) return;
  if (s.root) { s.scene.remove(s.root); disposeObject(s.root); }
  const root = new THREE.Group();
  const view = builders[habitatId](root);
  s.scene.add(root);
  s.root = root; s.view = view; s.groups = view.groups;
  s.meshes = []; root.traverse(o => { if (o.isMesh && o.userData.component) s.meshes.push(o); });
  // Label anchors and exploded-view offsets from each component's bounds.
  const all = new THREE.Box3();
  Object.values(view.groups).forEach(g => all.expandByObject(g));
  const center = all.getCenter(new THREE.Vector3());
  s.anchors = {}; s.centers = {}; s.explodeOffsets = {};
  for (const [id, g] of Object.entries(view.groups)) {
   const bb = new THREE.Box3().setFromObject(g), c = bb.getCenter(new THREE.Vector3());
   s.centers[id] = c.clone();
   s.anchors[id] = new THREE.Vector3(c.x, bb.max.y + .35, c.z);
   const dir = c.clone().sub(center); dir.y *= .6;
   if (dir.lengthSq() < .01) dir.set(0, 1, 0);
   s.explodeOffsets[id] = dir.normalize().multiplyScalar(view.ground ? 2.2 : 1.8).add(new THREE.Vector3(0, view.ground ? 1.2 : .4, 0));
  }
  s.paint = () => {
   for (const m of s.meshes) {
    const id = m.userData.component, mat = m.material;
    if (!mat.userData.base) mat.userData.base = {color: mat.emissive.clone(), intensity: mat.emissiveIntensity};
    if (id === s.selected) { mat.emissive.copy(SELECT); mat.emissiveIntensity = mat.userData.base.color.getHex() ? Math.max(.4, mat.userData.base.intensity) : .16 + .1 * (s.pulse || 0); }
    else if (id === s.hovered) { mat.emissive.copy(HOVER); mat.emissiveIntensity = 1; }
    else { mat.emissive.copy(mat.userData.base.color); mat.emissiveIntensity = mat.userData.base.intensity; }
   }
  };
  const c = s.controls;
  c.maxPolarAngle = view.ground ? Math.PI * .47 : Math.PI;
  s.camera.position.set(...view.camera); c.target.set(...view.target); c.update();
  s.home = {camera: view.camera, target: view.target};
  s.sun.position.set(...view.sun); s.sun.target.position.set(0, 0, 0);
  s.sunDisc.position.copy(new THREE.Vector3(...view.sun).normalize().multiplyScalar(190));
  s.focus = null; s.paint();
 }, [habitatId]);

 useEffect(() => {
  s.selected = selected; s.paint?.();
  if (selected && s.centers?.[selected] && s.home) s.focus = s.centers[selected].clone().lerp(new THREE.Vector3(...s.home.target), .45);
 }, [selected, habitatId]);
 useEffect(() => { s.exploded = exploded; }, [exploded]);
 useEffect(() => {
  if (!resetToken || !s.home) return;
  s.camera.position.set(...s.home.camera); s.controls.target.set(...s.home.target); s.focus = null; s.controls.update();
 }, [resetToken]);

 return <div className="learn-viewport" ref={mountRef}>
  <div className="learn-labels" ref={labelsRef} hidden={!showLabels} aria-hidden="true">
   {components.map((c, i) => <button key={c.id} data-id={c.id} tabIndex={-1} className={`learn-label ${selected === c.id ? 'active' : ''}`} onClick={() => onSelect(c.id)}>{i + 1}</button>)}
  </div>
  {callout && <div className="learn-callout" ref={calloutRef} key={selected}><span className="learn-callout-line" aria-hidden="true"/>{callout}</div>}
  <p className="learn-viewport-fallback">Tu navegador no puede mostrar el 3D. Usa la lista de partes para explorar.</p>
 </div>;
}
