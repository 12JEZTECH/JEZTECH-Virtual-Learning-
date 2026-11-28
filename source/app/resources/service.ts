import {z} from 'zod';
import {AppError,type User} from '../service';
import {levelKeySQL} from '../classroom/enrollment';
import {teachingClassAccess} from '../hub/service';
import {resourceFor,officialResources} from './catalog';
const one=(db:D1Database,q:string,...v:unknown[])=>db.prepare(q).bind(...v).first<any>();
const all=async(db:D1Database,q:string,...v:unknown[])=>(await db.prepare(q).bind(...v).all<any>()).results;
export const ResourceAction=z.discriminatedUnion('action',[
 z.object({action:z.literal('share'),classId:z.string().uuid(),sessionId:z.string().uuid(),resourceKey:z.string().min(1).max(160),instructions:z.string().trim().min(5).max(2000)}),
 z.object({action:z.literal('withdraw'),classId:z.string().uuid(),id:z.string().uuid()}),
]);
async function user(db:D1Database,u:User){const row=await one(db,'SELECT * FROM users WHERE id=?',u.id);if(!row||row.disabled)throw new AppError(403,'Account unavailable');return row as User;}
async function access(db:D1Database,u:User,classId:string,now:number){const c=await teachingClassAccess(db,u,classId,now);const s=await one(db,'SELECT * FROM class_sessions WHERE room_id=? ORDER BY opens_at DESC LIMIT 1',c.room_id);if(u.role==='student'){if(await one(db,"SELECT id FROM sessions WHERE student_id=? AND status IN ('active','paused')",u.id))throw new AppError(409,'Resources are unavailable during an assessment');if(!s||s.status!=='live'||s.ends_at<=now||!await one(db,'SELECT id FROM class_attendance WHERE session_id=? AND student_id=? AND left_at IS NULL',s.id,u.id))throw new AppError(409,'Join your live lesson to see teacher-shared resources');}return {c,s};}
export async function readResources(db:D1Database,original:User,classId?:string,offset=0,now=Date.now()){
 const u=await user(db,original);offset=Number.isSafeInteger(offset)&&offset>=0?Math.min(100000,offset):0;
 if(!classId){const v=u.role==='admin'?[]:[u.id];return {user:{role:u.role},classes:await all(db,`SELECT c.id,c.name,c.class_level,c.subject FROM teaching_classes c WHERE ${u.role==='admin'?'1=1':u.role==='teacher'?'c.teacher_id=?':`EXISTS(SELECT 1 FROM admissions a WHERE a.student_id=? AND a.teacher_id=c.teacher_id AND a.status='approved' AND ${levelKeySQL('a.level')}=c.class_level AND NOT EXISTS(SELECT 1 FROM learner_subjects ls WHERE ls.student_id=a.student_id AND ls.class_level=c.class_level AND ls.subject=c.subject AND ls.status='exempt'))`} ORDER BY c.name,c.id LIMIT 50 OFFSET ?`,...v,offset),offset};}
 const {c,s}=await access(db,u,classId,now),resources=s?await all(db,'SELECT * FROM lesson_resources WHERE class_id=? AND session_id=? AND withdrawn_at IS NULL ORDER BY shared_at DESC LIMIT 50',c.id,s.id):[];
 return {user:{role:u.role},classInfo:{id:c.id,name:c.name,level:c.class_level,subject:c.subject},session:s?{id:s.id,status:s.status,endsAt:s.ends_at}:null,resources:resources.map(r=>({...r,resource:resourceFor(r.resource_key,c.class_level,c.subject)})).filter(r=>r.resource),catalog:officialResources.filter(r=>(!r.level||r.level===c.class_level)&&(!r.subject||r.subject===c.subject)),serverNow:now};
}
export async function mutateResource(db:D1Database,original:User,raw:unknown,now=Date.now()){
 const u=await user(db,original);if(u.role==='student')throw new AppError(403,'Only the class teacher can share or withdraw resources');const a=ResourceAction.parse(raw),{c,s}=await access(db,u,a.classId,now);
 if(a.action==='withdraw'){const r=await one(db,'SELECT id FROM lesson_resources WHERE id=? AND class_id=?',a.id,c.id);if(!r)throw new AppError(404,'Resource not found');await db.prepare('UPDATE lesson_resources SET withdrawn_at=? WHERE id=? AND withdrawn_at IS NULL').bind(now,a.id).run();return {ok:true};}
 if(!s||s.id!==a.sessionId||s.status!=='live'||s.ends_at<=now)throw new AppError(409,'Start the selected lesson before sharing a resource');if(!resourceFor(a.resourceKey,c.class_level,c.subject))throw new AppError(400,'Choose an official resource for this class and subject');
 const prior=await one(db,'SELECT id FROM lesson_resources WHERE session_id=? AND resource_key=? AND withdrawn_at IS NULL',s.id,a.resourceKey);if(prior){await db.prepare('UPDATE lesson_resources SET instructions=?,shared_at=? WHERE id=?').bind(a.instructions,now,prior.id).run();return {id:prior.id};}
 if((await one(db,'SELECT COUNT(*) AS n FROM lesson_resources WHERE session_id=? AND withdrawn_at IS NULL',s.id)).n>=50)throw new AppError(409,'Withdraw an older resource before adding more');const id=crypto.randomUUID();await db.prepare('INSERT INTO lesson_resources(id,class_id,session_id,teacher_id,resource_key,instructions,shared_at) VALUES(?,?,?,?,?,?,?)').bind(id,c.id,s.id,u.id,a.resourceKey,a.instructions,now).run();return {id};
}
