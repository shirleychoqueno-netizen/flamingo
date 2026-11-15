import React,{useEffect,useState} from 'react';
import {publicationYear} from './catalogue-filters';
export default function PublicationRange({studies,value,onApply}){
 const currentYear=new Date().getFullYear();
 const years=studies.map(publicationYear).filter(Boolean).map(Number);
 const lower=Math.min(currentYear-1,...years),upper=Math.max(currentYear,...years);
 const [from,setFrom]=useState(value?.minYear??lower),[to,setTo]=useState(value?.maxYear??upper);
 const [includeUndated,setIncludeUndated]=useState(value?.includeUndated??false);
 const [error,setError]=useState('');
 useEffect(()=>{setFrom(value?.minYear??lower);setTo(value?.maxYear??upper);setIncludeUndated(value?.includeUndated??false);setError('');},[value,lower,upper]);
 const start=Math.max(lower,Math.min(Number(from)||lower,upper)),end=Math.max(lower,Math.min(Number(to)||upper,upper));
 const apply=event=>{
  event.preventDefault();const minYear=Number(from),maxYear=Number(to);
  if(!Number.isInteger(minYear)||!Number.isInteger(maxYear)||minYear<lower||maxYear>upper||minYear>maxYear){setError('Check the start and end year.');return;}
  setError('');onApply({minYear,maxYear,includeUndated});
 };
 return <section className="filter-section publication-range" aria-labelledby="publication-range-heading"><h3 id="publication-range-heading">Publication year</h3>
  <form onSubmit={apply}>
   <div className="year-range-track" style={{'--from':`${100*(start-lower)/(upper-lower)}%`,'--to':`${100*(end-lower)/(upper-lower)}%`}}>
    <div className="year-range-rail" aria-hidden="true"/><div className="year-range-selected" aria-hidden="true"/>
    <input type="range" aria-label="Start of publication range" min={lower} max={upper} step="1" value={start} onChange={e=>{setFrom(Math.min(Number(e.target.value),end));setError('');}}/>
    <input type="range" aria-label="End of publication range" min={lower} max={upper} step="1" value={end} onChange={e=>{setTo(Math.max(Number(e.target.value),start));setError('');}}/>
   </div>
   <div className="year-range-fields"><label><span>From</span><input aria-label="Start year" type="number" inputMode="numeric" min={lower} max={upper} step="1" value={from} onChange={e=>{setFrom(e.target.value);setError('');}} required/></label><label><span>To</span><input aria-label="End year" type="number" inputMode="numeric" min={lower} max={upper} step="1" value={to} onChange={e=>{setTo(e.target.value);setError('');}} required/></label></div>
   <label className="undated-choice"><input type="checkbox" checked={includeUndated} onChange={e=>setIncludeUndated(e.target.checked)}/><span>Include undated documents</span><small>{studies.filter(s=>publicationYear(s)===null).length}</small></label>
   {error&&<p className="year-error" role="alert">{error}</p>}
   <div className="year-range-actions"><button type="button" className="year-clear" onClick={()=>onApply(null)}>All years</button><button type="submit" className="year-apply" aria-label="Apply years">Apply</button></div>
   <p className="year-applied" role="status">{value?`Applied range: ${value.minYear}–${value.maxYear}${value.includeUndated?' · includes undated':''}`:'No year restriction'}</p>
  </form>
 </section>;
}
