import { z } from 'zod';

export type User = {id:string;email:string;name:string;role:'admin'|'teacher'|'student';disabled:number;deleted_at?:number|null};
export class AppError extends Error { constructor(public status:number,message:string){super(message)} }
const uuid=z.string().uuid();
const question=z.object({text:z.string().trim().min(1).max(2000),choices:z.array(z.string().trim().min(1).max(500)).length(4),correct:z.number().int().min(0).max(3)});
export const ActionSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('createExam'),title:z.string().trim().min(1).max(160),description:z.string().trim().max(3000).default(''),duration:z.number().int().min(1).max(300),startsAt:z.number().int().positive().nullable().default(null),endsAt:z.number().int().positive().nullable().default(null),questions:z.array(question).min(1).max(100)}),
 z.object({action:z.literal('addQuestion'),examId:uuid,question}),
 z.object({action:z.literal('examStatus'),examId:uuid,status:z.enum(['published','closed'])}),
 z.object({action:z.literal('start'),examId:uuid}),
 z.object({action:z.literal('answer'),sessionId:uuid,position:z.number().int().min(0).max(99),choice:z.number().int().min(0).max(3)}),
 z.object({action:z.literal('submit'),sessionId:uuid}),
 z.object({action:z.literal('heartbeat'),sessionId:uuid}),
 z.object({action:z.literal('event'),sessionId:uuid,code:z.enum(['tab_switch','window_blur','copy_paste','fullscreen_exit','no_face','multiple_faces','off_center']),}),
 z.object({action:z.literal('teacherAction'),sessionId:uuid,kind:z.enum(['warn','pause','resume','terminate','dismiss_flag']),message:z.string().trim().max(500).default('')}),
 z.object({action:z.literal('editUser'),userId:z.string().min(1).max(200),name:z.string().trim().min(2).max(160),role:z.enum(['student','teacher']),disabled:z.boolean()}),
 z.object({action:z.literal('deleteUser'),userId:z.string().min(1).max(200),confirmEmail:z.string().trim().email()}),
 z.object({action:z.literal('restoreUser'),userId:z.string().min(1).max(200)}),
 z.object({action:z.literal('userRole'),userId:z.string().min(1).max(200),role:z.enum(['student','teacher']),disabled:z.boolean()}),
]);
export type Action=z.infer<typeof ActionSchema>;
const stmt=(db:D1Database,sql:string,...values:unknown[])=>db.prepare(sql).bind(...values);
async function all(db:D1Database,sql:string,...values:unknown[]){return (await stmt(db,sql,...values).all<any>()).results}
async function one(db:D1Database,sql:string,...values:unknown[]){return stmt(db,sql,...values).first<any>()}
function required<T>(value:T|null,message='Record not found'):T {if(!value)throw new AppError(404,message);return value}
function staff(u:User){if(u.role==='student')throw new AppError(403,'Teacher access required')}
async function ownedExam(db:D1Database,u:User,id:string){staff(u);let e=required(await one(db,'SELECT * FROM exams WHERE id=?',id));if(u.role!=='admin'&&e.teacher_id!==u.id)throw new AppError(403,'This exam belongs to another teacher');return e}
async function ownSession(db:D1Database,u:User,id:string){let s=required(await one(db,'SELECT * FROM sessions WHERE id=?',id));if(s.student_id!==u.id)throw new AppError(403,'This session belongs to another student');return s}
const scoreSQL=`(SELECT COUNT(*) FROM questions q WHERE q.exam_id=sessions.exam_id AND CAST(json_extract(sessions.answers,'$."'||q.position||'"') AS INTEGER)=q.correct)`;
export async function expireSessions(db:D1Database,now:number){if(!await stmt(db,`SELECT id FROM sessions WHERE (status='active' AND deadline<=?) OR (status='paused' AND EXISTS(SELECT 1 FROM exams e WHERE e.id=sessions.exam_id AND e.ends_at IS NOT NULL AND e.ends_at<=?)) LIMIT 1`,now,now).first())return;await stmt(db,`UPDATE sessions SET status='submitted',score=${scoreSQL},ended_at=? WHERE (status='active' AND deadline<=?) OR (status='paused' AND EXISTS(SELECT 1 FROM exams e WHERE e.id=sessions.exam_id AND e.ends_at IS NOT NULL AND e.ends_at<=?))`,now,now,now).run()}
/** Roles always come from current server records, never client claims or stale objects. */
export async function authorizedUser(db:D1Database,claimed:User,requiredRole?:User['role']):Promise<User>{const current=await one(db,'SELECT * FROM users WHERE id=?',claimed.id);if(!current||current.disabled||current.deleted_at)throw new AppError(403,'Account unavailable');if(requiredRole&&current.role!==requiredRole)throw new AppError(403,'You are not authorized for this dashboard');return current as User;}
/** Registration-only authorization. Restricted learners can request review, never enter dashboards. */
export async function admissionApplicant(db:D1Database,claimed:Pick<User,'id'>):Promise<User>{
 const current=await one(db,'SELECT * FROM users WHERE id=?',claimed.id);
 if(current?.role==='student'&&current.disabled&&!current.deleted_at)return current as User;
 return authorizedUser(db,claimed as User);
}
export async function initializeAdmissionUser(db:D1Database,identity:{userId:string;email:string;displayName:string},ownerEmail:string,now=Date.now()):Promise<User>{
 const current=await one(db,'SELECT * FROM users WHERE id=?',identity.userId);
 if(current?.role==='student'&&current.disabled&&!current.deleted_at)return admissionApplicant(db,current);
 return initializeUser(db,identity,ownerEmail,now);
}
export async function initializeUser(db:D1Database,identity:{userId:string;email:string;displayName:string},ownerEmail:string,now=Date.now()):Promise<User>{
 let u=await one(db,'SELECT * FROM users WHERE id=?',identity.userId);
 if(!u){await stmt(db,'INSERT INTO users(id,email,name,role,created_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO NOTHING',identity.userId,identity.email,identity.displayName,identity.email.toLowerCase()===ownerEmail.toLowerCase()?'admin':'student',now).run();u=required(await one(db,'SELECT * FROM users WHERE id=?',identity.userId));}
 if(u.deleted_at)throw new AppError(403,'This account has been deleted. Contact your administrator to request restoration.');
 if(u.disabled)throw new AppError(403,'Your account has been disabled. Contact your administrator.');
 const teacher=await one(db,"SELECT * FROM teacher_accounts WHERE email=? AND status='pending'",identity.email.trim().toLowerCase());
 if(teacher&&u.role!=='admin'){
 await db.batch([
 stmt(db,"UPDATE users SET role='teacher',name=? WHERE id=? AND disabled=0 AND role!='admin' AND EXISTS(SELECT 1 FROM teacher_accounts WHERE id=? AND status='pending')",teacher.full_name,u.id,teacher.id),
 stmt(db,"UPDATE teacher_accounts SET status='active',user_id=?,activated_at=? WHERE id=? AND status='pending'",u.id,now,teacher.id)]);
 u=required(await one(db,'SELECT * FROM users WHERE id=?',identity.userId));
 }
 return u;
}
export async function readState(db:D1Database,u:User,now=Date.now()){
 u=await authorizedUser(db,u);
 await expireSessions(db,now);
 const student=u.role==='student';
 const examWhere=student?"(e.status='published' OR EXISTS(SELECT 1 FROM sessions s WHERE s.exam_id=e.id AND s.student_id=?)) AND (NOT EXISTS(SELECT 1 FROM assessment_cycles c WHERE c.exam_id=e.id) OR EXISTS(SELECT 1 FROM assessment_cycles c WHERE c.exam_id=e.id AND c.student_id=?))":u.role==='teacher'?'e.teacher_id=?':'1=1';
 const values=student?[u.id,u.id]:u.role==='teacher'?[u.id]:[];
 let exams=await all(db,`SELECT e.*,us.name AS teacher_name FROM exams e JOIN users us ON us.id=e.teacher_id WHERE ${examWhere} ORDER BY e.created_at DESC`,...values);
 // Answers are never sent to student clients, including after submission.
 const qs=await all(db,`SELECT q.id,q.exam_id,q.position,q.text,q.choices ${student?'':',q.correct'} FROM questions q JOIN exams e ON e.id=q.exam_id WHERE ${examWhere} ORDER BY q.position`,...values);
 exams=exams.map(e=>({...e,questions:qs.filter(q=>q.exam_id===e.id).map(q=>({...q,choices:JSON.parse(q.choices)}))}));
 const scope=student?'s.student_id=?':u.role==='teacher'?'e.teacher_id=?':'1=1';
 const sessions=await all(db,`SELECT s.*,us.name AS student_name,e.title AS exam_title FROM sessions s JOIN exams e ON e.id=s.exam_id JOIN users us ON us.id=s.student_id WHERE ${scope} ORDER BY s.started_at DESC`,...(student||u.role==='teacher'?[u.id]:[]));
 const events=await all(db,`SELECT v.*,us.name AS student_name,e.title AS exam_title FROM events v JOIN sessions s ON s.id=v.session_id JOIN exams e ON e.id=s.exam_id JOIN users us ON us.id=s.student_id WHERE ${scope} ORDER BY v.at DESC LIMIT 200`,...(student||u.role==='teacher'?[u.id]:[]));
 return {user:u,exams,sessions:sessions.map(s=>({...s,answers:student?JSON.parse(s.answers):undefined})),events,users:u.role==='admin'?await all(db,'SELECT * FROM users ORDER BY created_at DESC'):[],serverNow:now};
}
export async function mutate(db:D1Database,u:User,a:Action,now=Date.now()):Promise<any>{
 u=await authorizedUser(db,u);
 await expireSessions(db,now);
 if(a.action==='createExam'){
  staff(u);if(a.startsAt&&a.endsAt&&a.endsAt<=a.startsAt)throw new AppError(400,'Closing time must be later than opening time');if(a.endsAt&&a.endsAt<=now)throw new AppError(400,'Closing time must be in the future');
  const id=crypto.randomUUID();await db.batch([stmt(db,'INSERT INTO exams(id,teacher_id,title,description,duration,starts_at,ends_at,created_at) VALUES(?,?,?,?,?,?,?,?)',id,u.id,a.title,a.description,a.duration,a.startsAt,a.endsAt,now),...a.questions.map((q,i)=>stmt(db,'INSERT INTO questions(id,exam_id,position,text,choices,correct) VALUES(?,?,?,?,?,?)',crypto.randomUUID(),id,i,q.text,JSON.stringify(q.choices),q.correct))]);return {id};
 }
 if(a.action==='addQuestion'){
  const e=await ownedExam(db,u,a.examId);if(e.status!=='draft')throw new AppError(409,'Only draft exams can be edited');
  const q=a.question;const result=await stmt(db,`INSERT INTO questions(id,exam_id,position,text,choices,correct) SELECT ?,?,(SELECT COUNT(*) FROM questions WHERE exam_id=?),?,?,? WHERE EXISTS(SELECT 1 FROM exams WHERE id=? AND status='draft') AND (SELECT COUNT(*) FROM questions WHERE exam_id=?)<100`,crypto.randomUUID(),e.id,e.id,q.text,JSON.stringify(q.choices),q.correct,e.id,e.id).run();if(!result.meta.changes)throw new AppError(409,'Exam is published or has reached 100 questions');return {ok:true};
 }
 if(a.action==='examStatus'){
  const e=await ownedExam(db,u,a.examId);if(a.status==='published'&&e.status!=='draft')throw new AppError(409,'Only draft exams may be published');
  if(a.status==='closed'&&e.status!=='published')throw new AppError(409,'Only published exams may be closed');
  await stmt(db,'UPDATE exams SET status=? WHERE id=? AND status=?',a.status,e.id,e.status).run();return {ok:true};
 }
 if(a.action==='userRole'||a.action==='editUser'||a.action==='deleteUser'||a.action==='restoreUser'){
  if(u.role!=='admin')throw new AppError(403,'Administrator access required');
  const edit=a as Extract<Action,{action:'userRole'|'editUser'|'deleteUser'|'restoreUser'}>,target=required(await one(db,'SELECT * FROM users WHERE id=?',edit.userId));
  if(target.role==='admin'||target.id===u.id)throw new AppError(400,'Administrator accounts cannot be changed here');
  if(edit.action==='deleteUser'&&edit.confirmEmail.toLowerCase()!==target.email.toLowerCase())throw new AppError(400,'Type the exact account email to confirm deletion');
  if(target.deleted_at&&edit.action!=='restoreUser'){if(edit.action==='deleteUser')return {ok:true};throw new AppError(409,'Restore the deleted account before editing it');}
  if(edit.action==='restoreUser'&&!target.deleted_at)return {ok:true};
  const next={name:edit.action==='editUser'?edit.name:target.name,role:edit.action==='editUser'||edit.action==='userRole'?edit.role:target.role,disabled:edit.action==='deleteUser'||edit.action==='restoreUser'?1:edit.disabled?1:0,deleted_at:edit.action==='deleteUser'?now:edit.action==='restoreUser'?null:target.deleted_at};
  const snapshot=(v:any)=>JSON.stringify({name:v.name,role:v.role,disabled:v.disabled,deleted_at:v.deleted_at??null});
  const statements=[stmt(db,"UPDATE users SET name=?,role=?,disabled=?,deleted_at=? WHERE id=? AND role!='admin'",next.name,next.role,next.disabled,next.deleted_at??null,target.id),stmt(db,'INSERT INTO user_account_audit(id,actor_id,target_id,action,before,after,at) VALUES(?,?,?,?,?,?,?)',crypto.randomUUID(),u.id,target.id,edit.action,snapshot(target),snapshot(next),now),stmt(db,"UPDATE teacher_accounts SET full_name=?,status=? WHERE user_id=?",next.name,next.disabled||next.role!=='teacher'?'revoked':'active',target.id)];
  if(next.disabled||next.role!==target.role){
   statements.push(stmt(db,'UPDATE class_attendance SET left_at=?,ready=0,camera_frame=NULL,camera_at=NULL WHERE student_id=? AND left_at IS NULL',now,target.id),stmt(db,"UPDATE classroom_calls SET status='ended',ended_at=? WHERE (student_id=? OR teacher_id=?) AND status IN ('waiting','accepted')",now,target.id,target.id),stmt(db,'DELETE FROM conference_signals WHERE from_peer IN (SELECT id FROM conference_peers WHERE user_id=?) OR to_peer IN (SELECT id FROM conference_peers WHERE user_id=?)',target.id,target.id),stmt(db,'DELETE FROM conference_peers WHERE user_id=?',target.id),stmt(db,"UPDATE class_sessions SET status='ended',ended_at=?,teacher_present_id=NULL,teacher_last_seen=NULL WHERE status!='ended' AND room_id IN (SELECT id FROM classroom_rooms WHERE teacher_id=?)",now,target.id));
  }
  await db.batch(statements);return {ok:true};
 }
 if(a.action==='start'){
  if(u.role!=='student')throw new AppError(403,'Only student accounts may take exams');const e=required(await one(db,'SELECT * FROM exams WHERE id=?',a.examId));
  if(await one(db,'SELECT id FROM assessment_cycles WHERE exam_id=? AND student_id!=?',e.id,u.id))throw new AppError(403,'This assessment is assigned to another learner');
  const previous=await one(db,'SELECT id FROM sessions WHERE exam_id=? AND student_id=?',e.id,u.id);if(previous)return {id:previous.id};
  if(e.status!=='published'||(e.starts_at&&now<e.starts_at)||(e.ends_at&&now>=e.ends_at))throw new AppError(409,'This exam is not open');
  const total=(await one(db,'SELECT COUNT(*) AS n FROM questions WHERE exam_id=?',e.id)).n;if(!total)throw new AppError(409,'Exam has no questions');
  const id=crypto.randomUUID(),deadline=Math.min(now+e.duration*60000,e.ends_at||Infinity);
  const insert=stmt(db,`INSERT INTO sessions(id,exam_id,student_id,started_at,deadline,last_seen,total) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM exams WHERE id=? AND status='published' AND (starts_at IS NULL OR starts_at<=?) AND (ends_at IS NULL OR ends_at>?)) ON CONFLICT(exam_id,student_id) DO NOTHING`,id,e.id,u.id,now,deadline,now,total,e.id,now,now);
  await db.batch([insert,stmt(db,`INSERT INTO events(id,session_id,actor_id,code,message,at) SELECT ?,?,?, 'started','Assessment started',? WHERE EXISTS(SELECT 1 FROM sessions WHERE id=?)`,crypto.randomUUID(),id,u.id,now,id)]);
  const saved=required(await one(db,'SELECT id FROM sessions WHERE exam_id=? AND student_id=?',e.id,u.id),'Exam closed before the session began');return {id:saved.id};
 }
 if(a.action==='teacherAction'){
  const s=required(await one(db,'SELECT * FROM sessions WHERE id=?',a.sessionId));const e=await ownedExam(db,u,s.exam_id);if(!['active','paused'].includes(s.status))throw new AppError(409,'This session has already ended');
  let update='',values:unknown[]=[];
  if(a.kind==='warn')update='warnings=warnings+1,flagged=1';
  if(a.kind==='dismiss_flag')update='flagged=0';
  if(a.kind==='terminate'){update="status='terminated',ended_at=?,flagged=1";values=[now]}
  if(a.kind==='pause'){if(s.status!=='active')throw new AppError(409,'Session is already paused');update="status='paused',remaining_ms=MAX(0,deadline-?)";values=[now]}
  if(a.kind==='resume'){if(s.status!=='paused')throw new AppError(409,'Session is not paused');if(e.ends_at&&now>=e.ends_at)throw new AppError(409,'The exam closing time has passed; terminate this session');update="status='active',deadline=MIN(?+remaining_ms,?),remaining_ms=NULL";values=[now,e.ends_at||Number.MAX_SAFE_INTEGER]}
  const message=a.message||({warn:'Teacher warning: please focus on the assessment.',pause:'Teacher paused the assessment.',resume:'Teacher resumed the assessment.',terminate:'Teacher ended the session.',dismiss_flag:'Teacher reviewed and dismissed the flag.'}[a.kind]);
  // D1 batch is atomic. The audit entry and action share the same state predicate.
  const result=await db.batch([stmt(db,`INSERT INTO events(id,session_id,actor_id,code,message,at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM sessions WHERE id=? AND status=?)`,crypto.randomUUID(),s.id,u.id,a.kind,message,now,s.id,s.status),stmt(db,`UPDATE sessions SET ${update} WHERE id=? AND status=?`,...values,s.id,s.status)]);if(!result[1].meta.changes)throw new AppError(409,'Session changed; refresh and try again');return {ok:true};
 }
 const s=await ownSession(db,u,a.sessionId);
 if(a.action==='heartbeat'){await stmt(db,"UPDATE sessions SET last_seen=? WHERE id=? AND status IN ('active','paused')",now,s.id).run();return {ok:true}}
 if(a.action==='submit'){
  if(s.status!=='active')throw new AppError(409,'Only active sessions may be submitted');
  await db.batch([stmt(db,`INSERT INTO events(id,session_id,actor_id,code,message,at) SELECT ?,?,?, 'submitted','Student submitted assessment',? WHERE EXISTS(SELECT 1 FROM sessions WHERE id=? AND status='active')`,crypto.randomUUID(),s.id,u.id,now,s.id),stmt(db,`UPDATE sessions SET status='submitted',score=${scoreSQL},ended_at=? WHERE id=? AND status='active'`,now,s.id)]);return {ok:true};
 }
 if(s.status!=='active')throw new AppError(409,'This assessment is paused or finished');
 if(a.action==='answer'){
  const q=await one(db,'SELECT id FROM questions WHERE exam_id=? AND position=?',s.exam_id,a.position);if(!q)throw new AppError(400,'Invalid question');
  const result=await stmt(db,`UPDATE sessions SET answers=json_set(answers,?,?),last_seen=? WHERE id=? AND status='active' AND deadline>?`, '$."'+a.position+'"',a.choice,now,s.id,now).run();if(!result.meta.changes)throw new AppError(409,'Time has expired or the session is no longer active');return {ok:true};
 }
 if(a.action==='event'){
  const labels={tab_switch:'Browser tab became hidden',window_blur:'Exam window lost focus',copy_paste:'Copy or paste observed',fullscreen_exit:'Exited fullscreen',no_face:'Local camera check reported no face',multiple_faces:'Local camera check reported multiple faces',off_center:'Local camera check reported a face outside the centre'};
  const id=crypto.randomUUID();await db.batch([stmt(db,`INSERT INTO events(id,session_id,actor_id,code,message,at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM sessions WHERE id=? AND status='active') AND NOT EXISTS(SELECT 1 FROM events WHERE session_id=? AND code=? AND at>?)`,id,s.id,u.id,a.code,labels[a.code],now,s.id,s.id,a.code,now-3000),stmt(db,`UPDATE sessions SET flagged=1 WHERE id=? AND EXISTS(SELECT 1 FROM events WHERE id=?)`,s.id,id)]);return {ok:true};
 }
 throw new AppError(400,'Unknown action');
}


