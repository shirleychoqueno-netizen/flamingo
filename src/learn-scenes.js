// Procedural 3D models for the "Aprende" habitat explorer.
// Everything is generated in code (no external models) so it ships with the
// site and works offline. Each selectable part is grouped under a component id.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/* ---------- small utilities ---------- */
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function hash(x, y, seed) { const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453; return s - Math.floor(s); }
function valueNoise(x, y, seed = 1) {
 const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
 const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
 const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed), c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
 return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, seed = 1, oct = 5) { let f = 0, amp = .5, fr = 1; for (let i = 0; i < oct; i++) { f += amp * valueNoise(x * fr, y * fr, seed + i * 13); fr *= 2; amp *= .5; } return f; }

const textureCache = new Map();
function canvasTexture(key, w, h, draw, {repeat, srgb = true} = {}) {
 if (textureCache.has(key)) return textureCache.get(key);
 const c = document.createElement('canvas'); c.width = w; c.height = h;
 draw(c.getContext('2d'), w, h);
 const t = new THREE.CanvasTexture(c);
 if (srgb) t.colorSpace = THREE.SRGBColorSpace;
 t.anisotropy = 8;
 if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
 textureCache.set(key, t);
 return t;
}
export function disposeTextureCache() { textureCache.forEach(t => t.dispose()); textureCache.clear(); }

