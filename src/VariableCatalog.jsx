import React,{useEffect,useMemo,useState} from 'react';
import {ChevronDown,Download,FileText,Orbit,Layers3,Flame,ShieldCheck} from 'lucide-react';
import {buildVariableCatalog,variableCatalogRows} from './variable-catalog';
import {csvText} from './document-engine';
const icons={environment:Orbit,fuel:Layers3,fire:Flame,safety:ShieldCheck,evidence:FileText};
export default function VariableCatalog({study,category='all',subcategory='all',onRead,highlight}){
 const catalog=useMemo(()=>buildVariableCatalog(study),[study]);
 const [expanded,setExpanded]=useState(['environment']);
 useEffect(()=>{
  if(subcategory!=='all')setExpanded(catalog.filter(c=>c.subcategories.some(s=>s.name===subcategory)).map(c=>c.id));
  else setExpanded(category==='all'?['environment']:[category]);
 },[category,subcategory,catalog]);
 const shown=catalog.filter(c=>category==='all'||c.id===category);
 const exportFields=()=>{
  const href=URL.createObjectURL(new Blob([csvText(variableCatalogRows(study))],{type:'text/csv;charset=utf-8;'}));
  const a=document.createElement('a');a.href=href;a.download=`flamingo-${study.id}-categories-variables.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);
 };
 return <section className="variable-catalog" aria-label="Document categories and variables">
  <div className="catalog-toolbar"><p>Fields without extracted data remain identified. Each value retains its scope and type.</p><button className="button secondary" onClick={exportFields}><Download size={14}/>Export categories CSV</button></div>
  {shown.map(c=>{
   const Icon=icons[c.id],open=expanded.includes(c.id);
   const subs=c.subcategories.filter(s=>subcategory==='all'||s.name===subcategory);
   const fields=subs.flatMap(s=>s.fields),filled=fields.filter(f=>f.entries.some(v=>v.value!==null)).length;
   if(!subs.length)return null;
   return <section className="catalog-category" key={c.id}>
    <button className="catalog-category-toggle" aria-expanded={open} aria-controls={`catalog-${c.id}`} onClick={()=>setExpanded(old=>old.includes(c.id)?old.filter(id=>id!==c.id):[...old,c.id])}><Icon size={19}/><span><strong>{c.name}</strong><small>{filled} of {fields.length} fields with data</small></span><ChevronDown size={17} className={open?'rotated':''}/></button>
    {open&&<div id={`catalog-${c.id}`} className="catalog-category-content">{subs.map(s=><section className="catalog-subcategory" key={s.name}><h3>{s.name}</h3><div className="catalog-table-wrap"><table className="catalog-table"><thead><tr><th>Variable</th><th>Document information</th></tr></thead><tbody>{s.fields.map(f=><tr key={f.name} className={f.entries.some(v=>v.id===highlight)?'catalog-highlight':''}><th scope="row">{f.name}</th><td>{f.entries.length?f.entries.map((v,index)=><div className="catalog-entry" key={`${v.id}-${index}`}>
      {v.name!==f.name&&<strong className="catalog-record-name">{v.name}</strong>}
      <p className={v.value===null?'catalog-empty':''}>{v.value??'No extracted data'}{v.value!==null&&v.unit?` ${v.unit}`:''}</p>
      <div className="catalog-entry-meta"><span>{v.kind}</span>{v.scope&&<span>{v.scope}</span>}{v.pageNumber&&<button onClick={()=>onRead(v.pageNumber)} aria-label={`View source for ${f.name}, page ${v.pageNumber}`}><FileText size={11}/>View source</button>}</div>
      {v.note&&<details className="catalog-note"><summary>Details</summary><p>{v.note}</p></details>}
     </div>):<span className="catalog-empty">No extracted data</span>}</td></tr>)}</tbody></table></div></section>)}</div>}
   </section>;
  })}
 </section>;
}
