import {z} from 'zod';
import {AppError,type User} from '../service';
const st=(db:D1Database,q:string,...v:unknown[])=>db.prepare(q).bind(...v);
const all=async(db:D1Database,q:string,...v:unknown[])=>(await st(db,q,...v).all<any>()).results;
const one=(db:D1Database,q:string,...v:unknown[])=>st(db,q,...v).first<any>();
const time=z.number().int().positive().safe();
const CompanyContract=z.object({companyName:z.string().trim().min(2).max(160),representative:z.string().trim().min(2).max(160),teacherName:z.string().trim().min(2).max(160),duties:z.string().trim().min(10).max(2000),paymentSchedule:z.string().trim().min(5).max(1000),termination:z.string().trim().min(5).max(1000),conduct:z.string().trim().min(10).max(2000),companyConfirmed:z.literal(true)});
export const TeacherPayAction=z.discriminatedUnion('action',[
 z.object({action:z.literal('propose'),teacherId:z.string().min(1).max(150),rateCents:z.number().int().min(1).max(100000000),startsAt:time,endsAt:time,terms:z.string().trim().min(10).max(3000),replacesId:z.string().uuid().nullable().default(null),company:CompanyContract.optional()}),
 z.object({action:z.literal('respond'),id:z.string().uuid(),accept:z.boolean(),signedName:z.string().trim().max(160).optional(),acknowledged:z.boolean().optional()}),
 z.object({action:z.literal('withdraw'),id:z.string().uuid()}),
 z.object({action:z.literal('finalize'),id:z.string().uuid()}),
 z.object({action:z.literal('recordPayment'),id:z.string().uuid(),reference:z.string().trim().min(5).max(100).regex(/^[A-Za-z0-9 /_.:-]+$/),confirmed:z.literal(true)}),
]);
async function staff(db:D1Database,u:User){const fresh=await one(db,'SELECT * FROM users WHERE id=?',u.id);if(!fresh||fresh.disabled||!['admin','teacher'].includes(fresh.role))throw new AppError(403,'Teacher or administrator access required');return fresh as User}
const admin=(u:User)=>{if(u.role!=='admin')throw new AppError(403,'Administrator approval is required')};
const audit=(db:D1Database,u:User,teacher:string,action:string,id:string,details:unknown,now:number)=>st(db,'INSERT INTO teacher_pay_audit(id,teacher_id,actor_id,action,record_id,details,at) VALUES(?,?,?,?,?,?,?)',crypto.randomUUID(),teacher,u.id,action,id,JSON.stringify(details),now);
// A qualifying learner attended a started lesson during this period while tuition was valid.
// Conference passes and registration fees never count. Repeated attendance counts once.
export const learnersSQL=`SELECT DISTINCT a.student_id FROM class_attendance a JOIN class_sessions s ON s.id=a.session_id JOIN classroom_rooms r ON r.id=s.room_id
 WHERE r.teacher_id=? AND s.started_by=? AND s.started_at IS NOT NULL AND MAX(a.joined_at,s.started_at)>=? AND MAX(a.joined_at,s.started_at)<?
 AND a.last_seen>=s.started_at AND (a.left_at IS NULL OR a.left_at>=s.started_at)
 AND (EXISTS(SELECT 1 FROM subscriptions p WHERE p.student_id=a.student_id AND p.status='verified' AND p.verified_at<=MAX(a.joined_at,s.started_at) AND p.expires_at>MAX(a.joined_at,s.started_at))
 OR EXISTS(SELECT 1 FROM payment_access_grants g JOIN payments p ON p.id=g.payment_id WHERE g.student_id=a.student_id AND p.status='verified' AND g.granted_at<=MAX(a.joined_at,s.started_at) AND g.expires_at>MAX(a.joined_at,s.started_at)))`;
