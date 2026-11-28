import {orientationAccess} from '../orientation/access';
import {AppError,type User} from '../service';
import {requirePaidAccess,recordAccessBlock} from '../classroom/access';
export async function authorizeVideo(db:D1Database,u:User,teacherId:string|null,lease:string|null,now=Date.now()){
 if(u.role==='student'){
  await requirePaidAccess(db,u,now,'protected_practical_video');
  if(teacherId&&!await db.prepare("SELECT student_id FROM admissions WHERE student_id=? AND teacher_id=? AND status='approved'").bind(u.id,teacherId).first()){await recordAccessBlock(db,u,'wrong_teaching_group','protected_practical_video',now);throw new AppError(403,'This clip belongs to another learning group')}
  if(await orientationAccess(db,u.id,now))return;
  if(!lease||!await db.prepare('SELECT student_id FROM video_credits WHERE student_id=? AND lease_id=? AND lease_expires>?').bind(u.id,lease,now).first())throw new AppError(402,'Reserve playback credit before watching');
 }else if(teacherId&&u.role!=='admin'&&teacherId!==u.id)throw new AppError(403,'This clip belongs to another teacher');
}
export function videoRange(raw:string|null,size:number){
 if(!raw)return {start:0,end:size-1,partial:false};
 const match=/^bytes=(\d*)-(\d*)$/.exec(raw);if(!match||(!match[1]&&!match[2]))throw new AppError(416,'Invalid byte range');
 const start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));const end=match[1]&&match[2]?Math.min(size-1,Number(match[2])):size-1;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)throw new AppError(416,'Invalid byte range');
 return {start,end,partial:true};
}
