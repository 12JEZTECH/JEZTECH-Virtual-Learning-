import {z} from 'zod';
import {learnerFees,learnerFeeQuote,AppError,authorizedUser,type User} from '../service';
import {refreshAccess} from '../classroom/access';
import {requireAdmitted,grantEarnedCredit} from '../engagement/service';
export type PaymentConfig={MPESA_CONSUMER_KEY?:string;MPESA_CONSUMER_SECRET?:string;MPESA_PASSKEY?:string;MPESA_SHORTCODE?:string;MPESA_CALLBACK_URL?:string;MPESA_LIVE_ENABLED?:string};
export const PaymentAction=z.discriminatedUnion('action',[
 z.object({action:z.literal('adminStartStudentPayment'),studentId:z.string().min(1).max(200),purpose:z.enum(['registration','tuition']),expectedAmount:z.number().int().min(1).max(100000),expectedDays:z.number().int().min(0).max(365),phone:z.string().trim().min(9).max(20),confirmed:z.literal(true)}),
 z.object({action:z.literal('adminCheckStudentPayment'),id:z.string().uuid()}),
 z.object({action:z.literal('adminRecordStudentPayment'),id:z.string().uuid(),studentId:z.string().min(1).max(200),purpose:z.enum(['registration','tuition']),expectedAmount:z.number().int().min(1).max(100000),expectedDays:z.number().int().min(0).max(365),phone:z.string().trim().min(9).max(20),receipt:z.string().trim().regex(/^[A-Za-z0-9]{10}$/),note:z.string().trim().min(5).max(1000),confirmed:z.literal(true)}),
 z.object({action:z.literal('startPayment'),phone:z.string().trim().min(9).max(20),purpose:z.enum(['tuition','registration']).optional()}),
 z.object({action:z.literal('checkPayment'),id:z.string().uuid()}),
 z.object({action:z.literal('reconcilePayments')}),
]);
const st=(db:D1Database,sql:string,...v:unknown[])=>db.prepare(sql).bind(...v);
const keys=['MPESA_CONSUMER_KEY','MPESA_CONSUMER_SECRET','MPESA_PASSKEY','MPESA_SHORTCODE','MPESA_CALLBACK_URL','MPESA_LIVE_ENABLED'] as const;
export function paymentConfiguration(c:PaymentConfig){const missing=keys.filter(k=>!c[k]);let callback=false;try{const url=new URL(c.MPESA_CALLBACK_URL||'');callback=url.protocol==='https:'&&!url.username&&!url.password}catch{}return {configured:missing.length===0&&c.MPESA_LIVE_ENABLED==='true'&&c.MPESA_SHORTCODE==='522533'&&callback,missing,mode:'live',requiresPublicCallback:true}}
function config(c:PaymentConfig){if(!paymentConfiguration(c).configured)throw new AppError(503,'Automatic payments are not connected. The administrator must configure live Daraja credentials, the approved Paybill and a public callback gateway.');return {key:c.MPESA_CONSUMER_KEY!,secret:c.MPESA_CONSUMER_SECRET!,pass:c.MPESA_PASSKEY!,short:c.MPESA_SHORTCODE!,callback:c.MPESA_CALLBACK_URL!}}
export function normalisePhone(s:string){const p=s.replace(/[\s+()-]/g,'');const phone=p.startsWith('0')?'254'+p.slice(1):p;if(!/^254[17]\d{8}$/.test(phone))throw new AppError(400,'Enter a valid Kenyan M-Pesa phone number');return phone}
const BASE='https://api.safaricom.co.ke';
type ProviderFetch=typeof fetch;
async function request(fetcher:ProviderFetch,url:string,init:RequestInit){let r:Response;try{r=await fetcher(url,{...init,redirect:'error',signal:AbortSignal.timeout(20000)})}catch{throw new AppError(502,'Safaricom could not be reached. Your payment remains unverified; check again before retrying.')}if(!r.ok)throw new AppError(502,'Safaricom has not confirmed this request. Please check again later.');try{return await r.json() as Record<string,any>}catch{throw new AppError(502,'The payment provider returned an unreadable response')}}
async function credentials(c:PaymentConfig,fetcher:ProviderFetch,now:number){const v=config(c);const auth=await request(fetcher,BASE+'/oauth/v1/generate?grant_type=client_credentials',{headers:{Authorization:'Basic '+btoa(v.key+':'+v.secret)}});if(typeof auth.access_token!=='string'||!auth.access_token)throw new AppError(502,'Payment provider authentication failed');const timestamp=new Date(now+3*3600000).toISOString().slice(0,19).replace(/\D/g,'');return {...v,token:auth.access_token,timestamp,password:btoa(v.short+v.pass+timestamp)}}
async function provider(c:PaymentConfig,path:string,body:Record<string,unknown>,fetcher:ProviderFetch,now:number){const v=await credentials(c,fetcher,now);return request(fetcher,BASE+path,{method:'POST',headers:{Authorization:'Bearer '+v.token,'Content-Type':'application/json'},body:JSON.stringify({BusinessShortCode:v.short,Password:v.password,Timestamp:v.timestamp,...body})})}
function publicIntent(p:any){return {studentId:p.student_id,purpose:p.purpose||'tuition',id:p.id,amount:p.amount,days:p.days,status:p.status,message:p.message,created_at:p.created_at,confirmed_at:p.confirmed_at,reference:p.checkout_id}}
export async function readPayments(db:D1Database,u:User,c:PaymentConfig){u=await authorizedUser(db,u);const status=paymentConfiguration(c);const recording=u.role==='admin'?await st(db,`SELECT COUNT(CASE WHEN status='pending' AND purpose='registration' THEN 1 END) AS pendingRegistration,COUNT(CASE WHEN status='pending' AND purpose='tuition' THEN 1 END) AS pendingTuition,COUNT(CASE WHEN status IN ('unknown','review_required','starting') THEN 1 END) AS needsReview,COUNT(CASE WHEN status='pending' AND recording_error!='' THEN 1 END) AS verificationErrors FROM payment_intents`).first():undefined;const plan=(await learnerFees(db,u.role==='student'?u.id:'')).tuitionPlan;const admission=u.role==='student'?await st(db,'SELECT phone FROM admissions WHERE student_id=?',u.id).first<{phone:string}>():null;return {...(recording?{recording}:{}),plan,phone:admission?.phone||'',configuration:u.role==='admin'?status:{configured:status.configured},paymentIntents:u.role==='student'?(await st(db,`SELECT * FROM payment_intents WHERE student_id=? AND status IN ('starting','pending','unknown') ORDER BY created_at DESC LIMIT 20`,u.id).all<any>()).results.map(publicIntent):[]}}
export async function confirmIntent(db:D1Database,id:string,now:number){
 // Only call after a successful authenticated query to Safaricom. Idempotent D1 batch.
 const p=await st(db,'SELECT * FROM payment_intents WHERE id=?',id).first<any>();if(!p||!p.checkout_id)throw new AppError(404,'Payment request not found');
 if(p.purpose==='registration'){
 const existing=await st(db,"SELECT id FROM registration_payments WHERE student_id=? AND status IN ('pending','verified') AND id!=?",p.student_id,p.id).first();
 if(existing){await st(db,"UPDATE payment_intents SET status='review_required',message='Provider payment confirmed, but a registration payment is already recorded. Contact the administrator to reconcile a possible duplicate charge.' WHERE id=?",id).run();return}
 await db.batch([
 st(db,`INSERT INTO registration_payments(id,student_id,phone,receipt,amount,status,note,created_at,verified_at) SELECT id,student_id,phone,'STK:'||checkout_id,amount,'verified','Automatically confirmed registration fee; does not grant tuition access',created_at,? FROM payment_intents WHERE id=? AND status IN ('pending','confirmed') ON CONFLICT(id) DO NOTHING`,now,id),
 st(db,"UPDATE payment_intents SET status='confirmed',confirmed_at=COALESCE(confirmed_at,?),message='Registration fee confirmed. Tuition is paid separately.' WHERE id=? AND EXISTS(SELECT 1 FROM registration_payments WHERE id=? AND status='verified')",now,id,id),
 ]);return;
 }

 await db.batch([
 st(db,`INSERT INTO subscriptions(id,student_id,phone,receipt,amount,days,status,verified_at,expires_at,note,created_at) SELECT id,student_id,phone,'STK:'||checkout_id,amount,days,'verified',?,MAX(?,COALESCE((SELECT MAX(expires_at) FROM subscriptions WHERE student_id=payment_intents.student_id AND status='verified'),0))+days*86400000,'Automatically confirmed by authenticated Safaricom STK query; reference is the checkout ID',created_at FROM payment_intents WHERE id=? AND status IN ('pending','confirmed') ON CONFLICT(id) DO NOTHING`,now,now,id),
 st(db,"UPDATE payment_intents SET status='confirmed',confirmed_at=COALESCE(confirmed_at,?),message='Payment confirmed by Safaricom. Learner access is active.' WHERE id=? AND EXISTS(SELECT 1 FROM subscriptions WHERE id=? AND status='verified')",now,id,id),
 ]);await refreshAccess(db,p.student_id,now);await grantEarnedCredit(db,p.student_id,now);
}
async function check(db:D1Database,p:any,c:PaymentConfig,now:number,fetcher:ProviderFetch){
 if(p.status==='confirmed'){if(p.purpose!=='registration'){await refreshAccess(db,p.student_id,now);await grantEarnedCredit(db,p.student_id,now)}return publicIntent(p)}if(p.status!=='pending'||!p.checkout_id)return publicIntent(p);
 const lock=await st(db,'UPDATE payment_intents SET checked_at=? WHERE id=? AND (checked_at IS NULL OR checked_at<=?)',now,p.id,now-10000).run();if(!lock.meta.changes)return publicIntent(p);
 try{const data=await provider(c,'/mpesa/stkpushquery/v1/query',{CheckoutRequestID:p.checkout_id},fetcher,now);
 if(data.CheckoutRequestID!==p.checkout_id||data.MerchantRequestID!==p.merchant_id)throw new AppError(502,'Payment provider response did not match the original request');
 if(data.ResultCode===0||data.ResultCode==='0')await confirmIntent(db,p.id,now);
 else if(['1032','1037','1','2001'].includes(String(data.ResultCode)))await st(db,"UPDATE payment_intents SET status='failed',message='Payment was cancelled, timed out or declined. No access has been granted.' WHERE id=? AND status='pending'",p.id).run();
 await st(db,"UPDATE payment_intents SET recording_error='' WHERE id=?",p.id).run();
 return publicIntent(await st(db,'SELECT * FROM payment_intents WHERE id=?',p.id).first());
 }catch(e){await st(db,"UPDATE payment_intents SET recording_error='Provider verification is unavailable; payment remains unverified. Retry confirmation or reconcile with the provider statement.' WHERE id=? AND status='pending'",p.id).run();throw e}
}
export async function mutatePayment(db:D1Database,u:User,a:z.infer<typeof PaymentAction>,c:PaymentConfig,now=Date.now(),fetcher:ProviderFetch=fetch){
 u=await authorizedUser(db,u);if(a.action==='reconcilePayments'){if(u.role!=='admin')throw new AppError(403,'Administrator required');return reconcilePayments(db,c,now,fetcher)}
 if(a.action==='adminRecordStudentPayment')return recordStudentPayment(db,u,a,now);
 if(a.action==='adminCheckStudentPayment'){if(u.role!=='admin')throw new AppError(403,'Administrator required');const p=await st(db,'SELECT * FROM payment_intents WHERE id=?',a.id).first<any>();if(!p)throw new AppError(404,'Payment request not found');return check(db,p,c,now,fetcher)}
 let initiatedBy:string|null=null;
 if(a.action==='adminStartStudentPayment'){if(a.confirmed!==true)throw new AppError(400,'Confirm the selected student and payer before requesting payment');if(u.role!=='admin')throw new AppError(403,'Administrator required');initiatedBy=u.id;u=await studentPaymentTarget(db,a.studentId,a.purpose);const quote=await learnerFeeQuote(db,u.id,a.purpose);if(!quote||quote.price!==a.expectedAmount||quote.days!==a.expectedDays)throw new AppError(409,'The fee or period changed. Refresh and confirm the new amount before paying.');a={action:'startPayment',phone:a.phone,purpose:a.purpose};}
 if(u.role!=='student')throw new AppError(403,'Learner account required');if(!initiatedBy||a.action==='checkPayment'||a.purpose!=='registration')await requireAdmitted(db,u);
 if(a.action==='checkPayment'){const p=await st(db,'SELECT * FROM payment_intents WHERE id=? AND student_id=?',a.id,u.id).first<any>();if(!p)throw new AppError(404,'Payment request not found');return check(db,p,c,now,fetcher)}
 const purpose=a.purpose||'tuition';if(purpose==='registration'&&await st(db,"SELECT id FROM registration_payments WHERE student_id=? AND status IN ('pending','verified')",u.id).first())throw new AppError(409,'A registration fee is already pending or verified');
 const v=config(c),phone=normalisePhone(a.phone);const plan=await learnerFeeQuote(db,u.id,purpose);if(!plan||plan.price<1)throw new AppError(409,'The administrator must set the subscription fee and period first');
 const pending=await st(db,"SELECT * FROM payment_intents WHERE student_id=? AND purpose=? AND status IN ('starting','pending','unknown') AND (purpose='registration' OR created_at>?) ORDER BY created_at DESC LIMIT 1",u.id,purpose,now-600000).first<any>();if(pending)return publicIntent(pending);
 const recent=await st(db,'SELECT id FROM payment_intents WHERE student_id=? AND created_at>?',u.id,now-30000).first();if(recent)throw new AppError(429,'Wait before requesting another payment prompt');
 const id=crypto.randomUUID();try{const inserted=await st(db,"INSERT INTO payment_intents(id,student_id,phone,amount,days,created_at,purpose,initiated_by) SELECT ?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM payment_intents WHERE student_id=? AND purpose=? AND status IN ('starting','pending','unknown') AND created_at>?)",id,u.id,phone,plan.price,plan.days,now,purpose,initiatedBy,u.id,purpose,now-600000).run();if(!inserted.meta.changes)throw new Error('Existing payment request')}catch{throw new AppError(409,'Another payment request is being created. Refresh your payment status.')}
 try{const data=await provider(c,'/mpesa/stkpush/v1/processrequest',{TransactionType:'CustomerPayBillOnline',Amount:plan.price,PartyA:phone,PartyB:v.short,PhoneNumber:phone,CallBackURL:v.callback,AccountReference:'8075575',TransactionDesc:purpose==='registration'?'Registration':'Tuition'},fetcher,now);
 if(String(data.ResponseCode)!=='0'||typeof data.CheckoutRequestID!=='string'||typeof data.MerchantRequestID!=='string')throw new AppError(502,'Safaricom has not accepted the payment prompt');
 await st(db,"UPDATE payment_intents SET checkout_id=?,merchant_id=?,status='pending',message='Approve the M-Pesa prompt on your phone. Waiting for Safaricom confirmation.' WHERE id=?",data.CheckoutRequestID,data.MerchantRequestID,id).run();
 }catch(e){await st(db,"UPDATE payment_intents SET status='unknown',message='Prompt status is uncertain. Check your M-Pesa account before making another payment; contact the administrator if charged.' WHERE id=?",id).run();throw e}
 return publicIntent(await st(db,'SELECT * FROM payment_intents WHERE id=?',id).first());
}
export async function reconcilePayments(db:D1Database,c:PaymentConfig,now=Date.now(),fetcher:ProviderFetch=fetch){if(!paymentConfiguration(c).configured)return {connected:false,checked:0};const rows=(await st(db,"SELECT * FROM payment_intents WHERE status='pending' ORDER BY COALESCE(checked_at,0) LIMIT 5").all<any>()).results;let checked=0;for(const p of rows){try{await check(db,p,c,now,fetcher);checked++}catch{ /* Leave unverified for a later authenticated retry. */ }}return {connected:true,checked}}

