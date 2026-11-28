const st=(db:D1Database,sql:string,...v:unknown[])=>db.prepare(sql).bind(...v);
const pendingMedia=`EXISTS(SELECT 1 FROM class_attendance a JOIN class_sessions s ON s.id=a.session_id WHERE s.status='ended' AND (a.left_at IS NULL OR a.camera_frame IS NOT NULL OR a.ready!=0)) OR EXISTS(SELECT 1 FROM classroom_calls c JOIN class_sessions s ON s.id=c.session_id WHERE s.status='ended' AND c.status!='ended') OR EXISTS(SELECT 1 FROM conference_peers p JOIN class_sessions s ON s.id=p.session_id WHERE s.status='ended') OR EXISTS(SELECT 1 FROM conference_signals p JOIN class_sessions s ON s.id=p.session_id WHERE s.status='ended') OR EXISTS(SELECT 1 FROM call_signals x JOIN classroom_calls c ON c.id=x.call_id WHERE c.session_id IS NOT NULL AND c.status='ended')`;
export async function closeEndedLessonMedia(db:D1Database,now:number){if(!(await st(db,`SELECT ${pendingMedia} AS pending`).first<any>())?.pending)return;await db.batch([
 st(db,`UPDATE class_attendance SET left_at=COALESCE(left_at,(SELECT ended_at FROM class_sessions s WHERE s.id=class_attendance.session_id)),ready=0,camera_frame=NULL,camera_at=NULL WHERE session_id IN (SELECT id FROM class_sessions WHERE status='ended') AND (left_at IS NULL OR camera_frame IS NOT NULL OR ready!=0)`),
 st(db,"UPDATE classroom_calls SET status='ended',ended_at=COALESCE((SELECT ended_at FROM class_sessions s WHERE s.id=classroom_calls.session_id),?) WHERE session_id IN (SELECT id FROM class_sessions WHERE status='ended') AND status!='ended'",now),
 st(db,"DELETE FROM conference_signals WHERE session_id IN (SELECT id FROM class_sessions WHERE status='ended')"),
 st(db,"DELETE FROM conference_peers WHERE session_id IN (SELECT id FROM class_sessions WHERE status='ended')"),
 st(db,"DELETE FROM call_signals WHERE call_id IN (SELECT id FROM classroom_calls WHERE session_id IS NOT NULL AND status='ended')"),
 ]);}
export async function advanceLessonClock(db:D1Database,now=Date.now()){
 const state=await st(db,`SELECT EXISTS(SELECT 1 FROM class_sessions WHERE (status!='ended' AND ends_at<=?) OR (status='preparing' AND starts_at<=?)) AS due, ${pendingMedia} AS cleanup`,now,now).first<any>();if(!state?.due){if(state?.cleanup)await closeEndedLessonMedia(db,now);return}
 await db.batch([
 st(db,"UPDATE class_sessions SET status='ended',ended_at=ends_at WHERE status!='ended' AND ends_at IS NOT NULL AND ends_at<=?",now),
 st(db,"UPDATE class_sessions SET status='live',started_at=COALESCE(started_at,starts_at) WHERE status='preparing' AND start_mode='automatic' AND starts_at<=? AND ends_at>?",now,now),
 st(db,"UPDATE class_sessions SET status='waiting' WHERE status='preparing' AND start_mode='teacher' AND starts_at<=?",now),
 ]);await closeEndedLessonMedia(db,now);
}
export function microphoneAllowed(session:{status:string;starts_at:number;ends_at:number;mute_all:number},attendance:{left_at:number|null;mic_policy:string}|null,now:number){
 return session.status==='live'&&session.starts_at<=now&&session.ends_at>now&&!!attendance&&!attendance.left_at&&(attendance.mic_policy==='allowed'||attendance.mic_policy!=='muted'&&!session.mute_all);
}
export async function callLessonPolicy(db:D1Database,call:any,now=Date.now()){
 if(!call.session_id)return {...call,audio_blocked:false,lesson_ends_at:null};
 const session=await st(db,'SELECT * FROM class_sessions WHERE id=?',call.session_id).first<any>();
 const attendance=await st(db,'SELECT left_at,mic_policy FROM class_attendance WHERE session_id=? AND student_id=?',call.session_id,call.student_id).first<any>();
 return {...call,audio_blocked:!session||!microphoneAllowed(session,attendance,now),lesson_ends_at:session?.ends_at||null};
}
