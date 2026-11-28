import {z} from 'zod';
import {AppError,authorizedUser,type User} from '../service';
const st=(db:D1Database,sql:string,...values:unknown[])=>db.prepare(sql).bind(...values);
const eligible="SELECT u.id FROM users u JOIN admissions a ON a.student_id=u.id WHERE u.role='student' AND u.disabled=0 AND u.deleted_at IS NULL AND a.status='approved' AND NOT (a.goals='Conference system testing' AND a.note='Conference pass admission')";
export const TimedAccessAction=z.discriminatedUnion('action',[
 z.object({action:z.literal('unlock'),id:z.string().uuid(),hours:z.number().int().min(1).max(720),note:z.string().trim().min(5).max(500),confirmed:z.literal(true)}),
 z.object({action:z.literal('revoke'),id:z.string().uuid(),confirmed:z.literal(true)}),
]);
export async function readTimedAccess(db:D1Database,user:User,now=Date.now()){
 await authorizedUser(db,user,'admin');return {eligible:(await st(db,`SELECT COUNT(*) AS total FROM (${eligible})`).first<{total:number}>())?.total||0,windows:(await st(db,`SELECT w.*,u.name AS created_by_name,COUNT(m.student_id) AS learners FROM timed_access_windows w JOIN users u ON u.id=w.created_by LEFT JOIN timed_access_members m ON m.window_id=w.id GROUP BY w.id ORDER BY w.created_at DESC,w.id DESC LIMIT 50`).all()).results,serverNow:now};
}
export async function mutateTimedAccess(db:D1Database,user:User,input:unknown,now=Date.now()){
 const u=await authorizedUser(db,user,'admin'),parsed=TimedAccessAction.safeParse(input);if(!parsed.success)throw new AppError(400,'Choose 1–720 hours, provide a reason and confirm the registered learner group');const a=parsed.data;
 if(a.action==='revoke'){const row=await st(db,'SELECT id FROM timed_access_windows WHERE id=?',a.id).first();if(!row)throw new AppError(404,'Temporary access window not found');await st(db,'UPDATE timed_access_windows SET revoked_at=?,revoked_by=? WHERE id=? AND revoked_at IS NULL',now,u.id,a.id).run();return {ok:true};}
 const prior=await st(db,'SELECT * FROM timed_access_windows WHERE id=?',a.id).first<any>();if(prior){if(prior.created_by!==u.id||prior.hours!==a.hours||prior.note!==a.note)throw new AppError(409,'This request ID belongs to a different access window');return {ok:true,id:prior.id,expiresAt:prior.expires_at};}
 if(!(await st(db,`SELECT id FROM (${eligible}) LIMIT 1`).first()))throw new AppError(409,'No approved registered students are available to unlock');
 const until=now+a.hours*3600000;
 await db.batch([
 st(db,'INSERT INTO timed_access_windows(id,created_by,created_at,expires_at,hours,note) VALUES(?,?,?,?,?,?)',a.id,u.id,now,until,a.hours,a.note),
 st(db,`INSERT INTO timed_access_members(window_id,student_id) SELECT ?,id FROM (${eligible})`,a.id),
 ]);
 return {ok:true,id:a.id,expiresAt:until};
}
