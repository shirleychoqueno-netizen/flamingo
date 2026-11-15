import { readFile } from 'node:fs/promises';
import { FIRESTORE, GROQ } from '../src/core.mjs';

export async function publicFixtures() {
  const files = new Map();
  for (const path of ['meta/index', ...['PSI-98', 'PSI-100', 'PSI-25'].flatMap(study => [`investigations/${study}`, `tests/${study}__0`])]) {
    files.set(path, JSON.parse(await readFile(new URL(`../fixtures/${path.replaceAll('/', '__')}.json`, import.meta.url), 'utf8')));
  }
  return files;
}
export function fixtureFetch(files, modelResponse, trace = []) {
  return async (url, options = {}) => {
    trace.push({ url, method: options.method || 'GET' });
    if (url === GROQ) {
      if (typeof modelResponse === 'function') return modelResponse(JSON.parse(options.body));
      if (modelResponse instanceof Response) return modelResponse.clone();
      return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(modelResponse || { claims: [], limitations: ['supplied_evidence_only'] }) } }], usage: { total_tokens: 100 } });
    }
    if (!url.startsWith(FIRESTORE)) throw new Error('Unexpected destination');
    if (url === FIRESTORE + ':runQuery') {
      const query = JSON.parse(options.body).structuredQuery;
      const accession = query.where.fieldFilter.value.stringValue;
      const documents = [...files.entries()].filter(([path, doc]) => path.startsWith('tests/') && doc.fields.accession.stringValue === accession).map(([, document]) => ({ document }));
      return Response.json(documents);
    }
    const path = url.slice(FIRESTORE.length + 1).split('?')[0];
    return files.has(path) ? Response.json(files.get(path)) : Response.json({ error: 'not found' }, { status: 404 });
  };
}
export function environment(overrides = {}) {
  return { ENABLE_GROQ: 'true', FREE_TIER_CONFIRMED: 'true', GROQ_API_KEY: 'fixture-not-a-real-credential', IP_LIMITER: { limit: async () => ({ success: true }) }, GLOBAL_LIMITER: { limit: async () => ({ success: true }) }, ...overrides };
}
export const S1 = 'PSI-98|PSI-98_Experimental table_SAFFIRE-1.csv|1';
export const S2 = 'PSI-98|PSI-98_Experimental table_SAFFIRE-1.csv|2';
