import React,{useState} from 'react';
import {Check,ChevronDown} from 'lucide-react';
import {resourceCollections} from './resource-collections';
export default function ResourceFilter({studies,value,onChange}){
 const [open,setOpen]=useState(false);
 const current=resourceCollections.find(c=>c.id===value);
 const choose=id=>{onChange(id);setOpen(false);};
 return <div className="filter-section resource-filter"><h3>Challenge resources</h3>
  <button className="resource-filter-toggle" aria-expanded={open} aria-controls="resource-collection-options" onClick={()=>setOpen(!open)}><span>{current?.short||'All resources'}</span><ChevronDown size={15}/></button>
  {open&&<div id="resource-collection-options" className="resource-options" role="group" aria-label="Resource collections">{[{id:'all',label:'All resources'},...resourceCollections].map(c=><button key={c.id} className={value===c.id?'selected':''} aria-pressed={value===c.id} onClick={()=>choose(c.id)}><span>{c.label}</span><small>{studies.filter(s=>c.id==='all'||s.profile.resourceId===c.id).length}</small>{value===c.id&&<Check size={12}/>}</button>)}</div>}
 </div>;
}
