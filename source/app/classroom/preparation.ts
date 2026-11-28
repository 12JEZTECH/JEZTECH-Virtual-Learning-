import {roomEnrollment,enrollEligible,levelKey,levelKeySQL} from './enrollment';
import {advanceLessonClock,closeEndedLessonMedia,microphoneAllowed} from './lifecycle';
import {z} from 'zod';
import {AppError,type User} from '../service';
import {requirePaidAccess,sweepUnpaidSessions} from './access';
import {roomAccess} from './service';
export const PreparationAction=z.discriminatedUnion('action',[
 z.object({action:z.literal('openPreparation'),roomId:z.string().uuid(),title:z.string().trim().min(2).max(160),preparationMinutes:z.number().int().min(1).max(30).optional(),durationMinutes:z.number().int().min(1).max(180).optional(),startMode:z.enum(['teacher','automatic']).optional(),mediaMode:z.enum(['peer','sfu']).optional(),learnerLimit:z.number().int().min(1).max(5000).optional()}),
 z.object({action:z.literal('joinTeacherClass'),sessionId:z.string().uuid()}),
 z.object({action:z.literal('teacherClassHeartbeat'),sessionId:z.string().uuid()}),
 z.object({action:z.literal('leaveTeacherClass'),sessionId:z.string().uuid()}),
 z.object({action:z.literal('startClass'),sessionId:z.string().uuid()}),
 z.object({action:z.literal('classMuteAll'),sessionId:z.string().uuid(),muted:z.boolean()}),
 z.object({action:z.literal('classStudentMicrophone'),sessionId:z.string().uuid(),studentId:z.string().min(1).max(200),muted:z.boolean()}),
 z.object({action:z.literal('endClass'),sessionId:z.string().uuid()}),
 z.object({action:z.literal('joinClass'),sessionId:z.string().uuid()}),
 z.object({action:z.literal('classHeartbeat'),sessionId:z.string().uuid()}),
 z.object({action:z.literal('classReady'),sessionId:z.string().uuid(),ready:z.boolean()}),
 z.object({action:z.literal('leaveClass'),sessionId:z.string().uuid()}),
 z.object({action:z.literal('cameraCheckIn'),sessionId:z.string().uuid(),frame:z.string().max(30000).regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/).nullable()}),
]);
const st=(db:D1Database,sql:string,...v:unknown[])=>db.prepare(sql).bind(...v);
async function sessionAccess(db:D1Database,u:User,id:string){const s=await st(db,'SELECT * FROM class_sessions WHERE id=?',id).first<any>();if(!s)throw new AppError(404,'Class session not found');await roomAccess(db,u,s.room_id);return s}
export async function mutatePreparation(db:D1Database,u:User,a:z.infer<typeof PreparationAction>,now=Date.now()){
 await requirePaidAccess(db,u,now,'classroom_join_or_presence');await advanceLessonClock(db,now);
 if(a.action==='openPreparation'){
  if(u.role==='student')throw new AppError(403,'Teacher access required');await roomAccess(db,u,a.roomId);
  if(await st(db,"SELECT id FROM class_sessions WHERE room_id=? AND status!='ended'",a.roomId).first())throw new AppError(409,'End the current class before opening another');
  const id=crypto.randomUUID(),startsAt=now+(a.preparationMinutes??10)*60000,endsAt=a.startMode==='automatic'?startsAt+(a.durationMinutes??40)*60000:null;try{const created=await st(db,"INSERT INTO class_sessions(id,room_id,title,opens_at,starts_at,ends_at,duration_minutes,start_mode,media_mode,learner_limit) SELECT ?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM class_sessions WHERE room_id=? AND status!='ended')",id,a.roomId,a.title,now,startsAt,endsAt,a.durationMinutes??40,a.startMode||'teacher',a.mediaMode||'peer',a.learnerLimit||2000,a.roomId).run();if(!created.meta.changes)throw new Error('Class already open')}catch{throw new AppError(409,'A class is already open for this room')};await st(db,"UPDATE classroom_calls SET status='ended',ended_at=? WHERE room_id=? AND status!='ended'",now,a.roomId).run();return {id,startsAt,endsAt};
 }
 const s=await sessionAccess(db,u,a.sessionId);
 if(a.action==='endClass'){if(u.role==='student')throw new AppError(403,'Teacher access required');await st(db,"UPDATE class_sessions SET status='ended',ended_at=? WHERE id=? AND status!='ended'",now,s.id).run();await closeEndedLessonMedia(db,now);return {ok:true}}
 if(a.action==='joinTeacherClass'||a.action==='teacherClassHeartbeat'||a.action==='leaveTeacherClass'){
 if(u.role==='student')throw new AppError(403,'Teacher access required');if(s.status==='ended')throw new AppError(409,'This class has ended');
 if(a.action==='joinTeacherClass'){await st(db,'UPDATE class_sessions SET teacher_present_id=?,teacher_joined_at=?,teacher_last_seen=? WHERE id=?',u.id,now,now,s.id).run();return {ok:true}}
 if(a.action==='leaveTeacherClass'){await st(db,'UPDATE class_sessions SET teacher_present_id=NULL,teacher_last_seen=NULL WHERE id=? AND teacher_present_id=?',s.id,u.id).run();return {ok:true}}
 const changed=await st(db,'UPDATE class_sessions SET teacher_last_seen=? WHERE id=? AND teacher_present_id=?',now,s.id,u.id).run();if(!changed.meta.changes)throw new AppError(409,'Join this class as teacher first');return {ok:true};
 }
 if(a.action==='startClass'||a.action==='classMuteAll'||a.action==='classStudentMicrophone'){
 if(u.role==='student')throw new AppError(403,'Teacher access required');if(s.status==='ended')throw new AppError(409,'This class has ended');
 if(a.action==='startClass'){if(now<s.starts_at)throw new AppError(409,'Preparation must finish before the lesson starts');
 await st(db,`UPDATE class_sessions SET started_at=CASE WHEN status='live' THEN COALESCE(started_at,starts_at) ELSE ? END,started_by=COALESCE(started_by,?),ends_at=CASE WHEN status='live' THEN ends_at ELSE ?+duration_minutes*60000 END,status='live',teacher_present_id=?,teacher_joined_at=COALESCE(teacher_joined_at,?),teacher_last_seen=? WHERE id=? AND status!='ended'`,now,u.id,now,u.id,now,now,s.id).run();
 const updated=await st(db,'SELECT ends_at,started_at FROM class_sessions WHERE id=?',s.id).first<any>();return {ok:true,endsAt:updated.ends_at,startedAt:updated.started_at};}

 if(a.action==='classMuteAll'){await db.batch([st(db,'UPDATE class_sessions SET mute_all=? WHERE id=?',a.muted?1:0,s.id),st(db,"UPDATE class_attendance SET mic_policy='inherit' WHERE session_id=?",s.id)]);return {ok:true}}
 const changed=await st(db,'UPDATE class_attendance SET mic_policy=? WHERE session_id=? AND student_id=? AND left_at IS NULL',a.muted?'muted':'allowed',s.id,a.studentId).run();if(!changed.meta.changes)throw new AppError(404,'Student must join this lesson before changing microphone permission');return {ok:true};
 }
 if(s.status==='ended')throw new AppError(409,'This class has ended');if(u.role!=='student')throw new AppError(403,'Learner account required');
 if(a.action==='joinClass'){
  if(await st(db,"SELECT a.id FROM class_attendance a JOIN class_sessions c ON c.id=a.session_id WHERE a.student_id=? AND a.session_id!=? AND c.status!='ended' AND a.left_at IS NULL AND a.last_seen>?",u.id,s.id,now-75000).first())throw new AppError(409,'Leave your current class before joining another');
  const joined=await st(db,`INSERT INTO class_attendance(id,session_id,student_id,joined_at,last_seen) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM class_attendance WHERE session_id=? AND student_id=? AND left_at IS NULL) OR (SELECT COUNT(*) FROM class_attendance WHERE session_id=? AND left_at IS NULL AND last_seen>?)<? ON CONFLICT(session_id,student_id) DO UPDATE SET last_seen=excluded.last_seen,left_at=NULL`,crypto.randomUUID(),s.id,u.id,now,now,s.id,u.id,s.id,now-75000,s.learner_limit).run();if(!joined.meta.changes)throw new AppError(409,'This lesson has reached its configured learner capacity');return {ok:true};
 }
 const attending=await st(db,'SELECT id FROM class_attendance WHERE session_id=? AND student_id=? AND left_at IS NULL',s.id,u.id).first();if(!attending)throw new AppError(409,'Join the preparation room first');
 if(a.action==='cameraCheckIn'){await st(db,'UPDATE class_attendance SET camera_frame=?,camera_at=?,last_seen=? WHERE session_id=? AND student_id=?',a.frame,a.frame?now:null,now,s.id,u.id).run();return {ok:true}}
 if(a.action==='leaveClass'){await st(db,'UPDATE class_attendance SET left_at=?,ready=0,camera_frame=NULL,camera_at=NULL WHERE session_id=? AND student_id=?',now,s.id,u.id).run();await st(db,"UPDATE classroom_calls SET status='ended',ended_at=? WHERE session_id=? AND student_id=? AND status!='ended'",now,s.id,u.id).run();}
 else if(a.action==='classReady')await st(db,'UPDATE class_attendance SET ready=?,last_seen=? WHERE session_id=? AND student_id=?',a.ready?1:0,now,s.id,u.id).run();
 else await st(db,'UPDATE class_attendance SET last_seen=? WHERE session_id=? AND student_id=?',now,s.id,u.id).run();return {ok:true};
}
export async function readPreparation(db:D1Database,u:User,now=Date.now(),page:{roomId?:string;offset?:number;limit?:number}={}){
 await requirePaidAccess(db,u,now,'classroom_board');await advanceLessonClock(db,now);if(u.role!=='student')await sweepUnpaidSessions(db,u,now);await clearExpiredCameraFrames(db,now);
 const limit=Math.max(1,Math.min(100,page.limit||50)),offset=Math.max(0,Math.floor(page.offset||0));
 const scope=u.role==='admin'?'1=1':u.role==='teacher'?'r.teacher_id=?':"EXISTS(SELECT 1 FROM admissions a WHERE a.student_id=? AND a.teacher_id=r.teacher_id AND a.status='approved')";
 const args=[...(u.role==='admin'?[]:[u.id]),...(page.roomId?[page.roomId]:[])];
 let sessions=(await st(db,`SELECT c.*,r.name AS room_name,r.teacher_id,(SELECT name FROM users WHERE id=c.teacher_present_id) AS active_teacher_name FROM class_sessions c JOIN classroom_rooms r ON r.id=c.room_id WHERE c.status!='ended' AND ${scope} ${page.roomId?'AND c.room_id=?':''} ORDER BY c.opens_at DESC LIMIT 10`,...args).all<any>()).results;
 if(u.role==='student'){const allowed=[];for(const session of sessions)try{await roomEnrollment(db,u,session.room_id,now);allowed.push(session)}catch(e){if(!(e instanceof AppError)||e.status!==403)throw e}sessions=allowed;}
 for(const s of sessions){const course=await st(db,'SELECT * FROM teaching_classes WHERE room_id=?',s.room_id).first<any>();if(course&&u.role!=='student')await enrollEligible(db,course,now);
 const eligibility=course?`AND ${levelKeySQL('d.level')}=? AND EXISTS(SELECT 1 FROM class_enrollments ce WHERE ce.class_id=? AND ce.student_id=u.id AND ce.status='active') AND NOT EXISTS(SELECT 1 FROM learner_subjects ls WHERE ls.student_id=u.id AND ls.class_level=? AND ls.subject=? AND ls.status='exempt')`:'';
 const base=`SELECT d.level,u.id AS student_id,u.name,a.camera_frame,a.camera_at,a.joined_at,a.last_seen,a.ready,a.left_at,a.mic_policy,CASE WHEN la.expires_at>? THEN 1 ELSE 0 END AS paid FROM admissions d JOIN users u ON u.id=d.student_id LEFT JOIN class_attendance a ON a.student_id=u.id AND a.session_id=? LEFT JOIN learner_access la ON la.student_id=u.id WHERE d.teacher_id=? AND d.status='approved' AND u.disabled=0 ${eligibility}`;
 const baseArgs=[now,s.id,s.teacher_id,...(course?[course.class_level,course.id,course.class_level,course.subject]:[])];
 const totals=await st(db,`SELECT COUNT(*) AS total,COALESCE(SUM(paid=1 AND left_at IS NULL AND last_seen>?),0) AS online,COALESCE(SUM(paid=1 AND left_at IS NULL AND last_seen>? AND ready=1),0) AS ready FROM (${base})`,now-75000,now-75000,...baseArgs).first<any>();
 s.rosterTotal=totals.total;s.onlineCount=totals.online;s.readyCount=totals.ready;s.rosterOffset=u.role==='student'?0:offset;s.rosterLimit=limit;s.teacher_online=!!s.teacher_present_id&&s.teacher_last_seen>now-75000;
 const rows=(await st(db,base+(u.role==='student'?' AND u.id=?':'')+' ORDER BY lower(u.name),u.id LIMIT ? OFFSET ?',...baseArgs,...(u.role==='student'?[u.id]:[]),limit,u.role==='student'?0:offset).all<any>()).results;
 s.roster=rows.map(r=>({...r,mic_allowed:microphoneAllowed(s,r.joined_at?r:null,now),camera_frame:(u.role!=='student'||u.id===r.student_id)&&!!r.paid&&!r.left_at&&r.last_seen>now-75000&&r.camera_at>now-45000?r.camera_frame:null,camera_at:(u.role!=='student'||u.id===r.student_id)?r.camera_at:null,online:!!r.paid&&!r.left_at&&r.last_seen>now-75000,late:!!r.joined_at&&!!(s.started_at||s.start_mode==='automatic')&&r.joined_at>(s.started_at||s.starts_at)}));
 }
 const recentEnded=(await st(db,`SELECT c.id,c.title,c.ended_at,r.name AS room_name FROM class_sessions c JOIN classroom_rooms r ON r.id=c.room_id WHERE c.status='ended' AND ${scope} ${page.roomId?'AND c.room_id=?':''} ORDER BY c.ended_at DESC LIMIT 3`,...args).all()).results;
 return {classSessions:sessions,recentEnded,serverNow:now};
}

export async function clearExpiredCameraFrames(db:D1Database,now=Date.now()){if(!await st(db,'SELECT id FROM class_attendance WHERE camera_at<=? LIMIT 1',now-45000).first())return;await st(db,'UPDATE class_attendance SET camera_frame=NULL,camera_at=NULL WHERE camera_at<=?',now-45000).run()}