/* ---------- procedural textures ---------- */
const tex = {
 betaCloth: () => canvasTexture('beta', 512, 512, (g, w, h) => {
  g.fillStyle = '#e9e6de'; g.fillRect(0, 0, w, h);
  const img = g.getImageData(0, 0, w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
   const n = (fbm(x / 40, y / 40, 3, 4) - .5) * 26 + ((x + y) % 4 < 2 ? 3 : -3);
   const i = (y * w + x) * 4; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  g.strokeStyle = '#c9c4b6'; g.lineWidth = 3;
  for (let x = 0; x <= w; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  g.strokeStyle = '#d6d1c3'; g.lineWidth = 2;
  for (let y = 64; y < h; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
 }, {repeat: [6, 2]}),
 interiorPanel: () => canvasTexture('interior', 512, 512, (g, w, h) => {
  g.fillStyle = '#c9ced4'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 128) for (let x = 0; x < w; x += 128) {
   g.fillStyle = (x + y) % 256 ? '#c2c7ce' : '#ced3d9'; g.fillRect(x + 3, y + 3, 122, 122);
   g.fillStyle = '#8f969e'; [[12, 12], [116, 12], [12, 116], [116, 116]].forEach(([a, b]) => { g.beginPath(); g.arc(x + a, y + b, 3, 0, 7); g.fill(); });
  }
  g.fillStyle = '#e7b520'; for (let y = 60; y < h; y += 256) g.fillRect(0, y, w, 8);
 }, {repeat: [8, 3]}),
 rack: (seed, accent) => canvasTexture('rack' + seed, 256, 512, (g, w, h) => {
  const r = rng(seed);
  g.fillStyle = '#3c434c'; g.fillRect(0, 0, w, h);
  let y = 10;
  while (y < h - 20) {
   const bh = 40 + Math.floor(r() * 70);
   g.fillStyle = r() > .5 ? '#4a525c' : '#444b54'; g.fillRect(8, y, w - 16, bh - 6);
   g.fillStyle = '#2b3037'; g.fillRect(8, y + bh - 8, w - 16, 2);
   for (let i = 0; i < 1 + r() * 6; i++) { g.fillStyle = ['#59d38b', '#5aa2e6', '#f0b23c', '#e65a5a'][Math.floor(r() * 4)]; g.fillRect(20 + i * 16, y + 10, 7, 7); }
   for (let i = 0; i < 1 + r() * 3; i++) { g.fillStyle = '#c9cfd6'; g.fillRect(w - 60 + i * 14, y + 8, 8, 16); }
   if (r() > .5) { g.fillStyle = '#1b1f24'; g.fillRect(20, y + 24, 90, Math.min(28, bh - 34)); g.fillStyle = accent; g.fillRect(24, y + 28, 60 * r() + 10, 3); }
   g.fillStyle = '#9aa1a9'; g.font = '10px monospace'; g.fillText('M' + Math.floor(r() * 99), w - 38, y + bh - 14);
   y += bh;
  }
 }),
 solarCells: () => canvasTexture('solar', 512, 256, (g, w, h) => {
  g.fillStyle = '#c99a3b'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) {
   const grad = g.createLinearGradient(x, y, x + 30, y + 30); grad.addColorStop(0, '#1d3d7a'); grad.addColorStop(1, '#122650');
   g.fillStyle = grad; g.fillRect(x + 2, y + 2, 28, 28);
   g.strokeStyle = '#3a5ea8'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 16, y + 2); g.lineTo(x + 16, y + 30); g.stroke();
  }
 }),
 goldFoil: () => canvasTexture('foil', 512, 512, (g, w, h) => {
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
   const n = fbm(x / 22, y / 22, 9, 5), c = 150 + n * 105, i = (y * w + x) * 4;
   img.data[i] = c * 1.0; img.data[i + 1] = c * .78; img.data[i + 2] = c * .32; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
 }, {repeat: [3, 2]}),
 regolith: () => canvasTexture('regolith', 1024, 1024, (g, w, h) => {
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
   const n = fbm(x / 90, y / 90, 5, 6), fine = hash(x, y, 2) * 22, c = 78 + n * 70 + fine, i = (y * w + x) * 4;
   img.data[i] = c; img.data[i + 1] = c * .98; img.data[i + 2] = c * .95; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
 }, {repeat: [6, 6]}),
 earth: () => canvasTexture('earth', 1024, 512, (g, w, h) => {
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
   const lat = Math.abs(y / h - .5) * 2, n = fbm(x / 120, y / 120, 21, 6), cloud = fbm(x / 50 + 40, y / 35, 31, 5);
   let r, gr, b;
   if (lat > .86) { r = gr = b = 235; }
   else if (n > .55) { const k = (n - .55) * 3; r = 70 + k * 90; gr = 105 + k * 40; b = 50 + k * 20; if (lat < .35 && n > .62) { r = 180; gr = 150; b = 100; } }
   else { r = 18; gr = 58 + n * 40; b = 120 + n * 80; }
   const cl = Math.max(0, cloud - .52) * 3.2;
   const i = (y * w + x) * 4;
   img.data[i] = r + (255 - r) * Math.min(1, cl); img.data[i + 1] = gr + (255 - gr) * Math.min(1, cl); img.data[i + 2] = b + (255 - b) * Math.min(1, cl); img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
 }),
 tread: () => canvasTexture('tread', 256, 64, (g, w, h) => {
  g.fillStyle = '#2a2d31'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#4a4f55'; for (let x = 0; x < w; x += 16) { g.fillRect(x, 0, 6, h); }
  g.fillStyle = '#7c8086'; for (let x = 8; x < w; x += 32) g.fillRect(x, 10, 3, h - 20);
 }, {repeat: [6, 1]}),
 regolithBump: () => canvasTexture('regolithBump', 512, 512, (g, w, h) => {
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
   let c = fbm(x / 26, y / 26, 41, 5) * 170 + hash(x, y, 9) * 85;
   const i = (y * w + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = c; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
 }, {repeat: [14, 14], srgb: false}),
 clothBump: () => canvasTexture('clothBump', 256, 256, (g, w, h) => {
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
   const weave = ((x >> 1) + (y >> 1)) % 2 ? 150 : 110, c = weave + (fbm(x / 30, y / 30, 5, 3) - .5) * 120;
   const i = (y * w + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = c; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
 }, {repeat: [24, 8], srgb: false}),
 foilBump: () => canvasTexture('foilBump', 512, 512, (g, w, h) => {
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
   const c = Math.abs(fbm(x / 18, y / 18, 77, 5) - .5) * 510;
   const i = (y * w + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = c; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
 }, {repeat: [3, 2], srgb: false}),
 window: () => canvasTexture('window', 128, 128, (g, w, h) => {
  const grad = g.createLinearGradient(0, 0, w, h); grad.addColorStop(0, '#2b5277'); grad.addColorStop(.5, '#0d1d2e'); grad.addColorStop(1, '#3a6f9e');
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(10, 0); g.lineTo(40, 0); g.lineTo(0, 40); g.lineTo(0, 10); g.fill();
 }),
};

/* ---------- materials ---------- */
const std = (o) => new THREE.MeshStandardMaterial({roughness: .6, metalness: .15, ...o});
const phys = (o) => new THREE.MeshPhysicalMaterial({roughness: .5, metalness: .1, ...o});
const M = {
 beta: () => std({map: tex.betaCloth(), bumpMap: tex.clothBump(), bumpScale: .9, roughness: .85, metalness: 0}),
 interior: () => std({map: tex.interiorPanel(), roughness: .55, metalness: .25, side: THREE.BackSide}),
 aluminum: () => std({color: '#b8c0c8', roughness: .35, metalness: .85}),
 darkMetal: () => std({color: '#3b4148', roughness: .45, metalness: .7}),
 handrail: () => std({color: '#e6b422', roughness: .45, metalness: .3}),
 solar: () => std({map: tex.solarCells(), roughness: .25, metalness: .6, side: THREE.DoubleSide}),
 foil: () => std({map: tex.goldFoil(), bumpMap: tex.foilBump(), bumpScale: 2.2, color: '#ffffff', roughness: .28, metalness: 1}),
 white: () => std({color: '#eef0f2', roughness: .55, metalness: .05}),
 fabric: (color) => std({color, roughness: .95, metalness: 0}),
 regolith: () => std({map: tex.regolith(), bumpMap: tex.regolithBump(), bumpScale: 3, color: '#a6a39d', roughness: 1, metalness: 0}),
 glass: () => phys({map: tex.window(), roughness: .05, metalness: .2, clearcoat: 1, clearcoatRoughness: .05}),
 rubber: () => std({map: tex.tread(), roughness: .9, metalness: .1}),
 emissive: (color, intensity = 2) => std({color, emissive: color, emissiveIntensity: intensity, roughness: .4}),
};

/* ---------- builder context ---------- */
function makeBuilder(root) {
 const groups = {};
 const comp = id => {
  if (!groups[id]) { const g = new THREE.Group(); g.userData.component = id; root.add(g); groups[id] = g; }
  return groups[id];
 };
 const add = (id, geometry, material, p = [0, 0, 0], r = [0, 0, 0], s) => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...p); mesh.rotation.set(...r); if (s) mesh.scale.set(...s);
  mesh.castShadow = true; mesh.receiveShadow = true;
  if (id) mesh.userData.component = id;
  (id ? comp(id) : root).add(mesh);
  return mesh;
 };
 return {groups, comp, add};
}

function starField(root, count = 2500, radius = 220) {
 const r = rng(7), pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
 for (let i = 0; i < count; i++) {
  const v = new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize().multiplyScalar(radius);
  pos.set([v.x, v.y, v.z], i * 3);
  const t = .6 + r() * .4, warm = r(); col.set([t, t * (.92 + warm * .08), t * (1 - warm * .15)], i * 3);
 }
 const g = new THREE.BufferGeometry();
 g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
 g.setAttribute('color', new THREE.BufferAttribute(col, 3));
 root.add(new THREE.Points(g, new THREE.PointsMaterial({size: .55, vertexColors: true, sizeAttenuation: true, depthWrite: false, fog: false})));
}

function earth(root, radius, position) {
 const e = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 64), std({map: tex.earth(), roughness: .8, metalness: 0}));
 e.position.set(...position); e.rotation.z = .4; root.add(e);
 const atm = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.025, 96, 64), new THREE.MeshBasicMaterial({color: '#4f9cff', transparent: true, opacity: .18, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false, fog: false}));
 atm.position.copy(e.position); root.add(atm);
 return e;
}

