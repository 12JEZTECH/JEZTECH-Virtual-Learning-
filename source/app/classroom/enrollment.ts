import {AppError,type User} from '../service';
const st=(db:D1Database,sql:string,...v:unknown[])=>db.prepare(sql).bind(...v);
export function levelKey(value:string){const m=value.toLowerCase().match(/\b(grade|form)[\s-]*(\d+)\b/);return m?m[1]+'-'+m[2]:''}
/** SQL normalisation for the same conventional Grade/Form labels accepted by levelKey. */
export function levelKeySQL(column:string){if(!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(column))throw new Error('Invalid class column');return `CASE WHEN instr(lower(${column}),'grade')>0 THEN 'grade-'||CAST(ltrim(substr(lower(${column}),instr(lower(${column}),'grade')+5),' -') AS INTEGER) WHEN instr(lower(${column}),'form')>0 THEN 'form-'||CAST(ltrim(substr(lower(${column}),instr(lower(${column}),'form')+4),' -') AS INTEGER) ELSE '' END`}
export async function enrollEligible(db:D1Database,course:any,now:number){
 const missing=`SELECT a.student_id FROM admissions a JOIN users u ON u.id=a.student_id LEFT JOIN class_enrollments ce ON ce.student_id=a.student_id AND ce.class_id=? WHERE a.teacher_id=? AND a.status='approved' AND u.disabled=0 AND ce.id IS NULL AND ${levelKeySQL('a.level')}=? AND NOT EXISTS(SELECT 1 FROM learner_subjects ls WHERE ls.student_id=a.student_id AND ls.class_level=? AND ls.subject=? AND ls.status='exempt')`;
 if(await st(db,missing+' LIMIT 1',course.id,course.teacher_id,course.class_level,course.class_level,course.subject).first())await st(db,`INSERT INTO class_enrollments(id,class_id,student_id,enrolled_at) SELECT lower(hex(randomblob(16))),?,student_id,? FROM (${missing}) WHERE 1 ON CONFLICT(class_id,student_id) DO NOTHING`,course.id,now,course.id,course.teacher_id,course.class_level,course.class_level,course.subject).run();
}
export async function courseEnrollment(db:D1Database,u:User,course:any,now:number){
 if(u.role!=='student')return;
 if(await st(db,"SELECT id FROM learner_subjects WHERE student_id=? AND class_level=? AND subject=? AND status='exempt'",u.id,course.class_level,course.subject).first())throw new AppError(403,'You are exempted from this subject. Contact your teacher to change your subject attendance.');
 const admission=await st(db,"SELECT level,teacher_id FROM admissions WHERE student_id=? AND status='approved'",u.id).first<any>();
 if(!admission||admission.teacher_id!==course.teacher_id||levelKey(admission.level)!==course.class_level)throw new AppError(403,'This class is for a different teacher or class level');
 const existing=await st(db,'SELECT status FROM class_enrollments WHERE class_id=? AND student_id=?',course.id,u.id).first<{status:string}>();if(existing){if(existing.status!=='active')throw new AppError(403,'Your enrolment in this class is inactive');return;}
 await st(db,'INSERT INTO class_enrollments(id,class_id,student_id,enrolled_at) VALUES(?,?,?,?) ON CONFLICT(class_id,student_id) DO NOTHING',crypto.randomUUID(),course.id,u.id,now).run();
 if(!await st(db,"SELECT id FROM class_enrollments WHERE class_id=? AND student_id=? AND status='active'",course.id,u.id).first())throw new AppError(403,'Your enrolment in this class is inactive');
}
export async function roomEnrollment(db:D1Database,u:User,roomId:string,now=Date.now()){
 const course=await st(db,'SELECT * FROM teaching_classes WHERE room_id=?',roomId).first<any>();if(course)await courseEnrollment(db,u,course,now);return course;
}

/** Persist eligible class membership as soon as admission is approved. No attendance/media is fabricated. */
export async function enrollRegisteredStudent(db:D1Database,studentId:string,now=Date.now()){
 const r=await st(db,`INSERT INTO class_enrollments(id,class_id,student_id,enrolled_at)
 SELECT lower(hex(randomblob(16))),c.id,a.student_id,? FROM admissions a JOIN users u ON u.id=a.student_id JOIN teaching_classes c ON c.teacher_id=a.teacher_id AND c.class_level=${levelKeySQL('a.level')}
 WHERE a.student_id=? AND a.status='approved' AND u.disabled=0
 AND NOT EXISTS(SELECT 1 FROM learner_subjects ls WHERE ls.student_id=a.student_id AND ls.class_level=c.class_level AND ls.subject=c.subject AND ls.status='exempt')
 ON CONFLICT(class_id,student_id) DO NOTHING`,now,studentId).run();return r.meta.changes;
}
