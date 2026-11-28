/** Stable links point to the authenticated player, never storage URLs or playback leases. */
export function clipLinkPath(id:string){if(!/^[a-zA-Z0-9_-]{1,200}$/.test(id))throw new Error('Invalid clip ID');return '/clips/'+encodeURIComponent(id)}
export function clipDashboard(role:'admin'|'teacher'|'student',id?:string){return '/'+role+'?section=videos'+(id?'&clip='+encodeURIComponent(id):'')}
