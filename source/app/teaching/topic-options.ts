import {classLevels,subjectsForLevel,teachingTopics} from './catalog';
import {referenceTopics} from '../curriculum/reference';
export type TopicLesson={subject:string;class_level?:string;topic?:string;status?:string};
export function classTopicOptions(level:string,subject:string,lessons:TopicLesson[]=[]){
 if(!classLevels.some(c=>c.id===level)||!subjectsForLevel(level).some(s=>s.id===subject))return [];
 const headings=referenceTopics(level,subject).map(t=>t.title);
 const published=lessons.filter(l=>l.subject===subject&&l.class_level===level&&l.status!=='archived'&&l.topic).map(l=>l.topic!);
 const starter=headings.length||/^grade-[1-6]$/.test(level)?[]:teachingTopics.filter(t=>t.subject===subject||(t.subject==='mathematics'&&['core-mathematics','essential-mathematics'].includes(subject))).map(t=>t.title);
 return [...new Set([...headings,...published,...starter])];
}
