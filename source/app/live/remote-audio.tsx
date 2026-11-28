'use client';
import {useEffect,useRef,useState} from 'react';
import {enablePlayback} from './playback';
/** Separate sound from camera visibility; never mount for a muted or local participant. */
export default function RemoteAudio({stream,name}:{stream:MediaStream;name:string}){
 const ref=useRef<HTMLAudioElement>(null),[blocked,setBlocked]=useState(false),[hasAudio,setHasAudio]=useState(false);
 useEffect(()=>{const el=ref.current;if(!el)return;let active=true;el.srcObject=stream;
 const play=()=>{const present=stream.getAudioTracks().some(t=>t.readyState==='live');setHasAudio(present);if(present)void el.play().then(()=>{if(active)setBlocked(false)}).catch(()=>{if(active)setBlocked(true)})};
 stream.addEventListener('addtrack',play);stream.addEventListener('removetrack',play);play();
 return()=>{active=false;stream.removeEventListener('addtrack',play);stream.removeEventListener('removetrack',play);el.pause();el.srcObject=null};},[stream]);
 return <div className="remote-audio"><audio ref={ref} autoPlay controls aria-label={'Sound from '+name} style={{display:hasAudio?'block':'none',width:'100%'}}/>{blocked&&<button type="button" className="secondary" onClick={()=>{if(ref.current)void enablePlayback([ref.current]).then(()=>setBlocked(false)).catch(()=>setBlocked(true))}}>Enable sound from {name}</button>}</div>;
}
