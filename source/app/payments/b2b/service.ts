import {z} from 'zod';
import {AppError,authorizedUser,type User} from '../../service';
export const B2B_ENDPOINT='https://sandbox.safaricom.co.ke/mpesa/b2b/v1/paymentrequest';
export type B2BConfig={MPESA_CONSUMER_KEY?:string;MPESA_CONSUMER_SECRET?:string;MPESA_B2B_INITIATOR?:string;MPESA_B2B_SECURITY_CREDENTIAL?:string;MPESA_B2B_SENDER_SHORTCODE?:string;MPESA_B2B_CALLBACK_BASE_URL?:string;MPESA_B2B_SANDBOX_ENABLED?:string};
const keys=['MPESA_CONSUMER_KEY','MPESA_CONSUMER_SECRET','MPESA_B2B_INITIATOR','MPESA_B2B_SECURITY_CREDENTIAL','MPESA_B2B_SENDER_SHORTCODE','MPESA_B2B_CALLBACK_BASE_URL'] as const;
export const B2BAction=z.object({action:z.literal('sandboxB2B'),idempotencyKey:z.string().uuid(),receiverShortcode:z.string().trim().regex(/^\d{5,9}$/),amount:z.number().int().min(1).max(10000),accountReference:z.string().trim().min(1).max(12),remarks:z.string().trim().min(2).max(100),confirmSandbox:z.literal(true)}).strict();
const st=(db:D1Database,sql:string,...v:unknown[])=>db.prepare(sql).bind(...v);
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(v=>v.toString(16).padStart(2,'0')).join('');
export function b2bConfiguration(c:B2BConfig){const missing=keys.filter(k=>!c[k]);let callback=false;try{const u=new URL(c.MPESA_B2B_CALLBACK_BASE_URL||'');callback=u.protocol==='https:'&&!u.username&&!u.password&&u.pathname==='/'&&!u.search&&!u.hash}catch{}return {mode:'sandbox' as const,endpoint:B2B_ENDPOINT,configured:!missing.length&&callback&&/^\d{5,9}$/.test(c.MPESA_B2B_SENDER_SHORTCODE||'')&&c.MPESA_B2B_SANDBOX_ENABLED==='true',missing,enabled:c.MPESA_B2B_SANDBOX_ENABLED==='true',callbackValid:callback}}
const publicRow=(p:any)=>({id:p.id,amount:p.amount,receiverShortcode:p.receiver_shortcode,accountReference:p.account_reference,status:p.status,resultCode:p.result_code,createdAt:p.created_at,conversationId:p.conversation_id,mode:'sandbox'});
export async function readB2B(db:D1Database,u:User,c:B2BConfig){await authorizedUser(db,u,'admin');return {configuration:b2bConfiguration(c),requests:(await st(db,'SELECT id,amount,receiver_shortcode,account_reference,status,result_code,created_at,conversation_id FROM mpesa_b2b_requests ORDER BY created_at DESC LIMIT 25').all()).results.map(publicRow)}}
async function jsonRequest(fetcher:typeof fetch,url:string,init:RequestInit){let r:Response;try{r=await fetcher(url,{...init,redirect:'error',signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error();return await r.json() as Record<string,unknown>}catch{throw new AppError(502,'Sandbox request status is uncertain. Review this request before starting another test.')}}
export async function submitB2B(db:D1Database,u:User,input:unknown,c:B2BConfig,now=Date.now(),fetcher:typeof fetch=fetch){
 u=await authorizedUser(db,u,'admin');const parsed=B2BAction.safeParse(input);if(!parsed.success)throw new AppError(400,'Check the sandbox amount, business shortcode, reference and confirmation');const a=parsed.data;
 const fingerprint=await hash(JSON.stringify([a.receiverShortcode,a.amount,a.accountReference,a.remarks]));
 const previous=await st(db,'SELECT * FROM mpesa_b2b_requests WHERE id=?',a.idempotencyKey).first<any>();if(previous){if(previous.request_hash!==fingerprint||previous.created_by!==u.id)throw new AppError(409,'This request ID belongs to a different sandbox test');return publicRow(previous)}
 if(!b2bConfiguration(c).configured)throw new AppError(503,'Sandbox B2B is awaiting its initiator, encrypted SecurityCredential, sender shortcode, callback origin and explicit sandbox enable setting');
 if(await st(db,'SELECT id FROM mpesa_b2b_requests WHERE created_by=? AND created_at>?',u.id,now-30000).first())throw new AppError(429,'Wait 30 seconds before starting a different sandbox test');
 const token=crypto.randomUUID()+crypto.randomUUID(),tokenHash=await hash(token);
 const created=await st(db,"INSERT INTO mpesa_b2b_requests(id,created_by,request_hash,callback_hash,amount,receiver_shortcode,account_reference,created_at,status) SELECT ?,?,?,?,?,?,?,?,'starting' WHERE NOT EXISTS(SELECT 1 FROM mpesa_b2b_requests WHERE created_by=? AND created_at>?) ON CONFLICT(id) DO NOTHING",a.idempotencyKey,u.id,fingerprint,tokenHash,a.amount,a.receiverShortcode,a.accountReference,now,u.id,now-30000).run();
 if(!created.meta.changes){const row=await st(db,'SELECT * FROM mpesa_b2b_requests WHERE id=?',a.idempotencyKey).first<any>();if(!row)throw new AppError(429,'Wait before starting a different sandbox test');if(row.request_hash!==fingerprint||row.created_by!==u.id)throw new AppError(409,'This request ID belongs to a different test');return publicRow(row)}
 const base=new URL('/api/payments/b2b/callback',c.MPESA_B2B_CALLBACK_BASE_URL);base.searchParams.set('id',a.idempotencyKey);base.searchParams.set('key',token);
 const result=new URL(base),timeout=new URL(base);result.searchParams.set('kind','result');timeout.searchParams.set('kind','timeout');
 try{
 const auth=await jsonRequest(fetcher,'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',{headers:{Authorization:'Basic '+btoa(c.MPESA_CONSUMER_KEY+':'+c.MPESA_CONSUMER_SECRET)}});if(typeof auth.access_token!=='string'||!auth.access_token)throw new AppError(502,'Sandbox authentication failed');
 const data=await jsonRequest(fetcher,B2B_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+auth.access_token},body:JSON.stringify({Initiator:c.MPESA_B2B_INITIATOR,SecurityCredential:c.MPESA_B2B_SECURITY_CREDENTIAL,CommandID:'BusinessPayBill',SenderIdentifierType:'4',RecieverIdentifierType:'4',Amount:a.amount,PartyA:c.MPESA_B2B_SENDER_SHORTCODE,PartyB:a.receiverShortcode,AccountReference:a.accountReference,Remarks:a.remarks,QueueTimeOutURL:timeout.href,ResultURL:result.href})});
 if(String(data.ResponseCode)!=='0'){await st(db,"UPDATE mpesa_b2b_requests SET status='rejected' WHERE id=?",a.idempotencyKey).run()}
 else if(typeof data.ConversationID==='string'&&typeof data.OriginatorConversationID==='string'&&data.ConversationID.length<=200&&data.OriginatorConversationID.length<=200){await st(db,"UPDATE mpesa_b2b_requests SET status='accepted_not_completed',conversation_id=?,originator_id=? WHERE id=?",data.ConversationID,data.OriginatorConversationID,a.idempotencyKey).run()}
 else throw new AppError(502,'Sandbox acknowledgement is incomplete; do not resend automatically');
 }catch(e){await st(db,"UPDATE mpesa_b2b_requests SET status='unknown' WHERE id=? AND status='starting'",a.idempotencyKey).run();throw e}
 return publicRow(await st(db,'SELECT * FROM mpesa_b2b_requests WHERE id=?',a.idempotencyKey).first());
}
export async function receiveB2BCallback(db:D1Database,id:string,key:string,kind:string,value:unknown,now=Date.now()){
 if(!z.string().uuid().safeParse(id).success||key.length!==72||!['result','timeout'].includes(kind))return;
 const row=await st(db,'SELECT * FROM mpesa_b2b_requests WHERE id=? AND callback_hash=?',id,await hash(key)).first<any>();if(!row||row.status!=='accepted_not_completed')return;
 const parsed=z.object({Result:z.object({ConversationID:z.string().max(200),OriginatorConversationID:z.string().max(200),ResultCode:z.union([z.number().int(),z.string().max(20)])})}).safeParse(value);
 if(!parsed.success||parsed.data.Result.ConversationID!==row.conversation_id||parsed.data.Result.OriginatorConversationID!==row.originator_id)return;
 await st(db,"UPDATE mpesa_b2b_requests SET status=?,result_code=?,callback_received_at=? WHERE id=? AND status='accepted_not_completed'",kind==='timeout'?'sandbox_timeout_reported':'sandbox_result_received',String(parsed.data.Result.ResultCode),now,id).run();
 // A sandbox observation never settles a collection, subscription or teacher statement.
}
