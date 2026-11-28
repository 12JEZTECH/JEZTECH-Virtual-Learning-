import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {initializeAdmissionUser,AppError} from '../../service';
import {admissionState,EngagementSchema,mutateEngagement} from '../../engagement/service';
export const dynamic='force-dynamic';
async function handle(req:Request,write:boolean){try{
 const identity=await getChatGPTUser();if(!identity)throw new AppError(401,'Sign in with ChatGPT to apply');if(!env.DB)throw new AppError(503,'Database unavailable');const u=await initializeAdmissionUser(env.DB,identity,'jezreelch@gmail.com');
 if(!write)return Response.json(await admissionState(env.DB,u),{headers:{'Cache-Control':'no-store'}});
 if(req.headers.get('origin')!==new URL(req.url).origin||!req.headers.get('content-type')?.startsWith('application/json'))throw new AppError(403,'Same-origin JSON is required');
 const raw=await req.text();if(raw.length>8000)throw new AppError(413,'Request too large');const a=EngagementSchema.parse(JSON.parse(raw));if(a.action!=='requestAdmission')throw new AppError(403,'Only admission requests are accepted here');return Response.json(await mutateEngagement(env.DB,u,a),{headers:{'Cache-Control':'no-store'}});
}catch(e){return Response.json({error:e instanceof AppError?e.message:'Could not process this admission request'},{status:e instanceof AppError?e.status:400,headers:{'Cache-Control':'no-store'}})}}
export async function GET(req:Request){return handle(req,false)}
export async function POST(req:Request){return handle(req,true)}
