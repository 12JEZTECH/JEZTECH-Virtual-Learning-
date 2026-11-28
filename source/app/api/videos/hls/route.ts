import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
import {initializeUser,AppError} from '../../../service';
import {beginHls,uploadHls,finishHls,removeHlsDraft} from '../../../live/hls-service';
export const dynamic='force-dynamic';
export async function POST(req:Request){try{if(req.headers.get('origin')!==new URL(req.url).origin)throw new AppError(403,'Same-origin request required');const identity=await getChatGPTUser();if(!identity||!env.DB)throw new AppError(401,'Sign in first');if(!env.BUCKET)throw new AppError(503,'Media storage unavailable');const u=await initializeUser(env.DB,identity,'jezreelch@gmail.com');let d;
 if(req.headers.get('content-type')?.startsWith('application/json')){const raw=await req.text();if(raw.length>2000)throw new AppError(413,'Request too large');const a=JSON.parse(raw);if(a.action==='begin')d=await beginHls(env.DB,u,a.videoId);else if(a.action==='finish')d=await finishHls(env.DB,env.BUCKET,u,a.id,a.entry);else if(a.action==='removeDraft')d=await removeHlsDraft(env.DB,env.BUCKET,u,a.id);else throw new AppError(400,'Unknown adaptive upload action');}
 else {if(!req.body)throw new AppError(400,'Upload body required');if(Number(req.headers.get('content-length')||0)>5*1024*1024)throw new AppError(413,'Segment too large');d=await uploadHls(env.DB,env.BUCKET,u,req.headers.get('X-HLS-Package')||'',req.headers.get('X-HLS-Path')||'',req.body)}return Response.json(d,{headers:{'Cache-Control':'no-store'}});
 }catch(e){return Response.json({error:e instanceof AppError?e.message:'Adaptive video upload failed'},{status:e instanceof AppError?e.status:400,headers:{'Cache-Control':'no-store'}})}}
