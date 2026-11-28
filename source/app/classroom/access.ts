import {orientationUntilSQL} from '../orientation/access';
import {learnerFees,AppError,type User} from '../service';
const st=(db:D1Database,sql:string,...v:unknown[])=>db.prepare(sql).bind(...v);
/** Authoritative paid expiry: a revoked receipt is never trusted from a cached access row. */
export function accessUntilSQL(id:string){return `MAX(${orientationUntilSQL(id)},COALESCE((SELECT MAX(s.expires_at) FROM subscriptions s WHERE s.student_id=${id} AND s.status='verified'),0),COALESCE((SELECT MAX(COALESCE(g.expires_at,COALESCE(p.reviewed_at,p.created_at)+COALESCE((SELECT days FROM subscription_settings WHERE id='main'),6)*86400000)) FROM payments p LEFT JOIN payment_access_grants g ON g.payment_id=p.id WHERE p.student_id=${id} AND p.status='verified'),0),COALESCE((SELECT MAX(cp.expires_at) FROM conference_passes cp WHERE cp.student_id=${id}),0))`}
export async function refreshAccess(db:D1Database,id:string,now=Date.now()){
 const read=()=>st(db,`SELECT a.*,${accessUntilSQL('u.id')} AS effective_until,EXISTS(SELECT 1 FROM payments p LEFT JOIN payment_access_grants g ON g.payment_id=p.id WHERE p.student_id=u.id AND p.status='verified' AND g.payment_id IS NULL) AS needs_grants FROM users u LEFT JOIN learner_access a ON a.student_id=u.id WHERE u.id=?`,id).first<any>();
 let row=await read();if(!row)return null;
 if(row.needs_grants){await st(db,`INSERT INTO payment_access_grants(payment_id,student_id,expires_at,granted_at) SELECT p.id,p.student_id,COALESCE(p.reviewed_at,p.created_at)+COALESCE((SELECT days FROM subscription_settings WHERE id='main'),6)*86400000,? FROM payments p LEFT JOIN payment_access_grants g ON g.payment_id=p.id WHERE p.student_id=? AND p.status='verified' AND g.payment_id IS NULL`,now,id).run();row=await read();}
 const until=row.effective_until||0;
 if(!row.student_id){if(!until)return null;const loginId='JZT-'+crypto.randomUUID().replace(/-/g,'').slice(0,12).toUpperCase();await st(db,'INSERT INTO learner_access(student_id,login_id,expires_at,issued_at) VALUES(?,?,?,?) ON CONFLICT(student_id) DO UPDATE SET expires_at=excluded.expires_at WHERE learner_access.expires_at!=excluded.expires_at',id,loginId,until,now).run();return st(db,'SELECT * FROM learner_access WHERE student_id=?',id).first<any>()}
 if(row.expires_at!==until)await st(db,'UPDATE learner_access SET expires_at=? WHERE student_id=? AND expires_at!=?',until,id,until).run();
 return {student_id:row.student_id,login_id:row.login_id,expires_at:until,issued_at:row.issued_at};
}
export async function requirePaidAccess(db:D1Database,u:User,now=Date.now(),resource='protected_lesson'){
 if(u.role!=='student')return null;
 if(u.disabled){await recordAccessBlock(db,u,'account_disabled',resource,now);await closeUnpaidSessions(db,u.id,now);throw new AppError(403,'This learner account is disabled')}
 if(!await st(db,"SELECT student_id FROM admissions WHERE student_id=? AND status='approved' AND NOT (goals='Conference system testing' AND note='Conference pass admission')",u.id).first()){await recordAccessBlock(db,u,'admission_required',resource,now);await closeUnpaidSessions(db,u.id,now);throw new AppError(403,'Admission approval is required')}
 const access=await refreshAccess(db,u.id,now);
 if(!access||access.expires_at<=now){await recordAccessBlock(db,u,'subscription_inactive',resource,now);await closeUnpaidSessions(db,u.id,now);throw new AppError(402,'Your learner login requires a verified payment or renewal. Open Activate access.')}
 return access;
}
export async function accessState(db:D1Database,u:User,now=Date.now()){
 const admission=await st(db,'SELECT status,note,goals FROM admissions WHERE student_id=?',u.id).first<any>();
 const registrationComplete=admission?.status==='approved'&&!(admission.goals==='Conference system testing'&&admission.note==='Conference pass admission');const registrationIncomplete=admission?.goals==='Conference system testing'&&admission?.note==='Conference pass admission';
 const access=await refreshAccess(db,u.id,now);if(u.role==='student'&&(u.disabled||!registrationComplete||!access||access.expires_at<=now))await closeUnpaidSessions(db,u.id,now);return {user:{name:u.name,email:u.email,role:u.role},admission,registrationIncomplete,access,active:!u.disabled&&registrationComplete&&!!access&&access.expires_at>now,plan:(await learnerFees(db,u.role==='student'?u.id:'')).tuitionPlan,paymentInstructions:await st(db,"SELECT business_number,account_reference,instructions FROM payment_settings WHERE id='main'").first(),receipts:[],receiptStatuses:u.role==='student'?(await st(db,'SELECT id,status,created_at FROM subscriptions WHERE student_id=? ORDER BY created_at DESC,id DESC LIMIT 30',u.id).all()).results:[],serverNow:now};
}
export async function verifyLoginId(db:D1Database,u:User,loginId:string,now=Date.now()){
 const access=await requirePaidAccess(db,u,now);if(!access||access.login_id!==loginId.trim().toUpperCase())throw new AppError(403,'This login ID does not belong to your verified account');return {ok:true,dashboard:'/student',expiresAt:access.expires_at};
}

