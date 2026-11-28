import {z} from 'zod';
import {AppError,type User} from '../service';
import {requirePaidAccess} from '../classroom/access';
import {canReadLesson} from '../engagement/service';
import {normalizeClass} from '../assignments/service';
import {classLevels,subjectsForLevel} from '../teaching/catalog';
const uuid=z.string().uuid();
export const ChatAction=z.discriminatedUnion('action',[
 z.object({action:z.literal('createChat'),classLevel:z.string(),subject:z.string(),topic:z.string().trim().min(1).max(160),title:z.string().trim().min(3).max(160)}),
 z.object({action:z.literal('chatMessage'),roomId:uuid,id:uuid,body:z.string().trim().min(1).max(2000)}),
 z.object({action:z.literal('removeChatMessage'),id:uuid}),
 z.object({action:z.literal('chatStatus'),roomId:uuid,status:z.enum(['open','locked'])}),
 z.object({action:z.literal('pinChatNotes'),roomId:uuid,lessonId:uuid.nullable()}),
 z.object({action:z.literal('shareTopicNotes'),lessonId:uuid}),
]);
const st=(db:D1Database,sql:string,...v:unknown[])=>db.prepare(sql).bind(...v);
const one=(db:D1Database,sql:string,...v:unknown[])=>st(db,sql,...v).first<any>();
const all=async(db:D1Database,sql:string,...v:unknown[])=>(await st(db,sql,...v).all<any>()).results;
function need<T>(v:T|null):T{if(!v)throw new AppError(404,'Chat record not found');return v}
function staff(u:User){if(u.role==='student')throw new AppError(403,'Teacher access required')}
async function inExam(db:D1Database,u:User){return u.role==='student'&&!!await one(db,"SELECT id FROM sessions WHERE student_id=? AND status IN ('active','paused')",u.id)}
async function roomAccess(db:D1Database,u:User,id:string,now:number){
 const room=need(await one(db,'SELECT * FROM class_chats WHERE id=?',id));if(u.role==='admin')return room;if(u.role==='teacher'){if(room.teacher_id!==u.id)throw new AppError(403,'This chat belongs to another teacher');return room}
 await requirePaidAccess(db,u,now,'class_chat');const admission=await one(db,"SELECT * FROM admissions WHERE student_id=? AND status='approved'",u.id);if(!admission||admission.teacher_id!==room.teacher_id||normalizeClass(admission.level)!==room.class_level)throw new AppError(403,'This chat is for another class');if(await inExam(db,u))throw new AppError(409,'Class chat is unavailable during an active assessment');return room;
}
function validClass(level:string,subject:string){if(!classLevels.some(c=>c.id===level)||!subjectsForLevel(level).some(s=>s.id===subject))throw new AppError(400,'Choose a valid class and subject')}
async function validNotes(db:D1Database,room:any,id:string){const l=need(await one(db,'SELECT * FROM lessons WHERE id=?',id));if(l.teacher_id!==room.teacher_id||l.status!=='published'||l.subject!==room.subject||l.class_level!==room.class_level||l.topic!==room.topic)throw new AppError(400,'Choose published notes from this teacher for the same class, subject and topic');return l}
export async function mutateChat(db:D1Database,u:User,input:unknown,now=Date.now()):Promise<any>{
 const parsed=ChatAction.safeParse(input);if(!parsed.success)throw new AppError(400,parsed.error.issues.map(i=>i.message).join('; '));const a=parsed.data;
 if(a.action==='createChat'){
  staff(u);validClass(a.classLevel,a.subject);if(await one(db,'SELECT id FROM class_chats WHERE teacher_id=? AND class_level=? AND subject=? AND topic=?',u.id,a.classLevel,a.subject,a.topic))throw new AppError(409,'A chat already exists for this topic. Open it from the room list.');const id=crypto.randomUUID();await st(db,'INSERT INTO class_chats(id,teacher_id,class_level,subject,topic,title,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)',id,u.id,a.classLevel,a.subject,a.topic,a.title,now,now).run();return {id};
 }
 if(a.action==='shareTopicNotes'){
  staff(u);const lesson=need(await one(db,'SELECT * FROM lessons WHERE id=?',a.lessonId));if(lesson.teacher_id!==u.id&&u.role!=='admin')throw new AppError(403,'These notes belong to another teacher');validClass(lesson.class_level,lesson.subject);if(lesson.status!=='published'||!lesson.topic)throw new AppError(409,'Publish class-specific topic notes before sharing');
  const id=crypto.randomUUID();await st(db,`INSERT INTO class_chats(id,teacher_id,class_level,subject,topic,title,lesson_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(teacher_id,class_level,subject,topic) DO UPDATE SET lesson_id=excluded.lesson_id,updated_at=excluded.updated_at`,id,lesson.teacher_id,lesson.class_level,lesson.subject,lesson.topic,(lesson.class_level+' · '+lesson.topic).slice(0,160),lesson.id,now,now).run();const room=await one(db,'SELECT id FROM class_chats WHERE teacher_id=? AND class_level=? AND subject=? AND topic=?',lesson.teacher_id,lesson.class_level,lesson.subject,lesson.topic);return {id:room.id};
 }
 if(a.action==='removeChatMessage'){
  const message=need(await one(db,'SELECT * FROM class_chat_messages WHERE id=?',a.id));await roomAccess(db,u,message.room_id,now);if(u.role==='student'&&message.sender_id!==u.id)throw new AppError(403,'Only the sender or teacher can remove this message');await st(db,'UPDATE class_chat_messages SET removed_at=?,removed_by=? WHERE id=? AND removed_at IS NULL',now,u.id,a.id).run();return {ok:true};
 }
 const room=await roomAccess(db,u,a.roomId,now);
 if(a.action==='chatStatus'){staff(u);await st(db,'UPDATE class_chats SET status=?,updated_at=? WHERE id=?',a.status,now,room.id).run();return {ok:true}}
 if(a.action==='pinChatNotes'){staff(u);if(a.lessonId)await validNotes(db,room,a.lessonId);await st(db,'UPDATE class_chats SET lesson_id=?,updated_at=? WHERE id=?',a.lessonId,now,room.id).run();return {ok:true}}
 const previous=await one(db,'SELECT * FROM class_chat_messages WHERE id=?',a.id);if(previous){if(previous.sender_id!==u.id||previous.room_id!==room.id||previous.body!==a.body)throw new AppError(409,'Message retry does not match');return {id:previous.id}}
 if(room.status!=='open')throw new AppError(409,'Your teacher has locked this discussion');
 const result=await st(db,`INSERT INTO class_chat_messages(id,room_id,sender_id,body,created_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM class_chats WHERE id=? AND status='open') AND (SELECT COUNT(*) FROM class_chat_messages WHERE sender_id=? AND created_at>?)<20`,a.id,room.id,u.id,a.body,now,room.id,u.id,now-60000).run();if(!result.meta.changes)throw new AppError(429,'Please wait a moment before sending another message');return {id:a.id};
}
export async function readChat(db:D1Database,u:User,now=Date.now()){
 if(u.role==='student'){await requirePaidAccess(db,u,now,'class_chat');if(await inExam(db,u))return {chatRooms:[],chatMessages:[],sharedTopicNotes:[],chatNotice:'Class chat is unavailable during an active assessment.'}}
 const student=u.role==='student';const admission=student?await one(db,"SELECT * FROM admissions WHERE student_id=? AND status='approved'",u.id):null;
 const rooms=await all(db,`SELECT c.*,t.name AS teacher_name FROM class_chats c JOIN users t ON t.id=c.teacher_id WHERE ${student||u.role==='teacher'?'c.teacher_id=?':'1=1'} ORDER BY c.updated_at DESC LIMIT 100`,...(student?[admission?.teacher_id||'']:u.role==='teacher'?[u.id]:[]));const visible=student?rooms.filter(r=>r.class_level===normalizeClass(admission?.level||'')):rooms;
 if(!visible.length)return {chatRooms:[],chatMessages:[],sharedTopicNotes:[],chatNotice:''};
 const ids=visible.map(r=>r.id),marks=ids.map(()=>'?').join(',');
 const messages=await all(db,`SELECT id,room_id,sender_id,sender_name,sender_role,CASE WHEN removed_at IS NULL THEN body ELSE '' END AS body,created_at,removed_at FROM (SELECT m.*,u.name AS sender_name,u.role AS sender_role,ROW_NUMBER() OVER(PARTITION BY m.room_id ORDER BY m.created_at DESC,m.id DESC) AS rn FROM class_chat_messages m JOIN users u ON u.id=m.sender_id WHERE m.room_id IN (${marks})) WHERE rn<=60 ORDER BY created_at,id`,...ids);
 const notes=[];for(const room of visible){if(!room.lesson_id)continue;const lesson=await one(db,"SELECT l.*,t.name AS teacher_name FROM lessons l JOIN users t ON t.id=l.teacher_id WHERE l.id=? AND l.status='published' AND l.teacher_id=? AND l.class_level=? AND l.subject=? AND l.topic=?",room.lesson_id,room.teacher_id,room.class_level,room.subject,room.topic);if(!lesson)continue;let unlocked=true;if(student){try{await canReadLesson(db,u,lesson.id,now)}catch(e){if(e instanceof AppError&&e.status===403)unlocked=false;else throw e}}notes.push({room_id:room.id,id:lesson.id,title:lesson.title,teacher_name:lesson.teacher_name,created_at:lesson.created_at,unlocked,...(unlocked?{content:lesson.content}:{})})}
 return {chatRooms:visible,chatMessages:messages,sharedTopicNotes:notes,chatNotice:''};
}
