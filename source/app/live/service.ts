import {orientationAccess} from '../orientation/access';
import {requireTutorialVideo} from '../subject-store/access';
import {z} from 'zod';
import {AppError,type User} from '../service';
import {teachingClassAccess} from '../hub/service';
import {enrollEligible,levelKey,levelKeySQL} from '../classroom/enrollment';
import {advanceLessonClock} from '../classroom/lifecycle';
import {requirePaidAccess} from '../classroom/access';
import {grantEarnedCredit} from '../engagement/service';
const uuid=z.string().uuid();
export const LiveAction=z.discriminatedUnion('action',[
 z.object({action:z.literal('cascadeClip'),classId:uuid,sessionId:uuid,clipId:uuid,durationSeconds:z.number().int().min(1).max(1800),displayOrder:z.number().int().min(1).max(100),present:z.boolean().optional()}),
 z.object({action:z.literal('presentClip'),classId:uuid,id:uuid,position:z.number().finite().min(0).max(1800),playing:z.boolean(),following:z.boolean()}),
 z.object({action:z.literal('archiveCascade'),classId:uuid,id:uuid}),
 z.object({action:z.literal('reserveClip'),classId:uuid,id:uuid}),
 z.object({action:z.literal('classEnrollment'),classId:uuid,studentId:z.string().min(1).max(200),active:z.boolean()}),
]);
const st=(db:D1Database,sql:string,...v:unknown[])=>db.prepare(sql).bind(...v);
const one=(db:D1Database,sql:string,...v:unknown[])=>st(db,sql,...v).first<any>();
const all=async(db:D1Database,sql:string,...v:unknown[])=>(await st(db,sql,...v).all<any>()).results;
export async function freshUser(db:D1Database,u:User){const current=await one(db,'SELECT * FROM users WHERE id=?',u.id);if(!current||current.disabled)throw new AppError(403,'Account disabled or unavailable');return current as User}
async function noExam(db:D1Database,u:User){if(u.role==='student'&&await one(db,"SELECT id FROM sessions WHERE student_id=? AND status IN ('active','paused')",u.id))throw new AppError(409,'Learning clips are unavailable during an active assessment')}
async function lesson(db:D1Database,c:any,id:string,now:number){const s=await one(db,'SELECT * FROM class_sessions WHERE id=? AND room_id=?',id,c.room_id);if(!s)throw new AppError(404,'Lesson not found');if(s.status!=='live'||!s.ends_at||s.ends_at<=now)throw new AppError(409,'The teacher must start this lesson before clips can be shared or played');return s}
async function cascade(db:D1Database,c:any,id:string,now:number){const clip=await one(db,"SELECT cc.*,v.title,v.url,v.teacher_id,v.explanation FROM cascaded_clips cc JOIN learning_videos v ON v.id=cc.clip_id JOIN class_sessions s ON s.id=cc.session_id WHERE cc.id=? AND s.room_id=? AND cc.status='cascaded'",id,c.room_id);if(!clip)throw new AppError(404,'Shared clip not found');await lesson(db,c,clip.session_id,now);return clip}
export async function liveSnapshot(db:D1Database,user:User,classId:string,now=Date.now(),page={offset:0,limit:50}){
 const offset=Number.isSafeInteger(page.offset)&&page.offset>=0?page.offset:0,limit=Math.max(1,Math.min(100,page.limit||50));
 const u=await freshUser(db,user);await advanceLessonClock(db,now);const c=await teachingClassAccess(db,u,classId,now);if(u.role!=='student')await enrollEligible(db,c,now);
 const s=await one(db,'SELECT s.*,u.name AS joined_teacher_name FROM class_sessions s LEFT JOIN users u ON u.id=s.teacher_present_id WHERE s.room_id=? ORDER BY s.opens_at DESC LIMIT 1',c.room_id);
 const base=`FROM class_enrollments e JOIN users u ON u.id=e.student_id JOIN admissions ad ON ad.student_id=u.id LEFT JOIN learner_subjects ls ON ls.student_id=u.id AND ls.class_level=? AND ls.subject=? WHERE e.class_id=? AND ad.teacher_id=? AND ad.status='approved' AND u.disabled=0 AND ${levelKeySQL('ad.level')}=? AND COALESCE(ls.status,'attend')!='exempt'`;
 const args=[c.class_level,c.subject,c.id,c.teacher_id,c.class_level];
 const counts=await one(db,`SELECT COUNT(*) AS total,COALESCE(SUM(e.status='active'),0) AS active ${base}`,...args);
 const members=u.role==='student'?[]:await all(db,`SELECT e.student_id,u.name,e.status ${base} ORDER BY lower(u.name),e.student_id LIMIT ? OFFSET ?`,...args,limit,offset);
 const onlineBase=`FROM class_attendance a JOIN class_enrollments e ON e.student_id=a.student_id AND e.class_id=? JOIN users u ON u.id=a.student_id JOIN admissions ad ON ad.student_id=u.id JOIN learner_access la ON la.student_id=u.id LEFT JOIN learner_subjects ls ON ls.student_id=u.id AND ls.class_level=? AND ls.subject=? WHERE a.session_id=? AND a.left_at IS NULL AND a.last_seen>? AND la.expires_at>? AND u.disabled=0 AND e.status='active' AND ad.teacher_id=? AND ad.status='approved' AND ${levelKeySQL('ad.level')}=? AND COALESCE(ls.status,'attend')!='exempt'`;
 const onlineArgs=[c.id,c.class_level,c.subject,s?.id||'',now-75000,now,c.teacher_id,c.class_level];
 const onlineCount=s&&s.status!=='ended'?(await one(db,`SELECT COUNT(*) AS n ${onlineBase}`,...onlineArgs)).n:0;
 const online=s&&s.status!=='ended'?await all(db,`SELECT a.student_id AS id,u.name,a.ready ${onlineBase} ORDER BY lower(u.name),a.student_id LIMIT ? OFFSET ?`,...onlineArgs,limit,offset):[];
 const joined=u.role==='student'&&!!s&&!!await one(db,'SELECT id FROM class_attendance WHERE session_id=? AND student_id=? AND left_at IS NULL',s.id,u.id);
 const examActive=u.role==='student'&&!!await one(db,"SELECT id FROM sessions WHERE student_id=? AND status IN ('active','paused')",u.id);
 const savedBoard=await one(db,'SELECT title,body,is_live,updated_at FROM lesson_boards WHERE class_id=?',c.id);
 const board=u.role==='student'?(s?.status==='live'&&!examActive&&savedBoard?.is_live?savedBoard:null):savedBoard;
 const notes=u.role==='student'?[]:await all(db,"SELECT id,title,content FROM lessons WHERE teacher_id=? AND subject=? AND status='published' AND (class_level=? OR class_level='all' OR class_level IS NULL) AND content!='' ORDER BY created_at DESC LIMIT 100",c.teacher_id,c.subject,c.class_level);
 const shared=s?.status==='live'&&!examActive?await all(db,"SELECT cc.id,cc.clip_id,cc.session_id,cc.duration_seconds,cc.display_order,cc.shared_at,v.title,v.explanation,(SELECT position FROM clip_telemetry e WHERE e.cascade_id=cc.id AND e.student_id=? ORDER BY e.occurred_at DESC,e.received_at DESC,e.id DESC LIMIT 1) AS resume_position FROM cascaded_clips cc JOIN learning_videos v ON v.id=cc.clip_id WHERE cc.session_id=? AND cc.status='cascaded' ORDER BY cc.display_order,cc.shared_at LIMIT 100",u.id,s.id):[];
 const presentation=s?.status==='live'&&!examActive?await one(db,"SELECT p.* FROM clip_presentations p JOIN cascaded_clips c ON c.id=p.cascade_id WHERE p.session_id=? AND c.status='cascaded'",s.id):null;
 return {user:{id:u.id,name:u.name,role:u.role},classInfo:{id:c.id,title:c.name,teacherName:c.teacher_name,roomId:c.room_id},session:s?{id:s.id,title:s.title,status:s.status,startedAt:s.started_at,startsAt:s.starts_at,endsAt:s.ends_at,teacherOnline:s.teacher_last_seen>now-75000&&!!s.teacher_present_id,teacherName:s.joined_teacher_name,teacherId:s.teacher_present_id,mediaMode:s.media_mode,learnerLimit:s.learner_limit}:null,onlineStudents:online.map(a=>({...a,ready:!!a.ready})),onlineCount,enrolled:counts.active,memberCount:counts.total,page:{offset,limit},members,joined,cascadedClips:shared,presentation,board,notes,library:u.role==='student'?[]:await all(db,'SELECT id,title FROM learning_videos WHERE teacher_id=? ORDER BY created_at DESC LIMIT 100',c.teacher_id),examActive,serverNow:now};
}
export async function mutateLive(db:D1Database,user:User,input:unknown,now=Date.now()){
 const a=LiveAction.parse(input),u=await freshUser(db,user);await advanceLessonClock(db,now);const c=await teachingClassAccess(db,u,a.classId,now);
 if(a.action==='classEnrollment'){
 if(u.role==='student')throw new AppError(403,'Teacher access required');const admission=await one(db,"SELECT a.level FROM admissions a JOIN users u ON u.id=a.student_id WHERE a.student_id=? AND a.teacher_id=? AND a.status='approved' AND u.disabled=0",a.studentId,c.teacher_id);if(!admission||levelKey(admission.level)!==c.class_level)throw new AppError(403,'Choose an approved learner in this class and teaching group');
 await st(db,"INSERT INTO class_enrollments(id,class_id,student_id,status,enrolled_at) VALUES(?,?,?,?,?) ON CONFLICT(class_id,student_id) DO UPDATE SET status=excluded.status",crypto.randomUUID(),c.id,a.studentId,a.active?'active':'removed',now).run();
 if(!a.active){await db.batch([st(db,'UPDATE class_attendance SET left_at=?,ready=0,camera_frame=NULL,camera_at=NULL WHERE student_id=? AND left_at IS NULL AND session_id IN (SELECT id FROM class_sessions WHERE room_id=?)',now,a.studentId,c.room_id),st(db,"UPDATE classroom_calls SET status='ended',ended_at=? WHERE student_id=? AND room_id=? AND status!='ended'",now,a.studentId,c.room_id)])}return {ok:true};
 }
 if(a.action==='presentClip'){
 if(u.role==='student')throw new AppError(403,'Only the teacher can control class clip playback');const clip=await cascade(db,c,a.id,now),s=await lesson(db,c,clip.session_id,now);
 if(s.teacher_present_id!==u.id&&u.role!=='admin')throw new AppError(403,'Only the presenting teacher can control playback');if(a.position>clip.duration_seconds)throw new AppError(400,'Playback position exceeds the shared clip length');
 await st(db,'INSERT INTO clip_presentations(session_id,cascade_id,position,playing,following,updated_at,updated_by) VALUES(?,?,?,?,?,?,?) ON CONFLICT(session_id) DO UPDATE SET cascade_id=excluded.cascade_id,position=excluded.position,playing=excluded.playing,following=excluded.following,updated_at=excluded.updated_at,updated_by=excluded.updated_by',s.id,clip.id,Math.floor(a.position),a.playing?1:0,a.following?1:0,now,u.id).run();return {ok:true};
 }
 if(a.action==='cascadeClip'){
 if(u.role==='student')throw new AppError(403,'Teacher access required');const session=await lesson(db,c,a.sessionId,now);if(a.present&&session.teacher_present_id!==u.id&&u.role!=='admin')throw new AppError(403,'Join as the presenting teacher before sharing and presenting');const v=await one(db,'SELECT teacher_id FROM learning_videos WHERE id=?',a.clipId);if(!v||v.teacher_id!==c.teacher_id)throw new AppError(403,'Choose a clip uploaded by this class teacher');
 const share=st(db,"INSERT INTO cascaded_clips(id,session_id,clip_id,duration_seconds,display_order,shared_at,shared_by) VALUES(?,?,?,?,?,?,?) ON CONFLICT(session_id,clip_id) DO UPDATE SET status='cascaded',duration_seconds=excluded.duration_seconds,display_order=excluded.display_order,shared_at=excluded.shared_at,shared_by=excluded.shared_by",crypto.randomUUID(),a.sessionId,a.clipId,a.durationSeconds,a.displayOrder,now,u.id);
 const writes=[share];if(a.present)writes.push(st(db,`INSERT INTO clip_presentations(session_id,cascade_id,position,playing,following,updated_at,updated_by) SELECT ?,cc.id,0,0,1,?,? FROM cascaded_clips cc WHERE cc.session_id=? AND cc.clip_id=? ON CONFLICT(session_id) DO UPDATE SET cascade_id=excluded.cascade_id,position=0,playing=0,following=1,updated_at=excluded.updated_at,updated_by=excluded.updated_by`,a.sessionId,now,u.id,a.sessionId,a.clipId));await db.batch(writes);const shared=await one(db,'SELECT id FROM cascaded_clips WHERE session_id=? AND clip_id=?',a.sessionId,a.clipId);return {ok:true,id:shared.id};
 }
 if(a.action==='archiveCascade'){
 if(u.role==='student')throw new AppError(403,'Teacher access required');const cc=await one(db,'SELECT cc.id FROM cascaded_clips cc JOIN class_sessions s ON s.id=cc.session_id WHERE cc.id=? AND s.room_id=?',a.id,c.room_id);if(!cc)throw new AppError(404,'Shared clip not found');await db.batch([st(db,"UPDATE cascaded_clips SET status='archived' WHERE id=?",a.id),st(db,'UPDATE clip_presentations SET following=0,playing=0,updated_at=? WHERE cascade_id=?',now,a.id)]);return {ok:true};
 }
 await noExam(db,u);const clip=await cascade(db,c,a.id,now),s=await lesson(db,c,clip.session_id,now);
 if(u.role==='student'&&!await one(db,'SELECT id FROM class_attendance WHERE session_id=? AND student_id=? AND left_at IS NULL',s.id,u.id))throw new AppError(409,'Join the lesson first');
 await requireTutorialVideo(db,u,clip.clip_id,now);
 const existing=await one(db,'SELECT * FROM clip_permits WHERE user_id=? AND cascade_id=? AND expires_at>? ORDER BY issued_at DESC LIMIT 1',u.id,clip.id,now);if(existing)return permitResult(db,existing,clip,u,now);
 const access=u.role==='student'?await requirePaidAccess(db,u,now,'shared_lesson_clip'):null;
 const seconds=Math.min(clip.duration_seconds,Math.floor((s.ends_at-now)/1000),access?Math.floor((access.expires_at-now)/1000):1800);if(seconds<1)throw new AppError(409,'This lesson or access period is ending');
 const id=crypto.randomUUID(),expires=now+seconds*1000;
 if(u.role==='student'&&!await orientationAccess(db,u.id,now)){
 await grantEarnedCredit(db,u.id,now);
 const reserved=await db.batch([
 st(db,'INSERT INTO clip_permits(id,cascade_id,user_id,issued_at,expires_at,reserved_seconds) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM video_credits WHERE student_id=? AND allowance-used>=? AND (lease_expires IS NULL OR lease_expires<=?))',id,clip.id,u.id,now,expires,seconds,u.id,seconds,now),
 st(db,'UPDATE video_credits SET used=used+?,lease_id=?,lease_expires=? WHERE student_id=? AND EXISTS(SELECT 1 FROM clip_permits WHERE id=?)',seconds,id,expires,u.id,id),
 ]);if(!reserved[0].meta.changes)throw new AppError(402,'Not enough video credit, or another playback reservation is active. Contact the administrator for credit.');
 }else await st(db,'INSERT INTO clip_permits(id,cascade_id,user_id,issued_at,expires_at,reserved_seconds) VALUES(?,?,?,?,?,?)',id,clip.id,u.id,now,expires,seconds).run();return permitResult(db,{id,expires_at:expires,reserved_seconds:seconds},clip,u,now);
}
async function permitResult(db:D1Database,p:any,clip:any,u:User,now:number){const resume=await one(db,'SELECT position,occurred_at FROM clip_telemetry WHERE student_id=? AND cascade_id=? ORDER BY occurred_at DESC,received_at DESC,id DESC LIMIT 1',u.id,clip.id);const presentation=await one(db,'SELECT * FROM clip_presentations WHERE session_id=? AND cascade_id=?',clip.session_id,clip.id);const hls=await one(db,"SELECT id,entry FROM hls_packages WHERE video_id=? AND status='ready' ORDER BY created_at DESC LIMIT 1",clip.clip_id);return {resumePosition:resume?.position||0,resumeAt:resume?.occurred_at||0,presentation,serverNow:now,hlsUrl:hls?'/api/classroom-media/'+p.id+'/hls/'+hls.id+'/'+hls.entry:null,hlsPrefix:hls?'/api/classroom-media/'+p.id+'/hls/'+hls.id+'/':null,id:p.id,cascadeId:clip.id,url:'/api/classroom-media/'+p.id,expiresAt:p.expires_at,reservedSeconds:p.reserved_seconds,durationSeconds:clip.duration_seconds,userId:u.id,title:clip.title}}
export async function authorizeSharedMedia(db:D1Database,user:User,id:string,now=Date.now()){
 const u=await freshUser(db,user);await advanceLessonClock(db,now);await noExam(db,u);
 const p=await one(db,"SELECT p.*,cc.clip_id,cc.session_id,cc.status,cc.duration_seconds,v.url,v.title,s.room_id,s.ends_at,s.status AS lesson_status FROM clip_permits p JOIN cascaded_clips cc ON cc.id=p.cascade_id JOIN learning_videos v ON v.id=cc.clip_id JOIN class_sessions s ON s.id=cc.session_id WHERE p.id=? AND p.user_id=?",id,u.id);
 if(!p||p.expires_at<=now||p.status!=='cascaded'||p.lesson_status!=='live'||p.ends_at<=now)throw new AppError(403,'Clip reservation expired, withdrawn or lesson ended');
 const c=await one(db,'SELECT id FROM teaching_classes WHERE room_id=?',p.room_id);if(!c)throw new AppError(404,'Class not found');await teachingClassAccess(db,u,c.id,now);
 if(u.role==='student'&&!await one(db,'SELECT id FROM class_attendance WHERE session_id=? AND student_id=? AND left_at IS NULL',p.session_id,u.id))throw new AppError(403,'Join the lesson before playing');
 await requireTutorialVideo(db,u,p.clip_id,now);return p;
}
export const TelemetryBatch=z.object({events:z.array(z.object({id:uuid,permitId:uuid,kind:z.enum(['play','progress','pause','ended','seek','waiting','error','exit']),position:z.number().finite().min(0).max(1800),watchedMs:z.number().int().min(0).max(20000).default(0),occurredAt:z.number().int().positive()})).min(1).max(50)});
export async function ingestTelemetry(db:D1Database,user:User,input:unknown,now=Date.now()){
 const u=await freshUser(db,user);if(u.role!=='student')throw new AppError(403,'Learner telemetry only');const a=TelemetryBatch.parse(input),accepted:string[]=[],rejected:string[]=[];
 for(const e of a.events){const p=await one(db,'SELECT p.*,c.duration_seconds FROM clip_permits p JOIN cascaded_clips c ON c.id=p.cascade_id WHERE p.id=? AND p.user_id=?',e.permitId,u.id);
 if(!p||e.occurredAt<p.issued_at-1000||e.occurredAt>p.expires_at+1000||e.occurredAt>now+30000||now-e.occurredAt>86400000||e.position>p.duration_seconds+1){rejected.push(e.id);continue}
 await st(db,'INSERT INTO clip_telemetry(id,permit_id,cascade_id,student_id,kind,position,watched_ms,occurred_at,received_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING',e.id,p.id,p.cascade_id,u.id,e.kind,Math.floor(e.position),e.kind==='progress'?e.watchedMs:0,e.occurredAt,now).run();accepted.push(e.id);
 }
 return {accepted,rejected};
}
export async function clipAnalytics(db:D1Database,user:User,classId:string,now=Date.now()){
 const u=await freshUser(db,user);if(u.role==='student')throw new AppError(403,'Teacher analytics required');const c=await teachingClassAccess(db,u,classId,now);
 const clips=await all(db,'SELECT cc.*,v.title FROM cascaded_clips cc JOIN learning_videos v ON v.id=cc.clip_id JOIN class_sessions s ON s.id=cc.session_id WHERE s.room_id=? ORDER BY cc.shared_at DESC LIMIT 30',c.room_id),result=[];
 for(const clip of clips){const rows=await all(db,'SELECT e.*,u.name FROM clip_telemetry e JOIN users u ON u.id=e.student_id WHERE e.cascade_id=? ORDER BY e.occurred_at LIMIT 20000',clip.id);const viewers=new Map<string,any>();for(const row of rows){const v=viewers.get(row.student_id)||{id:row.student_id,name:row.name,position:0,watchedMs:0,pauses:0,errors:0};v.position=Math.max(v.position,row.position);v.watchedMs+=row.watched_ms;v.pauses+=row.kind==='pause'?1:0;v.errors+=['error','waiting'].includes(row.kind)?1:0;viewers.set(row.student_id,v)}
 const students=[...viewers.values()].map(v=>({...v,watchedSeconds:Math.round(v.watchedMs/1000),completion:Math.min(100,Math.round(v.watchedMs/(clip.duration_seconds*10)))}));
 const buckets=new Map<number,Set<string>>();for(const row of rows.filter(r=>['pause','error','waiting','exit'].includes(r.kind)&&r.occurred_at>=now-300000)){const key=Math.floor(row.position/5)*5;if(!buckets.has(key))buckets.set(key,new Set());buckets.get(key)!.add(row.student_id)}
 for(const [bucket,ids] of buckets)if(ids.size>=3&&viewers.size>=3&&ids.size/viewers.size>=0.2)await st(db,'INSERT INTO clip_alerts(id,cascade_id,bucket,affected,viewers,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(cascade_id,bucket) DO NOTHING',crypto.randomUUID(),clip.id,bucket,ids.size,viewers.size,now).run();
 const retention=[];for(let sec=0;sec<=clip.duration_seconds;sec+=15)retention.push({second:sec,reached:students.filter(v=>v.position>=sec).length});
 result.push({id:clip.id,title:clip.title,durationSeconds:clip.duration_seconds,students,retention,alerts:await all(db,'SELECT bucket,affected,viewers,created_at FROM clip_alerts WHERE cascade_id=?',clip.id)});
 }return {clips:result};
}
export async function adminLiveLessons(db:D1Database,user:User,now=Date.now(),page={offset:0,limit:50}){
 const u=await freshUser(db,user);if(u.role!=='admin')throw new AppError(403,'Administrator access required');await advanceLessonClock(db,now);const offset=Math.max(0,Math.floor(page.offset||0)),limit=Math.max(1,Math.min(100,page.limit||50));
 const base=`SELECT s.id,s.title,s.status,s.started_at,s.ends_at,s.media_mode,s.learner_limit,s.opens_at,s.teacher_present_id,s.teacher_last_seen,c.id AS class_id,c.name AS class_title,r.name AS room_name,u.id AS teacher_id,u.name AS teacher_name,CASE WHEN u.disabled=0 AND s.teacher_present_id IS NOT NULL AND s.teacher_last_seen>? THEN 1 ELSE 0 END AS teacher_online,(SELECT COUNT(*) FROM class_attendance a JOIN users au ON au.id=a.student_id JOIN admissions d ON d.student_id=au.id JOIN learner_access la ON la.student_id=au.id WHERE a.session_id=s.id AND a.left_at IS NULL AND a.last_seen>? AND la.expires_at>? AND au.disabled=0 AND d.status='approved' AND d.teacher_id=r.teacher_id AND (c.id IS NULL OR (${levelKeySQL('d.level')}=c.class_level AND EXISTS(SELECT 1 FROM class_enrollments ce WHERE ce.class_id=c.id AND ce.student_id=au.id AND ce.status='active') AND NOT EXISTS(SELECT 1 FROM learner_subjects ls WHERE ls.student_id=au.id AND ls.class_level=c.class_level AND ls.subject=c.subject AND ls.status='exempt')))) AS online_students,(SELECT COUNT(*) FROM cascaded_clips cc WHERE cc.session_id=s.id AND cc.status='cascaded') AS clips FROM class_sessions s JOIN classroom_rooms r ON r.id=s.room_id JOIN users u ON u.id=r.teacher_id LEFT JOIN teaching_classes c ON c.room_id=r.id WHERE s.status!='ended'`;
 const args=[now-75000,now-75000,now];const lessons=await all(db,base+' ORDER BY s.opens_at DESC,s.id LIMIT ? OFFSET ?',...args,limit,offset);
 const totals=await one(db,`SELECT COUNT(*) AS open,COALESCE(SUM(status='live'),0) AS running,COUNT(DISTINCT CASE WHEN status='live' AND teacher_online=1 THEN teacher_present_id END) AS teachers,COALESCE(SUM(CASE WHEN status='live' THEN online_students ELSE 0 END),0) AS learners FROM (${base})`,...args);
 return {lessons:lessons.map(s=>({...s,teacher_online:!!s.teacher_online})),total:totals.open,stats:totals,page:{offset,limit},serverNow:now};
}