export async function recordAccessBlock(db:D1Database,u:User,reason:string,resource:string,now=Date.now(),teacherId?:string){
 if(u.role!=='student')return;const admission=await st(db,'SELECT teacher_id FROM admissions WHERE student_id=?',u.id).first<{teacher_id:string}>();
 await st(db,`INSERT INTO lesson_access_events(id,student_id,teacher_id,resource,reason,bucket,attempt_count,first_at,last_at) VALUES(?,?,?,?,?,?,1,?,?) ON CONFLICT(student_id,resource,reason,bucket) DO UPDATE SET attempt_count=attempt_count+1,last_at=excluded.last_at`,crypto.randomUUID(),u.id,teacherId||admission?.teacher_id||null,resource.slice(0,80),reason,Math.floor(now/300000),now,now).run();
}
async function closeUnpaidSessions(db:D1Database,studentId:string,now:number,teacherId?:string){
 if(!await st(db,`SELECT 1 AS active WHERE EXISTS(SELECT 1 FROM class_attendance WHERE student_id=? AND left_at IS NULL) OR EXISTS(SELECT 1 FROM classroom_calls WHERE student_id=? AND status IN ('waiting','accepted')) OR EXISTS(SELECT 1 FROM conference_peers WHERE user_id=?)`,studentId,studentId,studentId).first())return;
 await db.batch([
 st(db,`UPDATE class_attendance SET left_at=?,ready=0,camera_frame=NULL,camera_at=NULL WHERE student_id=? AND left_at IS NULL ${teacherId?'AND EXISTS(SELECT 1 FROM class_sessions c JOIN classroom_rooms r ON r.id=c.room_id WHERE c.id=class_attendance.session_id AND r.teacher_id=?)':''}`,now,studentId,...(teacherId?[teacherId]:[])),
 st(db,`UPDATE classroom_calls SET status='ended',ended_at=? WHERE student_id=? AND status IN ('waiting','accepted') ${teacherId?'AND teacher_id=?':''}`,now,studentId,...(teacherId?[teacherId]:[])),
 st(db,`DELETE FROM call_signals WHERE call_id IN (SELECT id FROM classroom_calls WHERE student_id=? AND status='ended' ${teacherId?'AND teacher_id=?':''})`,studentId,...(teacherId?[teacherId]:[])),
 st(db,`DELETE FROM conference_signals WHERE from_peer IN (SELECT id FROM conference_peers WHERE user_id=?) OR to_peer IN (SELECT id FROM conference_peers WHERE user_id=?)`,studentId,studentId),
 st(db,`DELETE FROM conference_peers WHERE user_id=? ${teacherId?'AND session_id IN (SELECT c.id FROM class_sessions c JOIN classroom_rooms r ON r.id=c.room_id WHERE r.teacher_id=?)':''}`,studentId,...(teacherId?[teacherId]:[])),
 ]);}
