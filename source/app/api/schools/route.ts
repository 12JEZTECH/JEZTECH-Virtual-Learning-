import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {initializeUser,AppError} from '../../service';
import {readSchools,mutateSchool} from '../../schools/service';
export const dynamic='force-dynamic';
async function handle(req:Request,write:boolean){try{const identity=await getChatGPTUser();if(!identity)throw new AppError(401,'Sign in first');if(!env.DB)throw new AppError(503,'School database unavailable');const u=await initializeUser(env.DB,identity,'jezreelch@gmail.com'),url=new URL(req.url);let result;
 if(write){if(req.headers.get('origin')!==url.origin||!req.headers.get('content-type')?.startsWith('application/json'))throw new AppError(403,'Same-origin JSON required');const raw=await req.text();if(raw.length>60000)throw new AppError(413,'School request too large');result=await mutateSchool(env.DB,u,JSON.parse(raw));}
 else{const sid=url.searchParams.get('school')||undefined,cid=url.searchParams.get('class')||undefined,offset=Number(url.searchParams.get('offset')||0);if(!Number.isSafeInteger(offset)||offset<0)throw new AppError(400,'Invalid page');if([sid,cid].some(id=>id&&!/^[0-9a-f-]{36}$/i.test(id)))throw new AppError(400,'Invalid school or class');if(cid&&!sid)throw new AppError(400,'Choose a school');result=await readSchools(env.DB,u,sid,cid,offset);}
 return Response.json(result,{headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch(e){return Response.json({error:e instanceof AppError?e.message:'School request could not be completed'},{status:e instanceof AppError?e.status:400,headers:{'Cache-Control':'private, no-store'}})}}
export async function GET(r:Request){return handle(r,false)}
export async function POST(r:Request){return handle(r,true)}
