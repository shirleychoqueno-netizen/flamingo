const configured = import.meta.env?.VITE_API_BASE_URL || 'https://houston-groq-proxy.houston-groq-proxy.workers.dev';
const parsed = new URL(configured);
if (parsed.username || parsed.password || parsed.search || parsed.hash || (parsed.protocol !== 'https:' && !['localhost','127.0.0.1'].includes(parsed.hostname))) throw new Error('Invalid evidence-service URL.');
export const NASA_API_BASE = configured.replace(/\/$/, '');
export async function nasaRequest(path, body, signal, fetcher = fetch) {
  if (!['/health','/demo-evaluation.json','/v1/rag','/v1/compare'].includes(path)) throw new Error('Unsupported evidence-service route.');
  const response = await fetcher(NASA_API_BASE + path, { method: body ? 'POST' : 'GET', ...(body ? { headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) } : {}), signal:signal ? AbortSignal.any([signal,AbortSignal.timeout(35000)]) : AbortSignal.timeout(35000) });
  if (response.status === 429) throw new Error('Request limit reached. Wait ' + (response.headers.get('Retry-After') || '60') + ' seconds before trying again.');
  if (!response.ok) throw new Error('Evidence service unavailable (HTTP ' + response.status + ').');
  return response.json();
}
export function comparisonCsv(evidence) {
  const escape = value => { const text=String(value ?? '');const safe=/^[=+@-]/.test(text)&&!/^[-+]\d/.test(text)?"'"+text:text; return '"'+safe.replaceAll('"','""')+'"'; };
  const fields=[...new Set(evidence.flatMap(e=>Object.keys(e.cells)))];
  const rows=[['original_field',...evidence.map(e=>e.test_uid)],...fields.map(field=>[field,...evidence.map(e=>Object.hasOwn(e.cells,field)?e.cells[field]:null)]),['source_locator',...evidence.map(e=>e.locator)],['classification_status',...evidence.map(e=>e.classification_status)],['scientific_comparability',...evidence.map(()=> 'not_established')]];
  return rows.map(row=>row.map(escape).join(',')).join('\r\n');
}