const bindings=(a:any)=>[a.teacher_id,a.teacher_id,a.starts_at,a.ends_at];
export async function readTeacherPay(db:D1Database,user:User,offset=0,detailId?:string,now=Date.now()){
 const u=await staff(db,user);offset=Math.max(0,Math.min(100000,Math.floor(offset/50)*50));const scope=u.role==='admin'?'1=1':'a.teacher_id=?',v=u.role==='admin'?[]:[u.id];
 const agreements=await all(db,`SELECT a.*,u.name AS teacher_name,${u.role==='admin'?'s.id AS statement_id,s.learner_count,s.amount_cents,s.paid_at,s.payment_reference':'NULL AS statement_id,NULL AS learner_count,NULL AS amount_cents,NULL AS paid_at,NULL AS payment_reference'} FROM teacher_pay_agreements a JOIN users u ON u.id=a.teacher_id LEFT JOIN teacher_pay_statements s ON s.agreement_id=a.id WHERE ${scope} ORDER BY a.created_at DESC,a.id LIMIT 50 OFFSET ?`,...v,offset);
 let detail=null;if(detailId){admin(u);const a=await one(db,`SELECT a.*,s.id AS statement_id FROM teacher_pay_agreements a LEFT JOIN teacher_pay_statements s ON s.agreement_id=a.id WHERE a.id=? AND ${scope}`,detailId,...v);if(!a)throw new AppError(404,'Agreement not found');const n=a.statement_id?await one(db,'SELECT learner_count AS n FROM teacher_pay_statements WHERE id=?',a.statement_id):await one(db,`SELECT COUNT(*) AS n FROM (${learnersSQL})`,...bindings(a));detail={id:a.id,count:n.n,amountCents:n.n*a.rate_cents,finalized:!!a.statement_id};}
 return {role:u.role,agreements,total:(await one(db,`SELECT COUNT(*) AS n FROM teacher_pay_agreements a WHERE ${scope}`,...v)).n,offset,detail,teachers:u.role==='admin'?await all(db,"SELECT id,name,email FROM users WHERE role='teacher' AND disabled=0 ORDER BY name LIMIT 500"):[],audit:await all(db,`SELECT e.*,u.name AS actor_name FROM teacher_pay_audit e JOIN users u ON u.id=e.actor_id WHERE ${u.role==='admin'?'1=1':"e.teacher_id=? AND e.action IN ('proposed','accepted','declined','withdrawn')"} ORDER BY e.at DESC,e.id LIMIT 50`,...v),serverNow:now};
}
export async function mutateTeacherPay(db:D1Database,user:User,raw:unknown,now=Date.now()){
 const u=await staff(db,user),a=TeacherPayAction.parse(raw);
 if(a.action==='propose'){
  admin(u);if(a.startsAt<now+60000||a.endsAt<=a.startsAt||a.endsAt-a.startsAt>366*86400000)throw new AppError(400,'Choose a future period of no more than 366 days');
  const t=await one(db,"SELECT id FROM users WHERE id=? AND role='teacher' AND disabled=0",a.teacherId);if(!t)throw new AppError(400,'Select an active teacher');
  if(a.replacesId){const old=await one(db,"SELECT * FROM teacher_pay_agreements WHERE id=? AND teacher_id=? AND status='accepted' AND starts_at>?",a.replacesId,a.teacherId,now);if(!old)throw new AppError(409,'Only a future accepted agreement can be revised');}
  const id=crypto.randomUUID();await db.batch([st(db,'INSERT INTO teacher_pay_agreements(id,teacher_id,rate_cents,starts_at,ends_at,terms,status,replaces_id,proposed_by,created_at,company_contract) VALUES(?,?,?,?,?,?,\'proposed\',?,?,?,?)',id,a.teacherId,a.rateCents,a.startsAt,a.endsAt,a.terms,a.replacesId,u.id,now,a.company?JSON.stringify(a.company):''),audit(db,u,a.teacherId,'proposed',id,a,now)]);return {id};
 }
 if(a.action==='recordPayment'){
  admin(u);const s=await one(db,'SELECT * FROM teacher_pay_statements WHERE id=?',a.id);if(!s)throw new AppError(404,'Statement not found');if(s.paid_at){if(s.payment_reference===a.reference.toUpperCase())return {ok:true};throw new AppError(409,'This statement already has an immutable payment record');}if(s.amount_cents<=0)throw new AppError(409,'A zero-value statement requires no payment');
  if(await one(db,'SELECT id FROM teacher_pay_statements WHERE payment_reference=?',a.reference.toUpperCase()))throw new AppError(409,'This payment reference is already recorded');
  await db.batch([st(db,'UPDATE teacher_pay_statements SET paid_at=?,paid_by=?,payment_reference=? WHERE id=? AND paid_at IS NULL',now,u.id,a.reference.toUpperCase(),a.id),audit(db,u,s.teacher_id,'external_payment_recorded',a.id,{reference:a.reference.toUpperCase(),amountCents:s.amount_cents},now)]);return {ok:true};
 }
 const agreement=await one(db,'SELECT * FROM teacher_pay_agreements WHERE id=?',a.id);if(!agreement||u.role!=='admin'&&agreement.teacher_id!==u.id)throw new AppError(404,'Agreement not found');
 if(a.action==='withdraw'){admin(u);if(agreement.status!=='proposed')throw new AppError(409,'Only a pending proposal can be withdrawn');await db.batch([st(db,"UPDATE teacher_pay_agreements SET status='withdrawn',responded_at=? WHERE id=? AND status='proposed'",now,a.id),audit(db,u,agreement.teacher_id,'withdrawn',a.id,{},now)]);return {ok:true};}
 if(a.action==='respond'){
  if(u.role!=='teacher'||u.id!==agreement.teacher_id)throw new AppError(403,'The named teacher must respond to this agreement');
  if(agreement.status!=='proposed'||agreement.starts_at<=now)throw new AppError(409,'This proposal is no longer open');
  if(!a.accept){await db.batch([st(db,"UPDATE teacher_pay_agreements SET status='declined',responded_at=? WHERE id=? AND status='proposed'",now,a.id),audit(db,u,u.id,'declined',a.id,{},now)]);return {ok:true};}
  if(agreement.company_contract){const contract=CompanyContract.parse(JSON.parse(agreement.company_contract));if(!a.acknowledged||!a.signedName||a.signedName.toLowerCase()!==contract.teacherName.toLowerCase())throw new AppError(400,'Read the company agreement, confirm it and type the teacher name exactly as shown');}
  // Conditional update handles competing proposals atomically; old terms stay until acceptance.
  const queries=[st(db,`UPDATE teacher_pay_agreements SET status='accepted',accepted_at=?,responded_at=?,accepted_name=? WHERE id=? AND status='proposed' AND starts_at>?
   AND NOT EXISTS(SELECT 1 FROM teacher_pay_agreements x WHERE x.teacher_id=? AND x.status='accepted' AND x.id!=COALESCE(?, '') AND x.starts_at<? AND x.ends_at>?)
   AND (? IS NULL OR EXISTS(SELECT 1 FROM teacher_pay_agreements x WHERE x.id=? AND x.status='accepted' AND x.starts_at>? AND x.teacher_id=?))`,now,now,a.signedName||u.name,a.id,now,u.id,agreement.replaces_id,agreement.ends_at,agreement.starts_at,agreement.replaces_id,agreement.replaces_id,now,u.id)];
  if(agreement.replaces_id)queries.push(st(db,"UPDATE teacher_pay_agreements SET status='superseded' WHERE id=? AND EXISTS(SELECT 1 FROM teacher_pay_agreements x WHERE x.id=? AND x.status='accepted' AND x.accepted_at=?)",agreement.replaces_id,a.id,now));
  queries.push(st(db,"INSERT INTO teacher_pay_audit(id,teacher_id,actor_id,action,record_id,details,at) SELECT ?,?,?, 'accepted',?,terms,? FROM teacher_pay_agreements WHERE id=? AND status='accepted' AND accepted_at=?",crypto.randomUUID(),u.id,u.id,a.id,now,a.id,now));await db.batch(queries);
  if((await one(db,'SELECT status FROM teacher_pay_agreements WHERE id=?',a.id)).status!=='accepted')throw new AppError(409,'An accepted period overlaps, or the original terms are no longer replaceable');return {ok:true};
 }
 admin(u);if(agreement.status!=='accepted'||agreement.ends_at>now)throw new AppError(409,'Finalize only after an accepted pay period has ended');
 const prior=await one(db,'SELECT id FROM teacher_pay_statements WHERE agreement_id=?',a.id);if(prior)return {id:prior.id};
 const id=crypto.randomUUID();await db.batch([
  st(db,`INSERT INTO teacher_pay_statements(id,agreement_id,teacher_id,learner_count,rate_cents,amount_cents,created_at,created_by) VALUES(?,?,?,0,?,0,?,?) ON CONFLICT(agreement_id) DO NOTHING`,id,a.id,agreement.teacher_id,agreement.rate_cents,now,u.id),
  st(db,`INSERT INTO teacher_pay_learners(id,statement_id,student_id) SELECT lower(hex(randomblob(16))),?,student_id FROM (${learnersSQL}) WHERE EXISTS(SELECT 1 FROM teacher_pay_statements WHERE id=?)`,id,...bindings(agreement),id),
  st(db,'UPDATE teacher_pay_statements SET learner_count=(SELECT COUNT(*) FROM teacher_pay_learners WHERE statement_id=?),amount_cents=rate_cents*(SELECT COUNT(*) FROM teacher_pay_learners WHERE statement_id=?) WHERE id=?',id,id,id),
  st(db,"INSERT INTO teacher_pay_audit(id,teacher_id,actor_id,action,record_id,details,at) SELECT ?,?,?,'statement_issued',?,CAST(amount_cents AS TEXT),? FROM teacher_pay_statements WHERE id=?",crypto.randomUUID(),agreement.teacher_id,u.id,id,now,id)
 ]);return {id:(await one(db,'SELECT id FROM teacher_pay_statements WHERE agreement_id=?',a.id)).id};
}
