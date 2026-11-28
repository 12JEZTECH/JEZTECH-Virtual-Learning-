export type GalleryMember={id:string;publisher:boolean};
/** Teacher initiates teacher links; peer IDs deterministically elect one student video offerer. */
export function galleryOfferer(from:GalleryMember,to:GalleryMember){return from.publisher!==to.publisher?from.publisher:from.id<to.id}
export function galleryPage<T extends {id:string}>(members:T[],teacherId:string|null,offset:number,size=12){const teacher=members.find(m=>m.id===teacherId),others=members.filter(m=>m.id!==teacherId);const width=Math.max(1,size-1),start=Math.min(Math.max(0,offset),Math.max(0,Math.floor((others.length-1)/width)*width));return {teacher,others:others.slice(start,start+width),total:others.length,offset:start}}
/** Keep the teacher pinned while finding a learner in a large media room. */
export function findGalleryMembers<T extends {id:string;name:string}>(members:T[],teacherId:string|null,query:string,focusId:string|null=null){const q=query.trim().toLocaleLowerCase();return members.filter(m=>m.id===teacherId||(focusId?m.id===focusId:!q||m.name.toLocaleLowerCase().includes(q)))}
