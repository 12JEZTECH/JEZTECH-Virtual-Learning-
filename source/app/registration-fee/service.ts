import {paymentReviewFields,reviewStudentPayment} from '../payments/review';
import {z} from 'zod';
import {learnerFees,AppError,authorizedUser,type User} from '../service';
import {requireAdmitted} from '../engagement/service';
const st=(db:D1Database,sql:string,...args:unknown[])=>db.prepare(sql).bind(...args);
export const RegistrationAction=z.discriminatedUnion('action',[
 z.object({action:z.literal('registrationFeeSettings'),amount:z.number().int().min(1).max(100000)}),
 z.object({action:z.literal('claimRegistrationFee'),phone:z.string().trim().min(9).max(20),receipt:z.string().trim().regex(/^[A-Za-z0-9]{10}$/)}),
 z.object({action:z.literal('reviewRegistrationFee'),...paymentReviewFields,id:z.string().uuid(),status:z.enum(['verified','rejected']),note:z.string().trim().min(1).max(1000)}),
]);
export async function readRegistrationFees(db:D1Database,u:User){
 u=await authorizedUser(db,u);
 const scope=u.role==='admin'?'1=1':u.role==='student'?'r.student_id=?':"EXISTS(SELECT 1 FROM admissions a WHERE a.student_id=r.student_id AND a.teacher_id=?)";
 return {user:{name:u.name,role:u.role},settings:(await learnerFees(db,u.role==='student'?u.id:'')).registrationFee,admission:u.role==='student'?await st(db,'SELECT phone,status FROM admissions WHERE student_id=?',u.id).first():null,
 ownStatus:u.role==='student'?(await st(db,"SELECT status FROM registration_payments WHERE student_id=? ORDER BY created_at DESC LIMIT 1",u.id).first<{status:string}>())?.status||null:null,
 tuitionPlan:(await learnerFees(db,u.role==='student'?u.id:'')).tuitionPlan,payments:u.role==='admin'?(await st(db,`SELECT r.*,u.name AS student_name,u.email AS student_email,a.level AS student_class,reviewer.name AS reviewer_name FROM registration_payments r JOIN users u ON u.id=r.student_id LEFT JOIN admissions a ON a.student_id=r.student_id LEFT JOIN users reviewer ON reviewer.id=r.reviewed_by WHERE ${scope} ORDER BY r.created_at DESC`,...(u.role==='admin'?[]:[u.id])).all()).results:[]};
}
export async function mutateRegistrationFee(db:D1Database,u:User,input:z.infer<typeof RegistrationAction>,now=Date.now()){
 u=await authorizedUser(db,u);const a=RegistrationAction.parse(input);if(u.disabled)throw new AppError(403,'Account disabled');
 if(a.action==='registrationFeeSettings'){if(u.role!=='admin')throw new AppError(403,'Only the administrator can set registration fees');await st(db,"UPDATE registration_fee_settings SET amount=?,updated_at=? WHERE id='main'",a.amount,now).run();return {ok:true}}
 if(a.action==='reviewRegistrationFee'){
 if(u.role!=='admin')throw new AppError(403,'Only the administrator can verify registration payments');
 await reviewStudentPayment(db,u,'registration',a,now);return {ok:true};
 }
 if(u.role!=='student')throw new AppError(403,'Student account required');await requireAdmitted(db,u);
 if(await st(db,"SELECT id FROM registration_payments WHERE student_id=? AND status IN ('pending','verified')",u.id).first())throw new AppError(409,'A registration payment is already pending or verified');
 const phone=a.phone.replace(/[\s+()-]/g,'');if(!/^(?:254[17]\d{8}|0[17]\d{8})$/.test(phone))throw new AppError(400,'Enter a valid Kenyan mobile number');
 const settings=(await learnerFees(db,u.id)).registrationFee;if(!settings)throw new AppError(409,'Ask the administrator to configure the registration fee');
 const id=crypto.randomUUID(),receipt=a.receipt.toUpperCase();
 try{await db.batch([
 st(db,'INSERT INTO payment_receipt_reservations(receipt,kind,payment_id,created_at) VALUES(?,?,?,?)',receipt,'registration',id,now),
 st(db,'INSERT INTO registration_payments(id,student_id,phone,receipt,amount,created_at) VALUES(?,?,?,?,?,?)',id,u.id,phone,receipt,settings.amount,now),
 ])}catch{throw new AppError(409,'That receipt is already recorded for a registration, tuition or lesson payment')}
 return {id};
}
