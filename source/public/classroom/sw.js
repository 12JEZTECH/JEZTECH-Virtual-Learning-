importScripts('/classroom/sync-queue.js');
/* Only explicitly reserved classroom media is cached. Never cache authentication, dashboard API data or ordinary paid videos. */
const CACHE='jeztech-reserved-clips-v1',MAX_BYTES=12*1024*1024,MAX_TOTAL=40*1024*1024;
const clientsScope=new Map();
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{await self.clients.claim();await cleanup()})()));
self.addEventListener('message',event=>{const m=event.data;if(!event.source?.id||!m||typeof m!=='object')return;
 if(m.type==='CLIP_SCOPE'&&typeof m.userId==='string'&&Array.isArray(m.permits)){clientsScope.set(event.source.id,{userId:m.userId,permits:new Map(m.permits.filter(p=>typeof p.url==='string'&&p.url.startsWith('/api/classroom-media/')&&Number.isFinite(p.expiresAt)).flatMap(p=>[[new URL(p.url,self.location.origin).href,p.expiresAt],...(typeof p.hlsPrefix==='string'&&p.hlsPrefix.startsWith(p.url+'/hls/')?[[new URL(p.hlsPrefix,self.location.origin).href,p.expiresAt]]:[])]))});event.waitUntil(cleanup(m.userId))}
 if(m.type==='CLEAR_CLIPS'){clientsScope.delete(event.source.id);event.waitUntil(caches.delete(CACHE))}
});
async function cleanup(userId){const c=await caches.open(CACHE),keys=await c.keys(),entries=[];let total=0;
 for(const k of keys){const r=await c.match(k),size=Number(r?.headers.get('content-length')||0),expires=Number(r?.headers.get('x-clip-expires')||0);if(!r||expires<=Date.now()||userId&&r.headers.get('x-clip-user')!==userId){await c.delete(k);continue}total+=size;entries.push({k,size,expires})}
 entries.sort((a,b)=>a.expires-b.expires);for(const e of entries){if(total<=MAX_TOTAL)break;const protectedNow=[...clientsScope.values()].some(s=>[...s.permits].some(([url,until])=>until>Date.now()&&(e.k.url===url||url.endsWith('/')&&e.k.url.startsWith(url))));if(!protectedNow){await c.delete(e.k);total-=e.size}}
}
function rangeResponse(buffer,type,raw){const size=buffer.byteLength,headers={'Content-Type':type,'Accept-Ranges':'bytes','Cache-Control':'private, no-store'};if(!raw)return new Response(buffer,{headers:{...headers,'Content-Length':String(size)}});
 const m=/^bytes=(\d*)-(\d*)$/.exec(raw);if(!m||!m[1]&&!m[2])return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
 const start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2])),end=m[1]&&m[2]?Math.min(size-1,Number(m[2])):size-1;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
 return new Response(buffer.slice(start,end+1),{status:206,headers:{...headers,'Content-Length':String(end-start+1),'Content-Range':`bytes ${start}-${end}/${size}`}});
}
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==self.location.origin||!u.pathname.startsWith('/api/classroom-media/'))return;
 event.respondWith((async()=>{const scope=clientsScope.get(event.clientId),expires=scope?[...scope.permits].find(([url])=>url===u.href||url.endsWith('/')&&u.href.startsWith(url))?.[1]||0:0;if(expires<=Date.now())return fetch(event.request);
 const c=await caches.open(CACHE),cached=await c.match(u.href);if(cached){if(Number(cached.headers.get('x-clip-expires'))>Date.now()&&cached.headers.get('x-clip-user')===scope.userId)return rangeResponse(await cached.arrayBuffer(),cached.headers.get('content-type')||'video/mp4',event.request.headers.get('range'));await c.delete(u.href)}
 const response=await fetch(event.request);const size=Number(response.headers.get('content-length')||0);
 if(event.request.headers.get('X-Clip-Buffer')==='1'&&response.status===200&&size>0&&size<=MAX_BYTES&&Number(response.headers.get('x-clip-expires'))===expires&&response.headers.get('x-clip-user')===scope.userId){let safe=true;if(self.navigator.storage?.estimate){const q=await self.navigator.storage.estimate();safe=!!q.quota&&(q.usage||0)+size<q.quota*.8}if(safe){await cleanup(scope.userId);const all=await c.keys();let total=0;for(const k of all)total+=Number((await c.match(k))?.headers.get('content-length')||0);if(total+size<=MAX_TOTAL)await c.put(u.href,response.clone()).catch(()=>{})}}
 return response;
 })().catch(()=>new Response('Clip unavailable offline or reservation expired',{status:503})));
});
