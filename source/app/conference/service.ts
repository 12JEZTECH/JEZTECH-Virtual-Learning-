import {AppError,requireStudentRegistration,type User} from '../service';
export async function conferenceHash(code:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code.trim().toUpperCase())))).map(b=>b.toString(16).padStart(2,'0')).join('')}
export async function claimConference(db:D1Database,u:User,code:string,_teacherId:string,_level:string,now=Date.now()){
 if(u.role!=='student'||u.disabled)throw new AppError(403,'An enabled student account is required');
 const registration=await requireStudentRegistration(db,u);u=registration.user;if(!registration.admission)throw new AppError(403,'Student registration required');
 const prior=await db.prepare('SELECT expires_at FROM conference_passes WHERE student_id=?').bind(u.id).first<{expires_at:number}>();
 const hash=await conferenceHash(code);
 const pass=await db.prepare('SELECT * FROM conference_passes WHERE code_hash=?').bind(hash).first<any>();
 if(!pass||pass.redeem_by<=now||(pass.student_id&&pass.student_id!==u.id))throw new AppError(403,'This pass is unavailable or its redemption window has ended');
 if(prior){if(pass.student_id===u.id&&prior.expires_at>now)return {expiresAt:prior.expires_at};throw new AppError(403,'This account has already used its conference access')}
 const expiresAt=now+30*60*1000;
 await db.batch([
 db.prepare('UPDATE conference_passes SET student_id=?,claimed_at=?,expires_at=? WHERE code_hash=? AND student_id IS NULL AND redeem_by>?').bind(u.id,now,expiresAt,hash,now),
 db.prepare(`INSERT INTO video_credits(student_id,allowance,used,granted_at) SELECT ?,1800,0,? WHERE EXISTS(SELECT 1 FROM conference_passes WHERE code_hash=? AND student_id=?) ON CONFLICT(student_id) DO NOTHING`).bind(u.id,now,hash,u.id),
 ]);
 const saved=await db.prepare('SELECT expires_at FROM conference_passes WHERE code_hash=? AND student_id=?').bind(hash,u.id).first<{expires_at:number}>();
 if(!saved)throw new AppError(409,'This pass was just claimed by another student');return {expiresAt:saved.expires_at};
}