// Callback metadata is only a durable retry hint, never evidence of payment.
export async function acceptPaymentCallback(db:D1Database,value:unknown,now=Date.now()):Promise<string|null>{
 const parsed=z.object({Body:z.object({stkCallback:z.object({CheckoutRequestID:z.string().min(1).max(200),MerchantRequestID:z.string().min(1).max(200)})})}).safeParse(value);
 if(!parsed.success)throw new AppError(400,'Invalid callback');
 const callback=parsed.data.Body.stkCallback;
 const p=await st(db,"SELECT id,status FROM payment_intents WHERE checkout_id=? AND merchant_id=?",callback.CheckoutRequestID,callback.MerchantRequestID).first<{id:string;status:string}>();
 if(!p||p.status!=='pending')return null;
 await st(db,"UPDATE payment_intents SET callback_received_at=COALESCE(callback_received_at,?) WHERE id=? AND status='pending'",now,p.id).run();return p.id;
}
export async function verifyCallbackPayment(db:D1Database,id:string,c:PaymentConfig,now=Date.now(),fetcher:ProviderFetch=fetch){
 const p=await st(db,"SELECT * FROM payment_intents WHERE id=? AND callback_received_at IS NOT NULL",id).first<any>();
 if(!p)return;
 try{await check(db,p,c,now,fetcher)}catch{ /* Durable pending row is retried by reconciliation; check records the error. */ }
}

