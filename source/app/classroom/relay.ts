export type RelayConfig={TURN_URLS?:string;TURN_SHARED_SECRET?:string};
/** Coturn REST credentials: short-lived HMAC; the shared secret never reaches a browser. */
export async function relaySettings(config:RelayConfig,userId:string,until=Date.now()+3600000,now=Date.now()){
 const iceServers:RTCIceServer[]=[{urls:'stun:stun.cloudflare.com:3478'}];
 const urls=(config.TURN_URLS||'').split(',').map(s=>s.trim()).filter(Boolean);
 if(!urls.length||!config.TURN_SHARED_SECRET||urls.some(u=>!/^turns?:[a-z0-9.-]+(?::\d{1,5})?(?:\?transport=(?:udp|tcp))?$/i.test(u)))return {iceServers,relayConfigured:false};
 const expires=Math.floor(Math.min(until,now+3600000)/1000);if(expires<=Math.floor(now/1000))return {iceServers,relayConfigured:false};
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(userId)),name=[...new Uint8Array(digest)].slice(0,8).map(b=>b.toString(16).padStart(2,'0')).join(''),username=expires+':'+name;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(config.TURN_SHARED_SECRET),{name:'HMAC',hash:'SHA-1'},false,['sign']);
 const signed=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(username)),credential=btoa(String.fromCharCode(...new Uint8Array(signed)));
 iceServers.push({urls,username,credential});return {iceServers,relayConfigured:true};
}
