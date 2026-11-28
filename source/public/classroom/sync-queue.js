/* Shared IndexedDB layout with app/live/queue.ts. No stored auth tokens. */
async function syncQueueDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('jeztech-video-events-v1',1);r.onupgradeneeded=()=>{const s=r.result.createObjectStore('events',{keyPath:'id'});s.createIndex('user','userId')};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function syncRead(userId){const db=await syncQueueDB();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('events','readonly'),r=tx.objectStore('events').index('user').getAll(userId);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}finally{db.close()}}
async function syncRemove(ids){if(!ids.length)return;const db=await syncQueueDB();try{await new Promise((resolve,reject)=>{const tx=db.transaction('events','readwrite');for(const id of ids)tx.objectStore('events').delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}finally{db.close()}}
let queueSyncActive=false;
async function syncClassroomReports(){if(queueSyncActive)return;queueSyncActive=true;try{
 const identity=await fetch('/api/analytics/batch',{credentials:'same-origin',cache:'no-store'});if(!identity.ok)return;const current=await identity.json();if(typeof current.userId!=='string')return;
 for(let batch=0;batch<10;batch++){
 const queued=(await syncRead(current.userId)).sort((a,b)=>a.occurredAt-b.occurredAt),old=queued.filter(e=>Date.now()-e.occurredAt>86400000);await syncRemove(old.map(e=>e.id));const events=queued.filter(e=>Date.now()-e.occurredAt<=86400000).slice(0,50);if(!events.length)return;
 const response=await fetch('/api/analytics/batch',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({events:events.map(({userId,...e})=>e)})});
 if(response.status===401||response.status===403)return;if(!response.ok)throw Error('Classroom reports will retry when a connection is available');const result=await response.json();if(result.userId!==current.userId)return;
 const sent=new Set(events.map(e=>e.id)),acknowledged=[...(result.accepted||[]),...(result.rejected||[])].filter(id=>sent.has(id));if(!acknowledged.length)return;await syncRemove(acknowledged);
 }
 }finally{queueSyncActive=false}}
self.addEventListener('sync',event=>{if(event.tag==='jeztech-classroom-reports')event.waitUntil(syncClassroomReports())});
self.addEventListener('message',event=>{if(event.source?.id&&event.data?.type==='SYNC_CLASSROOM_REPORTS')event.waitUntil(syncClassroomReports())});
