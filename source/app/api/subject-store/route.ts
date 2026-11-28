import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {getChatGPTUser} from '../../chatgpt-auth';
import {initializeUser,AppError} from '../../service';
import {readStore,mutateStore} from '../../subject-store/service';
export const dynamic='force-dynamic';
async function handle(req:Request,write:boolean){try{const identity=await getChatGPTUser();if(!identity)throw new AppError(401,'Sign in required');if(!env.DB)throw new AppError(503,'Database unavailable');const u=await initializeUser(env.DB,identity,'jezreelch@gmail.com');let data;if(write){if(req.headers.get('origin')!==new URL(req.url).origin)throw new AppError(403,'Same-site requests required');if(!req.headers.get('content-type')?.startsWith('application/json'))throw new AppError(415,'JSON required');const raw=await req.text();if(raw.length>100000)throw new AppError(413,'Request too large');data=await mutateStore(env.DB,u,JSON.parse(raw));}else{const q=new URL(req.url).searchParams;data=await readStore(env.DB,u,q.get('level')||'grade-7',q.get('subject')||'mathematics',q.get('set')||undefined,Number(q.get('offset')||0));}return Response.json(data,{headers:{'Cache-Control':'private, no-store'}});}catch(e){return Response.json({error:e instanceof AppError?e.message:e instanceof z.ZodError?'Check all required fields':'Unable to process subject access'},{status:e instanceof AppError?e.status:e instanceof z.ZodError||e instanceof SyntaxError?400:500,headers:{'Cache-Control':'private, no-store'}});}}
export async function GET(req:Request){return handle(req,false)}
export async function POST(req:Request){return handle(req,true)}
