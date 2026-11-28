import {z} from 'zod';
import {AppError,authorizedUser,type User} from '../service';
export const paymentReviewFields={studentId:z.string().min(1).max(200).optional(),expectedAmount:z.number().int().min(0).optional(),expectedReceipt:z.string().trim().min(1).max(200).optional(),confirmed:z.boolean().optional()};
type Review={id:string;studentId?:string;expectedAmount?:number;expectedReceipt?:string;confirmed?:boolean;status:'verified'|'rejected';note:string};
const st=(db:D1Database,sql:string,...v:unknown[])=>db.prepare(sql).bind(...v);
export async function reviewStudentPayment(db:D1Database,actor:User,kind:'registration'|'tuition',a:Review,now:number){
 actor=await authorizedUser(db,actor,'admin');const table=kind==='registration'?'registration_payments':'subscriptions';
 const row=await st(db,`SELECT * FROM ${table} WHERE id=?`,a.id).first<any>();if(!row)throw new AppError(404,'Payment record not found');if(row.status!=='pending')throw new AppError(409,'This payment was already reviewed. Refresh the student record.');
 if(!a.studentId)throw new AppError(400,'Select and confirm the student attached to this payment');if(a.studentId!==row.student_id)throw new AppError(409,'The selected student does not match this payment. Nothing was approved.');
 if(a.status==='verified'&&(a.confirmed!==true||a.expectedAmount===undefined||!a.expectedReceipt))throw new AppError(400,'Confirm the student, receipt and amount against the actual payment statement');
 if((a.expectedAmount!==undefined&&a.expectedAmount!==row.amount)||(a.expectedReceipt!==undefined&&a.expectedReceipt.trim().toUpperCase()!==String(row.receipt).trim().toUpperCase()))throw new AppError(409,'Payment details changed. Refresh and verify the student, receipt and amount again.');
 if(!a.note.trim()||a.note.length>1000)throw new AppError(400,'Add a payment verification or rejection note');
 if(a.status==='verified'&&(!Number.isSafeInteger(row.amount)||row.amount<1||(kind==='tuition'&&(!Number.isSafeInteger(row.days)||row.days<1))))throw new AppError(409,'This payment has an invalid amount or access period');
 const audit=crypto.randomUUID();const actions=[st(db,`INSERT INTO payment_review_audit(id,payment_id,purpose,student_id,actor_id,status,amount,receipt,note,reviewed_at) SELECT ?,id,?,student_id,?,?,amount,receipt,?,? FROM ${table} WHERE id=? AND student_id=? AND status='pending' AND amount=? AND receipt=?`,audit,kind,actor.id,a.status,a.note.trim(),now,row.id,row.student_id,row.amount,row.receipt)];
 if(kind==='registration')actions.push(st(db,"UPDATE registration_payments SET status=?,note=?,verified_at=?,reviewed_by=? WHERE id=? AND student_id=? AND status='pending' AND EXISTS(SELECT 1 FROM payment_review_audit WHERE id=?)",a.status,a.note.trim(),a.status==='verified'?now:null,actor.id,row.id,row.student_id,audit));
 else actions.push(st(db,"UPDATE subscriptions SET status=?,verified_at=?,expires_at=CASE WHEN ?='verified' THEN MAX(?,COALESCE((SELECT MAX(s.expires_at) FROM subscriptions s WHERE s.student_id=subscriptions.student_id AND s.status='verified' AND s.id!=subscriptions.id),0))+days*86400000 ELSE NULL END,note=? WHERE id=? AND student_id=? AND status='pending' AND EXISTS(SELECT 1 FROM payment_review_audit WHERE id=?)",a.status,a.status==='verified'?now:null,a.status,now,a.note.trim(),row.id,row.student_id,audit));
 let result;try{result=await db.batch(actions)}catch{throw new AppError(409,'This payment could not be reviewed or was reviewed concurrently. Refresh before retrying.')}
 if(!result[1].meta.changes)throw new AppError(409,'Payment already reviewed. Nothing was changed.');return {studentId:row.student_id,status:a.status};
}
