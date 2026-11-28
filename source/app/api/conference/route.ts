import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {initializeUser,AppError} from '../../service';
import {claimConference} from '../../conference/service';
export const dynamic='force-dynamic';
export async function GET(){if(!env.DB)return Response.json({error:"Database unavailable"},{status:503});if(!await getChatGPTUser())return Response.json({error:'Sign in first'},{status:401});return Response.json({teachers:(await env.DB.prepare("SELECT id,name FROM users WHERE role IN ('teacher','admin') AND disabled=0 ORDER BY name").all()).results},{headers:{'Cache-Control':'no-store'}})}
export async function POST(req:Request){try{
 if(req.headers.get('origin')!==new URL(req.url).origin||!req.headers.get('content-type')?.startsWith('application/json'))throw new AppError(403,'Same-origin JSON required');
 if(!env.DB)throw new AppError(503,'Database unavailable');const identity=await getChatGPTUser();if(!identity)throw new AppError(401,'Sign in first');const raw=await req.text();if(raw.length>2000)throw new AppError(413,'Request too large');const b=JSON.parse(raw);
 if(typeof b.code!=='string'||b.code.length>80||typeof b.teacherId!=='string'||typeof b.level!=='string')throw new AppError(400,'Enter a pass and select your teacher and class');
 const u=await initializeUser(env.DB,identity,'jezreelch@gmail.com');return Response.json(await claimConference(env.DB,u,b.code,b.teacherId,b.level),{headers:{'Cache-Control':'no-store'}});
 }catch(e){return Response.json({error:e instanceof AppError?e.message:'Unable to claim this pass. Please retry.'},{status:e instanceof AppError?e.status:400})}}
