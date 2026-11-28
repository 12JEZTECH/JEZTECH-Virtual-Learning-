import {orientationAccess,orientationLessonScope} from '../orientation/access';
import {generateLessonPractice} from '../subject-store/questions';
import {z} from 'zod';
import {refreshAccess} from '../classroom/access';
import {AppError,authorizedUser,type User} from '../service';
import {apparatus} from './catalog';
import {subjectsForLevel} from '../teaching/catalog';
const uuid=z.string().uuid(),subject=z.enum(["environmental", "agriculture", "arabic", "creative-arts", "cre", "english", "french", "german", "hre", "indigenous-languages", "general", "ire", "kiswahili", "mandarin", "mathematics", "pre-technical", "social-studies", "computer-studies", "home-science", "ict", "fine-arts", "music-dance", "physical-education", "sports-recreation", "theatre-film", "business-studies", "community-service", "geography", "history-citizenship", "fasihi", "literature", "biology", "chemistry", "core-mathematics", "essential-mathematics", "physics", "aviation", "building-construction", "electricity", "marine-fisheries", "media-technology", "metalwork", "power-mechanics", "woodwork", "history-government", "music", "art-design", "drawing-design"]),curriculum=z.enum(['cbe-primary','cbe-junior','cbe-senior','844']);
const classLevel=z.enum(['all','grade-1','grade-2','grade-3','grade-4','grade-5','grade-6','grade-7','grade-8','grade-9','grade-10','grade-11','grade-12','form-3','form-4']).default('all'),topic=z.string().trim().max(160).default('');
const labQuestion=z.object({type:z.enum(['mcq','tf','short','fill']),prompt:z.string().trim().min(1).max(2000),options:z.array(z.string().trim().max(500)).max(4).default([]),correct:z.union([z.number().int().min(0).max(3),z.boolean(),z.string().trim().max(1500)]),keywords:z.array(z.string().trim().min(1).max(100)).max(20).default([]),points:z.number().int().min(1).max(20)});
export const LabActionSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('importTopics'),classLevel,subject,topics:z.array(z.object({title:z.string().trim().min(1).max(160),notes:z.string().trim().max(30000).default('')})).min(1).max(100)}),
 z.object({action:z.literal('createLesson'),classLevel,topic,title:z.string().trim().min(1).max(160),summary:z.string().trim().max(1500),content:z.string().trim().min(1).max(30000),subject,curriculum,price:z.number().int().min(0).max(100000)}),
 z.object({action:z.literal('lessonStatus'),lessonId:uuid,status:z.enum(['published','archived'])}),
 z.object({action:z.literal('paymentSettings'),businessNumber:z.string().regex(/^\d{5,7}$/),accountReference:z.string().trim().min(1).max(30),instructions:z.string().trim().max(1500)}),
 z.object({action:z.literal('claimPayment'),lessonId:uuid,phone:z.string().min(9).max(20),receipt:z.string().trim().regex(/^[A-Za-z0-9]{10}$/)}),
 z.object({action:z.literal('reviewPayment'),paymentId:uuid,status:z.enum(['verified','rejected']),note:z.string().trim().min(1).max(500)}),
 z.object({action:z.literal('createLab'),classLevel,topic,title:z.string().trim().min(1).max(160),subject,curriculum,safety:z.string().trim().min(1).max(5000),duration:z.number().int().min(1).max(300),benchCount:z.number().int().min(1).max(100),apparatusIds:z.array(z.string()).min(1).max(100),questions:z.array(labQuestion).min(1).max(50),rubric:z.array(z.object({name:z.string().trim().min(1).max(80),weight:z.number().int().min(1).max(100)})).min(1).max(10)}),
 z.object({action:z.literal('joinLab'),labId:uuid}),
 z.object({action:z.literal('endLab'),labId:uuid}),
 z.object({action:z.literal('assignBenches'),labId:uuid}),
 z.object({action:z.literal('labReady'),entryId:uuid}),
 z.object({action:z.literal('labSave'),entryId:uuid,kind:z.enum(['answer','equipment','rubric','notes']),key:z.string().max(100).default(''),value:z.union([z.string().max(5000),z.number().int().min(0).max(100),z.boolean()])}),
 z.object({action:z.literal('submitLab'),entryId:uuid}),
 z.object({action:z.literal('regradeLab'),labId:uuid}),
 z.object({action:z.literal('gradeLabEntry'),entryId:uuid,marks:z.record(z.number().int().min(0).max(20)),rubric:z.record(z.number().int().min(0).max(100)),feedback:z.string().trim().max(3000)}),
]);
export type LabAction=z.infer<typeof LabActionSchema>;
export type LabQuestion={id:string;type:'mcq'|'tf'|'short'|'fill';prompt:string;options:string[];correct:number|boolean|string;keywords:string[];points:number};
const stmt=(db:D1Database,sql:string,...values:unknown[])=>db.prepare(sql).bind(...values);
const one=(db:D1Database,sql:string,...values:unknown[])=>stmt(db,sql,...values).first<any>();
const all=async(db:D1Database,sql:string,...values:unknown[])=>(await stmt(db,sql,...values).all<any>()).results;
function need<T>(v:T|null):T{if(!v)throw new AppError(404,'Record not found');return v}
function staff(u:User){if(u.role==='student')throw new AppError(403,'Teacher access required')}
async function ownLab(db:D1Database,u:User,id:string){staff(u);const lab=need(await one(db,'SELECT * FROM labs WHERE id=?',id));if(u.role!=='admin'&&lab.teacher_id!==u.id)throw new AppError(403,'This lab belongs to another teacher');return lab}
async function ownLesson(db:D1Database,u:User,id:string){staff(u);const lesson=need(await one(db,'SELECT * FROM lessons WHERE id=?',id));if(u.role!=='admin'&&lesson.teacher_id!==u.id)throw new AppError(403,'This lesson belongs to another teacher');return lesson}
async function ownEntry(db:D1Database,u:User,id:string){const entry=need(await one(db,'SELECT * FROM lab_entries WHERE id=?',id));if(entry.student_id!==u.id)throw new AppError(403,'This practical belongs to another student');return entry}
const normalize=(s:unknown)=>String(s??'').trim().toLowerCase().replace(/\s+/g,' ');
export function gradeQuestions(qs:LabQuestion[],answers:Record<string,unknown>,previous:Record<string,any>={}){
 let score=0,maxScore=0;const perQuestion:Record<string,any>={};
 for(const q of qs){const answer=answers[q.id],present=answer!==undefined&&answer!==null&&answer!=='';let earned=0;
  if(present){if(q.type==='mcq')earned=Number(answer)===q.correct?q.points:0;else if(q.type==='tf')earned=String(answer)===String(q.correct)?q.points:0;else if(q.type==='fill')earned=normalize(answer)===normalize(q.correct)?q.points:0;else{const a=normalize(answer);if(a===normalize(q.correct))earned=q.points;else if(q.keywords.length){const hits=q.keywords.filter(k=>a.includes(normalize(k))).length;earned=Math.round(q.points*hits/q.keywords.length)}}}
  const manual=previous[q.id]?.manualScore;const manualScore=typeof manual==='number'?Math.max(0,Math.min(q.points,manual)):undefined;
  const points=manualScore??earned;score+=points;maxScore+=q.points;perQuestion[q.id]={score:points,max:q.points,suggested:earned,reviewRequired:q.type==='short'&&manualScore===undefined,...(manualScore===undefined?{}:{manualScore})};
 }
 return {score,maxScore,perQuestion};
}
async function finalizeEntry(db:D1Database,entry:any,lab:any,now:number){
 const graded=gradeQuestions(JSON.parse(lab.questions),JSON.parse(entry.answers),JSON.parse(entry.per_question));
 await stmt(db,`UPDATE lab_entries SET status='submitted',score=?,max_score=?,per_question=?,submitted_at=?,version=version+1 WHERE id=? AND status='active' AND version=?`,graded.score,graded.maxScore,JSON.stringify(graded.perQuestion),now,entry.id,entry.version).run();
}
export async function expireLabs(db:D1Database,now:number){
 const entries=await all(db,"SELECT a.* FROM lab_entries a JOIN labs l ON l.id=a.lab_id WHERE a.status='active' AND (l.deadline<=? OR l.status='ended')",now);
 for(const entry of entries){const lab=need(await one(db,'SELECT * FROM labs WHERE id=?',entry.lab_id));await finalizeEntry(db,entry,lab,now)}
 await stmt(db,"UPDATE labs SET status='ended',ended_at=? WHERE status='active' AND deadline<=?",now,now).run();
}
export async function readFeatures(db:D1Database,u:User,now=Date.now()){
 u=await authorizedUser(db,u);
 await expireLabs(db,now);const student=u.role==='student',teacher=u.role==='teacher';
 const lessons=await all(db,`SELECT l.id,l.teacher_id,l.title,l.summary,l.class_level,l.topic,l.subject,l.curriculum,l.price,l.status,l.created_at,us.name AS teacher_name FROM lessons l JOIN users us ON us.id=l.teacher_id WHERE ${student?"l.status='published'":teacher?'l.teacher_id=?':'1=1'} ORDER BY l.created_at DESC`,...(teacher?[u.id]:[]));
 const orientation=student?await orientationAccess(db,u.id,now):null;
 const contents=await all(db,`SELECT l.id,l.content FROM lessons l WHERE ${student?`l.status='published' AND (?=0 OR ${orientationLessonScope('l','?')}) AND (?=1 OR l.price=0 OR EXISTS(SELECT 1 FROM payments p WHERE p.lesson_id=l.id AND p.student_id=? AND p.status='verified') OR EXISTS(SELECT 1 FROM subscriptions s WHERE s.student_id=? AND s.status='verified' AND s.expires_at>?) OR EXISTS(SELECT 1 FROM conference_passes cp WHERE cp.student_id=? AND cp.expires_at>?))`:teacher?'l.teacher_id=?':'1=1'}`,...(student?[orientation?1:0,u.id,orientation?1:0,u.id,u.id,now,u.id,now]:teacher?[u.id]:[]));
 const ps=u.role==='admin'?await all(db,`SELECT p.*,us.name AS student_name,l.title AS lesson_title FROM payments p JOIN lessons l ON l.id=p.lesson_id JOIN users us ON us.id=p.student_id WHERE ${student?'p.student_id=?':teacher?'l.teacher_id=?':'1=1'} ORDER BY p.created_at DESC`,...(student||teacher?[u.id]:[])):[];
 const pendingLessonIds=new Set(student?(await all(db,"SELECT lesson_id FROM payments WHERE student_id=? AND status='pending'",u.id)).map(p=>p.lesson_id):[]);
 const ls=await all(db,`SELECT l.*,us.name AS teacher_name FROM labs l JOIN users us ON us.id=l.teacher_id WHERE ${student?"l.status='active' OR EXISTS(SELECT 1 FROM lab_entries a WHERE a.lab_id=l.id AND a.student_id=?)":teacher?'l.teacher_id=?':'1=1'} ORDER BY l.started_at DESC`,...(student||teacher?[u.id]:[]));
 const es=await all(db,`SELECT a.*,us.name AS student_name,l.title AS lab_title FROM lab_entries a JOIN labs l ON l.id=a.lab_id JOIN users us ON us.id=a.student_id WHERE ${student?'a.student_id=?':teacher?'l.teacher_id=?':'1=1'} ORDER BY a.last_seen DESC`,...(student||teacher?[u.id]:[]));
 const topicLibrary=await all(db,`SELECT o.id,o.teacher_id,o.class_level,o.subject,o.title,o.created_at${student?'':',o.notes'} FROM teaching_outlines o WHERE ${student?"EXISTS(SELECT 1 FROM admissions a WHERE a.student_id=? AND a.teacher_id=o.teacher_id AND a.status='approved')":teacher?'o.teacher_id=?':'1=1'} ORDER BY o.created_at,o.title`,...(student||teacher?[u.id]:[]));
 return {topicLibrary,lessons:lessons.map(l=>{const c=contents.find(c=>c.id===l.id);return {...l,payment_pending:pendingLessonIds.has(l.id),unlocked:!!c,...(c?{content:c.content}:{})}}),payments:ps,paymentSettings:await one(db,'SELECT * FROM payment_settings WHERE id=?','main'),labs:ls.map(l=>({...l,apparatus_ids:JSON.parse(l.apparatus_ids),rubric:JSON.parse(l.rubric),questions:JSON.parse(l.questions).map((q:LabQuestion)=>student?{id:q.id,type:q.type,prompt:q.prompt,options:q.options,points:q.points}:q)})),labEntries:es.map(e=>({...e,answers:JSON.parse(e.answers),equipment:JSON.parse(e.equipment),self_rubric:JSON.parse(e.self_rubric),teacher_rubric:JSON.parse(e.teacher_rubric),per_question:JSON.parse(e.per_question)})),roster:student?[]:await all(db,"SELECT id,name FROM users WHERE role='student' AND disabled=0 ORDER BY name"),paymentMode:'manual_verification',stkReady:false};
}
export async function mutateFeature(db:D1Database,u:User,a:LabAction,now=Date.now()):Promise<any>{
 u=await authorizedUser(db,u);
 await expireLabs(db,now);
 if(a.action==='importTopics'){staff(u);if(a.classLevel==='all')throw new AppError(400,'Choose a specific class for topic imports');if(!subjectsForLevel(a.classLevel).some(s=>s.id===a.subject))throw new AppError(400,'Choose a subject offered for this class level');if(JSON.stringify(a.topics).length>120000)throw new AppError(413,'Split this topic import into smaller files');const unique=[...new Map(a.topics.map(t=>[t.title,t])).values()];await db.batch(unique.map(t=>stmt(db,'INSERT INTO teaching_outlines(id,teacher_id,class_level,subject,title,notes,created_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(teacher_id,class_level,subject,title) DO NOTHING',crypto.randomUUID(),u.id,a.classLevel,a.subject,t.title,t.notes,now)));return {ok:true}}
 if(a.action==='createLesson'){staff(u);validateTeachingLevel(a.classLevel,a.curriculum);const id=crypto.randomUUID();await stmt(db,'INSERT INTO lessons(id,teacher_id,title,summary,content,subject,curriculum,price,created_at,class_level,topic) VALUES(?,?,?,?,?,?,?,?,?,?,?)',id,u.id,a.title,a.summary,a.content,a.subject,a.curriculum,a.price,now,a.classLevel||'all',a.topic||'').run();return {id}}
 if(a.action==='lessonStatus'){const l=await ownLesson(db,u,a.lessonId);await stmt(db,'UPDATE lessons SET status=? WHERE id=?',a.status,l.id).run();const practice=a.status==='published'?await generateLessonPractice(db,l.id,now):null;return {ok:true,practice}}
 if(a.action==='paymentSettings'){if(u.role!=='admin')throw new AppError(403,'Administrator access required');await stmt(db,'INSERT INTO payment_settings(id,business_number,account_reference,instructions,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET business_number=excluded.business_number,account_reference=excluded.account_reference,instructions=excluded.instructions,updated_at=excluded.updated_at','main',a.businessNumber,a.accountReference,a.instructions,now).run();return {ok:true}}
 if(a.action==='claimPayment'){
  if(u.role!=='student')throw new AppError(403,'Only students submit payment receipts');const lesson=need(await one(db,'SELECT * FROM lessons WHERE id=?',a.lessonId));if(lesson.status!=='published'||lesson.price===0)throw new AppError(409,'This lesson does not require a payment');
  if(!await one(db,"SELECT id FROM payment_settings WHERE id='main'"))throw new AppError(409,'Payment instructions have not been configured by the administrator');
  let phone=a.phone.replace(/[\s+()-]/g,'');if(/^0[17]\d{8}$/.test(phone))phone='254'+phone.slice(1);if(/^[17]\d{8}$/.test(phone))phone='254'+phone;if(!/^254[17]\d{8}$/.test(phone))throw new AppError(400,'Enter a valid Kenyan mobile number');
  if(await one(db,"SELECT id FROM payments WHERE student_id=? AND lesson_id=? AND status IN ('pending','verified')",u.id,lesson.id))throw new AppError(409,'A payment is already pending or verified for this lesson');
  const receipt=a.receipt.toUpperCase();if(await one(db,'SELECT id FROM payments WHERE receipt=?',receipt)||await one(db,'SELECT id FROM subscriptions WHERE receipt=?',receipt))throw new AppError(409,'That receipt has already been submitted');
  const id=crypto.randomUUID();try{await db.batch([stmt(db,'INSERT INTO payment_receipt_reservations(receipt,kind,payment_id,created_at) VALUES(?,?,?,?)',receipt,'lesson',id,now),stmt(db,'INSERT INTO payments(id,lesson_id,student_id,phone,amount,receipt,created_at) VALUES(?,?,?,?,?,?,?)',id,lesson.id,u.id,phone,lesson.price,receipt,now)])}catch{throw new AppError(409,'Receipt already submitted; refresh before trying again')};return {id};
 }
 if(a.action==='reviewPayment'){
  await authorizedUser(db,u,'admin');
  const p=need(await one(db,'SELECT * FROM payments WHERE id=?',a.paymentId));await ownLesson(db,u,p.lesson_id);if(p.status!=='pending')throw new AppError(409,'This payment has already been reviewed');
  const result=await stmt(db,"UPDATE payments SET status=?,reviewed_by=?,review_note=?,reviewed_at=? WHERE id=? AND status='pending'",a.status,u.id,a.note,now,p.id).run();if(!result.meta.changes)throw new AppError(409,'Payment changed; refresh and retry');if(a.status==='verified')await refreshAccess(db,p.student_id,now);return {ok:true};
 }
 if(a.action==='createLab'){validateTeachingLevel(a.classLevel,a.curriculum);
  staff(u);const ids=[...new Set(a.apparatusIds)];if(ids.some(id=>!apparatus.some(x=>x.id===id)))throw new AppError(400,'Unknown apparatus selected');
  if(a.rubric.reduce((n,r)=>n+r.weight,0)!==100)throw new AppError(400,'Rubric weights must total 100');if(new Set(a.rubric.map(r=>r.name)).size!==a.rubric.length)throw new AppError(400,'Rubric names must be unique');
  for(const q of a.questions){if(q.type==='mcq'&&(q.options.length!==4||q.options.some(x=>!x)||typeof q.correct!=='number'))throw new AppError(400,'MCQ needs four choices and a correct choice index');if(q.type==='tf'&&typeof q.correct!=='boolean')throw new AppError(400,'True/false needs a boolean answer');if(['short','fill'].includes(q.type)&&(typeof q.correct!=='string'||!q.correct.trim()))throw new AppError(400,'Written questions need a model answer')}
  const qs=a.questions.map(q=>({...q,id:crypto.randomUUID()})),id=crypto.randomUUID();await stmt(db,'INSERT INTO labs(id,teacher_id,title,subject,curriculum,safety,duration,bench_count,apparatus_ids,questions,rubric,started_at,deadline,class_level,topic) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',id,u.id,a.title,a.subject,a.curriculum,a.safety,a.duration,a.benchCount,JSON.stringify(ids),JSON.stringify(qs),JSON.stringify(a.rubric),now,now+a.duration*60000,a.classLevel||'all',a.topic||'').run();return {id};
 }
 if(a.action==='joinLab'){
  if(u.role!=='student')throw new AppError(403,'Only students join practicals');const l=need(await one(db,'SELECT * FROM labs WHERE id=?',a.labId));if(l.status!=='active'||l.deadline<=now)throw new AppError(409,'This practical has ended');const id=crypto.randomUUID();await stmt(db,"INSERT INTO lab_entries(id,lab_id,student_id,last_seen) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM labs WHERE id=? AND status='active' AND deadline>?) ON CONFLICT(lab_id,student_id) DO NOTHING",id,l.id,u.id,now,l.id,now).run();return {id:need(await one(db,'SELECT id FROM lab_entries WHERE lab_id=? AND student_id=?',l.id,u.id)).id};
 }
 if(a.action==='endLab'||a.action==='assignBenches'||a.action==='regradeLab'){
  const action=a as Extract<LabAction,{action:'endLab'|'assignBenches'|'regradeLab'}>;const l=await ownLab(db,u,action.labId);
  if(a.action==='endLab'){await stmt(db,"UPDATE labs SET status='ended',ended_at=? WHERE id=? AND status='active'",now,l.id).run();await expireLabs(db,now);return {ok:true}}
  const entries=await all(db,'SELECT * FROM lab_entries WHERE lab_id=? ORDER BY student_id',l.id);
  if(a.action==='assignBenches'){if(l.status!=='active')throw new AppError(409,'This practical has ended');if(entries.length)await db.batch(entries.map((e,i)=>stmt(db,'UPDATE lab_entries SET bench=? WHERE id=?',(i%l.bench_count)+1,e.id)));return {ok:true}}
  const qs=JSON.parse(l.questions);for(const entry of entries.filter(e=>e.status==='submitted')){const g=gradeQuestions(qs,JSON.parse(entry.answers),JSON.parse(entry.per_question));await stmt(db,"UPDATE lab_entries SET score=?,max_score=?,per_question=? WHERE id=? AND status='submitted'",g.score,g.maxScore,JSON.stringify(g.perQuestion),entry.id).run()}return {ok:true};
 }
 if(a.action==='gradeLabEntry'){
  const e=need(await one(db,'SELECT * FROM lab_entries WHERE id=?',a.entryId)),l=await ownLab(db,u,e.lab_id);if(e.status!=='submitted')throw new AppError(409,'Only submitted practicals may be graded');
  const qs:LabQuestion[]=JSON.parse(l.questions),per=JSON.parse(e.per_question),rubric: {name:string;weight:number}[]=JSON.parse(l.rubric);
  for(const [id,mark] of Object.entries(a.marks)){const q=qs.find(q=>q.id===id);if(!q||mark>q.points)throw new AppError(400,'Invalid question mark');per[id]={...per[id],manualScore:mark}}
  if(Object.keys(a.rubric).some(name=>!rubric.some(r=>r.name===name)))throw new AppError(400,'Unknown rubric criterion');
  const g=gradeQuestions(qs,JSON.parse(e.answers),per);await stmt(db,"UPDATE lab_entries SET score=?,max_score=?,per_question=?,teacher_rubric=?,feedback=? WHERE id=? AND status='submitted'",g.score,g.maxScore,JSON.stringify(g.perQuestion),JSON.stringify(a.rubric),a.feedback,e.id).run();return {ok:true};
 }
 const e=await ownEntry(db,u,a.entryId),l=need(await one(db,'SELECT * FROM labs WHERE id=?',e.lab_id));if(e.status!=='active'||l.status!=='active'||l.deadline<=now)throw new AppError(409,'This practical is already submitted or ended');
 if(a.action==='labReady'){await stmt(db,"UPDATE lab_entries SET ready=1,last_seen=? WHERE id=? AND status='active'",now,e.id).run();return {ok:true}}
 if(a.action==='submitLab'){await finalizeEntry(db,e,l,now);const saved=need(await one(db,'SELECT status FROM lab_entries WHERE id=?',e.id));if(saved.status!=='submitted')throw new AppError(409,'Answers changed during submission; retry submitting');return {ok:true}}
 if(a.action==='labSave'){
  let field='',key=a.key;const value=a.value;
  if(a.kind==='answer'){const qs:LabQuestion[]=JSON.parse(l.questions),q=qs.find(q=>q.id===key);if(!q)throw new AppError(400,'Unknown practical question');if(q.type==='mcq'&&(typeof value!=='number'||value>3))throw new AppError(400,'Invalid answer choice');if(q.type==='tf'&&typeof value!=='boolean')throw new AppError(400,'Choose true or false');if(['short','fill'].includes(q.type)&&typeof value!=='string')throw new AppError(400,'Answer text is required');field='answers'}
  if(a.kind==='equipment'){if(!JSON.parse(l.apparatus_ids).includes(key)||typeof value!=='boolean')throw new AppError(400,'Invalid equipment checklist item');field='equipment'}
  if(a.kind==='rubric'){if(!JSON.parse(l.rubric).some((r:any)=>r.name===key)||typeof value!=='number')throw new AppError(400,'Invalid self-assessment');field='self_rubric'}
  if(a.kind==='notes'){if(typeof value!=='string')throw new AppError(400,'Notes must be text');field='notes'}
  // Array-like keys and arbitrary user names never enter a SQL string.
  let saved;
  if(field==='notes')saved=await stmt(db,"UPDATE lab_entries SET notes=?,last_seen=?,version=version+1 WHERE id=? AND status='active' AND EXISTS(SELECT 1 FROM labs WHERE id=lab_entries.lab_id AND status='active' AND deadline>?)",value,now,e.id,now).run();
  else{const path='$.'+JSON.stringify(key);saved=await stmt(db,`UPDATE lab_entries SET ${field}=json_set(${field},?,json(?)),last_seen=?,version=version+1 WHERE id=? AND status='active' AND EXISTS(SELECT 1 FROM labs WHERE id=lab_entries.lab_id AND status='active' AND deadline>?)`,path,JSON.stringify(value),now,e.id,now).run()}
  if(!saved.meta.changes)throw new AppError(409,'The practical ended before the change could be saved');
  return {ok:true};
 }
 throw new AppError(400,'Unknown lab action');
}

function validateTeachingLevel(level:string|undefined,curriculum:string){if(!level||level==='all')return;const expected=['grade-1','grade-2','grade-3','grade-4','grade-5','grade-6'].includes(level)?'cbe-primary':['form-3','form-4'].includes(level)?'844':['grade-7','grade-8','grade-9'].includes(level)?'cbe-junior':'cbe-senior';if(curriculum!==expected)throw new AppError(400,'Choose the curriculum that matches the class level')}
