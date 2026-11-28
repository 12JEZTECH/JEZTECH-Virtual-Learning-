import {z} from 'zod';
import {AppError,type User} from '../service';
const st=(db:D1Database,sql:string,...v:unknown[])=>db.prepare(sql).bind(...v);
const one=(db:D1Database,sql:string,...v:unknown[])=>st(db,sql,...v).first<any>();
export function hlsPath(path:string){if(!path||path.length>180||!/^[-a-zA-Z0-9_./]+$/.test(path)||path.startsWith('/')||path.split('/').some(p=>!p||p==='.'||p==='..')||!/[.](m3u8|ts|m4s|mp4)$/.test(path))throw new AppError(400,'Use relative HLS playlist and segment file names without traversal or external URLs');return path}
export function hlsType(path:string){return path.endsWith('.m3u8')?'application/vnd.apple.mpegurl':path.endsWith('.ts')?'video/mp2t':'video/mp4'}
/** Only self-contained, unencrypted VOD packages. Every referenced file must be in the package. */
export function rewritePlaylist(text:string,path:string,base:string,known:Set<string>){
 if(text.length>100000||!text.trimStart().startsWith('#EXTM3U'))throw new AppError(400,'Invalid or oversized HLS playlist');
 if(/#EXT-X-(KEY|SESSION-KEY|DEFINE|CONTENT-STEERING|BYTERANGE|PART|PRELOAD-HINT|RENDITION-REPORT)/.test(text))throw new AppError(400,'Upload a self-contained unencrypted VOD package without byte-range or low-latency directives');
 const supported=/^#(?:EXTM3U|EXTINF|EXT-X-(?:VERSION|INDEPENDENT-SEGMENTS|STREAM-INF|MEDIA|TARGETDURATION|MEDIA-SEQUENCE|PLAYLIST-TYPE|ENDLIST|MAP|DISCONTINUITY|DISCONTINUITY-SEQUENCE))(?::|$)/;for(const line of text.split(/\r?\n/).map(s=>s.trim()).filter(s=>s.startsWith('#')))if(!supported.test(line))throw new AppError(400,'Unsupported HLS playlist directive');
 const master=text.includes('#EXT-X-STREAM-INF:');if(!master&&!text.includes('#EXT-X-ENDLIST'))throw new AppError(400,'Only completed on-demand playlists are supported');
 const root=path.includes('/')?path.slice(0,path.lastIndexOf('/')+1):'';
 function resolve(raw:string){const target=hlsPath(root+raw);if(!known.has(target))throw new AppError(400,'HLS package is missing '+target);return base+target}
 return text.split(/\r?\n/).map(line=>{const trim=line.trim();if(!trim)return '';if(trim.startsWith('#'))return trim.replace(/URI="([^"]+)"/g,(_,uri)=>'URI="'+resolve(uri)+'"');return resolve(trim)}).join('\n');
}
async function videoOwner(db:D1Database,u:User,id:string){if(u.disabled||u.role==='student')throw new AppError(403,'Teacher access required');const v=await one(db,'SELECT * FROM learning_videos WHERE id=?',id);if(!v||u.role!=='admin'&&v.teacher_id!==u.id)throw new AppError(403,'Choose your own uploaded learning video');return v}
export async function beginHls(db:D1Database,u:User,videoId:string,now=Date.now()){z.string().uuid().parse(videoId);await videoOwner(db,u,videoId);const pending=await one(db,"SELECT COUNT(*) AS n FROM hls_packages WHERE created_by=? AND status='draft'",u.id);if(pending.n>=5)throw new AppError(409,'Finish or remove an unfinished adaptive-video upload first');const id=crypto.randomUUID();await st(db,'INSERT INTO hls_packages(id,video_id,created_by,created_at) VALUES(?,?,?,?)',id,videoId,u.id,now).run();return {id}}
export async function hlsOwner(db:D1Database,u:User,id:string){const p=await one(db,'SELECT * FROM hls_packages WHERE id=?',id);if(!p)throw new AppError(404,'Adaptive video package not found');await videoOwner(db,u,p.video_id);if(p.status!=='draft')throw new AppError(409,'This package is already published; start a new package to replace it');return p}
export async function uploadHls(db:D1Database,bucket:R2Bucket,u:User,id:string,path:string,body:ReadableStream<Uint8Array>){
 hlsPath(path);await hlsOwner(db,u,id);const count=await one(db,'SELECT COUNT(*) AS n,COALESCE(SUM(size),0) AS bytes FROM hls_assets WHERE package_id=?',id);if(count.n>=400||count.bytes>=150*1024*1024)throw new AppError(413,'Adaptive packages support up to 400 files and 150 MB');
 if(await one(db,'SELECT id FROM hls_assets WHERE package_id=? AND path=?',id,path))throw new AppError(409,'This file is already uploaded');
 const chunks:Uint8Array[]=[],reader=body.getReader();let size=0;try{while(true){const r=await reader.read();if(r.done)break;size+=r.value.byteLength;if(size>(path.endsWith('.m3u8')?100000:5*1024*1024))throw new AppError(413,'Use playlists below 100 KB and segments below 5 MB');chunks.push(r.value)}if(!size)throw new AppError(400,'Empty HLS file');}finally{try{await reader.cancel()}catch{}reader.releaseLock()}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}const key='hls/'+id+'/'+path;await bucket.put(key,bytes,{httpMetadata:{contentType:hlsType(path)}});
 try{await st(db,"INSERT INTO hls_assets(id,package_id,path,content_type,size) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM hls_packages WHERE id=? AND status='draft')",crypto.randomUUID(),id,path,hlsType(path),size,id).run()}catch(e){await bucket.delete(key);throw e}return {ok:true,size};
}
export async function finishHls(db:D1Database,bucket:R2Bucket,u:User,id:string,entry:string){
 const p=await hlsOwner(db,u,id);hlsPath(entry);if(!entry.endsWith('.m3u8'))throw new AppError(400,'Choose the master playlist');
 const assets=(await st(db,'SELECT path,size FROM hls_assets WHERE package_id=?',id).all<{path:string;size:number}>()).results,known=new Set(assets.map(a=>a.path));
 if(!known.has(entry)||!assets.some(a=>!a.path.endsWith('.m3u8')))throw new AppError(400,'Upload playlists and their media segments first');
 if(assets.filter(a=>a.path.endsWith('.m3u8')).length>12||assets.reduce((n,a)=>n+a.size,0)>150*1024*1024)throw new AppError(413,'Package too large');
 const graph=new Map<string,string[]>();
 for(const a of assets.filter(a=>a.path.endsWith('.m3u8'))){const file=await bucket.get('hls/'+id+'/'+a.path);if(!file)throw new AppError(400,'A playlist upload is missing');const rewritten=rewritePlaylist(await file.text(),a.path,'',known);graph.set(a.path,[...rewritten.split('\n').filter(line=>line&&!line.startsWith('#')&&line.endsWith('.m3u8')),...[...rewritten.matchAll(/URI="([^"]+[.]m3u8)"/g)].map(m=>m[1])])}
 const visited=new Set<string>(),visiting=new Set<string>();function visit(path:string){if(visiting.has(path))throw new AppError(400,'Circular HLS playlists are not supported');if(visited.has(path))return;visiting.add(path);for(const next of graph.get(path)||[])visit(next);visiting.delete(path);visited.add(path)}visit(entry);
 await st(db,"UPDATE hls_packages SET entry=?,status='ready' WHERE id=? AND status='draft'",entry,p.id).run();return {ok:true};
}
export async function removeHlsDraft(db:D1Database,bucket:R2Bucket,u:User,id:string){await hlsOwner(db,u,id);const paths=(await st(db,'SELECT path FROM hls_assets WHERE package_id=?',id).all<{path:string}>()).results;for(const a of paths)await bucket.delete('hls/'+id+'/'+a.path);await db.batch([st(db,'DELETE FROM hls_assets WHERE package_id=?',id),st(db,"DELETE FROM hls_packages WHERE id=? AND status='draft'",id)]);return {ok:true}}
