import {defaultBands,rating,parseAnswerSheet,assignmentAnalysis} from './report';
import {z} from 'zod';
import {AppError,authorizedUser,type User} from '../service';
import {requirePaidAccess} from '../classroom/access';
import {classLevels,subjectsForLevel} from '../teaching/catalog';
const uuid=z.string().uuid();
const question=z.object({text:z.string().trim().min(5).max(2000),choices:z.array(z.string().trim().min(1).max(500)).length(4).refine(a=>new Set(a.map(s=>s.toLowerCase())).size===4,'Use four distinct choices'),correct:z.number().int().min(0).max(3),explanation:z.string().trim().max(2000).default('')});
export const AssignmentAction=z.discriminatedUnion('action',[
 z.object({action:z.literal('saveAssignment'),id:uuid.nullable().default(null),title:z.string().trim().min(3).max(160),instructions:z.string().trim().max(3000).default(''),classLevel:z.string(),subject:z.string(),topic:z.string().trim().min(1).max(160),dueAt:z.number().int().positive().nullable().default(null),gradingBands:z.array(z.object({min:z.number().min(0).max(100),label:z.string().trim().min(1).max(80)})).min(2).max(12).refine(a=>a[a.length-1].min===0&&a.every((v,i)=>i===0||a[i-1].min>v.min)&&new Set(a.map(b=>b.label)).size===a.length,'Use descending unique rating bands ending at 0').optional(),questions:z.array(question).min(1).max(50)}),
 z.object({action:z.literal('publishAssignment'),id:uuid,reviewed:z.literal(true)}),
 z.object({action:z.literal('uploadAssignment'),entryId:uuid,format:z.enum(['csv','text']),content:z.string().trim().min(1).max(30000)}),
 z.object({action:z.literal('markUploadedAssignment'),entryId:uuid,score:z.number().int().min(0),feedback:z.string().trim().min(10).max(3000)}),
 z.object({action:z.literal('closeAssignment'),id:uuid}),
 z.object({action:z.literal('saveAssignmentAnswer'),entryId:uuid,questionId:uuid,choice:z.number().int().min(0).max(3)}),
 z.object({action:z.literal('submitAssignment'),entryId:uuid}),
]);
const st=(db:D1Database,sql:string,...v:unknown[])=>db.prepare(sql).bind(...v);
const one=(db:D1Database,sql:string,...v:unknown[])=>st(db,sql,...v).first<any>();
const all=async(db:D1Database,sql:string,...v:unknown[])=>(await st(db,sql,...v).all<any>()).results;
function need<T>(v:T|null):T{if(!v)throw new AppError(404,'Assignment not found');return v}
export function normalizeClass(s:string){const match=s.toLowerCase().match(/\b(grade|form)[\s-]*(\d+)\b/);return match?match[1]+'-'+match[2]:''}
async function owned(db:D1Database,u:User,id:string){if(u.role==='student')throw new AppError(403,'Teacher access required');const a=need(await one(db,'SELECT * FROM assignments WHERE id=?',id));if(u.role!=='admin'&&a.teacher_id!==u.id)throw new AppError(403,'This assignment belongs to another teacher');return a}
async function learnerEntry(db:D1Database,u:User,id:string,now:number){if(u.role!=='student')throw new AppError(403,'Only learners submit assignments');await requirePaidAccess(db,u,now,'assignment');const entry=need(await one(db,'SELECT e.*,a.status AS assignment_status,a.due_at,a.class_level,a.teacher_id FROM assignment_entries e JOIN assignments a ON a.id=e.assignment_id WHERE e.id=?',id));if(await one(db,"SELECT id FROM sessions WHERE student_id=? AND status IN ('active','paused')",u.id))throw new AppError(409,'Complete the active assessment before opening assignment answers');if(entry.student_id!==u.id)throw new AppError(403,'This assignment belongs to another learner');const admission=await one(db,"SELECT a.*,t.role AS teacher_role FROM admissions a JOIN users t ON t.id=? WHERE a.student_id=? AND a.status='approved'",entry.teacher_id,u.id);if(!admission||normalizeClass(admission.level)!==entry.class_level||(admission.teacher_role!=='admin'&&admission.teacher_id!==entry.teacher_id))throw new AppError(403,'This assignment is for a different class or teacher');return entry}
const scoreSQL=`(SELECT COUNT(*) FROM assignment_questions q WHERE q.assignment_id=assignment_entries.assignment_id AND json_type(assignment_entries.answers,'$."'||q.id||'"')='integer' AND json_extract(assignment_entries.answers,'$."'||q.id||'"')=q.correct)`;
export async function mutateAssignment(db:D1Database,u:User,input:unknown,now=Date.now()):Promise<any>{
 u=await authorizedUser(db,u);
 const parsed=AssignmentAction.safeParse(input);if(!parsed.success)throw new AppError(400,parsed.error.issues.map(i=>i.message).join('; '));const a=parsed.data;
 if(a.action==='saveAssignment'){
  if(u.role==='student')throw new AppError(403,'Teacher access required');
  if(!classLevels.some(c=>c.id===a.classLevel)||!subjectsForLevel(a.classLevel).some(s=>s.id===a.subject))throw new AppError(400,'Choose a valid class and subject');
  if(a.dueAt&&a.dueAt<=now)throw new AppError(400,'The due date must be in the future');
  const previous=a.id?await owned(db,u,a.id):null;if(previous&&previous.status!=='draft')throw new AppError(409,'Published assignments cannot be edited');const id=previous?.id||crypto.randomUUID();
  const first=previous?st(db,"UPDATE assignments SET title=?,instructions=?,class_level=?,subject=?,topic=?,due_at=? WHERE id=? AND status='draft'",a.title,a.instructions,a.classLevel,a.subject,a.topic,a.dueAt,id):st(db,'INSERT INTO assignments(id,teacher_id,title,instructions,class_level,subject,topic,due_at,created_at) VALUES(?,?,?,?,?,?,?,?,?)',id,u.id,a.title,a.instructions,a.classLevel,a.subject,a.topic,a.dueAt,now);
  const results=await db.batch([first,st(db,"DELETE FROM assignment_questions WHERE assignment_id=? AND EXISTS(SELECT 1 FROM assignments WHERE id=? AND status='draft')",id,id),...a.questions.map((q,i)=>st(db,"INSERT INTO assignment_questions(id,assignment_id,position,text,choices,correct,explanation) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM assignments WHERE id=? AND status='draft')",crypto.randomUUID(),id,i,q.text,JSON.stringify(q.choices),q.correct,q.explanation,id))]);
  if(!results[0].meta.changes)throw new AppError(409,'Assignment was already published');await st(db,"UPDATE assignments SET grading_bands=? WHERE id=? AND status='draft'",JSON.stringify(a.gradingBands||defaultBands(a.classLevel)),id).run();return {id};
 }
 if(a.action==='publishAssignment'){
  const assignment=await owned(db,u,a.id);if(assignment.status!=='draft')throw new AppError(409,'Only draft assignments can be published');if(assignment.due_at&&assignment.due_at<=now)throw new AppError(409,'Update the due date before publishing');
  const owner=need(await one(db,'SELECT role FROM users WHERE id=?',assignment.teacher_id));const admitted=await all(db,`SELECT a.student_id,a.level FROM admissions a JOIN users u ON u.id=a.student_id WHERE a.status='approved' AND u.disabled=0 ${owner.role==='admin'?'':'AND a.teacher_id=?'}`,...(owner.role==='admin'?[]:[assignment.teacher_id]));
  const learners=admitted.filter(s=>normalizeClass(s.level)===assignment.class_level);if(!learners.length)throw new AppError(409,'No admitted learners match this class. Check learner admission class settings.');
  const total=(await one(db,'SELECT COUNT(*) AS n FROM assignment_questions WHERE assignment_id=?',a.id)).n;if(!total)throw new AppError(409,'Add questions before publishing');
  await db.batch([...learners.map(s=>st(db,"INSERT INTO assignment_entries(id,assignment_id,student_id,total,assigned_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM assignments WHERE id=? AND status='draft') ON CONFLICT(assignment_id,student_id) DO NOTHING",crypto.randomUUID(),a.id,s.student_id,total,now,a.id)),st(db,"UPDATE assignments SET status='published',published_at=? WHERE id=? AND status='draft'",now,a.id)]);
  return {ok:true,assigned:learners.length};
 }
 if(a.action==='markUploadedAssignment'){const e=need(await one(db,'SELECT * FROM assignment_entries WHERE id=?',a.entryId));await owned(db,u,e.assignment_id);if(e.status!=='pending_review'||!e.uploaded_work)throw new AppError(409,'Only uploaded work awaiting review may be marked');if(a.score>e.total)throw new AppError(400,'Marks exceed the assignment total');const r=await st(db,"UPDATE assignment_entries SET score=?,feedback=?,status='submitted' WHERE id=? AND status='pending_review'",a.score,a.feedback,e.id).run();if(!r.meta.changes)throw new AppError(409,'Already marked');return {score:a.score,total:e.total};}
 if(a.action==='closeAssignment'){await owned(db,u,a.id);await st(db,"UPDATE assignments SET status='closed' WHERE id=? AND status='published'",a.id).run();return {ok:true}}
 const entry=await learnerEntry(db,u,a.entryId,now);
 if(a.action==='submitAssignment'&&entry.status==='submitted')return {score:entry.score,total:entry.total};
 if(entry.status==='pending_review')throw new AppError(409,'Uploaded work is awaiting teacher marking');
 if(entry.status==='submitted')throw new AppError(409,'Submitted answers are locked');
 if(entry.assignment_status!=='published'||(entry.due_at&&now>=entry.due_at))throw new AppError(409,'This assignment has closed. Saved drafts are not ranked.');
 if(a.action==='uploadAssignment'){
  const questions=await all(db,'SELECT id FROM assignment_questions WHERE assignment_id=? ORDER BY position',entry.assignment_id);
  let answers:Record<string,number>={};if(a.format==='csv'){let choices:number[];try{choices=parseAnswerSheet(a.content,questions.length)}catch(e){throw new AppError(400,(e as Error).message)}questions.forEach((q,i)=>answers[q.id]=choices[i]);}
  const r=await st(db,"UPDATE assignment_entries SET answers=?,uploaded_work=?,status=?,submitted_at=? WHERE id=? AND status IN ('assigned','in_progress') AND EXISTS(SELECT 1 FROM assignments a WHERE a.id=assignment_entries.assignment_id AND a.status='published' AND (a.due_at IS NULL OR a.due_at>?))",JSON.stringify(answers),a.format==='text'?a.content:null,a.format==='text'?'pending_review':'in_progress',a.format==='text'?now:null,entry.id,now).run();if(!r.meta.changes)throw new AppError(409,'Submission is locked');
  if(a.format==='text')return {pendingReview:true};return mutateAssignment(db,u,{action:'submitAssignment',entryId:entry.id},now);
 }
 if(a.action==='saveAssignmentAnswer'){
  if(!await one(db,'SELECT id FROM assignment_questions WHERE id=? AND assignment_id=?',a.questionId,entry.assignment_id))throw new AppError(400,'Question does not belong to this assignment');
  const result=await st(db,`UPDATE assignment_entries SET answers=json_set(answers,?,CAST(? AS INTEGER)),status='in_progress' WHERE id=? AND status IN ('assigned','in_progress') AND EXISTS(SELECT 1 FROM assignments a WHERE a.id=assignment_entries.assignment_id AND a.status='published' AND (a.due_at IS NULL OR a.due_at>?))`,'$."'+a.questionId+'"',a.choice,entry.id,now).run();if(!result.meta.changes)throw new AppError(409,'Answers are locked');return {ok:true};
 }
 await st(db,`UPDATE assignment_entries SET score=${scoreSQL},status='submitted',submitted_at=? WHERE id=? AND status IN ('assigned','in_progress') AND EXISTS(SELECT 1 FROM assignments a WHERE a.id=assignment_entries.assignment_id AND a.status='published' AND (a.due_at IS NULL OR a.due_at>?))`,now,entry.id,now).run();
 const result=need(await one(db,'SELECT score,total,status FROM assignment_entries WHERE id=?',entry.id));if(result.status!=='submitted')throw new AppError(409,'This assignment has closed');return {score:result.score,total:result.total};
}
export async function readAssignments(db:D1Database,u:User,now=Date.now()){
 u=await authorizedUser(db,u);const student=u.role==='student';if(student)await requirePaidAccess(db,u,now,'assignment');
 const scope=student?'EXISTS(SELECT 1 FROM assignment_entries e WHERE e.assignment_id=a.id AND e.student_id=?)':u.role==='teacher'?'a.teacher_id=?':'1=1';const args=student||u.role==='teacher'?[u.id]:[];
 let assignments=await all(db,`SELECT a.*,t.name AS teacher_name,t.role AS author_role FROM assignments a JOIN users t ON t.id=a.teacher_id WHERE ${scope} ORDER BY a.created_at DESC`,...args);
 if(student){
  const admission=await one(db,"SELECT * FROM admissions WHERE student_id=? AND status='approved'",u.id);
  const completed=await all(db,"SELECT assignment_id FROM assignment_entries WHERE student_id=? AND status='submitted'",u.id);
  assignments=assignments.filter(a=>completed.some(e=>e.assignment_id===a.id)||(admission&&normalizeClass(admission.level)===a.class_level&&(a.author_role==='admin'||admission.teacher_id===a.teacher_id)));
 }
 const questions=await all(db,`SELECT q.id,q.assignment_id,q.position,q.text,q.choices ${student?'':',q.correct,q.explanation'} FROM assignment_questions q JOIN assignments a ON a.id=q.assignment_id WHERE ${scope} ORDER BY q.position`,...args);
 const entries=await all(db,`SELECT e.*,s.name AS student_name FROM assignment_entries e JOIN assignments a ON a.id=e.assignment_id JOIN users s ON s.id=e.student_id WHERE ${scope} ${student?'AND e.student_id=?':''} ORDER BY e.assigned_at DESC`,...args,...(student?[u.id]:[]));
 const rankings=await all(db,`SELECT * FROM (SELECT e.id,e.assignment_id,e.student_id,${student?"''":"s.name"} AS student_name,e.score,e.total,RANK() OVER(PARTITION BY e.assignment_id ORDER BY e.score DESC) AS rank,COUNT(*) OVER(PARTITION BY e.assignment_id) AS ranked_count FROM assignment_entries e JOIN assignments a ON a.id=e.assignment_id JOIN users s ON s.id=e.student_id WHERE e.status='submitted' AND ${student?'1=1':scope}) ${student?'WHERE student_id=?':''} ORDER BY assignment_id,rank,student_name`,...(student?[u.id]:args));
 const analyses=student?[]:assignments.map(a=>({assignmentId:a.id,...assignmentAnalysis(questions.filter(q=>q.assignment_id===a.id),entries.filter(e=>e.assignment_id===a.id).map(e=>({...e,answers:JSON.parse(e.answers)})),JSON.parse(a.grading_bands||JSON.stringify(defaultBands(a.class_level))))}));
 return {assignmentAnalyses:analyses,assignments:assignments.map(a=>({...a,gradingBands:JSON.parse(a.grading_bands||JSON.stringify(defaultBands(a.class_level))),questions:questions.filter(q=>q.assignment_id===a.id).map(q=>({...q,choices:JSON.parse(q.choices)}))})),assignmentEntries:entries.filter(e=>assignments.some(a=>a.id===e.assignment_id)).map(e=>{const a=assignments.find(a=>a.id===e.assignment_id);return {...e,answers:JSON.parse(e.answers),rating:e.status==='submitted'?rating(e.score,e.total,JSON.parse(a.grading_bands||JSON.stringify(defaultBands(a.class_level)))):null}}),assignmentRankings:rankings.filter(r=>assignments.some(a=>a.id===r.assignment_id))};
}