function ribbedCylinder(b, id, radius, length, p, axis = 'x', mat = M.beta(), ribs = 6) {
 const rot = axis === 'x' ? [0, 0, Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
 b.add(id, new THREE.CylinderGeometry(radius, radius, length, 64, 1), mat, p, rot);
 for (let i = 0; i <= ribs; i++) {
  const t = -length / 2 + (length / ribs) * i;
  const rp = axis === 'x' ? [p[0] + t, p[1], p[2]] : axis === 'z' ? [p[0], p[1], p[2] + t] : [p[0], p[1] + t, p[2]];
  const rr = axis === 'x' ? [0, Math.PI / 2, 0] : axis === 'z' ? [0, 0, 0] : [Math.PI / 2, 0, 0];
  b.add(id, new THREE.TorusGeometry(radius + .02, .035, 10, 64), M.aluminum(), rp, rr);
 }
}

/* ---------- Orbital module (cutaway) ---------- */
export function buildStation(root) {
 const b = makeBuilder(root);
 starField(root);
 earth(root, 70, [0, -88, -30]);
 const R = 2.1, L = 8.4;
 // Cutaway hull: open toward the camera so the interior is visible.
 const cut = Math.PI * .62;
 b.add('hull', new THREE.CylinderGeometry(R, R, L, 96, 1, true, cut, Math.PI * 2 - cut), M.beta(), [0, 0, 0], [0, 0, Math.PI / 2]);
 b.add('hull', new THREE.CylinderGeometry(R - .06, R - .06, L, 96, 1, true, cut, Math.PI * 2 - cut), M.interior(), [0, 0, 0], [0, 0, Math.PI / 2]);
 for (let i = 0; i <= 8; i++) b.add('hull', new THREE.TorusGeometry(R + .03, .045, 10, 96, Math.PI * 2 - cut), M.aluminum(), [-L / 2 + i * L / 8, 0, 0], [0, Math.PI / 2, -Math.PI]);
 // End cones and hatch rings.
 for (const s of [-1, 1]) {
  b.add('hull', new THREE.CylinderGeometry(R, R * .62, .9, 64, 1, true), M.beta(), [s * (L / 2 + .45), 0, 0], [0, 0, s * Math.PI / 2]);
  b.add('hull', new THREE.TorusGeometry(R * .62, .09, 12, 64), M.aluminum(), [s * (L / 2 + .9), 0, 0], [0, Math.PI / 2, 0]);
 }
 b.add('hull', new THREE.CircleGeometry(R * .6, 48), M.darkMetal(), [-(L / 2 + .9), 0, 0], [0, Math.PI / 2, 0]);
 // Handrails on the outside.
 for (let i = 0; i < 6; i++) b.add('hull', new THREE.BoxGeometry(.9, .05, .05), M.handrail(), [-3 + i * 1.2, R + .12, -.4]);
 // Truss and solar arrays.
 b.add('hull', new THREE.BoxGeometry(.35, .35, 11), M.aluminum(), [-1.4, R + .7, -1.2]);
 for (const z of [-1, 1]) for (const x of [-2.6, -.2]) {
  b.add('hull', new THREE.BoxGeometry(2.1, .03, 5.2), M.solar(), [x, R + .7, -1.2 + z * 3.4]);
  b.add('hull', new THREE.BoxGeometry(.06, .06, 5.2), M.aluminum(), [x, R + .7, -1.2 + z * 3.4]);
 }
 // Radiator.
 b.add('hull', new THREE.BoxGeometry(1.6, .03, 2.4), M.white(), [1.8, R + .55, -1.4], [0, 0, .5]);

 // Interior: floor deck.
 b.add(null, new THREE.BoxGeometry(L - .2, .06, 2.2), std({color: '#9aa2ab', roughness: .6, metalness: .4}), [0, -1.45, -.2]);
 // Crew quarters with sleeping bag.
 b.add('quarters', new RoundedBoxGeometry(1.3, 2.3, .9, 4, .06), M.fabric('#cdbf9f'), [-3.1, -.25, -1.05]);
 b.add('quarters', new RoundedBoxGeometry(.65, 1.7, .22, 4, .1), M.fabric('#365f8f'), [-3.1, -.15, -.52]);
 b.add('quarters', new THREE.SphereGeometry(.13, 20, 16), M.fabric('#d9cfb8'), [-3.1, .62, -.48]);
 b.add('quarters', new THREE.BoxGeometry(.5, .32, .04), M.emissive('#a8d0ff', .5), [-3.1, .85, -.6]);
 // Avionics rack.
 b.add('avionics', new RoundedBoxGeometry(1.15, 2.4, .9, 3, .04), std({map: tex.rack(11, '#5aa2e6'), roughness: .5, metalness: .4}), [-1.6, -.2, -1.05]);
 for (let i = 0; i < 6; i++) b.add('avionics', new THREE.TorusGeometry(.08 + i * .015, .018, 8, 24, Math.PI), M.fabric(['#1a1a1a', '#c23b3b', '#e1e1e1'][i % 3]), [-1.2 + i * .02, .95, -.58], [0, 0, Math.PI]);
 // Combustion research chamber.
 b.add('research', new RoundedBoxGeometry(1.15, 2.4, .9, 3, .04), std({map: tex.rack(23, '#f0b23c'), roughness: .5, metalness: .4}), [-.3, -.2, -1.05]);
 b.add('research', new THREE.CylinderGeometry(.36, .36, .6, 40), std({color: '#7d868f', metalness: .9, roughness: .25}), [-.3, .15, -.55], [Math.PI / 2, 0, 0]);
 b.add('research', new THREE.CircleGeometry(.24, 32), M.glass(), [-.3, .15, -.245]);
 b.add('research', new THREE.SphereGeometry(.07, 24, 16), M.emissive('#7fb6ff', 6), [-.3, .15, -.28]);
 // Ventilation duct and fans along the ceiling.
 const duct = new THREE.CatmullRomCurve3([new THREE.Vector3(-3.9, 1.45, -.9), new THREE.Vector3(-1, 1.6, -1), new THREE.Vector3(1.5, 1.55, -.9), new THREE.Vector3(3.9, 1.45, -.8)]);
 b.add('ventilation', new THREE.TubeGeometry(duct, 64, .17, 20, false), std({color: '#d7dde3', roughness: .4, metalness: .6}));
 for (const x of [-2.4, 1.2]) {
  b.add('ventilation', new THREE.CylinderGeometry(.3, .3, .22, 32), M.darkMetal(), [x, 1.5, -.9]);
  b.add('ventilation', new THREE.CylinderGeometry(.24, .24, .23, 6), M.aluminum(), [x, 1.5, -.9]);
 }
 // Stowage bags strapped to the floor and walls.
 const bag = ['#ddd3bd', '#c7bba1', '#b9c4cf', '#d3c9b0'];
 for (let i = 0; i < 9; i++) b.add('stowage', new RoundedBoxGeometry(.62, .42, .5, 4, .12), M.fabric(bag[i % 4]), [.9 + (i % 3) * .7, -1.2 + Math.floor(i / 3) * .43, -.95 + (i % 2) * .05]);
 for (let i = 0; i < 3; i++) b.add('stowage', new THREE.BoxGeometry(.04, 1.3, .52), M.fabric('#3b3f45'), [.9 + i * .7, -.6, -.68]);
 // Interior lights.
 for (const x of [-2.5, 0, 2.5]) b.add(null, new THREE.BoxGeometry(1, .05, .2), M.emissive('#fff3dc', 1.6), [x, 1.85, -.2]);

 // Docked cargo vehicle with gold foil and circular solar arrays.
 b.add('cargo', new THREE.CylinderGeometry(R * .6, R * .6, .5, 48), M.aluminum(), [L / 2 + 1.15, 0, 0], [0, 0, Math.PI / 2]);
 b.add('cargo', new THREE.CylinderGeometry(1.5, 1.5, 3.6, 64), M.foil(), [L / 2 + 3.2, 0, 0], [0, 0, Math.PI / 2]);
 b.add('cargo', new THREE.CylinderGeometry(1.52, 1.52, .3, 64), M.white(), [L / 2 + 1.6, 0, 0], [0, 0, Math.PI / 2]);
 b.add('cargo', new THREE.CylinderGeometry(1.45, 1.2, 1.2, 64), M.white(), [L / 2 + 5.6, 0, 0], [0, 0, Math.PI / 2]);
 for (const z of [-1, 1]) {
  b.add('cargo', new THREE.BoxGeometry(.08, .08, 1.6), M.aluminum(), [L / 2 + 5.6, 0, z * 2.1]);
  const fan = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24, Math.PI * .1, Math.PI * 1.8), M.solar());
  fan.position.set(L / 2 + 5.6, 0, z * 3.6); fan.rotation.set(0, 0, 0); fan.castShadow = true; fan.userData.component = 'cargo'; b.comp('cargo').add(fan);
 }
 // Exterior detail: cupola, antenna, greebles and a spacewalking astronaut.
 b.add('hull', new THREE.SphereGeometry(.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.glass(), [-1.4, -R - .05, -.6], [Math.PI, 0, 0]);
 b.add('hull', new THREE.CylinderGeometry(.75, .75, .25, 32), M.aluminum(), [-1.4, -R + .05, -.6]);
 b.add('hull', new THREE.CylinderGeometry(.03, .03, 1.4, 8), M.aluminum(), [2.6, R + .9, .3]);
 b.add('hull', new THREE.SphereGeometry(.45, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.4), std({color: '#e9ecef', roughness: .3, metalness: .4, side: THREE.DoubleSide}), [2.6, R + 1.6, .3], [Math.PI * .8, 0, 0]);
 const gr = rng(5);
 for (let i = 0; i < 26; i++) { const ang = Math.PI * (.75 + gr() * 1.15), x = -3.8 + gr() * 7.6; b.add('hull', new RoundedBoxGeometry(.18 + gr() * .3, .08, .14 + gr() * .25, 2, .02), gr() > .5 ? M.aluminum() : M.white(), [x, Math.sin(ang) * (R + .05), Math.cos(ang) * (R + .05)], [Math.PI / 2 - ang, 0, 0]); }
 astronaut(root, [3.2, R + 1.1, 1.6], -.6, 'float');
 return {groups: b.groups, camera: [6.4, 3, 9.2], target: [.8, 0, -.4], sun: [20, 18, 22]};
}

