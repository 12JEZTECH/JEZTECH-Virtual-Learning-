import {readOrientation} from '../../orientation/service';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {AppError,initializeUser,authorizedUser} from '../../service';
export const dynamic='force-dynamic';
async function handle(req:Request,write:boolean){try{const identity=await getChatGPTUser();if(!identity)throw new AppError(401,'Sign in required');if(!env.DB)throw new AppError(503,'Database unavailable');const u=await authorizedUser(env.DB,await initializeUser(env.DB,identity,'jezreelch@gmail.com'));if(u.role!=='student')throw new AppError(403,'Student account required');if(write&&req.headers.get('origin')!==new URL(req.url).origin)throw new AppError(403,'Same-site request required');return Response.json(await readOrientation(env.DB,u,write),{headers:{'Cache-Control':'private, no-store'}});}catch(e){return Response.json({error:e instanceof AppError?e.message:'Orientation unavailable'},{status:e instanceof AppError?e.status:500,headers:{'Cache-Control':'no-store'}})}}
export async function GET(req:Request){return handle(req,false)}
export async function POST(req:Request){return handle(req,true)}
