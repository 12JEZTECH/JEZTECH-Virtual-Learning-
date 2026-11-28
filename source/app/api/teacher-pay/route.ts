import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {initializeUser,AppError} from '../../service';
import {readTeacherPay,mutateTeacherPay} from '../../teacher-pay/service';
export const dynamic='force-dynamic';
const reply=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function handle(req:Request,write:boolean){try{const identity=await getChatGPTUser();if(!identity)throw new AppError(401,'Sign in first');if(!env.DB)throw new AppError(503,'Database unavailable');const u=await initializeUser(env.DB,identity,'jezreelch@gmail.com');
 if(!write){const p=new URL(req.url).searchParams;return reply(await readTeacherPay(env.DB,u,Number(p.get('offset'))||0,p.get('id')||undefined));}
 if(req.headers.get('origin')!==new URL(req.url).origin||!req.headers.get('content-type')?.startsWith('application/json'))throw new AppError(403,'Same-origin JSON required');if(Number(req.headers.get('content-length'))>14000)throw new AppError(413,'Request too large');const raw=await req.text();if(raw.length>14000)throw new AppError(413,'Request too large');return reply(await mutateTeacherPay(env.DB,u,JSON.parse(raw)));
 }catch(e){return reply({error:e instanceof AppError?e.message:'Teacher payment request could not be completed. Check the details and retry.'},e instanceof AppError?e.status:400)}}
export const GET=(r:Request)=>handle(r,false);export const POST=(r:Request)=>handle(r,true);
