import {ChatAction,mutateChat,readChat} from '../../chat/service';
import {AssignmentAction,mutateAssignment,readAssignments} from '../../assignments/service';
import {ClipAction,updateClip} from '../../virtual-lab/clips-service';
import { env } from 'cloudflare:workers';
import {z} from 'zod';
import {refreshAccess,requirePaidAccess,readAccessAlerts,recordAccessBlock} from '../../classroom/access';
import {VirtualAction,mutateVirtual,readVirtual} from '../../virtual-lab/service';
import {PortalActionSchema,readPortalAccounts,mutatePortal} from '../../portals/service';
import {EngagementSchema,mutateEngagement,readEngagement,admissionState,requireAdmitted,initializePolicy} from '../../engagement/service';
import {LabActionSchema,mutateFeature,readFeatures} from '../../lab/service';
import { getChatGPTUser } from '../../chatgpt-auth';
import { ActionSchema, AppError, initializeUser, mutate, readState } from '../../service';
export const dynamic='force-dynamic';
const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function handle(req:Request,write:boolean){
 try{
  const identity=await getChatGPTUser();if(!identity)throw new AppError(401,'Please sign in with ChatGPT');
  if(write){
   if(req.headers.get('origin')!==new URL(req.url).origin)throw new AppError(403,'Requests must come from this site');
   if(!req.headers.get('content-type')?.startsWith('application/json'))throw new AppError(415,'JSON body required');
   const length=Number(req.headers.get('content-length')||0);if(length>150000)throw new AppError(413,'Request too large');
  }
  if(!env.DB)throw new AppError(503,'Shared database is unavailable');
  const user=await initializeUser(env.DB,identity,'jezreelch@gmail.com');
  await initializePolicy(env.DB);
  const intake=await admissionState(env.DB,user);
  if(!write&&user.role==='student'&&(intake.registrationIncomplete||intake.admission?.status!=='approved'))return response({...intake,admissionRequired:true});
  await requireAdmitted(env.DB,user);
  const learnerAccess=user.role==='student'?await refreshAccess(env.DB,user.id):null;
  if(!write&&user.role==='student'&&(!learnerAccess||learnerAccess.expires_at<=Date.now())){await recordAccessBlock(env.DB,user,'subscription_inactive','workspace');try{await requirePaidAccess(env.DB,user)}catch(e){if(!(e instanceof AppError)||e.status!==402)throw e}return response({user,paymentRequired:true,learnerAccess})}
  await requirePaidAccess(env.DB,user);
  if(!write)return response({accessAlerts:await readAccessAlerts(env.DB,user),...await readState(env.DB,user),...await readFeatures(env.DB,user),...await readEngagement(env.DB,user),...await readPortalAccounts(env.DB,user),...await readVirtual(env.DB,user),...await readAssignments(env.DB,user),...await readChat(env.DB,user),learnerAccess});
  const raw=await req.text();if(raw.length>150000)throw new AppError(413,'Request too large');
  let body;try{body=JSON.parse(raw)}catch{throw new AppError(400,'Invalid JSON')}
  const parsed=z.union([ActionSchema,LabActionSchema,EngagementSchema,PortalActionSchema,VirtualAction,ClipAction,AssignmentAction,ChatAction]).safeParse(body);if(!parsed.success)throw new AppError(400,parsed.error.issues.map(i=>i.path.join('.')+': '+i.message).join('; '));
  const chat=ChatAction.safeParse(parsed.data);if(chat.success)return response(await mutateChat(env.DB,user,chat.data));
  const assignment=AssignmentAction.safeParse(parsed.data);if(assignment.success)return response(await mutateAssignment(env.DB,user,assignment.data));
  const clip=ClipAction.safeParse(parsed.data);if(clip.success)return response(await updateClip(env.DB,user,clip.data));
  const virtual=VirtualAction.safeParse(parsed.data);if(virtual.success)return response(await mutateVirtual(env.DB,user,virtual.data));
  const base=ActionSchema.safeParse(parsed.data);
  if(base.success)return response(await mutate(env.DB,user,base.data));
  const portal=PortalActionSchema.safeParse(parsed.data);if(portal.success)return response(await mutatePortal(env.DB,user,portal.data));
  const feature=LabActionSchema.safeParse(parsed.data);
  return response(feature.success?await mutateFeature(env.DB,user,feature.data):await mutateEngagement(env.DB,user,EngagementSchema.parse(parsed.data)));
 }catch(err){if(err instanceof AppError)return response({error:err.message},err.status);console.error('Workspace operation failed',err);return response({error:'The request could not be completed. Please retry.'},500)}
}
export async function GET(req:Request){return handle(req,false)}
export async function POST(req:Request){return handle(req,true)}
