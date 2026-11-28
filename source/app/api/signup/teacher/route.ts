import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
import {initializeUser,AppError} from '../../../service';
import {TeacherSignup,requestTeacherSignup,teacherSignupState} from '../../../portals/service';
export const dynamic='force-dynamic';
async function handle(req:Request,write:boolean){try{
 const identity=await getChatGPTUser();if(!identity)throw new AppError(401,'Sign in to register');if(!env.DB)throw new AppError(503,'Database unavailable');
 const user=await initializeUser(env.DB,identity,'jezreelch@gmail.com');
 if(!write)return Response.json(await teacherSignupState(env.DB,user),{headers:{'Cache-Control':'no-store'}});
 if(req.headers.get('origin')!==new URL(req.url).origin||!req.headers.get('content-type')?.startsWith('application/json'))throw new AppError(403,'Same-origin JSON required');
 const raw=await req.text();if(raw.length>8000)throw new AppError(413,'Request too large');return Response.json(await requestTeacherSignup(env.DB,user,TeacherSignup.parse(JSON.parse(raw))));
 }catch(e){return Response.json({error:e instanceof AppError?e.message:'Please check your registration details and retry'},{status:e instanceof AppError?e.status:400,headers:{'Cache-Control':'no-store'}})}}
export async function GET(r:Request){return handle(r,false)}
export async function POST(r:Request){return handle(r,true)}
