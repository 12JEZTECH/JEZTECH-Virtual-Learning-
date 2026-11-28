import {mutatePreparation} from '../classroom/preparation';
import {courseEnrollment,enrollEligible,enrollRegisteredStudent,levelKeySQL} from '../classroom/enrollment';
import {advanceLessonClock} from '../classroom/lifecycle';
import {z} from 'zod';
import {AppError,authorizedUser,type User} from '../service';
import {requirePaidAccess,refreshAccess,accessUntilSQL} from '../classroom/access';
import {classLevels,subjectsForLevel} from '../teaching/catalog';
import {normalizeClass} from '../assignments/service';
const uuid=z.string().uuid();
const day=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!Number.isNaN(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v,'Enter a real date');
export const HubAction=z.discriminatedUnion('action',[
 z.object({action:z.literal('joinTeachingClass'),classId:uuid}),
 z.object({action:z.literal('createTeachingClass'),name:z.string().trim().min(3).max(160),classLevel:z.string(),subject:z.string(),topic:z.string().trim().min(1).max(160)}),
 z.object({action:z.literal('scheduleLesson'),classId:uuid,weekday:z.number().int().min(0).max(6),startMinute:z.number().int().min(0).max(1439),endMinute:z.number().int().min(1).max(1440),location:z.string().trim().min(1).max(100)}),
 z.object({action:z.literal('cancelTimetableSlot'),id:uuid}),
 z.object({action:z.literal('markClassRoll'),classId:uuid,studentId:z.string().min(1).max(200),day,status:z.enum(['present','absent','excused'])}),
 z.object({action:z.literal('publishLessonBoard'),classId:uuid,title:z.string().trim().min(3).max(160),body:z.string().trim().min(1).max(20000),live:z.boolean()}),
 z.object({action:z.literal('stopLessonBoard'),classId:uuid}),
 z.object({action:z.literal('displayHeartbeat'),classId:uuid,id:uuid}),
 z.object({action:z.literal('displayLeave'),classId:uuid,id:uuid}),
]);
const st=(db:D1Database,sql:string,...args:unknown[])=>db.prepare(sql).bind(...args);
const one=(db:D1Database,sql:string,...args:unknown[])=>st(db,sql,...args).first<any>();
const all=async(db:D1Database,sql:string,...args:unknown[])=>(await st(db,sql,...args).all<any>()).results;
const schoolDay=(now:number)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Nairobi',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
function staff(u:User){if(u.role==='student'||u.disabled)throw new AppError(403,'Teacher access required')}
export async function teachingClassAccess(db:D1Database,u:User,id:string,now=Date.now()){
 u=await authorizedUser(db,u);if(u.disabled)throw new AppError(403,'Account disabled');
 const c=await one(db,'SELECT c.*,u.name AS teacher_name FROM teaching_classes c JOIN users u ON u.id=c.teacher_id WHERE c.id=?',id);if(!c)throw new AppError(404,'Class not found');
 if(u.role==='admin'||u.role==='teacher'&&c.teacher_id===u.id)return c;
 if(u.role==='student'){
 const a=await one(db,"SELECT * FROM admissions WHERE student_id=? AND status='approved'",u.id);
 if(a?.teacher_id===c.teacher_id&&normalizeClass(a.level)===c.class_level){await courseEnrollment(db,u,c,now);await requirePaidAccess(db,u,now,'class_control_hub');return c;}
 }throw new AppError(403,'This class belongs to another teaching group');
}
async function readableBoard(db:D1Database,u:User,classId:string){
 const timed=await one(db,'SELECT s.status FROM class_sessions s JOIN teaching_classes c ON c.room_id=s.room_id WHERE c.id=? ORDER BY s.opens_at DESC LIMIT 1',classId);if(u.role==='student'&&timed&&timed.status!=='live')return null;
 if(u.role==='student'&&await one(db,"SELECT id FROM sessions WHERE student_id=? AND status IN ('active','paused')",u.id))return null;
 const b=await one(db,'SELECT * FROM lesson_boards WHERE class_id=?',classId);return u.role==='student'&&!b?.is_live?null:b;
}
export async function readHub(db:D1Database,u:User,classId?:string,dayValue?:string,now=Date.now(),page:{offset?:number;rosterOffset?:number;search?:string}={}){
 u=await authorizedUser(db,u);if(u.disabled)throw new AppError(403,'Account disabled');await requirePaidAccess(db,u,now,'class_control_hub');await advanceLessonClock(db,now);const date=dayValue?day.parse(dayValue):schoolDay(now),offset=Math.max(0,Math.floor(page.offset||0)),rosterOffset=Math.max(0,Math.floor(page.rosterOffset||0));
 const scope=u.role==='admin'?'1=1':u.role==='teacher'?'c.teacher_id=?':`EXISTS(SELECT 1 FROM admissions a WHERE a.student_id=? AND a.teacher_id=c.teacher_id AND a.status='approved' AND ${levelKeySQL('a.level')}=c.class_level) AND NOT EXISTS(SELECT 1 FROM class_enrollments e WHERE e.student_id=? AND e.class_id=c.id AND e.status!='active') AND NOT EXISTS(SELECT 1 FROM learner_subjects ls WHERE ls.student_id=? AND ls.class_level=c.class_level AND ls.subject=c.subject AND ls.status='exempt')`;
 const scopeArgs=u.role==='admin'?[]:u.role==='teacher'?[u.id]:[u.id,u.id,u.id];
 const members=`FROM admissions a JOIN users au ON au.id=a.student_id LEFT JOIN class_enrollments ce ON ce.student_id=au.id AND ce.class_id=c.id WHERE a.teacher_id=c.teacher_id AND a.status='approved' AND au.disabled=0 AND ${levelKeySQL('a.level')}=c.class_level AND COALESCE(ce.status,'active')='active' AND NOT EXISTS(SELECT 1 FROM learner_subjects ls WHERE ls.student_id=au.id AND ls.class_level=c.class_level AND ls.subject=c.subject AND ls.status='exempt')`;
 if(u.role==='student')await enrollRegisteredStudent(db,u.id,now);
 const classes=await all(db,`SELECT (SELECT s.status FROM class_sessions s WHERE s.room_id=c.room_id AND s.status!='ended' ORDER BY s.opens_at DESC LIMIT 1) AS lesson_status,c.*,u.name AS teacher_name,(SELECT COUNT(*) ${members}) AS student_count,(SELECT COUNT(*) ${members} AND EXISTS(SELECT 1 FROM learning_presence p WHERE p.student_id=au.id AND p.last_seen>?)) AS online_count,EXISTS(SELECT 1 FROM lesson_boards b WHERE b.class_id=c.id AND b.is_live=1) AS board_live,(SELECT COUNT(*) FROM board_displays bd WHERE bd.class_id=c.id AND bd.last_seen>?) AS display_count FROM teaching_classes c JOIN users u ON u.id=c.teacher_id WHERE ${scope} ORDER BY c.created_at DESC,c.id LIMIT 50 OFFSET ?`,now-45000,now-30000,...scopeArgs,offset);
 const total=(await one(db,`SELECT COUNT(*) AS n FROM teaching_classes c WHERE ${scope}`,...scopeArgs)).n;
 const timetable=await all(db,`SELECT s.*,c.name AS class_name,c.teacher_id,c.class_level,c.subject,c.topic,u.name AS teacher_name FROM timetable_slots s JOIN teaching_classes c ON c.id=s.class_id JOIN users u ON u.id=c.teacher_id WHERE s.status='scheduled' AND ${scope} AND c.id IN (SELECT value FROM json_each(?)) ORDER BY s.weekday,s.start_minute LIMIT 2000`,...scopeArgs,JSON.stringify(classId?[classId]:classes.map(c=>c.id)));
 let selected:any=null,roster:any[]=[],board:any=null,rosterTotal=0;
 if(classId){selected=await teachingClassAccess(db,u,classId,now);board=await readableBoard(db,u,classId);if(u.role!=='student'){
 await enrollEligible(db,selected,now);
 const filter=(page.search||'').trim().slice(0,160),where=`a.teacher_id=? AND a.status='approved' AND ${levelKeySQL('a.level')}=? ${filter?"AND (lower(u.name) LIKE ? OR lower(u.id) LIKE ?)":''}`,whereArgs=[selected.teacher_id,selected.class_level,...(filter?['%'+filter.toLowerCase()+'%','%'+filter.toLowerCase()+'%']:[])];
 rosterTotal=(await one(db,`SELECT COUNT(*) AS n FROM admissions a JOIN users u ON u.id=a.student_id WHERE ${where}`,...whereArgs)).n;
 const rows=await all(db,`SELECT a.student_id,a.teacher_id,a.level,u.name,u.disabled,p.last_seen,p.page,p.hand_raised,p.hand_note,${accessUntilSQL('u.id')} AS access_until,EXISTS(SELECT 1 FROM subscriptions s WHERE s.student_id=u.id AND s.status='verified' AND s.expires_at>? UNION SELECT 1 FROM payments pp JOIN payment_access_grants g ON g.payment_id=pp.id WHERE pp.student_id=u.id AND pp.status='verified' AND g.expires_at>?) AS paid,COALESCE(cr.status,'unmarked') AS attendance,ls.status AS subject_status,(SELECT SUM(e.score)*100.0/NULLIF(SUM(e.total),0) FROM assignment_entries e JOIN assignments aa ON aa.id=e.assignment_id WHERE e.student_id=u.id AND e.status='submitted' AND aa.teacher_id=? AND aa.class_level=? AND aa.subject=?) AS average FROM admissions a JOIN users u ON u.id=a.student_id LEFT JOIN learning_presence p ON p.student_id=u.id LEFT JOIN class_rolls cr ON cr.student_id=u.id AND cr.class_id=? AND cr.day=? LEFT JOIN learner_subjects ls ON ls.student_id=u.id AND ls.class_level=? AND ls.subject=? WHERE ${where} ORDER BY lower(u.name),u.id LIMIT 50 OFFSET ?`,now,now,selected.teacher_id,selected.class_level,selected.subject,selected.id,date,selected.class_level,selected.subject,...whereArgs,rosterOffset);
 roster=rows.map(a=>({...a,online:!a.disabled&&a.access_until>now&&a.last_seen>now-45000,access_status:a.disabled?'disabled':a.access_until>now?(a.paid?'verified_payment':'conference'):'inactive',average:a.average===null?null:Math.round(a.average)}));
 }}
 return {classes,total,timetable,selected,roster,rosterTotal,page:{offset,rosterOffset,limit:50},board,day:date,user:{id:u.id,name:u.name,role:u.role},serverNow:now};
}
export async function readDisplay(db:D1Database,u:User,classId:string,now=Date.now()){
 await advanceLessonClock(db,now);const c=await teachingClassAccess(db,u,classId,now);const b=await readableBoard(db,u,classId);
 const timed=await one(db,'SELECT status FROM class_sessions WHERE room_id=? ORDER BY opens_at DESC LIMIT 1',c.room_id);
 return {className:c.name,teacherName:c.teacher_name,board:b?.is_live&&(!timed||timed.status==='live')?{title:b.title,body:b.body,updated_at:b.updated_at}:null,serverNow:now};
}
export async function mutateHub(db:D1Database,u:User,input:z.infer<typeof HubAction>,now=Date.now()):Promise<any>{
 u=await authorizedUser(db,u);const a=HubAction.parse(input);if(u.disabled)throw new AppError(403,'Account disabled');
 if(a.action==='createTeachingClass'){
 staff(u);if(!classLevels.some(l=>l.id===a.classLevel)||!subjectsForLevel(a.classLevel).some(s=>s.id===a.subject))throw new AppError(400,'Choose a subject offered for the selected class');
 const id=crypto.randomUUID(),room=crypto.randomUUID();await db.batch([
 st(db,'INSERT INTO classroom_rooms(id,teacher_id,name,description,created_at) VALUES(?,?,?,?,?)',room,u.id,a.name,'Teaching class: '+a.topic,now),
 st(db,'INSERT INTO teaching_classes(id,teacher_id,name,class_level,subject,topic,room_id,created_at) VALUES(?,?,?,?,?,?,?,?)',id,u.id,a.name,a.classLevel,a.subject,a.topic,room,now)]);await enrollEligible(db,{id,teacher_id:u.id,class_level:a.classLevel,subject:a.subject},now);return {id};
 }
 if(a.action==='cancelTimetableSlot'){
 staff(u);const slot=await one(db,'SELECT class_id FROM timetable_slots WHERE id=?',a.id);if(!slot)throw new AppError(404,'Timetable entry not found');await teachingClassAccess(db,u,slot.class_id,now);await st(db,"UPDATE timetable_slots SET status='cancelled' WHERE id=?",a.id).run();return {ok:true};
 }
 const c=await teachingClassAccess(db,u,a.classId,now);
 if(a.action==='joinTeachingClass'){
 staff(u);await advanceLessonClock(db,now);await enrollEligible(db,c,now);const session=await one(db,"SELECT id FROM class_sessions WHERE room_id=? AND status!='ended' ORDER BY opens_at DESC LIMIT 1",c.room_id);
 if(session)await mutatePreparation(db,u,{action:'joinTeacherClass',sessionId:session.id},now);
 return {url:'/classroom/'+c.id,joined:!!session,sessionId:session?.id||null};
 }

 if(a.action==='displayHeartbeat'||a.action==='displayLeave'){
 if(a.action==='displayLeave'){await st(db,'DELETE FROM board_displays WHERE id=? AND user_id=? AND class_id=?',a.id,u.id,c.id).run();return {ok:true}}
 if(!await readableBoard(db,u,c.id))throw new AppError(409,'No lesson board is available');
 await st(db,'INSERT INTO board_displays(id,class_id,user_id,last_seen) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET last_seen=excluded.last_seen WHERE board_displays.user_id=excluded.user_id AND board_displays.class_id=excluded.class_id',a.id,c.id,u.id,now).run();return {ok:true};
 }
 staff(u);
 if(a.action==='scheduleLesson'){
 if(a.endMinute<=a.startMinute)throw new AppError(400,'The lesson must finish after it starts');
 const id=crypto.randomUUID();const result=await st(db,`INSERT INTO timetable_slots(id,class_id,weekday,start_minute,end_minute,location,created_at) SELECT ?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM timetable_slots s JOIN teaching_classes c ON c.id=s.class_id WHERE s.status='scheduled' AND s.weekday=? AND s.start_minute<? AND s.end_minute>? AND (c.teacher_id=? OR s.class_id=? OR lower(s.location)=lower(?)))`,id,c.id,a.weekday,a.startMinute,a.endMinute,a.location,now,a.weekday,a.endMinute,a.startMinute,c.teacher_id,c.id,a.location).run();
 if(!result.meta.changes)throw new AppError(409,'Schedule conflict: teacher, class or room is already booked during this time');return {id};
 }
 if(a.action==='markClassRoll'){
 if(await one(db,"SELECT id FROM learner_subjects WHERE student_id=? AND class_level=? AND subject=? AND status='exempt'",a.studentId,c.class_level,c.subject))throw new AppError(409,'This learner is exempted from the subject and is not required to attend');
 if(a.day>schoolDay(now))throw new AppError(400,'Attendance cannot be marked for a future day');
 const student=await one(db,"SELECT a.level,u.disabled FROM admissions a JOIN users u ON u.id=a.student_id WHERE a.student_id=? AND a.teacher_id=? AND a.status='approved'",a.studentId,c.teacher_id);
 if(!student||student.disabled||normalizeClass(student.level)!==c.class_level)throw new AppError(403,'Student is not admitted to this class');
 await st(db,'INSERT INTO class_rolls(id,class_id,student_id,day,status,marked_by,marked_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(class_id,student_id,day) DO UPDATE SET status=excluded.status,marked_by=excluded.marked_by,marked_at=excluded.marked_at',crypto.randomUUID(),c.id,a.studentId,a.day,a.status,u.id,now).run();return {ok:true};
 }
 if(a.action==='stopLessonBoard'){await db.batch([st(db,'UPDATE lesson_boards SET is_live=0,updated_at=?,updated_by=? WHERE class_id=?',now,u.id,c.id),st(db,'DELETE FROM board_displays WHERE class_id=?',c.id)]);return {ok:true}}
 await st(db,'INSERT INTO lesson_boards(class_id,title,body,is_live,updated_by,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(class_id) DO UPDATE SET title=excluded.title,body=excluded.body,is_live=excluded.is_live,updated_by=excluded.updated_by,updated_at=excluded.updated_at',c.id,a.title,a.body,a.live?1:0,u.id,now).run();return {ok:true};
}