async function studentPaymentTarget(db:D1Database,id:string,purpose:'registration'|'tuition'){
 const target=await authorizedUser(db,{id} as User,'student');const admission=await st(db,'SELECT status FROM admissions WHERE student_id=?',id).first<{status:string}>();
 if(!admission||admission.status==='rejected')throw new AppError(409,'Select a registered student with a pending or approved admission');
 if(purpose==='tuition')await requireAdmitted(db,target);return target;
}
export async function readStudentPaymentAdmin(db:D1Database,u:User,c:PaymentConfig,search='',studentId=''){
 await authorizedUser(db,u,'admin');search=search.trim().slice(0,80);
 const students=(await st(db,"SELECT u.id,u.name,u.email,a.level,a.status AS admission_status FROM users u JOIN admissions a ON a.student_id=u.id WHERE u.role='student' AND u.disabled=0 AND u.deleted_at IS NULL AND a.status IN ('pending','approved') AND (u.name LIKE ? OR u.email LIKE ? OR u.id=?) ORDER BY u.name,u.id LIMIT 50",'%'+search+'%','%'+search+'%',search).all()).results;
 let selected=null;if(studentId){const target=await studentPaymentTarget(db,studentId,'registration');const admission=await st(db,'SELECT level,status FROM admissions WHERE student_id=?',target.id).first<any>();
 selected={id:target.id,name:target.name,email:target.email,level:admission.level,admissionStatus:admission.status,registrationStatus:(await st(db,"SELECT status FROM registration_payments WHERE student_id=? AND status IN ('pending','verified') ORDER BY created_at DESC LIMIT 1",target.id).first<any>())?.status||null,requests:(await st(db,'SELECT * FROM payment_intents WHERE student_id=? ORDER BY created_at DESC LIMIT 10',target.id).all<any>()).results.map(publicIntent),pendingPayments:(await st(db,`SELECT id,student_id,phone,receipt,amount,0 AS days,'registration' AS purpose FROM registration_payments WHERE student_id=? AND status='pending' UNION ALL SELECT id,student_id,phone,receipt,amount,days,'tuition' AS purpose FROM subscriptions WHERE student_id=? AND status='pending'`,target.id,target.id).all<any>()).results.map(p=>({...p,student_name:target.name,student_email:target.email,student_class:admission.level}))};}
 return {students,selected,configuration:{configured:paymentConfiguration(c).configured},registrationFee:(await learnerFees(db,selected?.id||'')).registrationFee,tuitionPlan:(await learnerFees(db,selected?.id||'')).tuitionPlan};
}
async function recordStudentPayment(db:D1Database,actor:User,a:Extract<z.infer<typeof PaymentAction>,{action:'adminRecordStudentPayment'}>,now:number){
 await authorizedUser(db,actor,'admin');const parsed=PaymentAction.safeParse(a);if(!parsed.success)throw new AppError(400,'Confirm the completed payment and provide its transaction reference and review note');
 const target=await studentPaymentTarget(db,a.studentId,a.purpose),phone=normalisePhone(a.phone),receipt=a.receipt.toUpperCase();
 const fingerprint=JSON.stringify([target.id,a.purpose,phone,receipt,a.note,a.expectedAmount,a.expectedDays]);
 const previous=await st(db,'SELECT * FROM student_payment_audit WHERE payment_id=?',a.id).first<any>();if(previous){if(previous.request_fingerprint!==fingerprint||previous.actor_id!==actor.id)throw new AppError(409,'This record ID belongs to a different payment');return {id:a.id,studentId:target.id,purpose:a.purpose,status:'confirmed',method:'verified_receipt',amount:previous.amount};}
 if(await st(db,"SELECT id FROM payment_intents WHERE student_id=? AND purpose=? AND status IN ('starting','pending','unknown')",target.id,a.purpose).first())throw new AppError(409,'A phone payment request needs reconciliation first. Do not record the same payment twice.');
 if(a.purpose==='registration'&&await st(db,"SELECT id FROM registration_payments WHERE student_id=? AND status IN ('pending','verified')",target.id).first())throw new AppError(409,'Registration is already pending or verified. Review the existing payment instead.');
 const settings=await learnerFeeQuote(db,target.id,a.purpose);
 if(!settings||settings.price<1||(a.purpose==='tuition'&&settings.days<1))throw new AppError(409,'Configure the selected fee before recording payment');
 if(settings.price!==a.expectedAmount||settings.days!==a.expectedDays)throw new AppError(409,'The fee or period changed. Refresh and check the completed payment amount again.');
 const note='Admin verified payment on behalf of student. '+a.note;
 const actions=[st(db,'INSERT INTO payment_receipt_reservations(receipt,kind,payment_id,created_at) VALUES(?,?,?,?)',receipt,a.purpose,a.id,now)];
 if(a.purpose==='registration')actions.push(st(db,"INSERT INTO registration_payments(id,student_id,phone,receipt,amount,status,note,created_at,verified_at,reviewed_by) SELECT ?,?,?,?,?,'verified',?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM registration_payments WHERE student_id=? AND status IN ('pending','verified'))",a.id,target.id,phone,receipt,settings.price,note,now,now,actor.id,target.id));
 else actions.push(st(db,"INSERT INTO subscriptions(id,student_id,phone,receipt,amount,days,status,verified_at,expires_at,note,created_at) VALUES(?,?,?,?,?,?,'verified',?,MAX(?,COALESCE((SELECT MAX(expires_at) FROM subscriptions WHERE student_id=? AND status='verified'),0))+?*86400000,?,?)",a.id,target.id,phone,receipt,settings.price,settings.days,now,now,target.id,settings.days,note,now));
 actions.push(st(db,`INSERT INTO student_payment_audit(id,actor_id,student_id,payment_id,purpose,amount,request_fingerprint,created_at) VALUES(?,?,?,CASE WHEN ?='registration' THEN (SELECT id FROM registration_payments WHERE id=? AND student_id=?) ELSE (SELECT id FROM subscriptions WHERE id=? AND student_id=?) END,?,?,?,?)`,crypto.randomUUID(),actor.id,target.id,a.purpose,a.id,target.id,a.id,target.id,a.purpose,settings.price,fingerprint,now));
 try{await db.batch(actions)}catch{throw new AppError(409,'This transaction reference or payment ID is already recorded. Refresh before retrying.');}
 if(a.purpose==='tuition'){await refreshAccess(db,target.id,now);await grantEarnedCredit(db,target.id,now)}return {id:a.id,studentId:target.id,purpose:a.purpose,status:'confirmed',method:'verified_receipt',amount:settings.price};
}
