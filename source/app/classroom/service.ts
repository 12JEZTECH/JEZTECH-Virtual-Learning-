import {roomEnrollment} from './enrollment';
import {advanceLessonClock,callLessonPolicy} from './lifecycle';
import {z} from 'zod';
import {AppError,type User} from '../service';
import {requirePaidAccess,refreshAccess,sweepUnpaidSessions} from './access';
const uuid=z.string().uuid();
export const ClassroomAction=z.discriminatedUnion('action',[
 z.object({action:z.literal('createRoom'),name:z.string().trim().min(2).max(120),description:z.string().trim().max(1000)}),
 z.object({action:z.literal('requestCall'),roomId:uuid,topic:z.string().trim().min(3).max(1000)}),
 z.object({action:z.literal('acceptCall'),callId:uuid}),
 z.object({action:z.literal('endCall'),callId:uuid}),
 z.object({action:z.literal('callPresence'),callId:uuid}),
 z.object({action:z.literal('signal'),callId:uuid,type:z.enum(['offer','answer','ice']),payload:z.string().min(1).max(30000)}),
 z.object({action:z.literal('addCamera'),roomId:uuid,name:z.string().trim().min(2).max(120),format:z.enum(['hls','mjpeg']),url:z.string().url().max(2000)}),
 z.object({action:z.literal('setMonitor'),roomId:uuid,teacherId:z.string().min(1).max(200),enabled:z.boolean()}),
 z.object({action:z.literal('updateCamera'),id:uuid,name:z.string().trim().min(2).max(120),format:z.enum(['hls','mjpeg']),url:z.string().url().max(2000)}),
 z.object({action:z.literal('deleteCamera'),id:uuid}),
 z.object({action:z.literal('cameraStatus'),id:uuid,enabled:z.boolean()}),
]);
const st=(db:D1Database,sql:string,...v:unknown[])=>db.prepare(sql).bind(...v);
const one=(db:D1Database,sql:string,...v:unknown[])=>st(db,sql,...v).first<any>();
const all=async(db:D1Database,sql:string,...v:unknown[])=>(await st(db,sql,...v).all<any>()).results;
export function validateStreamUrl(value:string){const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.hash)throw new AppError(400,'Use an HTTPS browser-compatible stream without embedded camera passwords or URL fragments. RTSP/NVR sources need a gateway.');if([...url.searchParams.keys()].some(k=>/^(password|passwd|pwd|secret|token|access_token|api_key|key|authorization)$/i.test(k)))throw new AppError(400,'Do not store camera passwords or access tokens in the stream URL. Use gateway session authentication.');return url}
export async function roomAccess(db:D1Database,u:User,id:string){const r=await one(db,'SELECT * FROM classroom_rooms WHERE id=?',id);if(!r)throw new AppError(404,'Classroom not found');if(u.role==='admin'||r.teacher_id===u.id)return r;if(u.role==='student'&&await one(db,"SELECT student_id FROM admissions WHERE student_id=? AND teacher_id=? AND status='approved'",u.id,r.teacher_id)){await roomEnrollment(db,u,r.id);return r;}throw new AppError(403,'This classroom belongs to another teaching group')}
async function participant(db:D1Database,u:User,id:string){const c=await one(db,'SELECT * FROM classroom_calls WHERE id=?',id);if(!c)throw new AppError(404,'Call not found');if(u.id!==c.student_id&&u.id!==c.teacher_id)throw new AppError(403,'You are not a participant in this call');return c}
export async function readClassroom(db:D1Database,u:User,now=Date.now()){
 await requirePaidAccess(db,u,now,'classroom_connection');await advanceLessonClock(db,now);await sweepUnpaidSessions(db,u,now);
 // Close stale requests and calls whose learner access expired.
 if(await one(db,"SELECT id FROM classroom_calls WHERE status IN ('waiting','accepted') AND (last_seen<? OR NOT EXISTS(SELECT 1 FROM learner_access a WHERE a.student_id=classroom_calls.student_id AND a.expires_at>?)) LIMIT 1",now-300000,now))await st(db,"UPDATE classroom_calls SET status='ended',ended_at=? WHERE status IN ('waiting','accepted') AND (last_seen<? OR NOT EXISTS(SELECT 1 FROM learner_access a WHERE a.student_id=classroom_calls.student_id AND a.expires_at>?))",now,now-300000,now).run();
 if(await one(db,'SELECT id FROM call_signals WHERE created_at<? LIMIT 1',now-86400000))await st(db,'DELETE FROM call_signals WHERE created_at<?',now-86400000).run();
 const scope=u.role==='student'?"EXISTS(SELECT 1 FROM admissions a WHERE a.student_id=? AND a.teacher_id=r.teacher_id AND a.status='approved')":u.role==='teacher'?'r.teacher_id=?':'1=1';const args=u.role==='admin'?[]:[u.id];
 let rooms=await all(db,`SELECT r.*,us.name AS teacher_name FROM classroom_rooms r JOIN users us ON us.id=r.teacher_id WHERE ${scope} ORDER BY r.created_at DESC`,...args);
 if(u.role==='student'){const allowed=[];for(const room of rooms)try{await roomEnrollment(db,u,room.id,now);allowed.push(room)}catch(e){if(!(e instanceof AppError)||e.status!==403)throw e}rooms=allowed;}
 const calls=await all(db,`SELECT c.*,us.name AS student_name,r.name AS room_name FROM classroom_calls c JOIN classroom_rooms r ON r.id=c.room_id JOIN users us ON us.id=c.student_id WHERE ${u.role==='student'?'c.student_id=?':u.role==='teacher'?'c.teacher_id=?':'1=1'} AND c.created_at>? ORDER BY CASE WHEN c.status='accepted' THEN 0 WHEN c.status='waiting' THEN 1 ELSE 2 END,c.created_at DESC LIMIT 100`,...args,now-86400000);
 const cameraScope=u.role==='teacher'?"(r.teacher_id=? OR EXISTS(SELECT 1 FROM cctv_monitors m WHERE m.room_id=r.id AND m.teacher_id=?))":'1=1';const cameraArgs=u.role==='teacher'?[u.id,u.id]:[];
 const monitoringRooms=u.role==='student'?[]:await all(db,`SELECT r.id,r.name,r.teacher_id,us.name AS teacher_name FROM classroom_rooms r JOIN users us ON us.id=r.teacher_id WHERE ${cameraScope} ORDER BY r.name`,...cameraArgs);
 const cameras=u.role==='student'?[]:await all(db,`SELECT x.*,r.name AS room_name,r.teacher_id FROM cctv_cameras x JOIN classroom_rooms r ON r.id=x.room_id WHERE ${cameraScope} ORDER BY r.name,x.name`,...cameraArgs);
 const monitorGrants=u.role==='admin'?await all(db,'SELECT m.*,r.name AS room_name,us.name AS teacher_name FROM cctv_monitors m JOIN classroom_rooms r ON r.id=m.room_id JOIN users us ON us.id=m.teacher_id ORDER BY r.name,us.name'):[];
 const monitoringTeachers=u.role==='admin'?await all(db,"SELECT id,name FROM users WHERE role='teacher' AND disabled=0 ORDER BY name"):[];
 for(let i=0;i<calls.length;i++)calls[i]=await callLessonPolicy(db,calls[i],now);
 return {rooms,calls,cameras,monitoringRooms,monitorGrants,monitoringTeachers,serverNow:now};
}
export async function readSignals(db:D1Database,u:User,callId:string,after:number,now=Date.now()){
 await requirePaidAccess(db,u,now,'live_call_signals');await advanceLessonClock(db,now);const c=await participant(db,u,callId);const access=await refreshAccess(db,c.student_id,now);if(!access||access.expires_at<=now)throw new AppError(402,'Learner access expired');
 return {call:await callLessonPolicy(db,c,now),signals:await all(db,'SELECT id,type,payload FROM call_signals WHERE call_id=? AND sender_id!=? AND id>? ORDER BY id LIMIT 100',callId,u.id,after)};
}
export async function mutateClassroom(db:D1Database,u:User,a:z.infer<typeof ClassroomAction>,now=Date.now()):Promise<any>{
 await requirePaidAccess(db,u,now);await advanceLessonClock(db,now);
 if(a.action==='createRoom'){if(u.role==='student')throw new AppError(403,'Teacher access required');const id=crypto.randomUUID();await st(db,'INSERT INTO classroom_rooms(id,teacher_id,name,description,created_at) VALUES(?,?,?,?,?)',id,u.id,a.name,a.description,now).run();return {id}}
 if(a.action==='setMonitor'){
 if(u.role!=='admin')throw new AppError(403,'Only the administrator can grant cross-class monitoring');await roomAccess(db,u,a.roomId);if(a.enabled){const teacher=await one(db,"SELECT id FROM users WHERE id=? AND role='teacher' AND disabled=0",a.teacherId);if(!teacher)throw new AppError(400,'Choose an active teacher');await st(db,'INSERT INTO cctv_monitors(id,room_id,teacher_id,created_by,created_at) VALUES(?,?,?,?,?) ON CONFLICT(room_id,teacher_id) DO NOTHING',crypto.randomUUID(),a.roomId,a.teacherId,u.id,now).run()}else await st(db,'DELETE FROM cctv_monitors WHERE room_id=? AND teacher_id=?',a.roomId,a.teacherId).run();return {ok:true};
 }
 if(a.action==='updateCamera'||a.action==='deleteCamera'){
 if(u.role==='student')throw new AppError(403,'Teacher access required');const camera=await one(db,'SELECT * FROM cctv_cameras WHERE id=?',a.id);if(!camera)throw new AppError(404,'Camera not found');await roomAccess(db,u,camera.room_id);if(a.action==='deleteCamera')await st(db,'DELETE FROM cctv_cameras WHERE id=?',a.id).run();else{validateStreamUrl(a.url);await st(db,'UPDATE cctv_cameras SET name=?,url=?,format=? WHERE id=?',a.name,a.url,a.format,a.id).run()}return {ok:true};
 }
 if(a.action==='addCamera'){
 if(u.role==='student')throw new AppError(403,'Teacher access required');await roomAccess(db,u,a.roomId);validateStreamUrl(a.url);const id=crypto.randomUUID();await st(db,'INSERT INTO cctv_cameras(id,room_id,name,url,format,created_at) VALUES(?,?,?,?,?,?)',id,a.roomId,a.name,a.url,a.format,now).run();return {id};
 }
 if(a.action==='cameraStatus'){const cam=await one(db,'SELECT * FROM cctv_cameras WHERE id=?',a.id);if(!cam)throw new AppError(404,'Camera not found');if(u.role==='student')throw new AppError(403,'Teacher access required');await roomAccess(db,u,cam.room_id);await st(db,'UPDATE cctv_cameras SET enabled=? WHERE id=?',a.enabled?1:0,a.id).run();return {ok:true}}
 if(a.action==='requestCall'){
 if(u.role!=='student')throw new AppError(403,'Learner account required');const room=await roomAccess(db,u,a.roomId);
 const lesson=await one(db,'SELECT * FROM class_sessions WHERE room_id=? ORDER BY opens_at DESC LIMIT 1',room.id);if(lesson){if(lesson.status!=='live')throw new AppError(409,lesson.status==='ended'?'This lesson has ended. Wait for the next lesson.':'Wait for the teacher to start the lesson before requesting a live microphone connection');if(!await one(db,'SELECT id FROM class_attendance WHERE session_id=? AND student_id=? AND left_at IS NULL',lesson.id,u.id))throw new AppError(409,'Join the lesson board first')}
 if(await one(db,"SELECT id FROM classroom_calls WHERE student_id=? AND status IN ('waiting','accepted') AND last_seen>?",u.id,now-300000))throw new AppError(409,'You already have an open classroom question request');const id=crypto.randomUUID();await st(db,'INSERT INTO classroom_calls(id,room_id,student_id,teacher_id,topic,created_at,last_seen,session_id) VALUES(?,?,?,?,?,?,?,?)',id,room.id,u.id,room.teacher_id,a.topic,now,now,lesson?.id||null).run();return {id};
 }
 const c=await participant(db,u,a.callId);
 if(a.action==='endCall'){await st(db,"UPDATE classroom_calls SET status='ended',ended_at=? WHERE id=?",now,c.id).run();return {ok:true}}
 if(c.status==='ended')throw new AppError(409,'This call has ended');
 if(a.action==='acceptCall'){if(u.id!==c.teacher_id)throw new AppError(403,'Only the assigned teacher can accept the call');const access=await refreshAccess(db,c.student_id,now);if(!access||access.expires_at<=now)throw new AppError(402,'Learner payment access expired');if(await one(db,"SELECT id FROM classroom_calls WHERE teacher_id=? AND status='accepted' AND id!=?",u.id,c.id))throw new AppError(409,'Finish the current learner call before accepting another');await st(db,"UPDATE classroom_calls SET status='accepted',accepted_at=?,last_seen=? WHERE id=? AND status='waiting'",now,now,c.id).run();return {ok:true}}
 if(a.action==='callPresence'){await st(db,'UPDATE classroom_calls SET last_seen=? WHERE id=? AND status!=?',now,c.id,'ended').run();return {ok:true}}
 if(a.action==='signal'){
 const access=await refreshAccess(db,c.student_id,now);if(!access||access.expires_at<=now)throw new AppError(402,'Learner payment access expired');
 if(c.status!=='accepted')throw new AppError(409,'Wait for your teacher to accept the request');if(a.type==='offer'&&u.id!==c.student_id||a.type==='answer'&&u.id!==c.teacher_id)throw new AppError(403,'Unexpected signaling role');let payload;try{payload=JSON.parse(a.payload)}catch{throw new AppError(400,'Invalid signal payload')};if(a.type!=='ice'&&(payload.type!==a.type||typeof payload.sdp!=='string'))throw new AppError(400,'Invalid session description');if(a.type==='ice'&&payload!==null&&(typeof payload.candidate!=='string'||payload.candidate.length>5000))throw new AppError(400,'Invalid ICE candidate');await st(db,'INSERT INTO call_signals(call_id,sender_id,type,payload,created_at) VALUES(?,?,?,?,?)',c.id,u.id,a.type,JSON.stringify(payload),now).run();return {ok:true};
 }
 throw new AppError(400,'Invalid classroom action');
}
