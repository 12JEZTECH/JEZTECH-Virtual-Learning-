import {authorizedUser,type User} from '../service';
import {learnersSQL} from '../teacher-pay/service';
const one=(db:D1Database,q:string,...v:unknown[])=>db.prepare(q).bind(...v).first<any>();
const all=async(db:D1Database,q:string,...v:unknown[])=>(await db.prepare(q).bind(...v).all<any>()).results;
// Payment intents mirror these ledgers after confirmation; never add intents again.
const collectionCTE=`WITH raw AS (
 SELECT 'registration' AS kind,id,student_id,receipt,amount,verified_at AS verified_at FROM registration_payments WHERE status='verified'
 UNION ALL SELECT 'tuition',id,student_id,receipt,amount,verified_at FROM subscriptions WHERE status='verified'
 UNION ALL SELECT 'lesson',id,student_id,receipt,amount,reviewed_at FROM payments WHERE status='verified'
 UNION ALL SELECT product,id,student_id,receipt,amount,reviewed_at FROM subject_purchases WHERE status='verified'
), grouped AS (
 SELECT upper(trim(COALESCE(receipt,''))) AS receipt_key,COUNT(*) AS copies,MIN(kind) AS kind,MIN(amount) AS amount,
 CASE WHEN trim(COALESCE(receipt,''))='' OR COUNT(DISTINCT kind)!=1 OR COUNT(DISTINCT student_id)!=1 OR COUNT(DISTINCT amount)!=1 OR MIN(amount)<=0 OR SUM(CASE WHEN amount IS NULL THEN 1 ELSE 0 END)>0 THEN 1 ELSE 0 END AS conflict
 FROM raw GROUP BY upper(trim(COALESCE(receipt,'')))
)`;
// Reuse the same qualifying attendance definition as finalized teacher statements.
let index=0;
const provisionalLearners=learnersSQL.replace(/\?/g,()=>['g.teacher_id','g.teacher_id','g.starts_at','MIN(g.ends_at,?)'][index++]);
const teacherCTE=`WITH accrued AS (
 SELECT g.teacher_id,g.id,g.rate_cents*(SELECT COUNT(*) FROM (${provisionalLearners})) AS amount_cents
 FROM teacher_pay_agreements g WHERE g.status='accepted' AND g.starts_at<?
 AND NOT EXISTS(SELECT 1 FROM teacher_pay_statements s WHERE s.agreement_id=g.id)
), statement_totals AS (
 SELECT teacher_id,SUM(CASE WHEN paid_at IS NULL THEN amount_cents ELSE 0 END) AS due_cents,SUM(CASE WHEN paid_at IS NOT NULL THEN amount_cents ELSE 0 END) AS paid_cents,COUNT(*) AS statements
 FROM teacher_pay_statements GROUP BY teacher_id
), provisional_totals AS (
 SELECT teacher_id,SUM(amount_cents) AS provisional_cents,COUNT(*) AS unfinalized_periods FROM accrued GROUP BY teacher_id
), teacher_ids AS (SELECT teacher_id FROM statement_totals UNION SELECT teacher_id FROM provisional_totals), teacher_totals AS (
 SELECT u.id,u.name,COALESCE(s.due_cents,0) AS due_cents,COALESCE(s.paid_cents,0) AS paid_cents,COALESCE(p.provisional_cents,0) AS provisional_cents,COALESCE(s.statements,0) AS statements,COALESCE(p.unfinalized_periods,0) AS unfinalized_periods
 FROM teacher_ids t JOIN users u ON u.id=t.teacher_id LEFT JOIN statement_totals s ON s.teacher_id=t.teacher_id LEFT JOIN provisional_totals p ON p.teacher_id=t.teacher_id
)`;
export async function readFinance(db:D1Database,user:User,now=Date.now(),page={offset:0,compact:false}){
 await authorizedUser(db,user,'admin');
 const c=await one(db,collectionCTE+` SELECT COALESCE(SUM(CASE WHEN conflict=0 THEN amount*100 ELSE 0 END),0) AS collectedCents,
 COALESCE(SUM(CASE WHEN conflict=0 AND kind='registration' THEN amount*100 ELSE 0 END),0) AS registrationCents,
 COALESCE(SUM(CASE WHEN conflict=0 AND kind='tuition' THEN amount*100 ELSE 0 END),0) AS tuitionCents,
 COALESCE(SUM(CASE WHEN conflict=0 AND kind='lesson' THEN amount*100 ELSE 0 END),0) AS lessonCents,
 COALESCE(SUM(CASE WHEN conflict=0 AND kind='questions' THEN amount*100 ELSE 0 END),0) AS questionCents,
 COALESCE(SUM(CASE WHEN conflict=0 AND kind='tutorials' THEN amount*100 ELSE 0 END),0) AS tutorialCents,
 COALESCE(SUM(CASE WHEN conflict=0 THEN 1 ELSE 0 END),0) AS verifiedReceipts,
 COALESCE(SUM(CASE WHEN conflict!=0 THEN copies ELSE 0 END),0) AS reconciliationRecords,
 COALESCE(SUM(CASE WHEN conflict=0 THEN copies-1 ELSE 0 END),0) AS duplicateRecordsExcluded FROM grouped`);
 const totals=await one(db,teacherCTE+` SELECT COALESCE(SUM(due_cents),0) AS dueCents,COALESCE(SUM(paid_cents),0) AS paidCents,COALESCE(SUM(provisional_cents),0) AS provisionalCents,COALESCE(SUM(unfinalized_periods),0) AS unfinalizedPeriods,COUNT(*) AS teachers FROM teacher_totals`,now,now);
 const pending=await one(db,`SELECT (SELECT COUNT(*) FROM registration_payments WHERE status='pending')+(SELECT COUNT(*) FROM subscriptions WHERE status='pending')+(SELECT COUNT(*) FROM payments WHERE status='pending')+(SELECT COUNT(*) FROM subject_purchases WHERE status='pending') AS pendingRecords,(SELECT COUNT(*) FROM payment_intents WHERE status='review_required') AS providerReviewRecords`);
 const offset=Number.isSafeInteger(page.offset)&&page.offset>=0?Math.min(100000,page.offset):0;
 const teachers=page.compact?[]:await all(db,teacherCTE+' SELECT * FROM teacher_totals ORDER BY due_cents DESC,provisional_cents DESC,name,id LIMIT 50 OFFSET ?',now,now,offset);
 return {collections:c,teacherPayments:totals,review:pending,teachers,page:{offset,limit:50,total:totals.teachers},afterRecordedTeacherPaymentsCents:c.collectedCents-totals.paidCents,afterFinalizedDuesCents:c.collectedCents-totals.paidCents-totals.dueCents,serverNow:now,currency:'KES'};
}
