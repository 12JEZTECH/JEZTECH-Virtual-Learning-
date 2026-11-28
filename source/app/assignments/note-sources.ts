export type NoteSource={id:string;title:string;content:string;kind:'published'|'teacher-draft'|'revision'};
type Lesson={id:string;title:string;class_level?:string;subject:string;topic?:string;content?:string;status?:string};
type Outline={id:string;class_level:string;subject:string;title:string;notes?:string};
type Revision={id:string;level:string;subject:string;topic:string;title:string;content:string};
export function sourcesForTopic(level:string,subject:string,topic:string,lessons:Lesson[],outlines:Outline[],revision:Revision[]):NoteSource[]{
 if(!topic.trim())return [];const same=(t?:string)=>t?.trim().toLowerCase()===topic.trim().toLowerCase();
 return [...lessons.filter(l=>l.class_level===level&&l.subject===subject&&same(l.topic)&&l.status==='published'&&l.content?.trim()).map(l=>({id:'lesson:'+l.id,title:l.title,content:l.content!,kind:'published' as const})),...outlines.filter(o=>o.class_level===level&&o.subject===subject&&same(o.title)&&o.notes?.trim()).map(o=>({id:'outline:'+o.id,title:o.title+' · teacher draft',content:o.notes!,kind:'teacher-draft' as const})),...revision.filter(r=>r.level===level&&r.subject===subject&&same(r.topic)).map(r=>({id:r.id,title:r.title+' · original revision',content:r.content,kind:'revision' as const}))];
}
