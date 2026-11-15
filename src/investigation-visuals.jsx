import React, {useEffect, useRef, useState} from 'react';
import {Flame, Droplets, Wind, CloudFog, Orbit, Rocket, Building2, ShieldCheck, FireExtinguisher, Radar, Atom, FlaskConical, Columns2, Check} from 'lucide-react';
import './visuals.css';

// Visual identity per catalogue value: icon + accent colour.
export const fuelLook = {
 Solid: {Icon: Flame, color: '#ff8a3d', label: 'Solid fuel'},
 Liquid: {Icon: Droplets, color: '#5aa9ff', label: 'Liquid fuel'},
 Gas: {Icon: Wind, color: '#4fd1c5', label: 'Gas fuel'},
 Aerosol: {Icon: CloudFog, color: '#b5a6ff', label: 'Aerosol'},
};
export const platformLook = {
 ISS: {Icon: Orbit, color: '#7aa7ff', label: 'International Space Station'},
 Cygnus: {Icon: Rocket, color: '#ffc857', label: 'Cygnus cargo vehicle'},
 Ground: {Icon: Building2, color: '#9be37a', label: 'Ground laboratory'},
};
export const axisLook = {
 Prevention: {Icon: ShieldCheck, color: '#4fd1a5', label: 'Prevention'},
 Suppression: {Icon: FireExtinguisher, color: '#ff6b6b', label: 'Suppression'},
 Detection: {Icon: Radar, color: '#c89bff', label: 'Detection'},
 Fundamental: {Icon: Atom, color: '#5ad7ff', label: 'Fundamental science'},
};
export const lookFor = study => fuelLook[study.fuel_state] || {Icon: FlaskConical, color: '#c9d1d9', label: study.fuel_state || 'Not specified'};

/** Round icon "orb" coloured by fuel state, with a slow orbit ring. */
export function StudyOrb({study, size = 64}) {
 const {Icon, color} = lookFor(study);
 return <span className="study-orb" style={{'--orb': color, width: size, height: size}} aria-hidden="true"><Icon size={size * .42} strokeWidth={1.6}/><i/></span>;
}

export function Chip({look, value}) {
 if (!look) return <span className="viz-chip">{value || 'Not recorded'}</span>;
 const {Icon, label, color = 'var(--warm)'} = look;
 return <span className="viz-chip" style={{'--chip': color}}><span className="viz-chip-icon"><Icon size={16} strokeWidth={2}/></span>{value || label}</span>;
}

/** Count up to a number once it scrolls into view. */
export function useCountUp(target, duration = 1100) {
 const ref = useRef(null);
 const [value, setValue] = useState(0);
 useEffect(() => {
  const el = ref.current;
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!el || reduce || typeof IntersectionObserver === 'undefined') { setValue(target); return; }
  let frame;
  const io = new IntersectionObserver(([entry]) => {
   if (!entry.isIntersecting) return;
   io.disconnect();
   const start = performance.now();
   const tick = now => { const p = Math.min(1, (now - start) / duration); setValue(target * (1 - Math.pow(1 - p, 3))); if (p < 1) frame = requestAnimationFrame(tick); };
   frame = requestAnimationFrame(tick);
  }, {threshold: .3});
  io.observe(el);
  return () => { io.disconnect(); cancelAnimationFrame(frame); };
 }, [target, duration]);
 return [ref, value];
}

export function CountUp({value, decimals = 0, suffix = ''}) {
 const [ref, v] = useCountUp(value);
 return <span ref={ref}>{v.toLocaleString('en-US', {maximumFractionDigits: decimals, minimumFractionDigits: decimals})}{suffix}</span>;
}

/** KPI tile with icon and animated number. */
export function Kpi({Icon, value, decimals, suffix, label, hint}) {
 return <div className="viz-kpi"><span className="viz-kpi-icon"><Icon size={19}/></span><strong><CountUp value={value} decimals={decimals} suffix={suffix}/></strong><span>{label}</span>{hint && <small>{hint}</small>}</div>;
}

/** Horizontal bar that grows when visible. */
export function Meter({value, max, color = 'var(--warm)', label, display}) {
 const [ref, v] = useCountUp(value, 1200);
 const pct = max ? Math.max(value ? 2 : 0, (v / max) * 100) : 0;
 return <div className="viz-meter" ref={ref}><div className="viz-meter-head"><span>{label}</span><b>{display ?? Math.round(v).toLocaleString('en-US')}</b></div><div className="viz-meter-track"><span style={{width: `${pct}%`, background: color}}/></div></div>;
}

/** Compare toggle used on cards and detail pages. */
export function CompareToggle({active, disabled, onToggle, compact}) {
 return <button className={`compare-toggle ${active ? 'active' : ''} ${compact ? 'compact' : ''}`} aria-pressed={active} disabled={disabled && !active} onClick={onToggle} title={disabled && !active ? 'You can compare up to 4 investigations' : undefined}>
  {active ? <Check size={15}/> : <Columns2 size={15}/>}{active ? 'Comparing' : 'Compare'}
 </button>;
}
