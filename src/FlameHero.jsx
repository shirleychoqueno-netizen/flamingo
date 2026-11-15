import React,{useState,useRef,useEffect} from 'react';
import {ArrowUpRight,Pause,Play,ArrowRight} from 'lucide-react';
const modes=[
 {id:'droplet',label:'Droplets in microgravity',detail:'FLEX-2 · liquid fuel',thumb:'/media/droplet-flame.jpg',source:'https://commons.wikimedia.org/wiki/File:Amazing_Flame_Comes_to_Life_in_Space_Station_Microgravity_Combustion_Science.webm',caption:'Video: NASA Johnson · FLEX-2 · microgravity',context:'3 mm droplet · 21 % O₂ · 1 atm'},
 {id:'solid',label:'Solid flame spread',detail:'BASS · acrylic sphere',thumb:'/media/solid-poster.jpg',src:'/media/solid-sequence.gif',source:'/documents/combustion-science-guide.pdf#page=20',caption:'NASA sequence · guide p. 20, figure 11 · photos ~1.5 s apart',context:'2 cm sphere · 17 % O₂ · 12 cm/s'},
 {id:'flow',label:'Variable ventilation',detail:'BASS · opposed flow',thumb:'/media/ventilation-poster.jpg',src:'/media/ventilation.gif',source:'/documents/combustion-science-guide.pdf#page=20',caption:'NASA sequence · guide p. 20, figure 12 · photos every 1.25 s',context:'2 cm fabric · flow from 10 to <1 cm/s'},
];
export default function FlameHero(){
 const [mode,setMode]=useState('droplet');const [paused,setPaused]=useState(()=>typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches);const video=useRef(null);const current=modes.find(m=>m.id===mode);
 useEffect(()=>{if(!video.current)return;if(paused)video.current.pause();else video.current.play().catch(()=>setPaused(true));},[paused,mode]);
 return <>
  <section className="hero flame-hero">
   <div className="flame-media" key={mode}>
    {mode==='droplet'?<video ref={video} autoPlay={!paused} muted loop playsInline preload="metadata" poster="/media/droplet-flame.jpg" onLoadedMetadata={e=>{e.currentTarget.currentTime=28;}} onTimeUpdate={e=>{if(e.currentTarget.currentTime>57)e.currentTarget.currentTime=28;}} aria-label="Burning droplet in microgravity, NASA FLEX-2"><source src="/media/flex-2.webm" type="video/webm"/></video>:<img src={paused?current.thumb:current.src} alt={`Experimental sequence: ${current.context}`}/>}
   </div>
   <div className="hero-content"><div className="eyebrow"><span className="blue-line"/>FLAME IN FREEFALL <span className="eyebrow-divider">/</span> RESEARCH EXPLORER</div><h1>Explore the science.<br/><span>Anticipate the fire.</span></h1><p>Combustion evidence for safer habitats<br className="desktop-break"/> on Earth and beyond.</p><div className="corpus-status"><span/>25 investigations · 2,009 source rows</div></div>
   <div className="hero-media-caption" aria-live="polite"><span className="media-context">{current.context}</span><a href={current.source} target="_blank" rel="noreferrer">{current.caption}<ArrowUpRight size={12}/></a></div>
   <button className="motion-toggle" aria-label={paused?'Play animation':'Pause animation'} onClick={()=>setPaused(!paused)}>{paused?<Play size={15}/>:<Pause size={15}/>}</button>
  </section>
  <section className="context-explorer" aria-label="Visual combustion contexts"><div className="eyebrow">EXPLORE HOW FLAMES CHANGE</div><div className="context-options">{modes.map(m=><button key={m.id} className={`context-choice ${mode===m.id?'active':''}`} aria-pressed={mode===m.id} onClick={()=>setMode(m.id)}><span className="context-orb"><img src={m.thumb} alt=""/><span/></span><span><strong>{m.label}</strong><small>{m.detail}</small></span><ArrowRight size={15}/></button>)}</div><p className="media-scope-note">Each scene retains its experimental context. Selecting an application habitat does not turn these images into lunar or Martian data.</p></section>
 </>;
}
