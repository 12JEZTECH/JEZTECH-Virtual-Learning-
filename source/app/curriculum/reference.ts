import catalogue from './reference-topics.json';
import {classLevels,subjectsForLevel} from '../teaching/catalog';
export const referenceCourses=catalogue;
export function referenceCourse(level:string,subject:string){return referenceCourses.find(c=>c.level===level&&c.subject===subject)}
export function referenceTopics(level:string,subject:string){return referenceCourse(level,subject)?.topics||[]}
export const referenceTopicCount=referenceCourses.reduce((n,c)=>n+c.topics.length,0);
export function referenceCoverage(){return classLevels.map(level=>{const subjects=subjectsForLevel(level.id);const courses=referenceCourses.filter(c=>c.level===level.id);return {level:level.id,label:level.label,subjects:subjects.length,outlined:courses.length,topics:courses.reduce((n,c)=>n+c.topics.length,0),missing:subjects.filter(s=>!courses.some(c=>c.subject===s.id))}})}
