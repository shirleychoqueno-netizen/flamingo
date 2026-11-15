import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ArrowUpRight, FlaskConical, Info, Wind, Gauge, Orbit, Droplet, Flame} from 'lucide-react';
import {flameGravities, flamePresets} from './learn-habitats';
import {investigations} from './investigation-catalog';

const byAccession = Object.fromEntries(investigations.map(s => [s.accession, s]));

/* Qualitative, illustrative rules. Not a combustion model. */
function describe({g, o2, flow, fuel}) {
 // Illustrative oxygen limit: buoyancy or a gentle flow bring oxygen in; still air in orbit starves the flame.
 const limit = g > .1 ? 16 : flow < 2 ? 19 : flow <= 20 ? 15 : 15 + (flow - 20) * .12;
 const alive = o2 >= limit;
 const buoy = Math.sqrt(g);
 const shape = !alive ? 'Se apagó' : g < .05 && flow < 2 ? 'Esfera' : flow > 2 * (1 + buoy * 4) ? 'Inclinada por el viento' : g < .3 ? 'Alargada y más ancha' : 'Lágrima alta';
 const color = !alive ? '—' : (buoy * .9 + flow / 60) * (.5 + (o2 - 15) / 25) > .45 ? 'Amarilla y brillante (hollín caliente)' : 'Azul y tenue';
 const size = !alive ? '—' : o2 >= 30 ? 'Grande e intensa' : o2 >= 21 ? 'Normal' : 'Pequeña y débil';
 const why = [];
 if (!alive) why.push(g < .05 && flow < 2 ? 'Sin gravedad y sin viento, el gas quemado se queda alrededor de la llama y el oxígeno fresco solo llega muy despacio: con poco oxígeno, se apaga.' : 'Hay muy poco oxígeno para mantener la reacción.');
 else {
  if (g >= .9) why.push('En la Tierra el gas caliente pesa menos y sube (convección). Eso estira la llama hacia arriba y trae oxígeno fresco por abajo.');
  else if (g > .05) why.push('Con menos gravedad la convección es más débil: el aire caliente sube más despacio y la llama se ve más ancha y lenta.');
  else why.push('En órbita no hay “arriba”: el gas caliente no sube, así que la llama crece igual hacia todos lados.');
  if (flow > 1) why.push(`El viento de ${flow} cm/s trae oxígeno nuevo y empuja la llama en su dirección.`);
  if (o2 >= 30) why.push('Con más oxígeno, la reacción es más rápida: la llama crece y quema más rápido.');
  if (fuel === 'droplet' && g < .05) why.push('Así se veían las gotas de FLEX: una pequeña esfera de llama alrededor de la gota.');
 }
 return {alive, limit, shape, color, size, why};
}

