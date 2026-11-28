'use client';
import {clipLinkPath} from '../clips/link';
type Clip={id:string;title:string};
export function ClipLink({clip,notify}:{clip:Clip;notify:(message:string)=>void}){return <div className="actions"><a className="button-link" href={clipLinkPath(clip.id)}>Open clip link</a><button className="secondary" onClick={()=>navigator.clipboard.writeText(window.location.origin+clipLinkPath(clip.id)).then(()=>notify('Protected clip link copied. Recipients must sign in and have access.')).catch(()=>notify('Open the clip link and copy its address from the browser.'))}>Copy clip link</button></div>}
export function ClipLinkExport({clips,notify}:{clips:Clip[];notify:(message:string)=>void}){
 const lines=()=>clips.map(c=>c.title.replace(/[\r\n\t]/g,' ')+'\t'+window.location.origin+clipLinkPath(c.id)).join('\n');
 function download(){const url=URL.createObjectURL(new Blob([lines()+'\n'],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='jeztech-clip-links.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 return <section className="panel"><h3>Links for every uploaded clip</h3><p>{clips.length} clips in your accessible library. Links open the protected player; they do not include media files, login details or playback credits.</p><div className="actions"><button className="secondary" disabled={!clips.length} onClick={()=>navigator.clipboard.writeText(lines()).then(()=>notify('All accessible clip links copied.')).catch(()=>notify('Use Download link list if clipboard access is unavailable.'))}>Copy all clip links</button><button className="secondary" disabled={!clips.length} onClick={download}>Download link list</button></div></section>
}
