import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {removeScaleParticipant,type ScaleConfig} from '../../live/scale-service';
import {getChatGPTUser} from '../../chatgpt-auth';
import {initializeUser,AppError} from '../../service';
import {accessState,verifyLoginId} from '../../classroom/access';
import {EngagementSchema,mutateEngagement,initializePolicy} from '../../engagement/service';
export const dynamic='force-dynamic';
async function handle(req:Request,write:boolean){try{const identity=await getChatGPTUser();if(!identity||!env.DB)throw new AppError(401,'Verified sign-in required');const u=await initializeUser(env.DB,identity,'jezreelch@gmail.com');await initializePolicy(env.DB);if(!write){const rooms=u.role==='student'?(await env.DB.prepare("SELECT a.session_id FROM class_attendance a JOIN sfu_rooms r ON r.session_id=a.session_id WHERE a.student_id=? AND a.left_at IS NULL AND r.status='active' LIMIT 20").bind(u.id).all<{session_id:string}>()).results:[];const state=await accessState(env.DB,u);if(u.role==='student'&&!state.active&&rooms.length)await Promise.allSettled(rooms.map(r=>removeScaleParticipant(env.DB!,env as unknown as ScaleConfig,r.session_id,u.id)));return Response.json(state,{headers:{'Cache-Control':'no-store'}});}
 if(req.headers.get('origin')!==new URL(req.url).origin||!req.headers.get('content-type')?.startsWith('application/json'))throw new AppError(403,'Same-origin JSON is required');const raw=await req.text();if(raw.length>5000)throw new AppError(413,'Request too large');const body=JSON.parse(raw);
 if(body.action==='loginId'){const p=z.object({loginId:z.string().min(4).max(40)}).parse(body);return Response.json(await verifyLoginId(env.DB,u,p.loginId),{headers:{'Cache-Control':'no-store'}})}
 const a=EngagementSchema.parse(body);if(a.action!=='claimSubscription')throw new AppError(403,'Only subscription receipts are accepted here');return Response.json(await mutateEngagement(env.DB,u,a),{headers:{'Cache-Control':'no-store'}});
 }catch(e){return Response.json({error:e instanceof AppError?e.message:'Access request could not be completed'},{status:e instanceof AppError?e.status:400,headers:{'Cache-Control':'no-store'}})}}
export async function GET(req:Request){return handle(req,false)}
export async function POST(req:Request){return handle(req,true)}
