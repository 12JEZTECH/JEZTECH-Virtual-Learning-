export function classroomEvents(previous:any,next:any){const events:{event:string;data:unknown}[]=[];
 const before=new Map((previous?.cascadedClips||[]).map((c:any)=>[c.id,c.shared_at]));
 for(const clip of next.cascadedClips||[])if(before.get(clip.id)!==clip.shared_at)events.push({event:'CLIP_CASCADED',data:{lessonId:next.session?.id,data:clip}});
 if(previous?.session?.id!==next.session?.id||previous?.session?.status!==next.session?.status||previous?.session?.teacherOnline!==next.session?.teacherOnline)events.push({event:'TEACHER_STATUS_CHANGE',data:{lessonId:next.session?.id,classTitle:next.classInfo?.title,teacherName:next.session?.teacherName||next.classInfo?.teacherName,status:next.session?.status==='live'?'in_progress':next.session?.status==='ended'?'completed':next.session?.status||'scheduled',startedAt:next.session?.startedAt}});
 if(JSON.stringify(previous?.onlineStudents||[])!==JSON.stringify(next.onlineStudents||[]))events.push({event:'PRESENCE_LIST',data:next.onlineStudents||[]});
 return events;
}
