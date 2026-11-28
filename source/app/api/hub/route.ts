import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {initializeUser,AppError} from '../../service';
import {HubAction,mutateHub,readHub,readDisplay} from '../../hub/service';
export const dynamic='force-dynamic';
async function handle(req:Request,write:boolean){try{
 const identity=await getChatGPTUser();if(!identity)throw new AppError(401,'Sign in with ChatGPT');if(!env.DB)throw new AppError(503,'Database unavailable');const user=await initializeUser(env.DB,identity,'jezreelch@gmail.com');
 if(!write){const url=new URL(req.url),id=url.searchParams.get('class')||undefined;return Response.json(url.searchParams.has('display')&&id?await readDisplay(env.DB,user,id):await readHub(env.DB,user,id,url.searchParams.get('day')||undefined,Date.now(),{search:url.searchParams.get('search')||'',offset:Math.max(0,Math.floor(Number(url.searchParams.get('offset'))||0)),rosterOffset:Math.max(0,Math.floor(Number(url.searchParams.get('rosterOffset'))||0))}),{headers:{'Cache-Control':'no-store'}})}
 if(req.headers.get('origin')!==new URL(req.url).origin||!req.headers.get('content-type')?.startsWith('application/json'))throw new AppError(403,'Same-origin JSON required');const raw=await req.text();if(raw.length>25000)throw new AppError(413,'Request too large');const parsed=HubAction.safeParse(JSON.parse(raw));if(!parsed.success)throw new AppError(400,'Check the selected class, date, time and text length');return Response.json(await mutateHub(env.DB,user,parsed.data),{headers:{'Cache-Control':'no-store'}});
 }catch(e){return Response.json({error:e instanceof AppError?e.message:'Class hub request failed. Please retry.'},{status:e instanceof AppError?e.status:400,headers:{'Cache-Control':'no-store'}})}}
export async function GET(r:Request){return handle(r,false)}
export async function POST(r:Request){return handle(r,true)}
