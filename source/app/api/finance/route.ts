import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {initializeUser,AppError} from '../../service';
import {readFinance} from '../../finance/service';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{const identity=await getChatGPTUser();if(!identity)throw new AppError(401,'Sign in first');if(!env.DB)throw new AppError(503,'Database unavailable');const user=await initializeUser(env.DB,identity,'jezreelch@gmail.com'),q=new URL(req.url).searchParams;return Response.json(await readFinance(env.DB,user,Date.now(),{offset:Number(q.get('offset'))||0,compact:q.get('compact')==='1'}),{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}catch(e){return Response.json({error:e instanceof AppError?e.message:'Finance summary is unavailable. Retry shortly.'},{status:e instanceof AppError?e.status:500,headers:{'Cache-Control':'no-store'}})}}
