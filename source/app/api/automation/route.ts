import {reconcileScaleRooms,type ScaleConfig} from '../../live/scale-service';
import {clearExpiredCameraFrames} from '../../classroom/preparation';
import {reconcilePayments} from '../../payments/service';
import {env} from 'cloudflare:workers';
import {AutomationAction,automate,automationQueue} from '../../engagement/service';
import {AppError} from '../../service';
export const dynamic='force-dynamic';
async function handle(req:Request,write:boolean){try{
 const supplied=req.headers.get('X-Workspace-Service-Token');if(!env.WORKSPACE_SERVICE_TOKEN||!supplied||supplied!==env.WORKSPACE_SERVICE_TOKEN)return Response.json({error:'Unauthorized'},{status:401});
 if(!env.DB)throw new AppError(503,'Database unavailable');
 await clearExpiredCameraFrames(env.DB);
 const action=write?AutomationAction.parse(await req.json()):null;const payments=action?.action==='tick'?await reconcilePayments(env.DB,env):null;const media=action?.action==='tick'?await reconcileScaleRooms(env.DB,env as unknown as ScaleConfig):null;const value=action?{...await automate(env.DB,action),...(payments?{payments}: {}),...(media?{media}: {})}:await automationQueue(env.DB);
 return Response.json(value,{headers:{'Cache-Control':'no-store'}});
}catch(e){return Response.json({error:e instanceof AppError?e.message:'Invalid task operation'},{status:e instanceof AppError?e.status:400,headers:{'Cache-Control':'no-store'}})}}
export async function GET(req:Request){return handle(req,false)}
export async function POST(req:Request){return handle(req,true)}
