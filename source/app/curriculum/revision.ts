import packs from './revision-notes.json';
export const revisionNotes=packs;
export function revisionFor(level:string,subject:string,topic?:string){return revisionNotes.filter(p=>p.level===level&&p.subject===subject&&(!topic||p.topic.trim().toLowerCase()===topic.trim().toLowerCase()))}