export async function sweepUnpaidSessions(db:D1Database,u:User,now=Date.now()){
 if(u.role==='student')return;
 const scope=u.role==='admin'?'1=1':'owner_id=?';
 const candidates=`SELECT DISTINCT student_id,owner_id FROM (SELECT a.student_id,r.teacher_id AS owner_id FROM class_attendance a JOIN class_sessions c ON c.id=a.session_id JOIN classroom_rooms r ON r.id=c.room_id WHERE a.left_at IS NULL AND c.status!='ended' UNION SELECT student_id,teacher_id AS owner_id FROM classroom_calls WHERE status IN ('waiting','accepted')) WHERE ${scope}`;
 const bad=(await st(db,`SELECT x.student_id,x.owner_id,CASE WHEN u.disabled!=0 THEN 'account_disabled' WHEN NOT EXISTS(SELECT 1 FROM admissions a WHERE a.student_id=u.id AND a.teacher_id=x.owner_id AND a.status='approved' AND NOT (a.goals='Conference system testing' AND a.note='Conference pass admission')) THEN 'admission_required' ELSE 'subscription_inactive' END AS reason FROM (${candidates}) x JOIN users u ON u.id=x.student_id WHERE u.disabled!=0 OR NOT EXISTS(SELECT 1 FROM admissions a WHERE a.student_id=u.id AND a.teacher_id=x.owner_id AND a.status='approved' AND NOT (a.goals='Conference system testing' AND a.note='Conference pass admission')) OR ${accessUntilSQL('u.id')}<=?`,...(u.role==='admin'?[]:[u.id]),now).all<any>()).results;
 if(!bad.length)return;const rows=JSON.stringify(bad);
 await db.batch([
 st(db,`INSERT INTO lesson_access_events(id,student_id,teacher_id,resource,reason,bucket,attempt_count,first_at,last_at) SELECT lower(hex(randomblob(16))),json_extract(value,'$.student_id'),json_extract(value,'$.owner_id'),'active_class_removed',json_extract(value,'$.reason'),?,1,?,? FROM json_each(?) WHERE 1 ON CONFLICT(student_id,resource,reason,bucket) DO UPDATE SET attempt_count=attempt_count+1,last_at=excluded.last_at`,Math.floor(now/300000),now,now,rows),
 st(db,`UPDATE class_attendance SET left_at=?,ready=0,camera_frame=NULL,camera_at=NULL WHERE left_at IS NULL AND EXISTS(SELECT 1 FROM json_each(?) j JOIN class_sessions s ON s.id=class_attendance.session_id JOIN classroom_rooms r ON r.id=s.room_id WHERE json_extract(j.value,'$.student_id')=class_attendance.student_id AND json_extract(j.value,'$.owner_id')=r.teacher_id)`,now,rows),
 st(db,`UPDATE classroom_calls SET status='ended',ended_at=? WHERE status IN ('waiting','accepted') AND EXISTS(SELECT 1 FROM json_each(?) j WHERE json_extract(j.value,'$.student_id')=classroom_calls.student_id AND json_extract(j.value,'$.owner_id')=classroom_calls.teacher_id)`,now,rows),
 st(db,`DELETE FROM conference_peers WHERE EXISTS(SELECT 1 FROM json_each(?) j JOIN class_sessions s ON s.id=conference_peers.session_id JOIN classroom_rooms r ON r.id=s.room_id WHERE json_extract(j.value,'$.student_id')=conference_peers.user_id AND json_extract(j.value,'$.owner_id')=r.teacher_id)`,rows),
 st(db,`DELETE FROM call_signals WHERE call_id IN (SELECT id FROM classroom_calls WHERE status='ended' AND EXISTS(SELECT 1 FROM json_each(?) j WHERE json_extract(j.value,'$.student_id')=classroom_calls.student_id AND json_extract(j.value,'$.owner_id')=classroom_calls.teacher_id))`,rows),
 ]);
}
export async function readAccessAlerts(db:D1Database,u:User,now=Date.now()){
 if(u.role==='student')return [];
 await sweepUnpaidSessions(db,u,now);await st(db,'DELETE FROM lesson_access_events WHERE last_at<?',now-30*86400000).run();
 return (await st(db,`SELECT e.*,us.name AS student_name,CASE WHEN EXISTS(SELECT 1 FROM subscriptions s WHERE s.student_id=us.id AND s.status='verified' AND s.expires_at>?) OR EXISTS(SELECT 1 FROM payment_access_grants g JOIN payments p ON p.id=g.payment_id WHERE g.student_id=us.id AND p.status='verified' AND g.expires_at>?) THEN 1 ELSE 0 END AS paid_now FROM lesson_access_events e JOIN users us ON us.id=e.student_id WHERE ${u.role==='admin'?'1=1':'e.teacher_id=?'} ORDER BY e.last_at DESC LIMIT 200`,now,now,...(u.role==='admin'?[]:[u.id])).all()).results;
}
