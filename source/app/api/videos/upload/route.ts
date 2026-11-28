import {storeClip} from '../../../virtual-lab/clip-storage';
import {ClipMetadata} from '../../../virtual-lab/clips-service';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
import {initializeUser,AppError} from '../../../service';
export const dynamic='force-dynamic';
export async function POST(req:Request){try{
 const identity=await getChatGPTUser();if(!identity||!env.DB)throw new AppError(401,'Sign in required');const user=await initializeUser(env.DB,identity,'jezreelch@gmail.com');if(user.role==='student')throw new AppError(403,'Teacher access required');
 if(req.headers.get('origin')!==new URL(req.url).origin)throw new AppError(403,'Same-origin request required');if(!env.BUCKET)throw new AppError(503,'Video storage unavailable');
 const type=req.headers.get('content-type');if(!['video/mp4','video/webm'].includes(type||''))throw new AppError(415,'Upload an MP4 or WebM video');const title=decodeURIComponent(req.headers.get('X-Video-Title')||'').trim();if(!title||title.length>160)throw new AppError(400,'Video title is required');const metadata=ClipMetadata.safeParse({title,experiment:req.headers.get('X-Video-Experiment')||'general'});if(!metadata.success)throw new AppError(400,'Choose a valid practical topic and title');if(!req.body)throw new AppError(400,'Video file is required');
 const size=Number(req.headers.get('content-length')||0);if(size>50*1024*1024)throw new AppError(413,'Video must be at most 50 MB');
 const id=crypto.randomUUID(),key='learning/'+id;await storeClip(env.BUCKET,key,req.body,type!);
 try{await env.DB.prepare('INSERT INTO learning_videos(id,teacher_id,title,url,experiment,explanation,created_at) VALUES(?,?,?,?,?,?,?)').bind(id,user.id,metadata.data.title,'r2:'+key,metadata.data.experiment,'',Date.now()).run()}catch(e){await env.BUCKET.delete(key);throw e}
 return Response.json({id},{headers:{'Cache-Control':'no-store'}});
}catch(e){return Response.json({error:e instanceof AppError?e.message:'Video upload failed'},{status:e instanceof AppError?e.status:500})}}
