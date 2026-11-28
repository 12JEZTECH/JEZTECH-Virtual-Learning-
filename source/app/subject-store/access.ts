import {orientationAccess} from '../orientation/access';
import {AppError,authorizedUser,type User} from '../service';
import {requirePaidAccess} from '../classroom/access';
import {classLevels,subjectsForLevel} from '../teaching/catalog';
import {levelKey} from '../classroom/enrollment';
export const SUBJECT_PRICES={questions:10,tutorials:10} as const;
export const SUBJECT_DAYS=6;
export function topicKey(value:string){return value.trim().replace(/\s+/g,' ').toLowerCase()}

export const one=(db:D1Database,q:string,...v:unknown[])=>db.prepare(q).bind(...v).first<any>();
export const all=async(db:D1Database,q:string,...v:unknown[])=>(await db.prepare(q).bind(...v).all<any>()).results;
export function validSubject(level:string,subject:string){if(!classLevels.some(c=>c.id===level)||!subjectsForLevel(level).some(s=>s.id===subject))throw new AppError(400,'Choose a subject offered in this class');}
export async function learnerCourse(db:D1Database,user:User,subject:string,now=Date.now()){
 const u=await authorizedUser(db,user);if(u.role!=='student')throw new AppError(403,'Learner account required');const access=await requirePaidAccess(db,u,now,'subject_practice');
 const a=await one(db,"SELECT a.*,t.disabled AS teacher_disabled FROM admissions a JOIN users t ON t.id=a.teacher_id WHERE a.student_id=? AND a.status='approved'",u.id);if(!a||a.teacher_disabled)throw new AppError(403,'Approved teaching group required');const level=levelKey(a.level);validSubject(level,subject);
 if(await one(db,"SELECT id FROM learner_subjects WHERE student_id=? AND class_level=? AND subject=? AND status='exempt'",u.id,level,subject))throw new AppError(403,'You are exempted from this subject');
 if(await one(db,"SELECT id FROM sessions WHERE student_id=? AND status IN ('active','paused')",u.id))throw new AppError(409,'Practice questions and tutorials are unavailable during an active assessment');
 return {u,teacherId:a.teacher_id,level,subject,until:access.expires_at};
}
export async function subjectPass(db:D1Database,studentId:string,teacherId:string,level:string,subject:string,product:'questions'|'tutorials',now:number,topic=''){const orientation=await orientationAccess(db,studentId,now);if(orientation)return {id:'orientation',expires_at:orientation.expires_at};return one(db,"SELECT id,expires_at FROM subject_purchases WHERE student_id=? AND teacher_id=? AND class_level=? AND subject=? AND product=? AND (topic=? OR (product='tutorials' AND topic='' AND amount=20)) AND status='verified' AND expires_at>? ORDER BY expires_at DESC LIMIT 1",studentId,teacherId,level,subject,product,topicKey(topic),now);}
export async function requireSubjectPass(db:D1Database,user:User,subject:string,product:'questions'|'tutorials',now=Date.now(),topic=''){
 const c=await learnerCourse(db,user,subject,now),pass=await subjectPass(db,c.u.id,c.teacherId,c.level,subject,product,now,topic);if(!pass)throw new AppError(402,'Purchase this subject’s '+product+' access first');return {...c,expiresAt:Math.min(c.until,pass.expires_at)};
}
/** Tagged paid tutorial media remains protected even through older clip URLs. */
export async function requireTutorialVideo(db:D1Database,u:User,videoId:string,now=Date.now()){
 u=await authorizedUser(db,u);if(u.role!=='student')return;const tagged=await all(db,'SELECT * FROM subject_tutorials WHERE video_id=?',videoId);if(!tagged.length)return;
 for(const t of tagged){if(t.status!=='published')continue;try{const c=await requireSubjectPass(db,u,t.subject,'tutorials',now,t.topic);if(c.level===t.class_level&&c.teacherId===t.teacher_id)return;}catch(e){if(!(e instanceof AppError)||![402,403].includes(e.status))throw e;}}
 throw new AppError(402,'This clip requires a verified KSh 10 tutorial topic pass for your class. Open Subject practice & tutorials.');
}
