import {registrationContact,validRegistrationPhone} from '../registration/contact';
import {z} from 'zod';
import {AppError,authorizedUser,type User} from '../service';
const st=(db:D1Database,sql:string,...v:unknown[])=>db.prepare(sql).bind(...v);
const one=(db:D1Database,sql:string,...v:unknown[])=>st(db,sql,...v).first<any>();
export const portalPath=(role:string)=>role==='admin'?'/admin':role==='teacher'?'/teacher':'/student';
export const PortalActionSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('reviewTeacherSignup'),id:z.string().uuid(),status:z.enum(['approved','rejected']),note:z.string().trim().max(1000).default('')}),
 z.object({action:z.literal('addTeacher'),fullName:z.string().trim().min(2).max(160),email:z.string().trim().email().max(254),phone:z.string().trim().max(25).default(''),subject:z.string().trim().max(160).default('')}),
 z.object({action:z.literal('editTeacherRegistration'),id:z.string().uuid(),fullName:z.string().trim().min(2).max(160),phone:z.string().trim().max(25).default(''),subject:z.string().trim().max(160).default('')}),
 z.object({action:z.literal('deleteTeacherRegistration'),id:z.string().uuid(),confirmEmail:z.string().trim().email()}),
 z.object({action:z.literal('restoreTeacherRegistration'),id:z.string().uuid()}),
 z.object({action:z.literal('teacherAccountStatus'),id:z.string().uuid(),enabled:z.boolean()}),
]);
export async function readPortalAccounts(db:D1Database,u:User){
 u=await authorizedUser(db,u);
 if(u.role!=='admin')return {teacherAccounts:[],teacherApplications:[]};
 return {teacherApplications:(await st(db,'SELECT a.*,u.email FROM teacher_applications a JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC').all()).results,teacherAccounts:(await st(db,'SELECT t.*,u.disabled AS account_disabled,u.deleted_at AS account_deleted_at FROM teacher_accounts t LEFT JOIN users u ON u.id=t.user_id ORDER BY t.created_at DESC').all()).results};
}
export async function mutatePortal(db:D1Database,u:User,a:z.infer<typeof PortalActionSchema>,now=Date.now()){
 u=await authorizedUser(db,u,'admin');
 if(u.role!=='admin')throw new AppError(403,'Only administrators can add or manage teacher accounts');
 if(a.action==='reviewTeacherSignup'){
 const row=await one(db,'SELECT a.*,u.email,u.role,u.disabled FROM teacher_applications a JOIN users u ON u.id=a.user_id WHERE a.id=?',a.id);
 if(!row)throw new AppError(404,'Application not found');if(row.status!=='pending')throw new AppError(409,'Application already reviewed');
 if(row.role!=='student'||row.disabled)throw new AppError(409,'Account role or availability changed. Review People & access.');
 const actions=[st(db,"UPDATE teacher_applications SET status=?,note=?,reviewed_at=?,reviewed_by=? WHERE id=? AND status='pending'",a.status,a.note,now,u.id,row.id)];
 if(a.status==='approved'){
 if(await one(db,'SELECT id FROM teacher_accounts WHERE email=?',row.email.toLowerCase()))throw new AppError(409,'Teacher is already registered. Manage their account instead.');
 actions.push(st(db,"INSERT INTO teacher_accounts(id,email,full_name,phone,subject,status,user_id,created_by,created_at,activated_at) SELECT ?,?,?,?,?,'active',?,?,?,? WHERE EXISTS(SELECT 1 FROM teacher_applications WHERE id=? AND status='approved' AND reviewed_by=?)",crypto.randomUUID(),row.email.toLowerCase(),row.full_name,row.phone,row.subject,row.user_id,u.id,now,now,row.id,u.id));
 actions.push(st(db,"UPDATE users SET role='teacher',name=? WHERE id=? AND role='student' AND disabled=0 AND EXISTS(SELECT 1 FROM teacher_applications WHERE id=? AND status='approved')",row.full_name,row.user_id,row.id));
 }await db.batch(actions);return {ok:true};
 }
 if(a.action==='addTeacher'){
 const email=a.email.toLowerCase().trim();if(email===u.email.toLowerCase())throw new AppError(409,'Your administrator account is already registered');
 if(await one(db,'SELECT id FROM teacher_accounts WHERE email=?',email))throw new AppError(409,'This teacher is already registered. Manage their access in the list below.');
 const existing=await one(db,'SELECT * FROM users WHERE lower(email)=?',email);if(existing?.role==='admin')throw new AppError(409,'Administrator accounts cannot be changed into teachers');if(existing?.disabled)throw new AppError(409,'This account needs review. Restore or edit and save it under People & access before adding it as a teacher.');
 const id=crypto.randomUUID();const actions=[st(db,'INSERT INTO teacher_accounts(id,email,full_name,phone,subject,status,user_id,created_by,created_at,activated_at) VALUES(?,?,?,?,?,?,?,?,?,?)',id,email,a.fullName,a.phone,a.subject,existing?'active':'pending',existing?.id||null,u.id,now,existing?now:null)];
 if(existing)actions.push(st(db,"UPDATE users SET role='teacher',name=? WHERE id=? AND role!='admin' AND disabled=0",a.fullName,existing.id));
 await db.batch(actions);return {ok:true,id,status:existing?'active':'pending'};
 }
 const row=await one(db,'SELECT * FROM teacher_accounts WHERE id=?',a.id);if(!row)throw new AppError(404,'Teacher account not found');
 if(a.action==='editTeacherRegistration'||a.action==='deleteTeacherRegistration'||a.action==='restoreTeacherRegistration'){
 if(row.user_id)throw new AppError(409,'Manage this signed-in teacher using Edit user or Delete user under People & access.');
 if(a.action==='deleteTeacherRegistration'){if(a.confirmEmail.toLowerCase()!==row.email.toLowerCase())throw new AppError(400,'Type the exact teacher email to confirm deletion');const changed=await st(db,"UPDATE teacher_accounts SET status='deleted' WHERE id=? AND user_id IS NULL",row.id).run();if(!changed.meta.changes)throw new AppError(409,'Account changed; refresh and manage the signed-in user');return {ok:true}}
 if(a.action==='restoreTeacherRegistration'){await st(db,"UPDATE teacher_accounts SET status='pending' WHERE id=? AND user_id IS NULL AND status='deleted'",row.id).run();return {ok:true}}
 if(row.status==='deleted')throw new AppError(409,'Restore this teacher registration before editing');
 const changed=await st(db,"UPDATE teacher_accounts SET full_name=?,phone=?,subject=?,status='pending' WHERE id=? AND user_id IS NULL",a.fullName,a.phone,a.subject,row.id).run();if(!changed.meta.changes)throw new AppError(409,'Account changed; refresh and manage the signed-in user');return {ok:true};
 }
 if(row.status==='deleted')throw new AppError(409,'Restore this teacher registration before changing it');
 if(row.user_id){const linked=await one(db,'SELECT role,deleted_at FROM users WHERE id=?',row.user_id);if(linked?.deleted_at)throw new AppError(409,'Restore this deleted account under People & access first');if(linked?.role==='admin')throw new AppError(409,'Administrator accounts are protected')}
 const actions=[st(db,'UPDATE teacher_accounts SET status=? WHERE id=?',a.enabled?(row.user_id?'active':'pending'):'revoked',row.id)];
 if(row.user_id)actions.push(st(db,"UPDATE users SET disabled=?,role=? WHERE id=? AND role!='admin'",a.enabled?0:1,a.enabled?'teacher':'student',row.user_id));
 await db.batch(actions);return {ok:true};
}

