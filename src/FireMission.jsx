import React, {useState} from 'react';
import {ArrowRight, ArrowUpRight, Check, X, RotateCcw, Siren, Trophy, Info} from 'lucide-react';
import {mission} from './learn-habitats';
import {investigations} from './investigation-catalog';

const byAccession = Object.fromEntries(investigations.map(s => [s.accession, s]));
const POINTS = 20;

export default function FireMission() {
 const [step, setStep] = useState(-1); // -1 = intro, steps.length = results
 const [choice, setChoice] = useState(null);
 const [score, setScore] = useState(0);
 const [log, setLog] = useState([]);
 const total = mission.steps.length;
 const current = mission.steps[step];

 const restart = () => { setStep(-1); setChoice(null); setScore(0); setLog([]); };
 const choose = i => {
  if (choice !== null) return;
  setChoice(i);
  const ok = current.options[i][1];
  if (ok) setScore(s => s + POINTS);
  setLog(l => [...l, ok]);
 };
 const next = () => { setChoice(null); setStep(s => s + 1); };

 if (step === -1) return <section className="fire-mission intro">
  <div className="mission-alarm"><Siren size={34}/></div>
  <span className="learn-kicker">Misión guiada · {total} decisiones</span>
  <h2>{mission.title}</h2>
  <p>{mission.intro}</p>
  <p className="mission-note"><Info size={14}/>{mission.note}</p>
  <button className="button primary" onClick={() => setStep(0)}>Empezar la misión<ArrowRight size={16}/></button>
 </section>;

 if (step >= total) {
  const max = total * POINTS, pct = score / max;
  const badge = pct === 1 ? 'Comandante de seguridad' : pct >= .66 ? 'Especialista de misión' : pct >= .34 ? 'Astronauta en entrenamiento' : 'Cadete espacial';
  return <section className="fire-mission results">
   <div className="mission-trophy"><Trophy size={40}/></div>
   <span className="learn-kicker">Misión terminada</span>
   <h2>{score} / {max} puntos</h2>
   <p className="mission-badge">{badge}</p>
   <ol className="mission-recap">{mission.steps.map((s, i) => <li key={i} className={log[i] ? 'ok' : 'bad'}>{log[i] ? <Check size={14}/> : <X size={14}/>}<span>{s.prompt}</span><small>{s.options.find(o => o[1])[0]}</small></li>)}</ol>
   <p className="mission-note"><Info size={14}/>{mission.note}</p>
   <button className="button secondary" onClick={restart}><RotateCcw size={15}/>Intentar de nuevo</button>
  </section>;
 }

 const answered = choice !== null;
 const right = answered && current.options[choice][1];
 return <section className="fire-mission">
  <div className="mission-progress" aria-label={`Paso ${step + 1} de ${total}`}>
   {mission.steps.map((_, i) => <span key={i} className={i < step ? (log[i] ? 'ok' : 'bad') : i === step ? 'now' : ''}/>)}
   <b>{score} pts</b>
  </div>
  <span className="learn-kicker">Paso {step + 1} de {total}</span>
  <h2>{current.prompt}</h2>
  <div className="mission-options" role="radiogroup">
   {current.options.map(([text, ok, why], i) => {
    const state = !answered ? '' : ok ? 'correct' : i === choice ? 'wrong' : 'dim';
    return <button key={i} role="radio" aria-checked={choice === i} className={`mission-option ${state}`} onClick={() => choose(i)} disabled={answered}>
     <span className="mission-letter">{String.fromCharCode(65 + i)}</span><span>{text}</span>
     {answered && (ok ? <Check size={18}/> : i === choice ? <X size={18}/> : null)}
    </button>;
   })}
  </div>
  {answered && <div className={`mission-feedback ${right ? 'ok' : 'bad'}`} role="status">
   <strong>{right ? '¡Correcto! +20 puntos' : 'No es la mejor opción'}</strong>
   <p>{current.options[choice][2]}</p>
   {!right && <p className="mission-hint">La mejor opción: {current.options.find(o => o[1])[2]}</p>}
   {current.related.length > 0 && <div className="mission-related">Investigación real: {current.related.map(id => byAccession[id] && <a key={id} href={`#investigation/${id}`}>{id} / {byAccession[id].acronym}<ArrowUpRight size={12}/></a>)}</div>}
   <button className="button primary" onClick={next}>{step + 1 < total ? 'Siguiente paso' : 'Ver resultado'}<ArrowRight size={16}/></button>
  </div>}
 </section>;
}
