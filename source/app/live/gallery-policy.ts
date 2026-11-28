export type GalleryMember={id:string;publisher:boolean};
/** Teacher initiates teacher links; peer IDs deterministically elect one student video offerer. */
export function galleryOfferer(from:GalleryMember,to:GalleryMember){return from.publisher!==to.publisher?from.publisher:from.id<to.id}
export function galleryPage<T extends {id:string}>(members:T[],teacherId:string|null,offset:number,size=12){const teacher=members.find(m=>m.id===teacherId),others=members.filter(m=>m.id!==teacherId);return {teacher,others:others.slice(offset,offset+size-1),total:others.length}}
