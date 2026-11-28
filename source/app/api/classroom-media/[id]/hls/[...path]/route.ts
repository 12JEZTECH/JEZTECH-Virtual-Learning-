import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../../../chatgpt-auth';
import {initializeUser,AppError} from '../../../../../service';
import {authorizeSharedMedia} from '../../../../../live/service';
import {hlsPath,hlsType,rewritePlaylist} from '../../../../../live/hls-service';
export const dynamic='force-dynamic';
export async function GET(req:Request,{params}:{params:Promise<{id:string;path:string[]}>}){try{const identity=await getChatGPTUser();if(!identity||!env.DB)throw new AppError(401,'Sign in first');if(!env.BUCKET)throw new AppError(503,'Media storage unavailable');const {id,path}=await params,u=await initializeUser(env.DB,identity,'jezreelch@gmail.com'),p=await authorizeSharedMedia(env.DB,u,id),[packageId,...parts]=path,file=hlsPath(parts.join('/'));
 const pack=await env.DB.prepare("SELECT id FROM hls_packages WHERE id=? AND video_id=? AND status='ready'").bind(packageId,p.clip_id).first();if(!pack)throw new AppError(403,'This adaptive package is not part of your reserved clip');
 const asset=await env.DB.prepare('SELECT size FROM hls_assets WHERE package_id=? AND path=?').bind(packageId,file).first();if(!asset)throw new AppError(404,'Media segment missing');const object=await env.BUCKET.get('hls/'+packageId+'/'+file);if(!object)throw new AppError(404,'Media unavailable');
 const headers={'Content-Type':hlsType(file),'Cache-Control':'private, no-store','X-Clip-Expires':String(p.expires_at),'X-Clip-User':u.id,'X-Content-Type-Options':'nosniff'};if(file.endsWith('.m3u8')){const paths=(await env.DB.prepare('SELECT path FROM hls_assets WHERE package_id=?').bind(packageId).all<{path:string}>()).results;const text=rewritePlaylist(await object.text(),file,'/api/classroom-media/'+id+'/hls/'+packageId+'/',new Set(paths.map(a=>a.path)));return new Response(text,{headers:{...headers,'Content-Length':String(new TextEncoder().encode(text).byteLength)}})}
 return new Response(object.body,{headers:{...headers,'Content-Length':String(object.size)}});
 }catch(e){return Response.json({error:e instanceof AppError?e.message:'Adaptive media unavailable'},{status:e instanceof AppError?e.status:400,headers:{'Cache-Control':'private, no-store'}})}}