export const TeacherSignup=z.object({fullName:z.string().trim().min(2).max(160),contactMethod:z.enum(['email','phone']).default('phone'),phone:z.string().trim().max(25).default(''),subject:z.string().trim().min(2).max(160),experience:z.string().trim().max(1000).default('')}).refine(a=>a.contactMethod==='email'||validRegistrationPhone(a.phone),{message:'Choose email contact or enter a valid Kenyan mobile number',path:['phone']});
export async function teacherSignupState(db:D1Database,u:User){return {user:u,application:await one(db,'SELECT * FROM teacher_applications WHERE user_id=?',u.id)}}
export async function requestTeacherSignup(db:D1Database,u:User,input:z.infer<typeof TeacherSignup>,now=Date.now()){
 if(u.role!=='student'||u.disabled)throw new AppError(403,'Use your assigned dashboard or contact the administrator');
 const a=TeacherSignup.parse(input),contact=registrationContact(a.contactMethod,a.phone,u.email);const existing=await one(db,'SELECT id,status FROM teacher_applications WHERE user_id=?',u.id);
 if(existing)throw new AppError(409,'An application already exists. Check its decision below or contact the administrator.');
 await st(db,"INSERT INTO teacher_applications(id,user_id,full_name,phone,contact_method,subject,experience,status,created_at) VALUES(?,?,?,?,?,?,?,'pending',?)",crypto.randomUUID(),u.id,a.fullName,contact.phone,contact.method,a.subject,a.experience,now).run();return {ok:true};
}
