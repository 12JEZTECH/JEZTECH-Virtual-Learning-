/** Keep streamless WebRTC audio and video tracks together, regardless of arrival order. */
export function receiveTrack(stream:MediaStream,track:MediaStreamTrack){
 if(!stream.getTracks().some(t=>t.id===track.id))stream.addTrack(track);
 return stream;
}
/** Called directly from a click so browser autoplay permission can be granted. */
export async function enablePlayback(elements:Iterable<HTMLMediaElement>,resume?:()=>Promise<void>){
 const work:Promise<unknown>[]=[];
 if(resume)work.push(resume());
 for(const el of elements){el.muted=false;el.volume=1;work.push(el.play())}
 const results=await Promise.allSettled(work);
 if(results.some(r=>r.status==='rejected'))throw new Error('Sound is blocked. Allow audio in your browser, check the device volume, then tap Enable sound again.');
}