/* ---------- Lunar base ---------- */
const craters = [[-18, -12, 6], [22, 18, 4], [26, -22, 9], [-24, 24, 5], [8, -32, 7], [-38, -2, 8], [36, 4, 5], [14, 9, 1.6], [-11, 13, 1.2], [9, -12, 1.4]];
function terrainHeight(x, z) {
 const d0 = Math.hypot(x, z);
 let y = (fbm(x / 18, z / 18, 4, 5) - .5) * 2.2 + (fbm(x / 4, z / 4, 8, 3) - .5) * .25;
 y *= Math.min(1, Math.max(0, (d0 - 9) / 10));
 y += (fbm(x / 1.6, z / 1.6, 12, 2) - .5) * .06;
 for (const [cx, cz, r] of craters) { const d = Math.hypot(x - cx, z - cz) / r; if (d < 1.4) y += d < 1 ? -(1 - d * d) * r * .22 : (1.4 - d) * r * .2; }
 return y;
}
function lunarTerrain(root, size = 120, seg = 260) {
 const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
 const p = g.attributes.position;
 for (let i = 0; i < p.count; i++) p.setY(i, terrainHeight(p.getX(i), p.getZ(i)));
 g.computeVertexNormals();
 const m = new THREE.Mesh(g, M.regolith()); m.receiveShadow = true; root.add(m);
 rocks(root, size);
}
/** Scattered boulders and pebbles (instanced) for scale and realism. */
function rocks(root, size) {
 const geo = new THREE.IcosahedronGeometry(1, 1);
 const gp = geo.attributes.position;
 for (let i = 0; i < gp.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(gp, i); v.multiplyScalar(.75 + hash(v.x * 9, v.y * 9 + v.z * 5, 3) * .45); gp.setXYZ(i, v.x, v.y * .7, v.z); }
 geo.computeVertexNormals();
 const r = rng(31), count = 420;
 const mesh = new THREE.InstancedMesh(geo, std({map: tex.regolith(), bumpMap: tex.regolithBump(), bumpScale: 2, color: '#8f8a83', roughness: 1, metalness: 0, flatShading: true}), count);
 const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3();
 let n = 0;
 for (let i = 0; i < count * 3 && n < count; i++) {
  const x = (r() - .5) * size * .8, z = (r() - .5) * size * .8;
  if (Math.hypot(x, z) < 7.5) continue; // keep the work area clear
  const big = r() < .08, s = big ? .5 + r() * 1.1 : .06 + r() * .28;
  pos.set(x, terrainHeight(x, z) + s * .25, z);
  q.setFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3));
  sc.set(s * (.8 + r() * .5), s, s * (.8 + r() * .5));
  m.compose(pos, q, sc); mesh.setMatrixAt(n++, m);
 }
 mesh.count = n; mesh.castShadow = true; mesh.receiveShadow = true;
 root.add(mesh);
}
/** A spacesuited astronaut for scale (not selectable). */
function astronaut(root, position, rotY = 0, pose = 'stand') {
 const a = new THREE.Group();
 const suit = std({color: '#f2f1ec', roughness: .75, metalness: 0});
 const dark = std({color: '#4a4f57', roughness: .6, metalness: .3});
 const visor = new THREE.MeshPhysicalMaterial({color: '#d9a640', metalness: 1, roughness: .08, clearcoat: 1});
 const part = (geo, mat, p, r = [0, 0, 0]) => { const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.rotation.set(...r); m.castShadow = true; m.receiveShadow = true; a.add(m); return m; };
 part(new THREE.CapsuleGeometry(.26, .5, 6, 16), suit, [0, 1.05, 0]);
 part(new RoundedBoxGeometry(.5, .62, .28, 3, .06), suit, [0, 1.18, -.26]);
 part(new THREE.SphereGeometry(.22, 24, 16), suit, [0, 1.62, 0]);
 part(new THREE.SphereGeometry(.17, 24, 16, Math.PI * .05, Math.PI * .9, Math.PI * .25, Math.PI * .45), visor, [0, 1.62, .06]);
 part(new THREE.BoxGeometry(.3, .16, .06), dark, [0, 1.2, .25]);
 const swing = pose === 'walk' ? .35 : pose === 'float' ? .6 : .1;
 for (const s of [-1, 1]) {
  part(new THREE.CapsuleGeometry(.09, .42, 4, 10), suit, [s * .34, 1.12, 0], [swing * s, 0, s * .25]);
  part(new THREE.CapsuleGeometry(.11, .5, 4, 10), suit, [s * .13, .42, 0], [-swing * s, 0, 0]);
  part(new RoundedBoxGeometry(.18, .12, .3, 2, .04), dark, [s * .13, .07, .05]);
 }
 a.position.set(...position); a.rotation.y = rotY;
 if (pose === 'float') a.rotation.z = .5;
 root.add(a);
 return a;
}

