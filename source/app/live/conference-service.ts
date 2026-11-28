import {accessUntilSQL} from '../classroom/access';
import {galleryOfferer} from './gallery-policy';
import {levelKeySQL} from '../classroom/enrollment';
import {z} from 'zod';
import {AppError,type User} from '../service';
import {teachingClassAccess} from '../hub/service';
import {microphoneAllowed,advanceLessonClock} from '../classroom/lifecycle';
import {freshUser} from './service';
const uuid=z.string().uuid();
export const ConferenceAction=z.discriminatedUnion('action',[
 z.object({action:z.literal('join'),classId:uuid,sessionId:uuid,peerId:uuid}),
 z.object({action:z.literal('leave'),classId:uuid,sessionId:uuid,peerId:uuid}),
 z.object({action:z.literal('signal'),classId:uuid,sessionId:uuid,peerId:uuid,toPeer:uuid,eventId:uuid,kind:z.enum(['offer','answer','ice']),payload:z.string().min(1).max(30000)}),
]);
const st=(db:D1Database,sql:string,...v:unknown[])=>db.prepare(sql).bind(...v);
const one=(db:D1Database,sql:string,...v:unknown[])=>st(db,sql,...v).first<any>();
const all=async(db:D1Database,sql:string,...v:unknown[])=>(await st(db,sql,...v).all<any>()).results;
async function access(db:D1Database,user:User,classId:string,sessionId:string,now:number){
 const u=await freshUser(db,user);await advanceLessonClock(db,now);const c=await teachingClassAccess(db,u,classId,now);
 const s=await one(db,"SELECT * FROM class_sessions WHERE id=? AND room_id=? AND status='live' AND ends_at>?",sessionId,c.room_id,now);
 if(!s||!s.teacher_present_id)throw new AppError(409,'The teacher must join and start this lesson first');
 if(u.role==='student'){
  if(await one(db,"SELECT id FROM sessions WHERE student_id=? AND status IN ('active','paused')",u.id))throw new AppError(409,'Live media is unavailable during an assessment');
  if(!await one(db,'SELECT id FROM class_attendance WHERE session_id=? AND student_id=? AND left_at IS NULL',s.id,u.id))throw new AppError(403,'Join this lesson before joining live media');
 }
 return {u,c,s};
}
async function peers(db:D1Database,c:any,s:any,now:number){
 const candidates=await all(db,'SELECT p.*,u.name,u.role,u.disabled FROM conference_peers p JOIN users u ON u.id=p.user_id WHERE p.session_id=? AND p.last_seen>? ORDER BY p.joined_at',s.id,now-75000),out:any[]=[];
 for(const p of candidates){if(p.disabled)continue;
 if(p.role==='student'){
 const ok=await one(db,`SELECT a.left_at,a.mic_policy,${accessUntilSQL('ad.student_id')} AS access_until FROM class_attendance a JOIN learner_access l ON l.student_id=a.student_id JOIN class_enrollments e ON e.student_id=a.student_id AND e.class_id=? JOIN admissions ad ON ad.student_id=a.student_id WHERE a.session_id=? AND a.student_id=? AND a.left_at IS NULL AND ${accessUntilSQL('ad.student_id')}>? AND e.status='active' AND ad.status='approved' AND ad.teacher_id=? AND ${levelKeySQL('ad.level')}=? AND NOT EXISTS(SELECT 1 FROM learner_subjects ls WHERE ls.student_id=a.student_id AND ls.class_level=? AND ls.subject=? AND ls.status='exempt') AND NOT EXISTS(SELECT 1 FROM sessions x WHERE x.student_id=a.student_id AND x.status IN ('active','paused'))`,c.id,s.id,p.user_id,now,c.teacher_id,c.class_level,c.class_level,c.subject);
 if(!ok)continue;p.micAllowed=microphoneAllowed(s,ok,now);p.accessUntil=ok.access_until;
 }else p.micAllowed=p.user_id===s.teacher_present_id;
 out.push({id:p.id,userId:p.user_id,name:p.name,role:p.role,publisher:p.user_id===s.teacher_present_id,micAllowed:p.micAllowed,accessUntil:p.accessUntil||s.ends_at});}
 return out;
}
export async function conferenceState(db:D1Database,user:User,classId:string,sessionId:string,peerId:string,after:number,now=Date.now()){
 uuid.parse(peerId);if(!Number.isSafeInteger(after)||after<0)throw new AppError(400,'Invalid signal cursor');
 const {u,c,s}=await access(db,user,classId,sessionId,now);
 const current=await one(db,'SELECT id FROM conference_peers WHERE id=? AND user_id=? AND session_id=? AND last_seen>?',peerId,u.id,s.id,now-75000);if(!current)throw new AppError(409,'Live media connection ended. Join again.');
 await st(db,'UPDATE conference_peers SET last_seen=? WHERE id=?',now,peerId).run();
 const members=await peers(db,c,s,now),valid=new Set(members.map(p=>p.id));
 const received=await all(db,'SELECT id,from_peer,kind,payload FROM conference_signals WHERE to_peer=? AND session_id=? AND id>? ORDER BY id LIMIT 100',peerId,s.id,after),signals=received.filter(e=>valid.has(e.from_peer));
 return {peers:members,signals,cursor:received.at(-1)?.id||after,validUntil:Math.min(s.ends_at,now+75000,members.find(p=>p.userId===u.id)?.accessUntil||s.ends_at),endsAt:s.ends_at,serverNow:now,publisherId:s.teacher_present_id,maxStudents:10};
}
export async function mutateConference(db:D1Database,user:User,input:unknown,now=Date.now()){
 const a=ConferenceAction.parse(input),u=await freshUser(db,user);
 // A user may always close their own devices, even after subscription or lesson expiry.
 if(a.action==='leave'){await st(db,'DELETE FROM conference_peers WHERE id=? AND session_id=? AND user_id=?',a.peerId,a.sessionId,u.id).run();return {ok:true}}
 const {c,s}=await access(db,u,a.classId,a.sessionId,now);
 if(a.action==='join'){
 await db.batch([st(db,'DELETE FROM conference_peers WHERE session_id=? AND last_seen<=?',s.id,now-75000),st(db,'DELETE FROM conference_signals WHERE created_at<?',now-300000)]);
 // D1 serializes this insert. Up to ten audience connections plus the teacher; client counts cannot bypass the cap.
 const r=await st(db,'INSERT INTO conference_peers(id,session_id,user_id,joined_at,last_seen) SELECT ?,?,?,?,? WHERE ?=? OR EXISTS(SELECT 1 FROM conference_peers WHERE session_id=? AND user_id=?) OR (SELECT COUNT(*) FROM conference_peers WHERE session_id=? AND user_id!=?)<10 ON CONFLICT(session_id,user_id) DO UPDATE SET id=excluded.id,joined_at=excluded.joined_at,last_seen=excluded.last_seen',a.peerId,s.id,u.id,now,now,u.id,s.teacher_present_id,s.id,u.id,s.id,s.teacher_present_id).run();
 if(!r.meta.changes)throw new AppError(409,'This live media room already has ten audience connections. Other enrolled learners can still use notes and clips.');
 return conferenceState(db,u,c.id,s.id,a.peerId,0,now);
 }
 const members=await peers(db,c,s,now),from=members.find(p=>p.id===a.peerId&&p.userId===u.id),to=members.find(p=>p.id===a.toPeer);
 if(!from||!to)throw new AppError(403,'Live media participants must be currently joined');
 if(from.id===to.id)throw new AppError(403,'Choose another joined participant');
 const offerer=galleryOfferer(from,to);if(a.kind==='offer'&&!offerer||a.kind==='answer'&&offerer)throw new AppError(403,'Unexpected live media signaling role');
 let p:any;try{p=JSON.parse(a.payload)}catch{throw new AppError(400,'Invalid live media signal')}
 if(a.kind==='ice'){if(p!==null&&(typeof p?.candidate!=='string'||p.candidate.length>5000))throw new AppError(400,'Invalid network candidate')}
 else if(p?.type!==a.kind||typeof p.sdp!=='string'||p.sdp.length>29000)throw new AppError(400,'Invalid session description');
 if(!from.publisher&&!to.publisher&&a.kind!=='ice'&&/^m=audio\s/m.test(p.sdp))throw new AppError(403,'Classmate links share video only; microphones remain teacher controlled');
 if((await one(db,'SELECT COUNT(*) AS n FROM conference_signals WHERE from_peer=? AND created_at>?',from.id,now-60000)).n>=240)throw new AppError(429,'Live media signaling is busy. Retry shortly.');
 await st(db,'INSERT INTO conference_signals(event_id,session_id,from_peer,to_peer,kind,payload,created_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(event_id) DO NOTHING',a.eventId,s.id,from.id,to.id,a.kind,JSON.stringify(p),now).run();return {ok:true};
}
