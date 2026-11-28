import {relaySettings,type RelayConfig} from '../../classroom/relay';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {initializeUser,AppError} from '../../service';
import {conferenceState,mutateConference} from '../../live/conference-service';
export const dynamic='force-dynamic';
async function handle(req:Request,write:boolean){try{const identity=await getChatGPTUser();if(!identity||!env.DB)throw new AppError(401,'Sign in first');const u=await initializeUser(env.DB,identity,'jezreelch@gmail.com');let data;
 if(write){if(req.headers.get('origin')!==new URL(req.url).origin||!req.headers.get('content-type')?.startsWith('application/json'))throw new AppError(403,'Same-origin JSON required');const text=await req.text();if(text.length>35000)throw new AppError(413,'Signal too large');data=await mutateConference(env.DB,u,JSON.parse(text));}
 else {const q=new URL(req.url).searchParams;data=await conferenceState(env.DB,u,q.get('class')||'',q.get('session')||'',q.get('peer')||'',Number(q.get('after')||0));}
 return Response.json({...data,...await relaySettings(env as unknown as RelayConfig,u.id,(data as {endsAt?:number}).endsAt)},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return Response.json({error:e instanceof AppError?e.message:'Invalid live media request'},{status:e instanceof AppError?e.status:400,headers:{'Cache-Control':'no-store'}})}}
export async function GET(req:Request){return handle(req,false)}
export async function POST(req:Request){return handle(req,true)}
