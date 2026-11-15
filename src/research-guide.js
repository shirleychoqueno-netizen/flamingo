import {investigations,evidenceRoute} from './investigation-catalog';
import {nasaRequest} from './nasa-client';

export const guideExamples = [
 'How does ventilation affect flame spread?',
 'Where can I find smoke and aerosol measurements?',
 'Which investigations study droplet extinction?',
];
const studyMap = new Map(investigations.map(s => [s.accession,s]));

export function guideQuery(question,previous='') {
 const text=String(question||'').trim().slice(0,400);
 if(!text||/^(?:hi|hello|hey|hola|help|ayuda)[!.\s]*$/i.test(text))return null;
 if(previous&&/^(?:what about|how about|and\b|what else|those\b|these\b|its\b)/i.test(text))return `${previous.slice(0,180)} — Follow-up: ${text}`.slice(0,400);
 return text;
}

export function guideRecommendations(result,question,scope='') {
 const recommendations=[];const seen=new Set();
 for(const match of result?.retrieval?.matches||[]) {
  const study=studyMap.get(match.accession);
  if(!study||seen.has(study.accession)||(scope&&study.accession!==scope))continue;
  const quote=(match.citations||[]).find(c=>typeof c.original_text==='string'&&c.original_text.trim());
  if(!quote)continue;
  seen.add(study.accession);
  recommendations.push({accession:study.accession,title:study.title,acronym:study.acronym,
   route:`investigation/${study.accession}`,evidenceRoute:evidenceRoute(study.accession,question),
   quote:quote.original_text,locator:quote.locator||match.source_filename,
   source_kind:match.kind,available_rows:study.available_rows,chunk_id:match.chunk_id,
   source_sha256:match.source_sha256,review_flags:match.review_flags||[]});
  if(recommendations.length===3)break;
 }
 return recommendations;
}

export async function askResearchGuide(question,{previous='',scope='',signal,fetcher}={}) {
 const query=guideQuery(question,previous);
 if(!query)return {status:'clarify',query:'',recommendations:[],text:'Tell me what you want to investigate. You can start with a material, a measurement or a question about fire in space.'};
 const accession=studyMap.has(scope)?scope:'';
 const result=await nasaRequest('/v1/rag',{query,...(accession?{accession}:{}),mode:'auto',limit:6,generate:false},signal,fetcher);
 const recommendations=guideRecommendations(result,query,accession);
 return {status:recommendations.length?'matched':'empty',query,scope:accession,
  mode:result?.retrieval?.mode_used||'unavailable',recommendations,
  text:recommendations.length?'Here are starting points from the indexed NASA evidence. Open an investigation to explore its data, or follow the matching source excerpts.':'I did not find a supported starting point for that question in this search. Try a more specific material, measurement or experiment name, or broaden the investigation scope.'};
}
