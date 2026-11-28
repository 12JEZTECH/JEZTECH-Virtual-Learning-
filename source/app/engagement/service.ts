import {paymentReviewFields,reviewStudentPayment} from '../payments/review';
import {registrationContact} from '../registration/contact';
import {enrollRegisteredStudent} from '../classroom/enrollment';
import {orientationAccess,orientationLessonScope} from '../orientation/access';
import {z} from 'zod';
import {refreshAccess} from '../classroom/access';
import {learnerFees,AppError,authorizedUser,admissionApplicant,type User} from '../service';
const uuid=z.string().uuid();
export const EngagementSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('requestAdmission'),fullName:z.string().trim().min(2).max(160).optional(),teacherId:z.string().min(1).max(200),contactMethod:z.enum(['email','phone']).default('phone'),phone:z.string().trim().max(25).default(''),level:z.string().trim().min(1).max(100),registrationPayment:z.object({phone:z.string().trim().min(9).max(25),receipt:z.string().trim().regex(/^[A-Za-z0-9]{10}$/)}).optional(),goals:z.string().trim().min(1).max(1500)}),
 z.object({action:z.literal('reviewAdmission'),studentId:z.string().min(1).max(200),status:z.enum(['approved','rejected']),note:z.string().trim().max(1000)}),
 z.object({action:z.literal('presence'),page:z.string().max(80)}),
 z.object({action:z.literal('hand'),raised:z.boolean(),note:z.string().trim().max(500).default('')}),
 z.object({action:z.literal('acknowledgeHand'),studentId:z.string().min(1).max(200)}),
 z.object({action:z.literal('askQuestion'),lessonId:uuid.nullable(),question:z.string().trim().min(5).max(2000)}),
 z.object({action:z.literal('answerQuestion'),id:uuid,answer:z.string().trim().min(1).max(6000)}),
 z.object({action:z.literal('lessonViewed'),lessonId:uuid}),
 z.object({action:z.literal('subscriptionSettings'),price:z.number().int().min(1).max(100000),days:z.literal(6)}),
 z.object({action:z.literal('claimSubscription'),phone:z.string().min(9).max(20),receipt:z.string().trim().regex(/^[a-zA-Z0-9]{10}$/)}),
 z.object({action:z.literal('reviewSubscription'),...paymentReviewFields,id:uuid,status:z.enum(['verified','rejected']),note:z.string().trim().min(1).max(1000)}),
 z.object({action:z.literal('videoLease'),leaseId:uuid.nullable().default(null)}),
 z.object({action:z.literal('grantVideoCredit'),studentId:z.string().min(1).max(200),minutes:z.number().int().min(1).max(600)}),
 z.object({action:z.literal('readNotice'),id:uuid}),
 z.object({action:z.literal('buildDailyReports')}),
]);
export type EngagementAction=z.infer<typeof EngagementSchema>;
const st=(db:D1Database,sql:string,...v:unknown[])=>db.prepare(sql).bind(...v);
const one=(db:D1Database,sql:string,...v:unknown[])=>st(db,sql,...v).first<any>();
const all=async(db:D1Database,sql:string,...v:unknown[])=>(await st(db,sql,...v).all<any>()).results;
const need=<T>(v:T|null):T=>{if(!v)throw new AppError(404,'Record not found');return v};
export const learningDay=(n:number)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Nairobi',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(n));
function admin(u:User){if(u.role!=='admin')throw new AppError(403,'Administrator access required')}
async function ownStudent(db:D1Database,u:User,id:string){if(u.role==='student')throw new AppError(403,'Teacher access required');const a=need(await one(db,'SELECT * FROM admissions WHERE student_id=?',id));if(u.role!=='admin'&&a.teacher_id!==u.id)throw new AppError(403,'This learner is assigned to another teacher');return a}
export async function admissionState(db:D1Database,u:User){u=await admissionApplicant(db,u);return {user:u,registrationIncomplete:!!await one(db,"SELECT student_id FROM admissions WHERE student_id=? AND goals='Conference system testing' AND note='Conference pass admission'",u.id),accountReviewRequired:!!u.disabled,standardRegistrationFee:await one(db,"SELECT amount FROM registration_fee_settings WHERE id='main'"),registrationFee:(await learnerFees(db,u.id)).registrationFee,registrationStatus:u.role==='student'?(await one(db,'SELECT status FROM registration_payments WHERE student_id=? ORDER BY created_at DESC LIMIT 1',u.id))?.status||null:null,admission:u.role==='student'?await one(db,'SELECT a.*,us.name AS teacher_name FROM admissions a JOIN users us ON us.id=a.teacher_id WHERE a.student_id=?',u.id):null,teachers:await all(db,"SELECT id,name FROM users WHERE role IN ('admin','teacher') AND disabled=0 ORDER BY name")}}
export async function requireAdmitted(db:D1Database,u:User){if(u.role==='student'&&!await one(db,"SELECT student_id FROM admissions WHERE student_id=? AND status='approved' AND NOT (goals='Conference system testing' AND note='Conference pass admission')",u.id))throw new AppError(403,'Admission approval is required before entering the learning workspace')}
export async function initializePolicy(db:D1Database,now=Date.now()){
 if(!await one(db,"SELECT id FROM subscription_settings WHERE id='jeztech-payment-policy-v1'"))await db.batch([
 st(db,"INSERT INTO payment_settings(id,business_number,account_reference,instructions,updated_at) VALUES('main','522533','8075575','JEZTECH ENTERPRISES — confirm the recipient name before paying. Submit your receipt for verification.',?) ON CONFLICT(id) DO UPDATE SET business_number=excluded.business_number,account_reference=excluded.account_reference,instructions=excluded.instructions,updated_at=excluded.updated_at",now),
 st(db,"INSERT INTO subscription_settings(id,price,days,updated_at) VALUES('jeztech-payment-policy-v1',0,30,?) ON CONFLICT(id) DO NOTHING",now)]);
}
export async function subscriptionActive(db:D1Database,id:string,now=Date.now()){return !!await one(db,"SELECT id FROM subscriptions WHERE student_id=? AND status='verified' AND expires_at>? LIMIT 1",id,now)}
export async function canReadLesson(db:D1Database,u:User,id:string,now=Date.now()){
 const l=need(await one(db,'SELECT * FROM lessons WHERE id=?',id));if(u.role==='admin'||l.teacher_id===u.id)return l;if(u.role!=='student')throw new AppError(403,'This lesson belongs to another teacher');await requireAdmitted(db,u);
 if(await orientationAccess(db,u.id,now)&&!await one(db,`SELECT l.id FROM lessons l WHERE l.id=? AND ${orientationLessonScope('l','?')}`,l.id,u.id))throw new AppError(403,'Orientation is limited to your assigned class and subjects');
 if(l.status!=='published'||(!await orientationAccess(db,u.id,now)&&!await subscriptionActive(db,u.id,now)&&!await one(db,'SELECT student_id FROM conference_passes WHERE student_id=? AND expires_at>?',u.id,now)&&l.price!==0&&!await one(db,"SELECT id FROM payments WHERE student_id=? AND lesson_id=? AND status='verified'",u.id,l.id)))throw new AppError(403,'A verified payment or active subscription is required for this lesson');return l;
}
export async function grantEarnedCredit(db:D1Database,id:string,now=Date.now()){
 if(await one(db,'SELECT student_id FROM video_credits WHERE student_id=?',id))return;
 await st(db,`INSERT INTO video_credits(student_id,granted_at) SELECT ?,? WHERE EXISTS(SELECT 1 FROM admissions WHERE student_id=? AND status='approved') AND (EXISTS(SELECT 1 FROM payments WHERE student_id=? AND status='verified') OR EXISTS(SELECT 1 FROM subscriptions WHERE student_id=? AND status='verified')) ON CONFLICT(student_id) DO NOTHING`,id,now,id,id,id).run();
}
async function notice(db:D1Database,id:string,kind:string,ref:string,message:string,now:number){await st(db,'INSERT INTO notices(id,student_id,kind,ref,message,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(student_id,kind,ref) DO NOTHING',crypto.randomUUID(),id,kind,ref,message,now).run()}
export async function readEngagement(db:D1Database,u:User,now=Date.now()){
 u=await authorizedUser(db,u);
 await initializePolicy(db,now);const student=u.role==='student',teacher=u.role==='teacher';
 if(student){await grantEarnedCredit(db,u.id,now);const results=await all(db,"SELECT s.id,s.score,s.total,e.title FROM sessions s JOIN exams e ON e.id=s.exam_id WHERE s.student_id=? AND s.status='submitted' AND NOT EXISTS(SELECT 1 FROM notices n WHERE n.student_id=s.student_id AND n.kind='result' AND n.ref=s.id)",u.id);for(const s of results)await notice(db,u.id,'result',s.id,`${s.title}: ${s.score} / ${s.total}. Your marked result is ready.`,now)}
 const where=student?'a.student_id=?':teacher?'a.teacher_id=?':'1=1',args=student||teacher?[u.id]:[];
 const admissions=await all(db,`SELECT a.*,us.name AS student_name,us.email,us.disabled AS account_restricted,us.deleted_at AS account_deleted_at,ut.name AS teacher_name,p.last_seen,p.page,p.hand_raised,p.hand_note,p.raised_at,(SELECT COUNT(DISTINCT day) FROM learning_days d WHERE d.student_id=a.student_id) AS learning_days,(SELECT COUNT(*) FROM sessions s WHERE s.student_id=a.student_id AND s.status='submitted') AS completed_exams,(SELECT MAX(expires_at) FROM subscriptions s WHERE s.student_id=a.student_id AND s.status='verified') AS subscription_until,(SELECT allowance-used FROM video_credits c WHERE c.student_id=a.student_id) AS video_seconds,(SELECT login_id FROM learner_access x WHERE x.student_id=a.student_id) AS login_id,(SELECT expires_at FROM learner_access x WHERE x.student_id=a.student_id) AS login_expires FROM admissions a JOIN users us ON us.id=a.student_id JOIN users ut ON ut.id=a.teacher_id LEFT JOIN learning_presence p ON p.student_id=a.student_id WHERE ${where} ORDER BY a.requested_at DESC`,...args);
 const qwhere=student?'q.student_id=?':teacher?'q.teacher_id=?':'1=1';
 const qs=await all(db,`SELECT q.*,us.name AS student_name,l.title AS lesson_title FROM learner_questions q JOIN users us ON us.id=q.student_id LEFT JOIN lessons l ON l.id=q.lesson_id WHERE ${qwhere} ORDER BY q.created_at DESC LIMIT 200`,...args);
 const subs=u.role==='admin'?await all(db,`SELECT s.*,us.name AS student_name,us.email AS student_email,a.level AS student_class,reviewer.name AS reviewer_name FROM subscriptions s JOIN users us ON us.id=s.student_id LEFT JOIN admissions a ON a.student_id=s.student_id LEFT JOIN payment_review_audit review ON review.payment_id=s.id AND review.purpose='tuition' LEFT JOIN student_payment_audit sponsored ON sponsored.payment_id=s.id LEFT JOIN users reviewer ON reviewer.id=COALESCE(review.actor_id,sponsored.actor_id) ${student?'WHERE s.student_id=?':teacher?'WHERE EXISTS(SELECT 1 FROM admissions a WHERE a.student_id=s.student_id AND a.teacher_id=?)':''} ORDER BY s.created_at DESC`,...args):[];
 const credits=student?await one(db,'SELECT * FROM video_credits WHERE student_id=?',u.id):null;
 const videos=await all(db,`SELECT v.id,v.title,v.teacher_id,v.experiment,v.explanation,v.created_at,t.name AS teacher_name FROM learning_videos v JOIN users t ON t.id=v.teacher_id ${student?'WHERE EXISTS(SELECT 1 FROM admissions a WHERE a.student_id=? AND a.teacher_id=v.teacher_id)':teacher?'WHERE v.teacher_id=?':''} ORDER BY v.created_at DESC`,...args);
 return {admissions,learnerQuestions:qs,subscriptions:subs,subscriptionSettings:(await learnerFees(db,student?u.id:'')).tuitionPlan,videoCredit:credits,learningVideos:videos,notices:student?await all(db,'SELECT * FROM notices WHERE student_id=? ORDER BY created_at DESC LIMIT 50',u.id):[],dailyReports:student?[]:await all(db,`SELECT * FROM daily_reports ${teacher?'WHERE teacher_id=?':''} ORDER BY day DESC LIMIT 31`,...(teacher?[u.id]:[])),assessmentCycles:await all(db,`SELECT c.*,us.name AS student_name FROM assessment_cycles c JOIN users us ON us.id=c.student_id ${student?'WHERE c.student_id=?':teacher?'WHERE c.teacher_id=?':''} ORDER BY c.created_at DESC`,...args),subscriptionActive:student?await subscriptionActive(db,u.id,now):false,aiMode:'hourly_background',admissionRequired:false};
}
export async function mutateEngagement(db:D1Database,u:User,a:EngagementAction,now=Date.now()):Promise<any>{
 u=a.action==='requestAdmission'?await admissionApplicant(db,u):await authorizedUser(db,u);
 if(a.action==='buildDailyReports'){if(u.role==='student')throw new AppError(403,'Teacher access required');return maintenance(db,now)}
 if(a.action==='requestAdmission'){
 if(u.role!=='student')throw new AppError(400,'Only learner accounts request admission');const contact=registrationContact(a.contactMethod,a.phone,u.email);
 const t=need(await one(db,"SELECT id FROM users WHERE id=? AND role IN ('admin','teacher') AND disabled=0",a.teacherId));
 const existing=await one(db,'SELECT status,goals,note FROM admissions WHERE student_id=?',u.id);if(existing?.status==='approved'&&!u.disabled&&!(existing.goals==='Conference system testing'&&existing.note==='Conference pass admission'))throw new AppError(409,'You are already admitted');
 const statements=[st(db,"INSERT INTO admissions(student_id,teacher_id,phone,contact_method,level,goals,requested_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(student_id) DO UPDATE SET teacher_id=excluded.teacher_id,phone=excluded.phone,contact_method=excluded.contact_method,level=excluded.level,goals=excluded.goals,status='pending',note='',requested_at=excluded.requested_at,reviewed_at=NULL",u.id,t.id,contact.phone,contact.method,a.level,a.goals,now)];
 if(a.fullName)statements.push(st(db,'UPDATE users SET name=? WHERE id=?',a.fullName,u.id));
 if(a.registrationPayment){
 const payment=z.object({phone:z.string().trim().min(9).max(25),receipt:z.string().trim().regex(/^[A-Za-z0-9]{10}$/)}).safeParse(a.registrationPayment);if(!payment.success)throw new AppError(400,'Enter the 10-character M-Pesa registration transaction code');
 const phone=registrationContact('phone',payment.data.phone,u.email).phone,receipt=payment.data.receipt.toUpperCase();
 const prior=await one(db,"SELECT receipt,status FROM registration_payments WHERE student_id=? AND status IN ('pending','verified')",u.id);
 if(prior&&(prior.status!=='pending'||prior.receipt!==receipt))throw new AppError(409,'A registration payment is already pending or verified. Check your registration fee status.');
 if(!prior){const fee=(await learnerFees(db,u.id,a.level)).registrationFee;if(!fee)throw new AppError(409,'Registration fee has not been configured');const id=crypto.randomUUID();
 statements.push(st(db,'INSERT INTO payment_receipt_reservations(receipt,kind,payment_id,created_at) VALUES(?,?,?,?)',receipt,'registration',id,now),st(db,'INSERT INTO registration_payments(id,student_id,phone,receipt,amount,created_at) VALUES(?,?,?,?,?,?)',id,u.id,phone,receipt,fee.amount,now));}
 }
 try{await db.batch(statements)}catch(e){if(a.registrationPayment)throw new AppError(409,'The application was not saved. That M-Pesa code may already be recorded; check it or try again.');throw e}return {ok:true,registrationPayment:a.registrationPayment?'pending':null};
 }
 if(a.action==='reviewAdmission'){
 admin(u);await ownStudent(db,u,a.studentId);if(a.status==='approved'&&await one(db,"SELECT student_id FROM admissions WHERE student_id=? AND goals='Conference system testing' AND note='Conference pass admission'",a.studentId))throw new AppError(409,'This learner must complete the registration form before admission can be approved');const target=need(await one(db,'SELECT * FROM users WHERE id=?',a.studentId));
 if(target.deleted_at)throw new AppError(409,'Restore this deleted student under People & access before reviewing admission');
 if(target.role!=='student')throw new AppError(409,'Only student accounts can be admitted');
 const actions=[st(db,'UPDATE admissions SET status=?,note=?,reviewed_at=? WHERE student_id=?',a.status,a.note,now,a.studentId)];
 if(a.status==='approved'&&target.disabled){
 actions.push(st(db,"UPDATE users SET disabled=0 WHERE id=? AND role='student' AND deleted_at IS NULL",target.id));
 const snapshot=(disabled:number)=>JSON.stringify({name:target.name,role:target.role,disabled,deleted_at:null});
 actions.push(st(db,'INSERT INTO user_account_audit(id,actor_id,target_id,action,before,after,at) VALUES(?,?,?,?,?,?,?)',crypto.randomUUID(),u.id,target.id,'admissionReactivation',snapshot(target.disabled),snapshot(0),now));
 }
 await db.batch(actions);if(a.status==='approved')await enrollRegisteredStudent(db,a.studentId,now);await notice(db,a.studentId,'admission',String(now),`Admission ${a.status}. ${a.note}`,now);return {ok:true};
 }
 if(a.action==='subscriptionSettings'){admin(u);await st(db,"INSERT INTO subscription_settings(id,price,days,updated_at) VALUES('main',?,?,?) ON CONFLICT(id) DO UPDATE SET price=excluded.price,days=excluded.days,updated_at=excluded.updated_at",a.price,a.days,now).run();return {ok:true}}
 if(a.action==='reviewSubscription'){
 admin(u);const reviewed=await reviewStudentPayment(db,u,'tuition',a,now);if(a.status==='verified'){await refreshAccess(db,reviewed.studentId,now);await grantEarnedCredit(db,reviewed.studentId,now)}await notice(db,reviewed.studentId,'subscription',a.id,`Subscription receipt ${a.status}. ${a.note}`,now);return {ok:true};
 }
 if(a.action==='acknowledgeHand'){await ownStudent(db,u,a.studentId);await st(db,'UPDATE learning_presence SET hand_raised=0 WHERE student_id=?',a.studentId).run();return {ok:true}}
 if(a.action==='answerQuestion'){const q=need(await one(db,'SELECT * FROM learner_questions WHERE id=?',a.id));await ownStudent(db,u,q.student_id);await st(db,"UPDATE learner_questions SET answer=?,source='teacher',status='answered',answered_at=? WHERE id=?",a.answer,now,q.id).run();await notice(db,q.student_id,'answer',q.id,'Your teacher answered your question.',now);return {ok:true}}
 if(a.action==='grantVideoCredit'){admin(u);await ownStudent(db,u,a.studentId);await grantEarnedCredit(db,a.studentId,now);if(!await one(db,'SELECT student_id FROM video_credits WHERE student_id=?',a.studentId))throw new AppError(409,'Verify this registered learner’s payment first');await st(db,'UPDATE video_credits SET allowance=allowance+? WHERE student_id=?',a.minutes*60,a.studentId).run();return {ok:true}}
 if(a.action==='readNotice'){await st(db,'UPDATE notices SET read_at=? WHERE id=? AND student_id=?',now,a.id,u.id).run();return {ok:true}}
 await requireAdmitted(db,u);if(u.role!=='student')throw new AppError(403,'This action is for learners');
 const admission=need(await one(db,'SELECT * FROM admissions WHERE student_id=?',u.id));
 if(a.action==='presence'){await st(db,'INSERT INTO learning_presence(student_id,last_seen,page) VALUES(?,?,?) ON CONFLICT(student_id) DO UPDATE SET last_seen=excluded.last_seen,page=excluded.page',u.id,now,a.page).run();return {ok:true}}
 if(a.action==='hand'){await st(db,'INSERT INTO learning_presence(student_id,last_seen,page,hand_raised,hand_note,raised_at) VALUES(?,?,?, ?,?,?) ON CONFLICT(student_id) DO UPDATE SET hand_raised=excluded.hand_raised,hand_note=excluded.hand_note,raised_at=excluded.raised_at,last_seen=excluded.last_seen',u.id,now,'questions',a.raised?1:0,a.note,now).run();return {ok:true}}
 if(a.action==='askQuestion'){if(await one(db,"SELECT id FROM sessions WHERE student_id=? AND status IN ('active','paused')",u.id))throw new AppError(409,'AI learning questions are unavailable during an active assessment');if(a.lessonId)await canReadLesson(db,u,a.lessonId,now);const recent=await one(db,'SELECT id FROM learner_questions WHERE student_id=? AND created_at>?',u.id,now-15000);if(recent)throw new AppError(429,'Please wait a moment before submitting another question');const id=crypto.randomUUID();await st(db,'INSERT INTO learner_questions(id,student_id,teacher_id,lesson_id,question,created_at) VALUES(?,?,?,?,?,?)',id,u.id,admission.teacher_id,a.lessonId,a.question,now).run();return {id}}
 if(a.action==='lessonViewed'){const l=await canReadLesson(db,u,a.lessonId,now);await st(db,'INSERT INTO learning_days(id,student_id,lesson_id,day,at) VALUES(?,?,?,?,?) ON CONFLICT(student_id,lesson_id,day) DO NOTHING',crypto.randomUUID(),u.id,l.id,learningDay(now),now).run();return {ok:true}}
 if(a.action==='claimSubscription'){
 const settings=need((await learnerFees(db,u.id)).tuitionPlan);if(!settings.price)throw new AppError(409,'Subscription pricing is not configured');const receipt=a.receipt.toUpperCase(),phone=a.phone.replace(/[\s+()-]/g,'');if(!/^(?:254[17]\d{8}|0[17]\d{8})$/.test(phone))throw new AppError(400,'Enter a Kenyan mobile number');
 const existing=await one(db,'SELECT id,student_id,status FROM subscriptions WHERE receipt=?',receipt);if(existing){if(existing.student_id===u.id)return {id:existing.id,status:existing.status,alreadyRecorded:true};throw new AppError(409,'That receipt is already recorded. Ask the administrator to check the payment.');}if(await one(db,'SELECT id FROM payments WHERE receipt=?',receipt))throw new AppError(409,'Receipt already used');const id=crypto.randomUUID();try{await db.batch([st(db,'INSERT INTO payment_receipt_reservations(receipt,kind,payment_id,created_at) VALUES(?,?,?,?)',receipt,'tuition',id,now),st(db,'INSERT INTO subscriptions(id,student_id,phone,receipt,amount,days,created_at) VALUES(?,?,?,?,?,?,?)',id,u.id,phone,receipt,settings.price,settings.days,now)])}catch{throw new AppError(409,'That receipt is already recorded for a registration, tuition or lesson payment')}return {id};
 }
 if(a.action==='videoLease'){const orientation=await orientationAccess(db,u.id,now);if(orientation)return {leaseId:crypto.randomUUID(),expiresAt:orientation.expires_at,remaining:Math.floor((orientation.expires_at-now)/1000)};
 await grantEarnedCredit(db,u.id,now);const c=need(await one(db,'SELECT * FROM video_credits WHERE student_id=?',u.id));
 if(c.lease_expires>now){if(a.leaseId===c.lease_id)return {leaseId:c.lease_id,expiresAt:c.lease_expires,remaining:c.allowance-c.used};throw new AppError(409,'A video playback allowance is already reserved on another player; wait for it to finish')}
 const seconds=Math.min(15,c.allowance-c.used);if(seconds<=0)throw new AppError(402,'Your video allowance is used up. Contact the administrator about additional credit');const lease=a.leaseId&&a.leaseId===c.lease_id?a.leaseId:crypto.randomUUID();
 const r=await st(db,'UPDATE video_credits SET used=used+?,lease_id=?,lease_expires=? WHERE student_id=? AND (lease_expires IS NULL OR lease_expires<=?) AND used+?<=allowance',seconds,lease,now+seconds*1000,u.id,now,seconds).run();if(!r.meta.changes)throw new AppError(409,'Another player reserved this allowance; please retry');return {leaseId:lease,expiresAt:now+seconds*1000,remaining:c.allowance-c.used-seconds};
 }
 throw new AppError(400,'Unknown learning action');
}
export async function maintenance(db:D1Database,now=Date.now()){
 await initializePolicy(db,now);const students=await all(db,"SELECT a.student_id,a.teacher_id,COUNT(DISTINCT d.day) AS days FROM admissions a JOIN learning_days d ON d.student_id=a.student_id WHERE a.status='approved' GROUP BY a.student_id,a.teacher_id");
 for(const s of students){for(let cycle=1;cycle<=Math.floor(s.days/4);cycle++)await st(db,'INSERT INTO assessment_cycles(id,student_id,teacher_id,cycle,created_at) VALUES(?,?,?,?,?) ON CONFLICT(student_id,cycle) DO NOTHING',crypto.randomUUID(),s.student_id,s.teacher_id,cycle,now).run()}
 const days=[learningDay(now),learningDay(now-86400000)];const teachers=await all(db,"SELECT id FROM users WHERE role IN ('admin','teacher') AND disabled=0");
 for(const t of teachers)for(const day of days){const qs=await all(db,"SELECT q.*,u.name AS student_name FROM learner_questions q JOIN users u ON u.id=q.student_id WHERE q.teacher_id=? AND date(q.created_at/1000,'unixepoch','+3 hours')=? ORDER BY q.created_at LIMIT 1000",t.id,day);const report={total:qs.length,answered:qs.filter(q=>q.status==='answered').length,pending:qs.filter(q=>q.status==='pending').length,questions:qs};await st(db,'INSERT INTO daily_reports(id,teacher_id,day,data,created_at) VALUES(?,?,?,?,?) ON CONFLICT(teacher_id,day) DO UPDATE SET data=excluded.data,created_at=excluded.created_at',crypto.randomUUID(),t.id,day,JSON.stringify(report),now).run()}
 return {ok:true,days,learners:students.length};
}
export async function automationQueue(db:D1Database){
 const questions=await all(db,"SELECT q.id,q.question,l.title AS lesson_title,l.content AS lesson_content FROM learner_questions q LEFT JOIN lessons l ON l.id=q.lesson_id JOIN admissions a ON a.student_id=q.student_id WHERE q.status='pending' AND a.status='approved' AND NOT EXISTS(SELECT 1 FROM sessions s WHERE s.student_id=q.student_id AND s.status IN ('active','paused')) ORDER BY q.created_at LIMIT 20");
 const cycles=await all(db,"SELECT c.* FROM assessment_cycles c JOIN admissions a ON a.student_id=c.student_id WHERE c.status='pending' AND a.status='approved' ORDER BY c.created_at LIMIT 5");
 const assessments=[];for(const c of cycles){const days=await all(db,'SELECT DISTINCT day FROM learning_days WHERE student_id=? ORDER BY day LIMIT 4 OFFSET ?',c.student_id,(c.cycle-1)*4);const material=[];for(const d of days){material.push(...await all(db,'SELECT DISTINCT l.title,l.content FROM learning_days d JOIN lessons l ON l.id=d.lesson_id WHERE d.student_id=? AND d.day=?',c.student_id,d.day))}assessments.push({id:c.id,cycle:c.cycle,materials:material.map(l=>({title:l.title,content:l.content.slice(0,6000)})).slice(0,12)})}
 return {questions,assessments};
}
export const AutomationAction=z.discriminatedUnion('action',[
 z.object({action:z.literal('tick')}),
 z.object({action:z.literal('answer'),id:uuid,answer:z.string().trim().min(1).max(6000)}),
 z.object({action:z.literal('assessment'),id:uuid,title:z.string().trim().min(1).max(160),questions:z.array(z.object({text:z.string().trim().min(1).max(2000),choices:z.array(z.string().trim().min(1).max(500)).length(4),correct:z.number().int().min(0).max(3)})).min(3).max(10)}),
]);
export async function automate(db:D1Database,a:z.infer<typeof AutomationAction>,now=Date.now()){
 if(a.action==='tick')return maintenance(db,now);
 if(a.action==='answer'){const q=need(await one(db,'SELECT * FROM learner_questions WHERE id=?',a.id));if(await one(db,"SELECT id FROM sessions WHERE student_id=? AND status IN ('active','paused')",q.student_id))throw new AppError(409,'Learner is taking an assessment; retry after it ends');await st(db,"UPDATE learner_questions SET answer=?,source='ai_background',status='answered',answered_at=? WHERE id=? AND status='pending' AND EXISTS(SELECT 1 FROM admissions WHERE student_id=learner_questions.student_id AND status='approved')",a.answer,now,q.id).run();await notice(db,q.student_id,'answer',q.id,'An AI learning explanation is ready. Ask your teacher if you need clarification.',now);return {ok:true}}
 const c=need(await one(db,'SELECT * FROM assessment_cycles WHERE id=?',a.id));if(c.status!=='pending')return {ok:true,alreadyProcessed:true};const admitted=await one(db,"SELECT student_id FROM admissions WHERE student_id=? AND status='approved' AND NOT (goals='Conference system testing' AND note='Conference pass admission')",c.student_id);if(!admitted)throw new AppError(409,'Learner is no longer admitted');
 const examId=crypto.randomUUID();await db.batch([
 st(db,"INSERT INTO exams(id,teacher_id,title,description,duration,status,created_at) SELECT ?,?,?,?,30,'published',? WHERE EXISTS(SELECT 1 FROM assessment_cycles WHERE id=? AND status='pending')",examId,c.teacher_id,a.title,'Automatic assessment after four distinct learning days. Results are marked online.',now,c.id),
 ...a.questions.map((q,i)=>st(db,'INSERT INTO questions(id,exam_id,position,text,choices,correct) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM exams WHERE id=?)',crypto.randomUUID(),examId,i,q.text,JSON.stringify(q.choices),q.correct,examId)),
 st(db,"UPDATE assessment_cycles SET exam_id=?,status='ready' WHERE id=? AND status='pending'",examId,c.id)]);
 await notice(db,c.student_id,'assessment',c.id,'Your four-day learning assessment is ready in My assessments.',now);return {ok:true,examId};
}