/** Primary fees are quoted from the learner's recorded admission, never a client-supplied price. */
export async function learnerFees(db:D1Database,studentId:string,proposedLevel?:string){
 const row=await stmt(db,`SELECT (SELECT level FROM admissions WHERE student_id=?) AS level,(SELECT amount FROM registration_fee_settings WHERE id='main') AS registration,(SELECT price FROM subscription_settings WHERE id='main') AS price,(SELECT days FROM subscription_settings WHERE id='main') AS days`,studentId).first<{level:string|null;registration:number|null;price:number|null;days:number|null}>();
 const primary=/\bgrade[\s-]*[1-6]\b/i.test(proposedLevel??row?.level??'');
 const registration=row?.registration==null?null:{amount:row.registration};
 const tuition=row?.price==null||row.days==null?null:{price:row.price,days:row.days};
 return {primary,registrationFee:primary?{amount:50}:registration,tuitionPlan:primary?{price:200,days:tuition?.days??6}:tuition};
}
export async function learnerFeeQuote(db:D1Database,id:string,purpose:'registration'|'tuition'){
 const fees=await learnerFees(db,id);return purpose==='registration'?(fees.registrationFee?{price:fees.registrationFee.amount,days:0}:null):fees.tuitionPlan;
}

/** A pass or payment never creates or approves a student registration. */
export async function requireStudentRegistration(db:D1Database,user:User){
 const u=await authorizedUser(db,user);
 if(u.role!=='student')return {user:u,admission:null};
 const admission=await stmt(db,'SELECT student_id,teacher_id,level,status,goals,note FROM admissions WHERE student_id=?',u.id).first<{student_id:string;teacher_id:string;level:string;status:string;goals:string;note:string}>();
 if(!admission||admission.status!=='approved'||(admission.goals==='Conference system testing'&&admission.note==='Conference pass admission'))throw new AppError(403,'Complete student registration and receive administrator admission approval before accessing learning.');
 return {user:u,admission};
}
