import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
import {initializeUser,AppError} from '../../../service';
import {readB2B,submitB2B} from '../../../payments/b2b/service';
export const dynamic='force-dynamic';
async function handle(req:Request,write:boolean){try{const identity=await getChatGPTUser();if(!identity)throw new AppError(401,'Verified sign-in required');if(!env.DB)throw new AppError(503,'Database unavailable');const u=await initializeUser(env.DB,identity,'jezreelch@gmail.com');if(!write)return Response.json(await readB2B(env.DB,u,env),{headers:{'Cache-Control':'no-store'}});if(req.headers.get('origin')!==new URL(req.url).origin||!req.headers.get('content-type')?.startsWith('application/json'))throw new AppError(403,'Same-origin JSON required');const raw=await req.text();if(raw.length>3000)throw new AppError(413,'Request too large');return Response.json(await submitB2B(env.DB,u,JSON.parse(raw),env),{headers:{'Cache-Control':'no-store'}})}catch(e){return Response.json({error:e instanceof AppError?e.message:'B2B request could not be processed'},{status:e instanceof AppError?e.status:400,headers:{'Cache-Control':'no-store'}})}}
export async function GET(req:Request){return handle(req,false)}
export async function POST(req:Request){return handle(req,true)}
