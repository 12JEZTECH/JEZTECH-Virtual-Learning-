import type {Resource} from './catalog';
export function resourceMatches(r:Resource,query:string,kind:string,source:string){
 if(kind&&r.kind!==kind)return false;
 const host=new URL(r.url).hostname;if(source&&host!==source)return false;
 const text=[r.title,r.guidance,r.kind,r.level,r.subject,host].filter(Boolean).join(' ').toLocaleLowerCase();
 return query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean).every(term=>text.includes(term));
}
