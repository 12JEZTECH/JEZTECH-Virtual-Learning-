import {draftFromNotes} from '../assignments/draft';
import {classLevels,subjectsForLevel} from '../teaching/catalog';
import {one} from './access';
export async function generateLessonPractice(db:D1Database,lessonId:string,now=Date.now()){
 const l=await one(db,"SELECT * FROM lessons WHERE id=? AND status='published'",lessonId);if(!l)return {created:0,skipped:1,blockers:[] as string[]};
 const levels=l.class_level&&l.class_level!=='all'?classLevels.filter(c=>c.id===l.class_level):classLevels.filter(c=>c.curriculum===l.curriculum);let questions;try{questions=draftFromNotes(l.content)}catch(e){return {created:0,skipped:0,blockers:[l.title+': '+(e as Error).message]};}
 let created=0;for(const level of levels){if(!subjectsForLevel(level.id).some(s=>s.id===l.subject))continue;const r=await db.prepare("INSERT INTO subject_question_sets(id,teacher_id,lesson_id,source_key,class_level,subject,title,questions,created_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(source_key,class_level) DO NOTHING").bind(crypto.randomUUID(),l.teacher_id,l.id,'lesson:'+l.id,level.id,l.subject,l.title,JSON.stringify(questions),now).run();created+=r.meta.changes;}
 return {created,skipped:created?0:1,blockers:[] as string[]};
}
