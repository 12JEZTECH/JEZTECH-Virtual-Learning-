import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {initializeUser,AppError} from '../../service';
import {studentSubjects,setStudentSubject} from '../../student/subjects-service';
export const dynamic='force-dynamic';
async function handle(req:Request,write:boolean){try{const identity=await getChatGPTUser();if(!identity||!env.DB)throw new AppError(401,'Sign in first');const u=await initializeUser(env.DB,identity,'jezreelch@gmail.com');let data;
 if(write){if(req.headers.get('origin')!==new URL(req.url).origin||!req.headers.get('content-type')?.startsWith('application/json'))throw new AppError(403,'Same-origin JSON required');const raw=await req.text();if(raw.length>3000)throw new AppError(413,'Request too large');data=await setStudentSubject(env.DB,u,JSON.parse(raw));}else data=await studentSubjects(env.DB,u,new URL(req.url).searchParams.get('student')||u.id);
 return Response.json(data,{headers:{'Cache-Control':'no-store'}});
 }catch(e){return Response.json({error:e instanceof AppError?e.message:'Subject request failed'},{status:e instanceof AppError?e.status:400,headers:{'Cache-Control':'no-store'}})}}
export async function GET(r:Request){return handle(r,false)}
export async function POST(r:Request){return handle(r,true)}
