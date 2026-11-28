import {requireTutorialVideo} from '../../../subject-store/access';
import {authorizeVideo,videoRange} from '../../../virtual-lab/video-access';
import {generatedVideo} from '../../../virtual-lab/generated/assets';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
import {initializeUser,AppError} from '../../../service';
export const dynamic='force-dynamic';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){try{
 const identity=await getChatGPTUser();if(!identity||!env.DB)throw new AppError(401,'Sign in required');const u=await initializeUser(env.DB,identity,'jezreelch@gmail.com');const {id}=await params;const lease=new URL(req.url).searchParams.get('lease');
 if(id.startsWith('ai-')){
  // Authorize before decoding or returning any generated media bytes.
  await authorizeVideo(env.DB,u,null,lease);const bytes=generatedVideo(id);if(!bytes)throw new AppError(404,'Video not found');let range;try{range=videoRange(req.headers.get('range'),bytes.length)}catch(e){if(e instanceof AppError&&e.status===416)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${bytes.length}`,'Cache-Control':'private, no-store'}});throw e}
  return new Response(bytes.slice(range.start,range.end+1),{status:range.partial?206:200,headers:{'Content-Type':'video/mp4','Accept-Ranges':'bytes',...(range.partial?{'Content-Range':`bytes ${range.start}-${range.end}/${bytes.length}`}:{ }),'Content-Length':String(range.end-range.start+1),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }
 if(!env.BUCKET)throw new AppError(503,'Video storage unavailable');const v=await env.DB.prepare('SELECT * FROM learning_videos WHERE id=?').bind(id).first<any>();if(!v)throw new AppError(404,'Video not found');await requireTutorialVideo(env.DB,u,id);await authorizeVideo(env.DB,u,v.teacher_id,lease);
 const key=v.url.slice(3),meta=await env.BUCKET.head(key);if(!meta)throw new AppError(404,'Video file unavailable');const raw=req.headers.get('range'),match=raw?.match(/^bytes=(\d+)-(\d*)$/);const start=match?Number(match[1]):0;if(start>=meta.size)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${meta.size}`}});const end=Math.min(meta.size-1,start+1024*1024-1,match?.[2]?Number(match[2]):Infinity);if(end<start)throw new AppError(416,'Invalid byte range');const obj=await env.BUCKET.get(key,{range:{offset:start,length:end-start+1}});if(!obj)throw new AppError(404,'Video unavailable');return new Response(obj.body,{status:206,headers:{'Content-Type':meta.httpMetadata?.contentType||'video/mp4','Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${meta.size}`,'Content-Length':String(end-start+1),'Cache-Control':'private, no-store'}});
}catch(e){return Response.json({error:e instanceof AppError?e.message:'Video unavailable'},{status:e instanceof AppError?e.status:500})}}
