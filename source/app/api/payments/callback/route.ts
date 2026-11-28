import {env,waitUntil} from 'cloudflare:workers';
import {AppError} from '../../../service';
import {acceptPaymentCallback,verifyCallbackPayment} from '../../../payments/service';
// Public callback delivery. Callback data never grants access;
// authenticated Safaricom checkout queries remain the source of truth.
export const dynamic='force-dynamic';
export async function POST(req:Request){
 if(!req.headers.get('content-type')?.startsWith('application/json'))return Response.json({error:'JSON required'},{status:415});
 const reader=req.body?.getReader();if(!reader)return Response.json({error:'Body required'},{status:400});let bytes=0;const parts:Uint8Array[]=[];
 try{while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>16384){await reader.cancel();return Response.json({error:'Request too large'},{status:413})}parts.push(value)}const body=new Uint8Array(bytes);let offset=0;for(const p of parts){body.set(p,offset);offset+=p.byteLength}const value=JSON.parse(new TextDecoder().decode(body));if(!env.DB)return Response.json({error:'Payment storage unavailable'},{status:503});const id=await acceptPaymentCallback(env.DB,value);if(id)waitUntil(verifyCallbackPayment(env.DB,id,env));return Response.json({ResultCode:0,ResultDesc:'Accepted for independent status verification'},{headers:{'Cache-Control':'no-store'}})}catch(e){return Response.json({error:e instanceof SyntaxError||e instanceof AppError?'Invalid callback':'Payment storage unavailable'},{status:e instanceof SyntaxError||e instanceof AppError?400:503})}finally{reader.releaseLock()}
}
