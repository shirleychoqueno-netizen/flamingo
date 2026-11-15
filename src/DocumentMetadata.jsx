import React from 'react';
import {Users,CalendarDays,FileText,Download,ChevronDown} from 'lucide-react';
export default function DocumentMetadata({study,onRead,showDownload=true}){
 const profile=study.profile;
 const firstAuthors=profile.authors.slice(0,2).join(', ');
 const hasDate=Boolean(profile.publicationDate||profile.editorialYear);
 return <div className="document-metadata">
  <div className="bibliography-line authors-line"><Users size={13}/>{profile.authors.length?<button onClick={()=>onRead(profile.authorPage)} title={profile.authors.join('; ')}>{firstAuthors}{profile.authors.length>2&&<span> and {profile.authors.length-2} more <ChevronDown size={11}/></span>}</button>:<span>NASA</span>}</div>
  {hasDate&&<div className="bibliography-line publication-line"><CalendarDays size={13}/>{profile.datePage?<button onClick={()=>onRead(profile.datePage)} title={profile.metadataNote}>{profile.dateLabel}</button>:<span title={profile.metadataNote}>{profile.dateLabel}</span>}</div>}
  <details className="bibliography-details"><summary>Source details<ChevronDown size={11}/></summary><div><p>{profile.institution}</p><p><time dateTime={profile.fileCreated}>{profile.fileCreatedLabel}</time></p><p>{profile.metadataNote}</p>{profile.fileAuthor&&<p>Technical file author: {profile.fileAuthor}</p>}<button onClick={()=>onRead(profile.authorPage||profile.institutionPage)}>View document credits</button></div></details>
  <div className="document-type-line"><a className="document-kind" href={`#type/${encodeURIComponent(profile.kind)}`} aria-label={`View documents of type ${profile.kind}`}>{profile.kind}</a>{showDownload&&<a className="button pdf-download" href={study.source.url} download={study.document.originalName} aria-label={`Download PDF ${study.acronym}`} title="Download the original PDF"><FileText size={14}/>PDF<Download size={13}/></a>}</div>
 </div>;
}
