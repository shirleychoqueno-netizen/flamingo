export const documentTypes=['Investigation','Paper','Test','Video'];
export const publicationYear=study=>study.profile.publicationDate?.slice(0,4)||(study.profile.editorialYear?String(study.profile.editorialYear):null);
export function matchesDocumentFilters(study,{kind='all',year='all',range=null,resource='all'}={}){
 const published=publicationYear(study);
 return (kind==='all'||study.profile.kind===kind)&&(resource==='all'||study.profile.resourceId===resource)&&(year==='all'||(year==='undated'?published===null:published===year))&&(!range||(published===null?range.includeUndated:Number(published)>=range.minYear&&Number(published)<=range.maxYear));
}
