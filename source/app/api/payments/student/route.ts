import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
import {initializeUser,AppError} from '../../../service';
import {readStudentPaymentAdmin} from '../../../payments/service';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{const identity=await getChatGPTUser();if(!identity)throw new AppError(401,'Verified sign-in required');if(!env.DB)throw new AppError(503,'Database unavailable');const u=await initializeUser(env.DB,identity,'jezreelch@gmail.com'),p=new URL(req.url).searchParams;return Response.json(await readStudentPaymentAdmin(env.DB,u,env,p.get('search')||'',p.get('student')||''),{headers:{'Cache-Control':'no-store'}})}catch(e){return Response.json({error:e instanceof AppError?e.message:'Student payment options unavailable'},{status:e instanceof AppError?e.status:400,headers:{'Cache-Control':'no-store'}})}}