export function buildLunar(root) {
 const b = makeBuilder(root);
 starField(root);
 earth(root, 9, [-60, 38, -150]);
 lunarTerrain(root);
 // Main habitat module on lander legs.
 ribbedCylinder(b, 'habitat', 1.6, 6, [0, 2.3, 0], 'x', M.beta(), 6);
 for (const s of [-1, 1]) b.add('habitat', new THREE.SphereGeometry(1.6, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), M.beta(), [s * 3, 2.3, 0], [0, 0, -s * Math.PI / 2]);
 for (const x of [-2, 2]) for (const z of [-1, 1]) {
  b.add('habitat', new THREE.CylinderGeometry(.08, .1, 1.6, 12), M.aluminum(), [x, .9, z * 1.1], [z * .25, 0, 0]);
  b.add('habitat', new THREE.CylinderGeometry(.35, .35, .06, 20), M.aluminum(), [x, .12, z * 1.3]);
 }
 for (let i = 0; i < 3; i++) b.add('habitat', new THREE.CircleGeometry(.22, 32), M.glass(), [-1.5 + i * 1.5, 2.6, 1.62]);
 for (let i = 0; i < 3; i++) b.add('habitat', new THREE.TorusGeometry(.24, .04, 8, 32), M.aluminum(), [-1.5 + i * 1.5, 2.6, 1.6]);
 // Airlock with hatch and ladder.
 b.add('airlock', new THREE.CylinderGeometry(.95, .95, 2, 48), M.white(), [-5.3, 2.1, 0], [0, 0, Math.PI / 2]);
 b.add('airlock', new THREE.TorusGeometry(.7, .08, 12, 48), M.aluminum(), [-6.32, 2.1, 0], [0, Math.PI / 2, 0]);
 b.add('airlock', new THREE.CircleGeometry(.66, 48), std({color: '#d77a3a', roughness: .5}), [-6.33, 2.1, 0], [0, -Math.PI / 2, 0]);
 for (let i = 0; i < 6; i++) b.add('airlock', new THREE.BoxGeometry(.05, .05, .7), M.aluminum(), [-6.5, .3 + i * .28, 0]);
 for (const z of [-.35, .35]) b.add('airlock', new THREE.BoxGeometry(.05, 1.8, .05), M.aluminum(), [-6.5, 1.05, z]);
 // Lab module connected by a tunnel.
 b.add('lab', new THREE.CylinderGeometry(.6, .6, 2, 32), M.white(), [1, 2.1, 2.4], [Math.PI / 2, 0, 0]);
 ribbedCylinder(b, 'lab', 1.3, 4.2, [1, 2.1, 4.9], 'x', M.white(), 5);
 for (const x of [-.6, 2.6]) b.add('lab', new THREE.CylinderGeometry(.08, .1, 1.3, 12), M.aluminum(), [x, .9, 4.9]);
 b.add('lab', new THREE.BoxGeometry(1.4, .3, .04), M.emissive('#7fb6ff', .7), [1, 2.6, 6.2]);
 // Atmosphere control: tank farm with plumbing.
 for (const [x, c] of [[2.8, '#f1f2f3'], [3.8, '#d8e6f5'], [4.8, '#f1f2f3']]) {
  b.add('atmosphere', new THREE.CapsuleGeometry(.42, 1.4, 8, 24), std({color: c, roughness: .35, metalness: .3}), [x, 1.2, -3.2]);
  b.add('atmosphere', new THREE.TorusGeometry(.44, .03, 8, 32), M.aluminum(), [x, 1.2, -3.2], [Math.PI / 2, 0, 0]);
 }
 b.add('atmosphere', new RoundedBoxGeometry(1.6, .9, 1, 3, .06), M.darkMetal(), [1.6, .5, -3.2]);
 const pipe = new THREE.CatmullRomCurve3([new THREE.Vector3(1.6, 1, -3.2), new THREE.Vector3(1.4, 1.6, -2.2), new THREE.Vector3(1, 1.9, -1.4)]);
 b.add('atmosphere', new THREE.TubeGeometry(pipe, 20, .06, 10, false), M.aluminum());
 // Power: vertical solar array tower (south-pole style) and battery vault.
 b.add('power', new THREE.CylinderGeometry(.12, .16, 8, 16), M.aluminum(), [-8, 4, 7]);
 b.add('power', new THREE.BoxGeometry(.12, 5, 3.2), M.solar(), [-8, 5.8, 7]);
 b.add('power', new THREE.BoxGeometry(.2, .2, 3.4), M.aluminum(), [-8, 8.4, 7]);
 b.add('power', new RoundedBoxGeometry(2, 1.2, 1.4, 3, .08), std({color: '#5f6873', roughness: .5, metalness: .5}), [-6.2, .6, 5.4]);
 b.add('power', new THREE.BoxGeometry(1.6, .06, .1), M.emissive('#59d38b', 1.4), [-6.2, .9, 4.68]);
 const cable = new THREE.CatmullRomCurve3([new THREE.Vector3(-6.2, .1, 4.6), new THREE.Vector3(-5, .08, 2.5), new THREE.Vector3(-3, .08, 1.2), new THREE.Vector3(-2, .5, 1.1)]);
 b.add('power', new THREE.TubeGeometry(cable, 30, .04, 8, false), std({color: '#202326'}));
 // Regolith berm (piled lunar soil).
 const bermGeo = new THREE.TorusGeometry(8.4, 1.4, 16, 120, Math.PI * .9);
 const bp = bermGeo.attributes.position;
 for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), y = bp.getY(i); bp.setZ(i, bp.getZ(i) * .55 + (fbm(x / 2, y / 2, 3, 3) - .5) * .6); }
 bermGeo.computeVertexNormals();
 b.add('shielding', bermGeo, M.regolith(), [0, -.2, 0], [Math.PI / 2, 0, -Math.PI * .95]);
 // Warm interior light through the windows and astronauts for scale.
 for (let i = 0; i < 3; i++) b.add('habitat', new THREE.CircleGeometry(.15, 24), M.emissive('#ffcf8a', 2.2), [-1.5 + i * 1.5, 2.6, 1.625]);
 astronaut(root, [-7.2, 0, 1.4], .9, 'walk');
 astronaut(root, [-5.6, 0, 3.1], 2.4, 'stand');
 return {groups: b.groups, camera: [10.5, 6, 12.5], target: [-.8, 1.8, 1], ground: true, sun: [-30, 14, 20]};
}

