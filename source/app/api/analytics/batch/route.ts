import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
import {initializeUser,AppError} from '../../../service';
import {ingestTelemetry} from '../../../live/service';
export const dynamic='force-dynamic';
export async function POST(req:Request){try{if(req.headers.get('origin')!==new URL(req.url).origin||!req.headers.get('content-type')?.startsWith('application/json'))throw new AppError(403,'Same-origin JSON required');const identity=await getChatGPTUser();if(!identity||!env.DB)throw new AppError(401,'Sign in first');const raw=await req.text();if(raw.length>20000)throw new AppError(413,'Batch too large');const u=await initializeUser(env.DB,identity,'jezreelch@gmail.com');return Response.json({...await ingestTelemetry(env.DB,u,JSON.parse(raw)),userId:u.id},{headers:{'Cache-Control':'no-store'}})}catch(e){return Response.json({error:e instanceof AppError?e.message:'Invalid analytics batch'},{status:e instanceof AppError?e.status:400})}}

export async function GET(){try{const identity=await getChatGPTUser();if(!identity||!env.DB)throw new AppError(401,'Sign in first');const u=await initializeUser(env.DB,identity,'jezreelch@gmail.com');if(u.disabled)throw new AppError(403,'Account unavailable');return Response.json({userId:u.id},{headers:{'Cache-Control':'no-store'}})}catch(e){return Response.json({error:e instanceof AppError?e.message:'Identity unavailable'},{status:e instanceof AppError?e.status:500,headers:{'Cache-Control':'no-store'}})}}
