import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {AppError,initializeUser} from '../../service';
import {readTimedAccess,mutateTimedAccess} from '../../timed-access/service';
export const dynamic='force-dynamic';
async function handle(req:Request,write:boolean){try{const identity=await getChatGPTUser();if(!identity)throw new AppError(401,'Sign in required');if(!env.DB)throw new AppError(503,'Database unavailable');const u=await initializeUser(env.DB,identity,'jezreelch@gmail.com');if(write){if(req.headers.get('origin')!==new URL(req.url).origin||!req.headers.get('content-type')?.startsWith('application/json'))throw new AppError(403,'Same-origin JSON required');const raw=await req.text();if(raw.length>4000)throw new AppError(413,'Request too large');return Response.json(await mutateTimedAccess(env.DB,u,JSON.parse(raw)),{headers:{'Cache-Control':'no-store'}})}return Response.json(await readTimedAccess(env.DB,u),{headers:{'Cache-Control':'no-store'}})}catch(e){return Response.json({error:e instanceof AppError?e.message:'Temporary access request could not be completed'},{status:e instanceof AppError?e.status:400,headers:{'Cache-Control':'no-store'}})}}
export async function GET(req:Request){return handle(req,false)}
export async function POST(req:Request){return handle(req,true)}