/* ---------- Pressurized rover ---------- */
export function buildRover(root) {
 const b = makeBuilder(root);
 starField(root);
 earth(root, 7, [50, 30, -140]);
 lunarTerrain(root, 80, 160);
 // Tracks in the regolith.
 for (const z of [-1.35, 1.35]) b.add(null, new THREE.PlaneGeometry(26, .45), std({color: '#5c5a56', roughness: 1}), [-13, .04, z], [-Math.PI / 2, 0, 0]);
 // Chassis and suspension.
 b.add(null, new RoundedBoxGeometry(5, .35, 2.4, 3, .06), M.darkMetal(), [0, 1.05, 0]);
 for (const x of [-1.8, 0, 1.8]) for (const z of [-1, 1]) {
  b.add(null, new THREE.CylinderGeometry(.55, .55, .45, 40), M.rubber(), [x, .55, z * 1.45], [Math.PI / 2, 0, 0]);
  b.add(null, new THREE.CylinderGeometry(.3, .3, .47, 24), M.aluminum(), [x, .55, z * 1.45], [Math.PI / 2, 0, 0]);
  b.add(null, new THREE.BoxGeometry(.12, .12, .5), M.aluminum(), [x, .85, z * 1.2], [.5 * z, 0, 0]);
 }
 // Battery packs under the floor.
 for (const x of [-1.1, 1.1]) {
  b.add('battery', new RoundedBoxGeometry(1.8, .38, 1.8, 3, .05), std({color: '#d9782f', roughness: .45, metalness: .3}), [x, .72, 0]);
  for (let i = 0; i < 4; i++) b.add('battery', new THREE.BoxGeometry(.04, .06, 1.6), M.darkMetal(), [x - .6 + i * .4, .93, 0]);
 }
 // Cabin body.
 b.add('cabin', new RoundedBoxGeometry(4, 1.9, 2.3, 6, .45), M.white(), [-.2, 2.15, 0]);
 b.add('cabin', new THREE.BoxGeometry(4.02, .12, 2.32), std({color: '#2d4f80', roughness: .4, metalness: .3}), [-.2, 1.5, 0]);
 for (const z of [-1, 1]) b.add('cabin', new THREE.CircleGeometry(.22, 32), M.glass(), [-.6, 2.4, z * 1.16], [0, z > 0 ? 0 : Math.PI, 0]);
 // Faceted front windows and docking hatch.
 b.add('window', new THREE.BoxGeometry(.06, .9, 2), M.glass(), [1.82, 2.45, 0], [0, 0, -.45]);
 for (const z of [-.98, .98]) b.add('window', new THREE.BoxGeometry(.9, .7, .05), M.glass(), [1.4, 2.45, z * 1.16]);
 b.add('window', new THREE.TorusGeometry(.42, .07, 12, 40), M.aluminum(), [1.85, 1.75, 0], [0, Math.PI / 2, 0]);
 b.add('window', new THREE.CircleGeometry(.38, 40), M.darkMetal(), [1.86, 1.75, 0], [0, Math.PI / 2, 0]);
 // Suitports with docked suits on the back.
 for (const z of [-.6, .6]) {
  b.add('suitports', new THREE.TorusGeometry(.4, .08, 12, 40), std({color: '#d77a3a', roughness: .5}), [-2.25, 2.1, z], [0, Math.PI / 2, 0]);
  b.add('suitports', new THREE.CapsuleGeometry(.32, .75, 8, 20), M.fabric('#f1f0ea'), [-2.62, 1.8, z]);
  b.add('suitports', new THREE.SphereGeometry(.26, 32, 20), M.fabric('#f1f0ea'), [-2.62, 2.48, z]);
  b.add('suitports', new THREE.SphereGeometry(.2, 32, 20, 0, Math.PI), phys({color: '#d9a640', metalness: 1, roughness: .12, clearcoat: 1}), [-2.75, 2.48, z], [0, -Math.PI / 2, 0]);
  b.add('suitports', new RoundedBoxGeometry(.4, .55, .25, 3, .05), M.fabric('#e3e1d8'), [-2.4, 1.95, z]);
 }
 // Roof: life support box, radiator, antenna and lights.
 b.add('lifesupport', new RoundedBoxGeometry(1.5, .4, 1.3, 3, .06), M.darkMetal(), [-1, 3.3, 0]);
 b.add('lifesupport', new THREE.BoxGeometry(2.2, .04, 2), std({color: '#f3f4f5', roughness: .2, metalness: .6}), [.8, 3.35, 0], [0, 0, .08]);
 for (let i = 0; i < 7; i++) b.add('lifesupport', new THREE.BoxGeometry(2.1, .02, .04), M.aluminum(), [.8, 3.38, -.9 + i * .3], [0, 0, .08]);
 b.add('lifesupport', new THREE.CylinderGeometry(.03, .03, .7, 8), M.aluminum(), [-1.5, 3.8, .5]);
 b.add('lifesupport', new THREE.SphereGeometry(.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.2), std({color: '#e9ecef', roughness: .3, metalness: .4, side: THREE.DoubleSide}), [-1.5, 4.15, .5], [Math.PI, 0, 0]);
 for (const z of [-.7, .7]) b.add(null, new THREE.CylinderGeometry(.12, .12, .08, 20), M.emissive('#fff6df', 3), [1.95, 1.3, z], [0, 0, Math.PI / 2]);
 astronaut(root, [-3.6, 0, 2.6], -1.9, 'walk');
 return {groups: b.groups, camera: [6.4, 3.4, 7.2], target: [-.2, 1.7, .3], ground: true, sun: [25, 16, 18]};
}

export const builders = {station: buildStation, lunar: buildLunar, rover: buildRover};
