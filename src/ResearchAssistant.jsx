import React,{useEffect,useRef,useState} from 'react';
import {ArrowRight,ArrowUpRight,Sparkles,X,Search,MessageSquare,RotateCcw,Square} from 'lucide-react';
import {askResearchGuide,guideExamples} from './research-guide';
import {investigations} from './investigation-catalog';

export default function ResearchAssistant({open,onClose,seed,navigate,accession=''}) {
 const [question,setQuestion]=useState(''),[messages,setMessages]=useState([]),[busy,setBusy]=useState(false),[scoped,setScoped]=useState(true);
 const active=useRef(null),sequence=useRef(0),dialog=useRef(null),input=useRef(null),bottom=useRef(null),askRef=useRef(null);
 const study=investigations.find(s=>s.accession===accession);
 useEffect(()=>{setScoped(true);},[accession]);
 useEffect(()=>{
  if(!open)return;const node=dialog.current;if(node&&!node.open)node.showModal();input.current?.focus();
  return()=>{if(node?.open)node.close();};
 },[open]);
 useEffect(()=>{bottom.current?.scrollIntoView({block:'nearest',behavior:'instant'});},[messages,busy]);
 useEffect(()=>()=>active.current?.abort(),[]);
 function cancel(){active.current?.abort();sequence.current++;setBusy(false);setMessages(old=>old.map(m=>m.status==='loading'?{...m,status:'canceled',text:'Search stopped. You can ask another question when you are ready.'}:m));}
 function close(){cancel();onClose();}
 async function ask(value){
  const text=value.trim().slice(0,400);if(!text)return;
  active.current?.abort();const controller=new AbortController();active.current=controller;const id=++sequence.current;
  const previous=[...messages].reverse().find(m=>m.status==='matched')?.query||'';
  const scope=scoped&&study?study.accession:'';
  setQuestion('');setBusy(true);setMessages(old=>[...old.slice(-5),{id,question:text,status:'loading',scope}]);
  try{const answer=await askResearchGuide(text,{previous,scope,signal:controller.signal});if(!controller.signal.aborted&&id===sequence.current)setMessages(old=>old.map(m=>m.id===id?{...m,...answer}:m));}
  catch(e){if(!controller.signal.aborted&&id===sequence.current)setMessages(old=>old.map(m=>m.id===id?{...m,status:'error',text:e.message}:m));}
  finally{if(!controller.signal.aborted&&id===sequence.current)setBusy(false);}
 }
 askRef.current=ask;
 useEffect(()=>{if(open&&seed?.question)askRef.current(seed.question);},[seed?.id]);
 function go(route){close();navigate(route);}
 if(!open)return null;
 return <dialog ref={dialog} className="guide-dialog" aria-labelledby="guide-title" onCancel={e=>{e.preventDefault();close();}}>
 <div className="guide-shell"><header className="guide-header"><span className="guide-mark"><Sparkles size={22}/></span><div><span className="guide-kicker">YOUR RESEARCH COMPANION</span><h2 id="guide-title">Let's find your starting point.</h2></div><button className="icon-button" aria-label="Close research guide" onClick={close}><X size={21}/></button></header>
 <div className="guide-status"><span className="guide-online-dot"/>AI-assisted source discovery<span>NASA evidence · cited suggestions</span></div>
 <div className="guide-conversation" role="log" aria-label="Research guide conversation" aria-live="polite" aria-busy={busy}>
 {!messages.length&&<div className="guide-welcome"><div className="guide-welcome-icon"><Search size={28}/></div><h3>A question is all you need.</h3><p>I can help you find investigations, locate source tables and choose where to explore next.</p><div className="guide-examples">{guideExamples.map(q=><button key={q} onClick={()=>ask(q)}>{q}<ArrowUpRight size={16}/></button>)}</div></div>}
 {messages.map(m=><section className="guide-turn" key={m.id}><p className="guide-user-question">{m.question}</p>{m.scope&&<span className="guide-scope-label">Search scope: {m.scope}</span>}{m.status==='loading'?<p className="guide-thinking" role="status"><span/>Finding sources and matching investigations…</p>:<><p className={m.status==='error'?'guide-message guide-message-error':'guide-message'}>{m.text}</p>{m.status==='matched'&&<span className="guide-result-mode">{m.mode==='hybrid'?'Semantic + keyword search':'Keyword search'} · suggested starting points</span>}
 <div className="guide-results">{m.recommendations?.map((r,i)=><article key={r.accession}><div className="guide-result-heading"><span>0{i+1}</span><span>{r.accession} {r.acronym&&`/ ${r.acronym}`}</span></div><h3>{r.title}</h3><p className="guide-result-data">{r.available_rows?`${r.available_rows} source rows available`:'Indexed evidence available'}</p><blockquote>{r.quote.slice(0,280)}{r.quote.length>280?'…':''}</blockquote><p className="guide-result-source">{r.locator}</p><div className="guide-result-actions"><button className="button primary" onClick={()=>go(r.route)}>Open investigation<ArrowRight size={15}/></button><button className="text-button" onClick={()=>go(r.evidenceRoute)}>See source evidence<ArrowUpRight size={14}/></button></div></article>)}</div>
 {m.status==='error'&&<button className="text-button" disabled={busy} onClick={()=>ask(m.question)}><RotateCcw size={14}/>Try again when ready</button>}{m.status==='empty'&&<button className="button secondary" onClick={()=>go('explore')}>Browse all investigations<ArrowRight size={15}/></button>}</>}</section>)}
 <div ref={bottom}/></div>
 <div className="guide-composer"><div className="guide-composer-top">{study?<label><input type="checkbox" checked={scoped} onChange={e=>setScoped(e.target.checked)} disabled={busy}/>Search within {study.accession}</label>:<span>Across all 25 investigations</span>}{messages.length>0&&<button className="text-button" disabled={busy} onClick={()=>setMessages([])}>New conversation</button>}</div><form onSubmit={e=>{e.preventDefault();ask(question);}}><label className="sr-only" htmlFor="guide-question">Your research question</label><textarea ref={input} id="guide-question" value={question} onChange={e=>setQuestion(e.target.value)} maxLength={400} rows={2} placeholder={messages.length?'Ask a follow-up question…':'What would you like to investigate?'} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();if(!busy)ask(question);}}}/>{busy?<button type="button" className="guide-send" onClick={cancel} aria-label="Stop evidence search"><Square size={17}/></button>:<button className="guide-send" disabled={!question.trim()} aria-label="Find research sources"><ArrowRight size={22}/></button>}</form><p>Suggestions come from retrieved sources. They do not establish scientific validity or safety.</p></div></div>
 </dialog>;
}
