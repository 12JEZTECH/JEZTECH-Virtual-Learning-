export type Presentation={cascade_id:string;position:number;playing:number;following:number;updated_at:number};
export type SavedPosition={position:number;at:number};
export function clipPosition(id:string,duration:number,now:number,presentation:Presentation|null,server:SavedPosition,local:SavedPosition|null,follow=true){
 const bound=(n:number)=>Math.max(0,Math.min(duration,Number.isFinite(n)?n:0));
 if(follow&&presentation?.following&&presentation.cascade_id===id)return {position:bound(presentation.position+(presentation.playing?Math.max(0,now-presentation.updated_at)/1000:0)),following:true,playing:!!presentation.playing};
 const saved=local&&Number.isFinite(local.at)&&local.at>server.at?local:server;
 return {position:bound(saved.position),following:false,playing:false};
}
