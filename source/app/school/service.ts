import {z} from 'zod';
import {AppError,authorizedUser,type User} from '../service';
import {readHub,teachingClassAccess} from '../hub/service';
import {levelKeySQL} from '../classroom/enrollment';
import {accessUntilSQL} from '../classroom/access';
const st=(db:D1Database,sql:string,...values:unknown[])=>db.prepare(sql).bind(...values);
export async function schoolStaff(db:D1Database,user:User){const u=await authorizedUser(db,user);if(u.role==='student')throw new AppError(403,'An approved teacher or administrator account is required for the school portal');return u;}
function eligibleSQL(){return `u.role='student' AND u.disabled=0 AND u.deleted_at IS NULL AND a.status='approved' AND NOT (a.goals='Conference system testing' AND a.note='Conference pass admission') AND a.teacher_id=c.teacher_id AND ${levelKeySQL('a.level')}=c.class_level AND e.status='active' AND NOT EXISTS(SELECT 1 FROM learner_subjects ls WHERE ls.student_id=u.id AND ls.class_level=c.class_level AND ls.subject=c.subject AND ls.status='exempt') AND ${accessUntilSQL('u.id')}>? AND NOT EXISTS(SELECT 1 FROM sessions x WHERE x.student_id=u.id AND x.status IN ('active','paused'))`;}
async function eligibleIds(db:D1Database,classId:string,ids:string[],now:number){return (await st(db,`SELECT u.id FROM teaching_classes c JOIN class_enrollments e ON e.class_id=c.id JOIN users u ON u.id=e.student_id JOIN admissions a ON a.student_id=u.id WHERE c.id=? AND u.id IN (SELECT value FROM json_each(?)) AND ${eligibleSQL()}`,classId,JSON.stringify(ids),now).all<{id:string}>()).results.map(r=>r.id);}
export async function readSchoolClassroom(db:D1Database,user:User,classId?:string,offset=0,search='',now=Date.now()){
 const u=await schoolStaff(db,user);const d=await readHub(db,u,classId,undefined,now,{offset:classId?0:offset,rosterOffset:classId?offset:0,search});
 const eligible=classId?new Set(await eligibleIds(db,classId,d.roster.map(r=>r.student_id),now)):new Set<string>();
 return {...d,roster:d.roster.map(r=>({...r,eligible:eligible.has(r.student_id)}))};
}
export const SchoolAttendance=z.object({classId:z.string().uuid(),students:z.array(z.string().min(1).max(200)).min(1).max(50),confirmed:z.literal(true)});
export async function markSchoolAttendance(db:D1Database,user:User,input:unknown,now=Date.now()){
 const u=await schoolStaff(db,user),parsed=SchoolAttendance.safeParse(input);if(!parsed.success)throw new AppError(400,'Select up to 50 registered learners and confirm they are physically present');const a=parsed.data,c=await teachingClassAccess(db,u,a.classId,now),ids=[...new Set(a.students)];
 const eligible=await eligibleIds(db,c.id,ids,now);if(eligible.length!==ids.length)throw new AppError(403,'A selected learner has no active approved enrolment, is exempt, has expired access or is taking an assessment. Refresh the roster.');
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Nairobi',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
 const results=await db.batch(ids.map(id=>st(db,`INSERT INTO class_rolls(id,class_id,student_id,day,status,marked_by,marked_at) SELECT ?,c.id,u.id,?,'present',?,? FROM teaching_classes c JOIN class_enrollments e ON e.class_id=c.id JOIN users u ON u.id=e.student_id JOIN admissions a ON a.student_id=u.id WHERE c.id=? AND u.id=? AND ${eligibleSQL()} ON CONFLICT(class_id,student_id,day) DO UPDATE SET status='present',marked_by=excluded.marked_by,marked_at=excluded.marked_at`,crypto.randomUUID(),day,u.id,now,c.id,id,now)));
 return {marked:results.reduce((n,r)=>n+(r.meta.changes||0),0),requested:ids.length,day};
}
