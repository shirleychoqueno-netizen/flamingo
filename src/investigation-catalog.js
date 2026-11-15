import snapshot from './investigation-catalog.json';
export {snapshot};
export const investigations = snapshot.investigations;
export const coverageTypes = [
 ['all','All investigations'],['rows','Source rows available'],['text','Document excerpts indexed'],
 ['workbook','Workbook cells indexed'],['remote','Remote file references'],['gaps','Inventory gaps'],
];
export const normalizeCatalog = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function filterInvestigations(list,{query='',coverage='all',fuel='all',platform='all'}={}) {
 const terms=normalizeCatalog(query).split(/\s+/).filter(Boolean);
 return list.filter(s=>
  (coverage==='all'||coverage==='rows'&&s.available_rows>0||coverage==='text'&&s.coverage.document_paragraph>0||coverage==='workbook'&&s.coverage.workbook_cached_cell>0||coverage==='remote'&&s.n_assets>0||coverage==='gaps'&&s.catalog_status!=='complete')&&
  (fuel==='all'||s.fuel_state===fuel)&&(platform==='all'||s.platform===platform)&&
  terms.every(term=>normalizeCatalog([s.accession,s.acronym,s.title,s.summary,s.fuel_state,s.platform,s.primary_axis].join(' ')).includes(term)));
}
export function evidenceRoute(accession='',query='') {return `nasa/${encodeURIComponent(query)}/${encodeURIComponent(accession)}`;}
export function catalogRows(list) {
 return list.map(s=>({accession:s.accession,title:s.title,platform:s.platform,fuel_state:s.fuel_state,
  available_source_rows:s.available_rows,indexed_fragments:s.indexed_fragments,
  remote_asset_references:s.n_assets,remote_declared_bytes:s.remote_bytes,
  inventory_status:s.catalog_status,source_url:s.psi_url,scientific_comparability:'not_established'}));
}
export function rowSelection(previous,uid) {
 if(previous.includes(uid))return previous.filter(id=>id!==uid);
 if(previous.length>=6)return previous;
 return [...previous,uid];
}
