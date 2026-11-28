import {z} from 'zod';
import {AppError,type User} from '../service';
import {classLevels,subjectsForLevel} from '../teaching/catalog';
import {levelKey} from '../classroom/enrollment';
const st=(db:D1Database,sql:string,...v:unknown[])=>db.prepare(sql).bind(...v);
const all=async(db:D1Database,sql:string,...v:unknown[])=>(await st(db,sql,...v).all<any>()).results;
export const SubjectAction=z.object({studentId:z.string().min(1).max(200),classLevel:z.string(),subject:z.string(),status:z.enum(['attend','exempt']),note:z.string().trim().max(300).default('')});
async function learner(db:D1Database,u:User,id:string){if(u.disabled)throw new AppError(403,'Account unavailable');const a=await st(db,"SELECT a.*,u.name AS student_name,t.name AS teacher_name FROM admissions a JOIN users u ON u.id=a.student_id JOIN users t ON t.id=a.teacher_id WHERE a.student_id=? AND a.status='approved'",id).first<any>();if(!a||u.role==='student'&&u.id!==id||u.role==='teacher'&&a.teacher_id!==u.id)throw new AppError(403,'Choose an approved learner in your teaching group');return a}
export async function studentSubjects(db:D1Database,u:User,id=u.id,now=Date.now()){
 const a=await learner(db,u,id),level=levelKey(a.level),catalogue=subjectsForLevel(level);
 const settings=await all(db,'SELECT subject,status,note FROM learner_subjects WHERE student_id=? AND class_level=?',id,level);
 const courses=await all(db,"SELECT c.id,c.name,c.subject,e.status AS enrollment FROM teaching_classes c LEFT JOIN class_enrollments e ON e.class_id=c.id AND e.student_id=? WHERE c.teacher_id=? AND c.class_level=? ORDER BY c.name",id,a.teacher_id,level);
 const configured=new Set([...courses.map(c=>c.subject),...settings.map(s=>s.subject)]);
 const subjects=catalogue.filter(s=>u.role!=='student'||configured.has(s.id)).map(s=>{const setting=settings.find(v=>v.subject===s.id);return {id:s.id,label:s.label,status:setting?.status||'attend',note:setting?.note||'',classes:courses.filter(c=>c.subject===s.id).map(c=>({id:c.id,name:c.name,active:c.enrollment!=='removed'&&c.enrollment!=='exempted'}))}});
 return {studentId:id,studentName:a.student_name,classLevel:level,className:classLevels.find(c=>c.id===level)?.label||a.level,teacherName:a.teacher_name,subjects,serverNow:now};
}
export async function setStudentSubject(db:D1Database,u:User,input:unknown,now=Date.now()){
 if(u.role==='student')throw new AppError(403,'Only your teacher or administrator may change exemptions');const x=SubjectAction.parse(input),a=await learner(db,u,x.studentId);
 if(levelKey(a.level)!==x.classLevel||!subjectsForLevel(x.classLevel).some(s=>s.id===x.subject))throw new AppError(400,'Choose a subject for this learner’s admitted class');
 const commands=[st(db,'INSERT INTO learner_subjects(id,student_id,class_level,subject,status,note,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(student_id,class_level,subject) DO UPDATE SET status=excluded.status,note=excluded.note,updated_by=excluded.updated_by,updated_at=excluded.updated_at',crypto.randomUUID(),x.studentId,x.classLevel,x.subject,x.status,x.note,u.id,now)];
 if(x.status==='exempt'){
 const rooms='SELECT room_id FROM teaching_classes WHERE teacher_id=? AND class_level=? AND subject=?';
 commands.push(st(db,`UPDATE class_attendance SET left_at=?,ready=0,camera_frame=NULL,camera_at=NULL WHERE student_id=? AND session_id IN (SELECT id FROM class_sessions WHERE room_id IN (${rooms}))`,now,x.studentId,a.teacher_id,x.classLevel,x.subject));
 commands.push(st(db,`UPDATE classroom_calls SET status='ended',ended_at=? WHERE student_id=? AND room_id IN (${rooms}) AND status!='ended'`,now,x.studentId,a.teacher_id,x.classLevel,x.subject));
 commands.push(st(db,`DELETE FROM conference_peers WHERE user_id=? AND session_id IN (SELECT id FROM class_sessions WHERE room_id IN (${rooms}))`,x.studentId,a.teacher_id,x.classLevel,x.subject));
 }
 await db.batch(commands);return {ok:true};
}
