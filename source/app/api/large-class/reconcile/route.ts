import {env} from 'cloudflare:workers';
import {reconcileScaleRooms,type ScaleConfig} from '../../../live/scale-service';
export const dynamic='force-dynamic';
// External minute-level housekeeping. No browser/user identity is manufactured.
export async function POST(req:Request){if(!env.WORKSPACE_SERVICE_TOKEN||req.headers.get('X-Workspace-Service-Token')!==env.WORKSPACE_SERVICE_TOKEN)return Response.json({error:'Unauthorized'},{status:401,headers:{'Cache-Control':'no-store'}});if(!env.DB)return Response.json({error:'Database unavailable'},{status:503});try{return Response.json(await reconcileScaleRooms(env.DB,env as unknown as ScaleConfig),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Media reconciliation failed'},{status:503,headers:{'Cache-Control':'no-store'}})}}
