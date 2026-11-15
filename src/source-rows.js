export function filterSourceRows(records,{query='',table='all',type='all'}={}){
 const tokens=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
 return records.filter(r=>(table==='all'||r.source_filename===table)&&(type==='all'||r.row_type===type)&&tokens.every(t=>[r.test_uid,r.row_type,...Object.keys(r.cells),...Object.values(r.cells)].join(' ').toLowerCase().includes(t)));
}
export async function fetchSourceRows(study,signal,fetcher=fetch){
 const response=await fetcher(study.rows_url,{signal});if(!response.ok)throw new Error(`Source-row snapshot unavailable (HTTP ${response.status}).`);
 const data=await response.json();
 if(data.accession!==study.accession||!Array.isArray(data.records)||data.records.length!==study.available_rows||data.records.some(r=>!r.test_uid.startsWith(study.accession+'|')||!r.cells||Array.isArray(r.cells)||Object.values(r.cells).some(v=>typeof v!=='string')))throw new Error('Source-row snapshot does not match this investigation.');
 return data.records;
}