export default function FlameLab() {
 const [gid, setGid] = useState('earth');
 const [o2, setO2] = useState(21);
 const [flow, setFlow] = useState(0);
 const [fuel, setFuel] = useState('candle');
 const g = flameGravities.find(x => x.id === gid).g;
 const state = useMemo(() => describe({g, o2, flow, fuel}), [g, o2, flow, fuel]);
 const canvasRef = useRef(null);
 const params = useRef({});
 params.current = {g, o2, flow, fuel, alive: state.alive};

 useEffect(() => {
  const canvas = canvasRef.current, ctx = canvas.getContext('2d');
  let frame, last = performance.now(), t = 0, life = 1;
  const smoke = [];
  const sm = {g: 1, o2: 21, flow: 0}; // smoothed values for fluid transitions
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const resize = () => { const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio, 2); canvas.width = r.width * d; canvas.height = r.height * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();
  const draw = now => {
   const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
   const p = params.current;
   for (const k of ['g', 'o2', 'flow']) sm[k] += (p[k] - sm[k]) * Math.min(1, dt * 3);
   life += ((p.alive ? 1 : 0) - life) * Math.min(1, dt * (p.alive ? 2 : 1.2));
   const W = canvas.clientWidth, H = canvas.clientHeight;
   // Chamber background.
   const bg = ctx.createRadialGradient(W / 2, H * .55, 10, W / 2, H * .55, Math.max(W, H) * .7);
   bg.addColorStop(0, '#0e1520'); bg.addColorStop(1, '#03060a');
   ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
   ctx.strokeStyle = '#ffffff10'; ctx.lineWidth = 1;
   for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
   for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
   const S = Math.min(W, H) / 420;
   const cx = W * .42, cy = p.fuel === 'candle' ? H * .66 : H * .5;
   // Airflow streaks.
   if (sm.flow > .5) {
    ctx.strokeStyle = `rgba(120,170,255,${Math.min(.35, sm.flow / 60)})`; ctx.lineWidth = 1.2;
    for (let i = 0; i < 14; i++) { const y = (i + .5) * H / 14, x = ((t * sm.flow * 9 + i * 97) % (W + 120)) - 60; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 30 + sm.flow, y); ctx.stroke(); }
   }
   // Fuel.
   if (p.fuel === 'candle') {
    const cg = ctx.createLinearGradient(cx - 22 * S, 0, cx + 22 * S, 0); cg.addColorStop(0, '#d9cfbd'); cg.addColorStop(.5, '#f4eee2'); cg.addColorStop(1, '#bcb19c');
    ctx.fillStyle = cg; ctx.fillRect(cx - 22 * S, cy + 4 * S, 44 * S, H - cy);
    ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 2.4 * S; ctx.beginPath(); ctx.moveTo(cx, cy + 6 * S); ctx.lineTo(cx, cy - 6 * S); ctx.stroke();
   } else {
    ctx.strokeStyle = '#8a96a6'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx - 140 * S, cy + 30 * S); ctx.lineTo(cx, cy); ctx.lineTo(cx + 140 * S, cy + 30 * S); ctx.stroke();
    ctx.fillStyle = '#c8d6e6'; ctx.beginPath(); ctx.arc(cx, cy, 5 * S, 0, 7); ctx.fill();
   }
   // Flame geometry from smoothed conditions.
   const buoy = Math.sqrt(Math.max(0, sm.g));
   const o = Math.max(0, (sm.o2 - 14) / 26);
   const base = (p.fuel === 'candle' ? 24 : 30) * S * (.75 + o * .9) * life;
   const height = base * (1 + buoy * 2.4 + sm.flow / 30);
   const width = base * (1.05 + (1 - buoy) * .35);
   const tilt = Math.min(1, sm.flow / (6 + buoy * 30));
   const flick = reduce ? 0 : buoy * (Math.sin(t * 11) * .05 + Math.sin(t * 17.3) * .035);
   const lift = p.fuel === 'candle' ? width * .55 * (1 - buoy) : 0; // spherical flames sit around the wick, above the wax
   const fx = cx + tilt * height * .55, fy = (p.fuel === 'candle' ? cy - 6 * S : cy) - Math.max(0, height - width) * .5 * (1 - tilt * .6) - lift;
   if (life > .02) {
    const soot = Math.min(1, (buoy * .9 + sm.flow / 60) * (.5 + o)) * life;
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(tilt * .9); ctx.scale(1, (height / width) * (1 + flick));
    ctx.globalCompositeOperation = 'lighter';
    // Outer blue reaction zone.
    let gr = ctx.createRadialGradient(0, 0, width * .2, 0, 0, width * 1.25);
    gr.addColorStop(0, `rgba(70,120,255,${.0 * life})`); gr.addColorStop(.62, `rgba(60,120,255,${.55 * life})`); gr.addColorStop(.8, `rgba(40,80,220,${.25 * life})`); gr.addColorStop(1, 'rgba(20,40,160,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, width * 1.25, 0, 7); ctx.fill();
    // Luminous soot zone (yellow/orange), stronger with buoyancy.
    if (soot > .05) {
     gr = ctx.createRadialGradient(0, -width * .25 * buoy, 0, 0, -width * .1, width * .95);
     gr.addColorStop(0, `rgba(255,250,215,${.95 * soot})`); gr.addColorStop(.35, `rgba(255,205,90,${.85 * soot})`); gr.addColorStop(.75, `rgba(255,120,30,${.45 * soot})`); gr.addColorStop(1, 'rgba(255,80,0,0)');
     ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, width * .95, 0, 7); ctx.fill();
    }
    ctx.restore();
    // Glow.
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, height * 2.2);
    glow.addColorStop(0, `rgba(255,150,60,${.12 * life * (.4 + soot)})`); glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    // Combustion products: rise with buoyancy, drift with flow, linger in still orbit.
    if (!reduce && Math.random() < .6 * life) smoke.push({x: fx + (Math.random() - .5) * width, y: fy - height * .4 * buoy, vx: (Math.random() - .5) * 8, vy: (Math.random() - .5) * 8, a: 1});
   }
   for (let i = smoke.length - 1; i >= 0; i--) {
    const s = smoke[i];
    const drag = Math.max(0, 1 - dt * 1.8);
    s.vx = s.vx * drag + sm.flow * 3 * dt; s.vy = s.vy * drag - sm.g * 120 * dt; s.x += s.vx * dt * S; s.y += s.vy * dt * S;
    s.a -= dt * (sm.g > .05 || sm.flow > 1 ? .35 : .12);
    if (s.a <= 0 || s.x > W + 20 || s.y < -20) { smoke.splice(i, 1); continue; }
    ctx.fillStyle = `rgba(150,160,175,${s.a * .18})`; ctx.beginPath(); ctx.arc(s.x, s.y, 3 + (1 - s.a) * 10, 0, 7); ctx.fill();
   }
   if (smoke.length > 400) smoke.splice(0, smoke.length - 400);
   frame = requestAnimationFrame(draw);
  };
  frame = requestAnimationFrame(draw);
  return () => { cancelAnimationFrame(frame); ro.disconnect(); };
 }, []);

 const applyPreset = p => { setGid(p.g); setO2(p.o2); setFlow(p.flow); setFuel(p.fuel); };
 const related = ['PSI-68', 'PSI-26', 'PSI-25', 'PSI-20'].map(id => byAccession[id]).filter(Boolean);

 return <section className="flame-lab" aria-label="Laboratorio de llama">
  <div className="flame-lab-stage">
   <canvas ref={canvasRef} className="flame-lab-canvas" role="img" aria-label={`Llama ilustrativa: ${state.shape}, ${state.color}`}/>
   <div className="flame-lab-badge">{flameGravities.find(x => x.id === gid).label} · {o2} % O₂ · {flow} cm/s</div>
   {!state.alive && <div className="flame-lab-out">La llama se apagó<small>Prueba subir el oxígeno o agregar un poco de viento</small></div>}
   <div className="flame-lab-readout">
    <div><span>Forma</span><strong>{state.shape}</strong></div>
    <div><span>Color</span><strong>{state.color}</strong></div>
    <div><span>Tamaño</span><strong>{state.size}</strong></div>
   </div>
  </div>

  <div className="flame-lab-panel">
   <div className="flame-lab-presets"><span>Prueba un escenario</span>{flamePresets.map(p => <button key={p.label} onClick={() => applyPreset(p)}>{p.label}</button>)}</div>

   <fieldset className="flame-lab-control"><legend><Orbit size={15}/>Gravedad</legend>
    <div className="flame-lab-segments">{flameGravities.map(x => <button key={x.id} aria-pressed={gid === x.id} className={gid === x.id ? 'active' : ''} onClick={() => setGid(x.id)}><strong>{x.label}</strong><small>{x.detail}</small></button>)}</div>
   </fieldset>
   <label className="flame-lab-control"><span><Gauge size={15}/>Oxígeno en el aire <b>{o2} %</b></span>
    <input type="range" min="15" max="40" value={o2} onChange={e => setO2(+e.target.value)}/>
    <small className="flame-lab-scale"><span>15 %</span><span>21 % (Tierra)</span><span>34 % (Luna, propuesto)</span><span>40 %</span></small>
   </label>
   <label className="flame-lab-control"><span><Wind size={15}/>Viento (ventilación) <b>{flow} cm/s</b></span>
    <input type="range" min="0" max="40" value={flow} onChange={e => setFlow(+e.target.value)}/>
    <small className="flame-lab-scale"><span>0</span><span>8–20 (cabina de la EEI)</span><span>40</span></small>
   </label>
   <fieldset className="flame-lab-control"><legend>Combustible</legend>
    <div className="flame-lab-segments two">
     <button aria-pressed={fuel === 'candle'} className={fuel === 'candle' ? 'active' : ''} onClick={() => setFuel('candle')}><Flame size={16}/><strong>Vela</strong></button>
     <button aria-pressed={fuel === 'droplet'} className={fuel === 'droplet' ? 'active' : ''} onClick={() => setFuel('droplet')}><Droplet size={16}/><strong>Gota</strong></button>
    </div>
   </fieldset>

   <div className="flame-lab-why"><h3>¿Por qué se ve así?</h3><ul>{state.why.map(w => <li key={w}>{w}</li>)}</ul></div>
   <div className="flame-lab-note"><Info size={15}/><p>Ilustración cualitativa para aprender, no un modelo de combustión validado. Los límites de oxígeno de esta animación son aproximados.</p></div>
   <div className="flame-lab-related"><h3><FlaskConical size={15}/>Experimentos reales</h3>{related.map(s => <a key={s.accession} href={`#investigation/${s.accession}`}><span>{s.accession} / {s.acronym}</span>{s.title}<ArrowUpRight size={13}/></a>)}</div>
  </div>
 </section>;
}
