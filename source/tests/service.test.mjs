import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import ts from 'typescript';
fs.mkdirSync('.sites-runtime',{recursive:true});
fs.writeFileSync('.sites-runtime/service-test.mjs',ts.transpileModule(fs.readFileSync('app/service.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
fs.writeFileSync('.sites-runtime/payment-review-test.mjs',ts.transpileModule(fs.readFileSync('app/payments/review.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("'../service'","'./service-test.mjs'"));
fs.writeFileSync('.sites-runtime/registration-contact-test.mjs',ts.transpileModule(fs.readFileSync('app/registration/contact.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("'../service'","'./service-test.mjs'"));
fs.writeFileSync('.sites-runtime/catalog-test.mjs',ts.transpileModule(fs.readFileSync('app/lab/catalog.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
fs.writeFileSync('.sites-runtime/orientation-test.mjs',ts.transpileModule(fs.readFileSync('app/orientation/access.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("'../classroom/enrollment'","'./enrollment-test.mjs'"));
for(const [src,out,replacements] of [
 ['app/classroom/enrollment.ts','enrollment',[["'../service'","'./service-test.mjs'"]]],
 ['app/classroom/lifecycle.ts','lesson-lifecycle',[]],
 ['app/classroom/access.ts','class-access',[["'../orientation/access'","'./orientation-test.mjs'"],["'../service'","'./service-test.mjs'"]]],
 ['app/classroom/service.ts','classroom',[["'./enrollment'","'./enrollment-test.mjs'"],["'./lifecycle'","'./lesson-lifecycle-test.mjs'"],["'../service'","'./service-test.mjs'"],["'./access'","'./class-access-test.mjs'"]]],
 ['app/virtual-lab/model.ts','virtual-model',[]],
 ['app/virtual-lab/service.ts','virtual',[["'../service'","'./service-test.mjs'"],["'./model'","'./virtual-model-test.mjs'"]]],
]){let text=ts.transpileModule(fs.readFileSync(src,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;for(const [a,b] of replacements)text=text.replaceAll(a,b);fs.writeFileSync('.sites-runtime/'+out+'-test.mjs',text)}
const {refreshAccess,requirePaidAccess,verifyLoginId,readAccessAlerts,sweepUnpaidSessions,accessState}=await import('../.sites-runtime/class-access-test.mjs');
const {mutateClassroom,readClassroom,readSignals,validateStreamUrl}=await import('../.sites-runtime/classroom-test.mjs');
const {calculateVirtual,mutateVirtual,readVirtual,VirtualAction}=await import('../.sites-runtime/virtual-test.mjs');
fs.writeFileSync('.sites-runtime/teaching-catalog-test.mjs',ts.transpileModule(fs.readFileSync('app/teaching/catalog.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
for(const [src,out,replacements] of [
 ['app/orientation/access.ts','orientation',[["'../classroom/enrollment'","'./enrollment-test.mjs'"]]],
 ['app/orientation/service.ts','orientation-service',[["'../service'","'./service-test.mjs'"]]],
 ['app/assignments/draft.ts','assignment-draft',[]],
 ['app/assignments/report.ts','assignment-report',[]],
 ['app/subject-store/access.ts','subject-access',[["'../service'","'./service-test.mjs'"],["'../orientation/access'","'./orientation-test.mjs'"],["'../classroom/access'","'./class-access-test.mjs'"],["'../classroom/enrollment'","'./enrollment-test.mjs'"],["'../teaching/catalog'","'./teaching-catalog-test.mjs'"]]],
 ['app/subject-store/questions.ts','subject-questions',[["'./access'","'./subject-access-test.mjs'"],["'../assignments/draft'","'./assignment-draft-test.mjs'"],["'../teaching/catalog'","'./teaching-catalog-test.mjs'"]]],
 ['app/subject-store/service.ts','subject-store',[["'../assignments/draft'","'./assignment-draft-test.mjs'"],["'./access'","'./subject-access-test.mjs'"],["'./questions'","'./subject-questions-test.mjs'"],["'../service'","'./service-test.mjs'"]]],
]){let text=ts.transpileModule(fs.readFileSync(src,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;for(const [a,b] of replacements)text=text.replaceAll(a,b);fs.writeFileSync('.sites-runtime/'+out+'-test.mjs',text)}
const {readOrientation}=await import('../.sites-runtime/orientation-service-test.mjs');
const {readStore,mutateStore}=await import('../.sites-runtime/subject-store-test.mjs');
const {requireTutorialVideo}=await import('../.sites-runtime/subject-access-test.mjs');
const {parseAnswerSheet,rating,defaultBands}=await import('../.sites-runtime/assignment-report-test.mjs');
fs.writeFileSync('.sites-runtime/lab-service-test.mjs',ts.transpileModule(fs.readFileSync('app/lab/service.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("'../service'","'./service-test.mjs'").replace("'../subject-store/questions'","'./subject-questions-test.mjs'").replace("'../orientation/access'","'./orientation-test.mjs'").replace("'./catalog'","'./catalog-test.mjs'").replace("'../teaching/catalog'","'./teaching-catalog-test.mjs'").replace("'../classroom/access'","'./class-access-test.mjs'"));
const {mutateFeature,readFeatures,gradeQuestions,LabActionSchema}=await import('../.sites-runtime/lab-service-test.mjs');
const {apparatus}=await import('../.sites-runtime/catalog-test.mjs');
const {initializeUser,initializeAdmissionUser,admissionApplicant,mutate,readState,ActionSchema}=await import('../.sites-runtime/service-test.mjs');
fs.writeFileSync('.sites-runtime/account-state-test.mjs',ts.transpileModule(fs.readFileSync('app/portals/account-state.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("'../service'","'./service-test.mjs'"));
const {loadAccount}=await import('../.sites-runtime/account-state-test.mjs');
fs.writeFileSync('.sites-runtime/portal-test.mjs',ts.transpileModule(fs.readFileSync('app/portals/service.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("'../registration/contact'","'./registration-contact-test.mjs'").replace("'../service'","'./service-test.mjs'"));
const {mutatePortal,readPortalAccounts,portalPath,PortalActionSchema}=await import('../.sites-runtime/portal-test.mjs');
fs.writeFileSync('.sites-runtime/engagement-test.mjs',ts.transpileModule(fs.readFileSync('app/engagement/service.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("'../payments/review'","'./payment-review-test.mjs'").replace("'../registration/contact'","'./registration-contact-test.mjs'").replace("'../classroom/enrollment'","'./enrollment-test.mjs'").replace("'../orientation/access'","'./orientation-test.mjs'").replace("'../service'","'./service-test.mjs'").replace("'../classroom/access'","'./class-access-test.mjs'"));
const {EngagementSchema,mutateEngagement,readEngagement,admissionState,requireAdmitted,maintenance,automationQueue,automate,initializePolicy,grantEarnedCredit,canReadLesson}=await import('../.sites-runtime/engagement-test.mjs');
for(const [src,out,replacements] of [
 ['app/classroom/preparation.ts','preparation',[["'./enrollment'","'./enrollment-test.mjs'"],["'./lifecycle'","'./lesson-lifecycle-test.mjs'"],["'../service'","'./service-test.mjs'"],["'./access'","'./class-access-test.mjs'"],["'./service'","'./classroom-test.mjs'"]]],
 ['app/payments/service.ts','payment',[["'../service'","'./service-test.mjs'"],["'../classroom/access'","'./class-access-test.mjs'"],["'../engagement/service'","'./engagement-test.mjs'"]]],
]){let text=ts.transpileModule(fs.readFileSync(src,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;for(const [a,b] of replacements)text=text.replaceAll(a,b);fs.writeFileSync('.sites-runtime/'+out+'-test.mjs',text)}
const {mutatePreparation,readPreparation}=await import('../.sites-runtime/preparation-test.mjs');
const {mutatePayment,readPayments,paymentConfiguration,reconcilePayments,acceptPaymentCallback,verifyCallbackPayment,readStudentPaymentAdmin}=await import('../.sites-runtime/payment-test.mjs');
fs.writeFileSync('.sites-runtime/audio-test.mjs',ts.transpileModule(fs.readFileSync('app/classroom/audio.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
const {parseAudioOptions,defaultAudioOptions,audioConstraints,microphoneError}=await import('../.sites-runtime/audio-test.mjs');
fs.writeFileSync('.sites-runtime/clips-service-test.mjs',ts.transpileModule(fs.readFileSync('app/virtual-lab/clips-service.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("'../service'","'./service-test.mjs'"));
const {ClipMetadata,ClipAction,updateClip}=await import('../.sites-runtime/clips-service-test.mjs');
fs.writeFileSync('.sites-runtime/clip-storage-test.mjs',ts.transpileModule(fs.readFileSync('app/virtual-lab/clip-storage.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("'../service'","'./service-test.mjs'"));
const {storeClip}=await import('../.sites-runtime/clip-storage-test.mjs');
fs.writeFileSync('.sites-runtime/video-access-test.mjs',ts.transpileModule(fs.readFileSync('app/virtual-lab/video-access.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("'../orientation/access'","'./orientation-test.mjs'").replace("'../service'","'./service-test.mjs'").replace("'../classroom/access'","'./class-access-test.mjs'"));
const {authorizeVideo,videoRange}=await import('../.sites-runtime/video-access-test.mjs');

for(const [src,out,replacements] of [
 ['app/assignments/service.ts','assignments',[["'./report'","'./assignment-report-test.mjs'"],["'../service'","'./service-test.mjs'"],["'../classroom/access'","'./class-access-test.mjs'"],["'../teaching/catalog'","'./teaching-catalog-test.mjs'"]]],
 ['app/assignments/draft.ts','assignment-draft',[]],
]){let text=ts.transpileModule(fs.readFileSync(src,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;for(const [a,b] of replacements)text=text.replaceAll(a,b);fs.writeFileSync('.sites-runtime/'+out+'-test.mjs',text)}
const {mutateAssignment,readAssignments,AssignmentAction,normalizeClass}=await import('../.sites-runtime/assignments-test.mjs');
const {draftFromNotes}=await import('../.sites-runtime/assignment-draft-test.mjs');
fs.writeFileSync('.sites-runtime/note-sources-test.mjs',ts.transpileModule(fs.readFileSync('app/assignments/note-sources.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
const {sourcesForTopic}=await import('../.sites-runtime/note-sources-test.mjs');


let chatCode=ts.transpileModule(fs.readFileSync('app/chat/service.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
for(const [a,b] of [["'../service'","'./service-test.mjs'"],["'../classroom/access'","'./class-access-test.mjs'"],["'../engagement/service'","'./engagement-test.mjs'"],["'../assignments/service'","'./assignments-test.mjs'"],["'../teaching/catalog'","'./teaching-catalog-test.mjs'"]])chatCode=chatCode.replaceAll(a,b);
fs.writeFileSync('.sites-runtime/chat-test.mjs',chatCode);
const {mutateChat,readChat,ChatAction}=await import('../.sites-runtime/chat-test.mjs');

class D1 {
 constructor(){this.sqlite=new DatabaseSync(':memory:');for(const migration of fs.readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort())this.sqlite.exec(fs.readFileSync('drizzle/'+migration,'utf8'));this.sqlite.exec('PRAGMA foreign_keys=ON')}
 prepare(sql){const statement=this.sqlite.prepare(sql);const bind=(...values)=>({bind,first:async()=>statement.get(...values)||null,all:async()=>({results:statement.all(...values)}),run:async()=>{const info=statement.run(...values);return {meta:{changes:Number(info.changes)}}}});return bind()}
 async batch(statements){this.sqlite.exec('BEGIN');try{const r=[];for(const s of statements)r.push(await s.run());this.sqlite.exec('COMMIT');return r}catch(e){this.sqlite.exec('ROLLBACK');throw e}}
}
let db,admin,teacher,other,student,student2;const NOW=2000000000000;
const identity=(id,email,name)=>({userId:id,email,displayName:name});
beforeEach(async()=>{db=new D1();admin=await initializeUser(db,identity('owner','owner@example.test','Owner'),'owner@example.test',NOW);teacher=await initializeUser(db,identity('teacher','teacher@example.test','Teacher'),'owner@example.test',NOW);other=await initializeUser(db,identity('other','other@example.test','Other Teacher'),'owner@example.test',NOW);student=await initializeUser(db,identity('student','student@example.test','Student'),'owner@example.test',NOW);student2=await initializeUser(db,identity('student2','student2@example.test','Student Two'),'owner@example.test',NOW);for(const u of [teacher,other]){await mutate(db,admin,{action:'userRole',userId:u.id,role:'teacher',disabled:false},NOW);u.role='teacher'}});
const q=(correct=2)=>({text:'15% of 200?',choices:['10','20','30','40'],correct});
async function exam(options={}){const {id}=await mutate(db,teacher,{action:'createExam',title:'Math',description:'Practice',duration:10,startsAt:null,endsAt:null,questions:[q(),q(1)],...options},NOW);return id}
async function start(id,user=student,time=NOW){await mutate(db,teacher,{action:'examStatus',examId:id,status:'published'},NOW);return (await mutate(db,user,{action:'start',examId:id},time)).id}
const reject=(promise,status)=>assert.rejects(promise,e=>e.status===status);
test('only verified owner is admin and repeated sign-in preserves assigned role',async()=>{assert.equal(admin.role,'admin');assert.equal(student.role,'student');const again=await initializeUser(db,identity('teacher','teacher@example.test','Teacher'),'owner@example.test',NOW);assert.equal(again.role,'teacher')});
test('student cannot create exams or promote themselves',async()=>{await reject(mutate(db,student,{action:'createExam',title:'X',duration:10,questions:[q()]},NOW),403);await reject(mutate(db,student,{action:'userRole',userId:student.id,role:'teacher',disabled:false},NOW),403)});
test('teachers cannot read or change another teacher exam or sessions',async()=>{const id=await exam();const sid=await start(id);const state=await readState(db,other,NOW);assert.equal(state.exams.length,0);assert.equal(state.sessions.length,0);await reject(mutate(db,other,{action:'teacherAction',sessionId:sid,kind:'terminate',message:''},NOW),403);await reject(mutate(db,other,{action:'examStatus',examId:id,status:'closed'},NOW),403)});
test('student receives no correct answers and sees only owned sessions',async()=>{const id=await exam();await start(id);const s=await readState(db,student,NOW);assert.equal(s.exams[0].questions[0].correct,undefined);assert.equal((await readState(db,student2,NOW)).sessions.length,0)});
test('heartbeat, answers, and events reject other student session IDs',async()=>{const sid=await start(await exam());for(const a of [{action:'heartbeat'},{action:'answer',position:0,choice:2},{action:'event',code:'tab_switch'},{action:'submit'}])await reject(mutate(db,student2,{...a,sessionId:sid},NOW),403)});
test('server saves, grades, and permanently locks submitted answers',async()=>{const sid=await start(await exam());await mutate(db,student,{action:'answer',sessionId:sid,position:0,choice:2},NOW+1000);await mutate(db,student,{action:'answer',sessionId:sid,position:1,choice:1},NOW+2000);await mutate(db,student,{action:'submit',sessionId:sid},NOW+3000);const s=(await readState(db,student,NOW+4000)).sessions[0];assert.equal(s.score,2);assert.equal(s.status,'submitted');await reject(mutate(db,student,{action:'answer',sessionId:sid,position:0,choice:0},NOW+4000),409)});
test('separate question saves do not overwrite other answers',async()=>{const sid=await start(await exam());await Promise.all([mutate(db,student,{action:'answer',sessionId:sid,position:0,choice:2},NOW+1),mutate(db,student,{action:'answer',sessionId:sid,position:1,choice:1},NOW+2)]);const s=(await readState(db,student,NOW+100)).sessions[0];assert.deepEqual(s.answers,{'0':2,'1':1})});
test('empty answers score zero including a zero-index correct choice',async()=>{const sid=await start(await exam({questions:[q(0)]}));await mutate(db,student,{action:'submit',sessionId:sid},NOW+10);assert.equal((await readState(db,student,NOW+100)).sessions[0].score,0)});
test('repeat starts reuse one attempt, including after completion',async()=>{const id=await exam(),sid=await start(id);assert.equal((await mutate(db,student,{action:'start',examId:id},NOW+1)).id,sid);await mutate(db,student,{action:'submit',sessionId:sid},NOW+2);assert.equal((await mutate(db,student,{action:'start',examId:id},NOW+3)).id,sid);assert.equal((await readState(db,teacher,NOW+4)).sessions.length,1)});
test('time expiry auto-grades and rejects late answers',async()=>{const sid=await start(await exam({duration:1}));await mutate(db,student,{action:'answer',sessionId:sid,position:0,choice:2},NOW+1);await reject(mutate(db,student,{action:'answer',sessionId:sid,position:1,choice:1},NOW+60001),409);const s=(await readState(db,student,NOW+60002)).sessions[0];assert.equal(s.status,'submitted');assert.equal(s.score,1)});
test('pausing locks answers and resumes with remaining time',async()=>{const sid=await start(await exam({duration:1}));await mutate(db,teacher,{action:'teacherAction',sessionId:sid,kind:'pause',message:''},NOW+10000);await reject(mutate(db,student,{action:'answer',sessionId:sid,position:0,choice:2},NOW+20000),409);await mutate(db,teacher,{action:'teacherAction',sessionId:sid,kind:'resume',message:''},NOW+90000);const s=(await readState(db,student,NOW+90000)).sessions[0];assert.equal(s.deadline,NOW+140000);assert.equal(s.status,'active')});
test('scheduled closing time caps timer and finalizes paused sessions',async()=>{const sid=await start(await exam({endsAt:NOW+30000}));const s=(await readState(db,student,NOW)).sessions[0];assert.equal(s.deadline,NOW+30000);await mutate(db,teacher,{action:'teacherAction',sessionId:sid,kind:'pause',message:''},NOW+10000);assert.equal((await readState(db,student,NOW+30001)).sessions[0].status,'submitted')});
test('future exams cannot be started early',async()=>{const id=await exam({startsAt:NOW+60000});await mutate(db,teacher,{action:'examStatus',examId:id,status:'published'},NOW);await reject(mutate(db,student,{action:'start',examId:id},NOW),409)});
test('published exams are immutable and closed exams reject new attempts',async()=>{const id=await exam();await start(id);await reject(mutate(db,teacher,{action:'addQuestion',examId:id,question:q()},NOW+1),409);await mutate(db,teacher,{action:'examStatus',examId:id,status:'closed'},NOW+2);await reject(mutate(db,student2,{action:'start',examId:id},NOW+3),409);assert.equal((await readState(db,student,NOW+4)).sessions[0].status,'active')});
test('events flag sessions without automatic guilty verdicts and deduplicate',async()=>{const sid=await start(await exam());for(let i=1;i<=2;i++)await mutate(db,student,{action:'event',sessionId:sid,code:'tab_switch'},NOW+i);let d=await readState(db,teacher,NOW+3);assert.equal(d.events.filter(e=>e.code==='tab_switch').length,1);assert.equal(d.sessions[0].flagged,1);assert.equal(d.sessions[0].warnings,0);assert.equal(d.sessions[0].status,'active');await mutate(db,teacher,{action:'teacherAction',sessionId:sid,kind:'dismiss_flag',message:''},NOW+4);assert.equal((await readState(db,teacher,NOW+5)).sessions[0].flagged,0)});
test('teacher warnings are logged and termination cannot be resumed',async()=>{const sid=await start(await exam());await mutate(db,teacher,{action:'teacherAction',sessionId:sid,kind:'warn',message:'Please focus'},NOW+1);const d=await readState(db,student,NOW+2);assert.equal(d.sessions[0].warnings,1);assert.equal(d.events[0].message,'Please focus');await mutate(db,teacher,{action:'teacherAction',sessionId:sid,kind:'terminate',message:''},NOW+3);await reject(mutate(db,teacher,{action:'teacherAction',sessionId:sid,kind:'resume',message:''},NOW+4),409)});
test('disabled accounts cannot sign in and administrator cannot be demoted',async()=>{await mutate(db,admin,{action:'userRole',userId:student.id,role:'student',disabled:true},NOW);await reject(initializeUser(db,identity('student','student@example.test','Student'),'owner@example.test',NOW),403);await reject(mutate(db,admin,{action:'userRole',userId:admin.id,role:'student',disabled:false},NOW),400)});
test('input validation rejects malformed actions and ignores client score fields',()=>{assert.equal(ActionSchema.safeParse({action:'answer',sessionId:'not-an-id',position:0,choice:9}).success,false);assert.equal(ActionSchema.safeParse({action:'createExam',title:'   ',duration:1,questions:[q()]}).success,false);const parsed=ActionSchema.parse({action:'submit',sessionId:crypto.randomUUID(),score:100});assert.equal(parsed.score,undefined)});
const labqs=()=>[{type:'mcq',prompt:'Which item measures liquids?',options:['Cylinder','Mirror','Wire','Magnet'],correct:0,keywords:[],points:2},{type:'tf',prompt:'Wear eye protection.',options:[],correct:true,keywords:[],points:1},{type:'fill',prompt:'A device for viewing cells is a ___',options:[],correct:'microscope',keywords:[],points:2},{type:'short',prompt:'Explain safe practice',options:[],correct:'Wear eye protection and report spills',keywords:['eye protection','report spills'],points:4}];
async function lab(options={}){return (await mutateFeature(db,teacher,{action:'createLab',title:'Science practical',subject:'general',curriculum:'cbe-junior',safety:'Follow teacher directions',duration:10,benchCount:2,apparatusIds:[apparatus[0].id],questions:labqs(),rubric:[{name:'Technique',weight:60},{name:'Safety',weight:40}],...options},NOW)).id}
async function lesson(price=50){return (await mutateFeature(db,teacher,{action:'createLesson',title:'Cells',summary:'Microscope basics',content:'PRIVATE LESSON BODY',subject:'biology',curriculum:'cbe-junior',price},NOW)).id}
async function settings(){return mutateFeature(db,admin,{action:'paymentSettings',businessNumber:'123456',accountReference:'LESSON',instructions:'Example test settings'},NOW)}
test('catalogue imports all 118 source cards with stable IDs',()=>{assert.equal(apparatus.length,118);assert.equal(new Set(apparatus.map(a=>a.id)).size,118);assert.ok(apparatus.every(a=>a.name&&a.uses&&a.safety))});
test('paid lesson body is absent from student responses until admin verifies receipt',async()=>{const id=await lesson();await settings();let d=await readFeatures(db,student,NOW);assert.equal(d.lessons[0].content,undefined);assert.equal(d.lessons[0].unlocked,false);const {id:paymentId}=await mutateFeature(db,student,{action:'claimPayment',lessonId:id,phone:'0712345678',receipt:'ABC1234567'},NOW+1);d=await readFeatures(db,student,NOW+2);assert.equal(d.lessons[0].content,undefined);assert.equal(d.payments.length,0);const ledger=await readFeatures(db,admin,NOW+2);assert.equal(ledger.payments[0].amount,50);assert.equal(ledger.payments[0].phone,'254712345678');await mutateFeature(db,admin,{action:'reviewPayment',paymentId,status:'verified',note:'Checked statement'},NOW+3);d=await readFeatures(db,student,NOW+4);assert.equal(d.lessons[0].content,'PRIVATE LESSON BODY');assert.equal(d.lessons[0].unlocked,true);assert.equal((await readFeatures(db,student2,NOW+4)).lessons[0].content,undefined)});
test('free lessons unlock without payment and archived lessons are hidden',async()=>{const id=await lesson(0);assert.equal((await readFeatures(db,student,NOW)).lessons[0].content,'PRIVATE LESSON BODY');await mutateFeature(db,teacher,{action:'lessonStatus',lessonId:id,status:'archived'},NOW);assert.equal((await readFeatures(db,student,NOW)).lessons.length,0)});
test('students cannot create lessons, configure payments, or verify receipts',async()=>{const id=await lesson();await settings();await reject(mutateFeature(db,student,{action:'createLesson',title:'X',summary:'',content:'X',price:0,subject:'general',curriculum:'844'},NOW),403);await reject(mutateFeature(db,student,{action:'paymentSettings',businessNumber:'123456',accountReference:'X',instructions:''},NOW),403);const {id:paymentId}=await mutateFeature(db,student,{action:'claimPayment',lessonId:id,phone:'0712345678',receipt:'ABC1234567'},NOW);await reject(mutateFeature(db,student,{action:'reviewPayment',paymentId,status:'verified',note:'Fake'},NOW),403)});
test('payment receipts are unique and another teacher cannot unlock lesson',async()=>{const id=await lesson();await settings();const {id:paymentId}=await mutateFeature(db,student,{action:'claimPayment',lessonId:id,phone:'0712345678',receipt:'ABC1234567'},NOW);await reject(mutateFeature(db,student2,{action:'claimPayment',lessonId:id,phone:'0712345678',receipt:'abc1234567'},NOW),409);await reject(mutateFeature(db,other,{action:'reviewPayment',paymentId,status:'verified',note:'Unauthorized'},NOW),403);assert.equal((await readFeatures(db,other,NOW)).payments.length,0);assert.equal((await readFeatures(db,student2,NOW)).payments.length,0)});
test('rejected receipts do not unlock content and lack of settings prevents claim',async()=>{const id=await lesson();await reject(mutateFeature(db,student,{action:'claimPayment',lessonId:id,phone:'0712345678',receipt:'ABC1234567'},NOW),409);await settings();const {id:paymentId}=await mutateFeature(db,student,{action:'claimPayment',lessonId:id,phone:'0712345678',receipt:'ABC1234567'},NOW);await mutateFeature(db,admin,{action:'reviewPayment',paymentId,status:'rejected',note:'Not on statement'},NOW);assert.equal((await readFeatures(db,student,NOW)).lessons[0].unlocked,false)});
test('lab questions and lesson keys remain protected from other accounts',async()=>{await lab();const d=await readFeatures(db,student,NOW);for(const q of d.labs[0].questions){assert.equal(q.correct,undefined);assert.equal(q.keywords,undefined)}assert.equal((await readFeatures(db,other,NOW)).labs.length,0)});
test('lab self-enrolment is idempotent and cross-student writes are rejected',async()=>{const labId=await lab(),{id:entryId}=await mutateFeature(db,student,{action:'joinLab',labId},NOW);assert.equal((await mutateFeature(db,student,{action:'joinLab',labId},NOW)).id,entryId);await reject(mutateFeature(db,student2,{action:'labReady',entryId},NOW),403);await reject(mutateFeature(db,student2,{action:'submitLab',entryId},NOW),403);assert.equal((await readFeatures(db,student2,NOW)).labEntries.length,0)});
test('bench assignment supports groups and keeps values within range',async()=>{const labId=await lab({benchCount:1});await mutateFeature(db,student,{action:'joinLab',labId},NOW);await mutateFeature(db,student2,{action:'joinLab',labId},NOW);await mutateFeature(db,teacher,{action:'assignBenches',labId},NOW);const d=await readFeatures(db,teacher,NOW);assert.equal(d.labEntries.length,2);assert.ok(d.labEntries.every(e=>e.bench===1))});
test('mixed-type responses save separately, readiness and checklist are durable',async()=>{const labId=await lab(),{id:entryId}=await mutateFeature(db,student,{action:'joinLab',labId},NOW);const qs=(await readFeatures(db,teacher,NOW)).labs[0].questions;const answers=[0,true,' MICROSCOPE ','eye protection'];for(let i=0;i<qs.length;i++)await mutateFeature(db,student,{action:'labSave',entryId,kind:'answer',key:qs[i].id,value:answers[i]},NOW+i);await mutateFeature(db,student,{action:'labSave',entryId,kind:'equipment',key:apparatus[0].id,value:true},NOW+5);await mutateFeature(db,student,{action:'labSave',entryId,kind:'rubric',key:'Safety',value:95},NOW+6);await mutateFeature(db,student,{action:'labSave',entryId,kind:'notes',key:'',value:'Observed cells'},NOW+7);await mutateFeature(db,student,{action:'labReady',entryId},NOW+8);await mutateFeature(db,student,{action:'submitLab',entryId},NOW+9);const e=(await readFeatures(db,student,NOW+10)).labEntries[0];assert.equal(e.score,7);assert.equal(e.max_score,9);assert.equal(e.ready,1);assert.equal(e.equipment[apparatus[0].id],true);assert.equal(e.notes,'Observed cells');assert.equal(e.self_rubric.Safety,95);assert.equal(e.per_question[qs[3].id].reviewRequired,true);assert.deepEqual(e.teacher_rubric,{});await reject(mutateFeature(db,student,{action:'labSave',entryId,kind:'notes',key:'',value:'Changed'},NOW+11),409)});
test('short-answer suggestions require review and teacher overrides survive regrading',async()=>{const labId=await lab(),{id:entryId}=await mutateFeature(db,student,{action:'joinLab',labId},NOW);const qs=(await readFeatures(db,teacher,NOW)).labs[0].questions;await mutateFeature(db,student,{action:'submitLab',entryId},NOW);await mutateFeature(db,teacher,{action:'gradeLabEntry',entryId,marks:{[qs[3].id]:3},rubric:{Technique:80,Safety:90},feedback:'Good practical work'},NOW+1);await mutateFeature(db,teacher,{action:'regradeLab',labId},NOW+2);const e=(await readFeatures(db,student,NOW+3)).labEntries[0];assert.equal(e.score,3);assert.equal(e.per_question[qs[3].id].reviewRequired,false);assert.equal(e.teacher_rubric.Safety,90);assert.equal(e.feedback,'Good practical work');await reject(mutateFeature(db,other,{action:'gradeLabEntry',entryId,marks:{},rubric:{},feedback:''},NOW),403)});
test('lab expiry submits saved answers, ends practical, and locks late changes',async()=>{const labId=await lab({duration:1}),{id:entryId}=await mutateFeature(db,student,{action:'joinLab',labId},NOW);const qs=(await readFeatures(db,teacher,NOW)).labs[0].questions;await mutateFeature(db,student,{action:'labSave',entryId,kind:'answer',key:qs[0].id,value:0},NOW+1);const d=await readFeatures(db,student,NOW+60001);assert.equal(d.labs[0].status,'ended');assert.equal(d.labEntries[0].status,'submitted');assert.equal(d.labEntries[0].score,2);await reject(mutateFeature(db,student,{action:'labSave',entryId,kind:'notes',key:'',value:'Late'},NOW+60002),409)});
test('teacher ending a lab finalizes saved entries and rejects new students',async()=>{const labId=await lab();await mutateFeature(db,student,{action:'joinLab',labId},NOW);await reject(mutateFeature(db,other,{action:'endLab',labId},NOW),403);await mutateFeature(db,teacher,{action:'endLab',labId},NOW+1);assert.equal((await readFeatures(db,student,NOW+2)).labEntries[0].status,'submitted');await reject(mutateFeature(db,student2,{action:'joinLab',labId},NOW+2),409)});
test('lab validates catalogue IDs, rubric totals, and answer type',async()=>{await reject(lab({apparatusIds:['fake']}),400);await reject(lab({rubric:[{name:'Technique',weight:50}]}),400);const labId=await lab(),{id:entryId}=await mutateFeature(db,student,{action:'joinLab',labId},NOW),qs=(await readFeatures(db,teacher,NOW)).labs[0].questions;await reject(mutateFeature(db,student,{action:'labSave',entryId,kind:'answer',key:qs[1].id,value:'true'},NOW),400);assert.equal(LabActionSchema.safeParse({action:'gradeLabEntry',entryId,marks:{x:200},rubric:{},feedback:''}).success,false)});
test('optional local face-check signals flag sessions for human review',async()=>{const sid=await start(await exam());for(const code of ['no_face','multiple_faces','off_center']){assert.equal(ActionSchema.safeParse({action:'event',sessionId:sid,code}).success,true);await mutate(db,student,{action:'event',sessionId:sid,code},NOW+1)}const d=await readState(db,teacher,NOW+2);assert.equal(d.sessions[0].status,'active');assert.equal(d.sessions[0].flagged,1);assert.equal(d.sessions[0].warnings,0)});
async function admit(who=student){await mutateEngagement(db,who,{action:'requestAdmission',teacherId:teacher.id,phone:'0712345678',level:'Grade 9',goals:'Learn science'},NOW);await mutateEngagement(db,admin,{action:'reviewAdmission',studentId:who.id,status:'approved',note:'Welcome'},NOW+1)}
async function subscribe(who=student,receipt='SUB1234567'){await mutateEngagement(db,admin,{action:'subscriptionSettings',price:200,days:6},NOW);const {id}=await mutateEngagement(db,who,{action:'claimSubscription',phone:'0712345678',receipt},NOW+2);await mutateEngagement(db,admin,{action:'reviewSubscription',...await reviewEvidence(db,'tuition',id),id,status:'verified',note:'Checked actual statement'},NOW+3);return id}
test('unadmitted learners cannot enter protected learning actions',async()=>{await reject(requireAdmitted(db,student),403);await reject(mutateEngagement(db,student,{action:'presence',page:'lessons'},NOW),403);await reject(mutateEngagement(db,student,{action:'askQuestion',lessonId:null,question:'Please explain molarity'},NOW),403);await admit();await requireAdmitted(db,student)});
test('only administrators can approve student registrations',async()=>{await mutateEngagement(db,student,{action:'requestAdmission',teacherId:teacher.id,phone:'0712345678',level:'Grade 9',goals:'Science'},NOW);await reject(mutateEngagement(db,other,{action:'reviewAdmission',studentId:student.id,status:'approved',note:''},NOW),403);await reject(mutateEngagement(db,student,{action:'reviewAdmission',studentId:student.id,status:'approved',note:''},NOW),403);await reject(mutateEngagement(db,teacher,{action:'reviewAdmission',studentId:student.id,status:'approved',note:''},NOW),403);await mutateEngagement(db,admin,{action:'reviewAdmission',studentId:student.id,status:'approved',note:'Welcome'},NOW);await requireAdmitted(db,student)});
test('online presence and hand raises are visible to assigned teacher only',async()=>{await admit();await mutateEngagement(db,student,{action:'presence',page:'lessons'},NOW+10);await mutateEngagement(db,student,{action:'hand',raised:true,note:'Please explain step 2'},NOW+11);const d=await readEngagement(db,teacher,NOW+12);assert.equal(d.admissions[0].hand_raised,1);assert.equal(d.admissions[0].hand_note,'Please explain step 2');assert.equal((await readEngagement(db,other,NOW)).admissions.length,0);await reject(mutateEngagement(db,other,{action:'acknowledgeHand',studentId:student.id},NOW),403);await mutateEngagement(db,teacher,{action:'acknowledgeHand',studentId:student.id},NOW);assert.equal((await readEngagement(db,teacher,NOW)).admissions[0].hand_raised,0)});
test('questions persist, AI answers are idempotent, teacher corrections survive retries',async()=>{await admit();const {id}=await mutateEngagement(db,student,{action:'askQuestion',lessonId:null,question:'Explain how a microscope works'},NOW+20);assert.equal((await automationQueue(db)).questions[0].id,id);await automate(db,{action:'answer',id,answer:'A microscope magnifies a specimen through lenses.'},NOW+30);await automate(db,{action:'answer',id,answer:'Repeated answer should not replace original'},NOW+31);let q=(await readEngagement(db,student,NOW+32)).learnerQuestions[0];assert.equal(q.source,'ai_background');assert.equal(q.answer,'A microscope magnifies a specimen through lenses.');await mutateEngagement(db,teacher,{action:'answerQuestion',id,answer:'Teacher explanation with classroom context'},NOW+33);await automate(db,{action:'answer',id,answer:'Late AI retry'},NOW+34);q=(await readEngagement(db,student,NOW+35)).learnerQuestions[0];assert.equal(q.source,'teacher');assert.equal(q.answer,'Teacher explanation with classroom context')});
test('automatic assistance waits while a learner is taking an exam',async()=>{await admit();const {id}=await mutateEngagement(db,student,{action:'askQuestion',lessonId:null,question:'Explain safe microscope use'},NOW);await start(await exam());assert.equal((await automationQueue(db)).questions.length,0);await reject(automate(db,{action:'answer',id,answer:'Do not supply exam-time assistance'},NOW),409);await reject(mutateEngagement(db,student,{action:'askQuestion',lessonId:null,question:'Please answer my live question'},NOW+16000),409)});
test('daily reports contain learner questions and answers grouped by Nairobi day',async()=>{await admit();const {id}=await mutateEngagement(db,student,{action:'askQuestion',lessonId:null,question:'How do lenses magnify cells?'},NOW);await automate(db,{action:'answer',id,answer:'Lenses refract light to form a magnified image.'},NOW+10);await maintenance(db,NOW+20);let d=await readEngagement(db,teacher,NOW+30);let reports=d.dailyReports.map(r=>JSON.parse(r.data));assert.ok(reports.some(r=>r.total===1&&r.answered===1));await maintenance(db,NOW+40);assert.equal((await readEngagement(db,teacher,NOW+50)).dailyReports.length,2);assert.equal((await readEngagement(db,student,NOW)).dailyReports.length,0)});
test('four distinct days, rather than four opens, trigger one personalised assessment',async()=>{await admit();const lessonId=await lesson(0);for(let i=0;i<4;i++)await mutateEngagement(db,student,{action:'lessonViewed',lessonId},NOW+i*1000);await maintenance(db,NOW+4000);assert.equal((await automationQueue(db)).assessments.length,0);for(let i=1;i<4;i++)await mutateEngagement(db,student,{action:'lessonViewed',lessonId},NOW+i*86400000);await maintenance(db,NOW+3*86400000+1);let q=await automationQueue(db);assert.equal(q.assessments.length,1);assert.equal(q.assessments[0].materials[0].content,'PRIVATE LESSON BODY');await maintenance(db,NOW+3*86400000+2);assert.equal((await automationQueue(db)).assessments.length,1);const taskId=q.assessments[0].id;const questions=Array.from({length:3},(_,i)=>({text:'Question '+i,choices:['A','B','C','D'],correct:0}));const {examId}=await automate(db,{action:'assessment',id:taskId,title:'Four-day review',questions},NOW+3*86400000+3);await automate(db,{action:'assessment',id:taskId,title:'Duplicate',questions},NOW+3*86400000+4);assert.equal((await readState(db,student,NOW+3*86400000+5)).exams.filter(e=>e.id===examId).length,1);assert.equal((await readState(db,student2,NOW)).exams.some(e=>e.id===examId),false);await reject(mutate(db,student2,{action:'start',examId},NOW+3*86400000+6),403);assert.equal((await automationQueue(db)).assessments.length,0)});
test('verified subscriptions unlock lessons and expired subscriptions do not',async()=>{await admit();const lessonId=await lesson(50);await reject(canReadLesson(db,student,lessonId,NOW),403);await subscribe();assert.equal((await readFeatures(db,student,NOW+4)).lessons[0].unlocked,true);await canReadLesson(db,student,lessonId,NOW+4);await reject(canReadLesson(db,student,lessonId,NOW+31*86400000),403);assert.equal((await readFeatures(db,student,NOW+31*86400000)).lessons[0].unlocked,false)});
test('paid registered learners receive exactly one free 20-minute video allowance',async()=>{await admit();await subscribe();let d=await readEngagement(db,student,NOW+4);assert.equal(d.videoCredit.allowance,1200);await grantEarnedCredit(db,student.id,NOW+5);await subscribe(student,'SUB7654321');d=await readEngagement(db,student,NOW+6);assert.equal(d.videoCredit.allowance,1200);await reject(mutateEngagement(db,student,{action:'grantVideoCredit',studentId:student.id,minutes:20},NOW),403)});
test('pending receipts do not unlock subscriptions or award video credit',async()=>{await admit();await mutateEngagement(db,admin,{action:'subscriptionSettings',price:200,days:6},NOW);await mutateEngagement(db,student,{action:'claimSubscription',phone:'0712345678',receipt:'SUB1234567'},NOW);const d=await readEngagement(db,student,NOW);assert.equal(d.subscriptionActive,false);assert.equal(d.videoCredit,null)});
test('video leases cap total allowance and reject concurrent players',async()=>{await admit();await subscribe();let lease=await mutateEngagement(db,student,{action:'videoLease',leaseId:null},NOW+10);assert.equal(lease.remaining,1185);await reject(mutateEngagement(db,student,{action:'videoLease',leaseId:null},NOW+11),409);let same=await mutateEngagement(db,student,{action:'videoLease',leaseId:lease.leaseId},NOW+12);assert.equal(same.remaining,1185);for(let i=1;i<80;i++)lease=await mutateEngagement(db,student,{action:'videoLease',leaseId:lease.leaseId},NOW+10+i*15000);assert.equal(lease.remaining,0);await reject(mutateEngagement(db,student,{action:'videoLease',leaseId:lease.leaseId},NOW+10+80*15000),402);const d=await readEngagement(db,student,NOW+10+80*15000);assert.equal(d.videoCredit.used,1200)});
test('payment settings match the supplied JEZTECH account and are not repeatedly overwritten',async()=>{await initializePolicy(db,NOW);let r=await db.prepare("SELECT * FROM payment_settings WHERE id='main'").first();assert.equal(r.business_number,'522533');assert.equal(r.account_reference,'8075575');assert.match(r.instructions,/JEZTECH ENTERPRISES/);await db.prepare("UPDATE payment_settings SET instructions='Updated by admin' WHERE id='main'").run();await initializePolicy(db,NOW+1);r=await db.prepare("SELECT * FROM payment_settings WHERE id='main'").first();assert.equal(r.instructions,'Updated by admin')});
test('portal paths are fixed by the assigned role, never by arbitrary destinations',()=>{assert.equal(portalPath('admin'),'/admin');assert.equal(portalPath('teacher'),'/teacher');assert.equal(portalPath('student'),'/student');assert.equal(portalPath('https://example.com'),'/student')});
test('only administrator can add teacher accounts',async()=>{const action={action:'addTeacher',fullName:'New Teacher',email:'newteacher@example.test',phone:'0712345678',subject:'Science'};await reject(mutatePortal(db,student,action,NOW),403);await reject(mutatePortal(db,teacher,action,NOW),403);assert.equal((await readPortalAccounts(db,student)).teacherAccounts.length,0)});
test('teacher pre-registration activates only for matching verified email',async()=>{const action={action:'addTeacher',fullName:'Registered Teacher',email:'NewTeacher@Example.test',phone:'0712345678',subject:'Science'};const added=await mutatePortal(db,admin,action,NOW);assert.equal(added.status,'pending');const wrong=await initializeUser(db,identity('new1','someoneelse@example.test','Other Learner'),'owner@example.test',NOW+1);assert.equal(wrong.role,'student');const matching=await initializeUser(db,identity('new2','newteacher@example.test','Verified Name'),'owner@example.test',NOW+2);assert.equal(matching.role,'teacher');assert.equal(matching.name,'Registered Teacher');const rows=(await readPortalAccounts(db,admin)).teacherAccounts;assert.equal(rows[0].status,'active');assert.equal(rows[0].user_id,'new2');assert.equal(rows[0].email,'newteacher@example.test')});
test('adding an already registered student as teacher takes effect immediately',async()=>{await mutatePortal(db,admin,{action:'addTeacher',fullName:'Promoted Teacher',email:student.email,phone:'',subject:'Math'},NOW);const user=await initializeUser(db,identity(student.id,student.email,'Old Name'),'owner@example.test',NOW+1);assert.equal(user.role,'teacher');assert.equal(user.name,'Promoted Teacher')});
test('duplicate teacher emails and administrator conversion are rejected',async()=>{await mutatePortal(db,admin,{action:'addTeacher',fullName:'New Teacher',email:'new@example.test',phone:'',subject:''},NOW);await reject(mutatePortal(db,admin,{action:'addTeacher',fullName:'Other',email:'NEW@example.test',phone:'',subject:''},NOW+1),409);await reject(mutatePortal(db,admin,{action:'addTeacher',fullName:'Owner',email:admin.email,phone:'',subject:''},NOW+1),409)});
test('revoked teacher cannot reactivate their own account on sign-in',async()=>{const {id}=await mutatePortal(db,admin,{action:'addTeacher',fullName:'Registered Teacher',email:'new@example.test',phone:'',subject:''},NOW);await initializeUser(db,identity('new','new@example.test','New'),'owner@example.test',NOW+1);await reject(mutatePortal(db,teacher,{action:'teacherAccountStatus',id,enabled:false},NOW+2),403);await mutatePortal(db,admin,{action:'teacherAccountStatus',id,enabled:false},NOW+2);await reject(initializeUser(db,identity('new','new@example.test','New'),'owner@example.test',NOW+3),403);await mutatePortal(db,admin,{action:'teacherAccountStatus',id,enabled:true},NOW+4);const enabled=await initializeUser(db,identity('new','new@example.test','New'),'owner@example.test',NOW+5);assert.equal(enabled.role,'teacher');assert.equal(enabled.disabled,0)});
test('revoking a pending teacher prevents role activation before first sign-in',async()=>{const {id}=await mutatePortal(db,admin,{action:'addTeacher',fullName:'Pending Teacher',email:'new@example.test',phone:'',subject:''},NOW);await mutatePortal(db,admin,{action:'teacherAccountStatus',id,enabled:false},NOW+1);const user=await initializeUser(db,identity('new','new@example.test','New'),'owner@example.test',NOW+2);assert.equal(user.role,'student')});
test('registration captures learner name and cannot set privileged role',async()=>{const action=EngagementSchema.parse({action:'requestAdmission',fullName:'Registered Learner',teacherId:teacher.id,phone:'0712345678',level:'Grade 9',goals:'Science',role:'admin'});await mutateEngagement(db,student,action,NOW);const user=await initializeUser(db,identity(student.id,student.email,'Provider Name'),'owner@example.test',NOW+1);assert.equal(user.name,'Registered Learner');assert.equal(user.role,'student');await reject(requireAdmitted(db,user),403)});
test('teacher form validation rejects malformed email and incomplete name',()=>{assert.equal(PortalActionSchema.safeParse({action:'addTeacher',fullName:'A',email:'not-an-email'}).success,false)});
test('payment login stays locked until approval, is account-bound, and expires',async()=>{await admit();await reject(requirePaidAccess(db,student,NOW),402);await subscribe();const a=await requirePaidAccess(db,student,NOW+4);assert.match(a.login_id,/^JZT-[A-F0-9]{12}$/);assert.equal((await verifyLoginId(db,student,a.login_id,NOW+5)).dashboard,'/student');await reject(verifyLoginId(db,student,'JZT-000000000000',NOW+5),403);await admit(student2);await subscribe(student2,'ALT1234567');await reject(verifyLoginId(db,student2,a.login_id,NOW+5),403);await reject(requirePaidAccess(db,student,a.expires_at),402);assert.equal((await refreshAccess(db,student.id,NOW+6)).login_id,a.login_id)});
test('renewal extends access without changing learner ID',async()=>{await admit();await subscribe();const a=await refreshAccess(db,student.id,NOW+4);await subscribe(student,'NEW1234567');const b=await refreshAccess(db,student.id,NOW+5);assert.equal(a.login_id,b.login_id);assert.equal(b.expires_at,a.expires_at+6*86400000)});
test('classroom calls isolate groups, enforce acceptance, and protect signals',async()=>{await admit();await subscribe();const {id:roomId}=await mutateClassroom(db,teacher,{action:'createRoom',name:'Science',description:''},NOW);const {id:otherRoom}=await mutateClassroom(db,other,{action:'createRoom',name:'Other',description:''},NOW);await reject(mutateClassroom(db,student,{action:'requestCall',roomId:otherRoom,topic:'Help me please'},NOW+4),403);const {id:callId}=await mutateClassroom(db,student,{action:'requestCall',roomId,topic:'Why does a circuit need a loop?'},NOW+4);const offer={action:'signal',callId,type:'offer',payload:JSON.stringify({type:'offer',sdp:'test SDP'})};await reject(mutateClassroom(db,student,offer,NOW+5),409);await reject(mutateClassroom(db,other,{action:'acceptCall',callId},NOW+5),403);await mutateClassroom(db,teacher,{action:'acceptCall',callId},NOW+5);await reject(mutateClassroom(db,teacher,offer,NOW+6),403);await mutateClassroom(db,student,offer,NOW+6);assert.equal((await readSignals(db,teacher,callId,0,NOW+7)).signals.length,1);assert.equal((await readSignals(db,student,callId,0,NOW+7)).signals.length,0);await reject(readSignals(db,admin,callId,0,NOW+7),403);await mutateClassroom(db,teacher,{action:'endCall',callId},NOW+8);await reject(mutateClassroom(db,student,offer,NOW+9),409)});
test('CCTV sources require staff ownership and HTTPS without embedded passwords',async()=>{await admit();await subscribe();const {id:roomId}=await mutateClassroom(db,teacher,{action:'createRoom',name:'Lab',description:''},NOW);const a={action:'addCamera',roomId,name:'Lab camera',format:'hls',url:'https://camera.example/live.m3u8'};await reject(mutateClassroom(db,student,a,NOW+4),403);await reject(mutateClassroom(db,other,a,NOW+4),403);for(const url of ['rtsp://camera.example/live','https://user:secret@camera.example/live'])await reject(mutateClassroom(db,teacher,{...a,url},NOW+4),400);await mutateClassroom(db,teacher,a,NOW+4);assert.equal((await readClassroom(db,student,NOW+5)).cameras.length,0);assert.equal((await readClassroom(db,other,NOW+5)).cameras.length,0);assert.equal((await readClassroom(db,teacher,NOW+5)).cameras.length,1);await reject(readClassroom(db,student,NOW+31*86400000),402)});
test('virtual workbenches calculate physical models and keep journals scoped',async()=>{await admit();const input={experiment:'circuit',voltage:6,resistance:100,closed:true};const result=calculateVirtual(input);assert.equal(result.currentMilliamps,60);assert.equal(calculateVirtual({...input,closed:false}).currentMilliamps,0);const eq=calculateVirtual({experiment:'titration',acidConcentration:.1,acidVolume:25,baseConcentration:.1,baseVolume:25});assert.equal(eq.pH,7);assert.equal(calculateVirtual({experiment:'microscope',objective:40,focus:55,specimen:'plant'}).magnification,400);const a=VirtualAction.parse({action:'saveVirtualRun',inputs:input,notes:'Measured current with a closed switch',results:{currentMilliamps:9000}});await mutateVirtual(db,student,a,NOW);assert.equal((await readVirtual(db,student)).virtualRuns[0].results.currentMilliamps,60);assert.equal((await readVirtual(db,student2)).virtualRuns.length,0);assert.equal((await readVirtual(db,other)).virtualRuns.length,0);assert.equal((await readVirtual(db,teacher)).virtualRuns.length,1);assert.equal(VirtualAction.safeParse({...a,inputs:{...input,resistance:0}}).success,false)});
test('class preparation lasts exactly ten minutes and learner board tracks readiness and absence',async()=>{await admit();await admit(student2);await subscribe();const {id:roomId}=await mutateClassroom(db,teacher,{action:'createRoom',name:'Science room',description:''},NOW);const opened=await mutatePreparation(db,teacher,{action:'openPreparation',startMode:'automatic',roomId,title:'Circuits class'},NOW+4);assert.equal(opened.startsAt,NOW+600004);await reject(mutatePreparation(db,teacher,{action:'openPreparation',startMode:'automatic',roomId,title:'Duplicate'},NOW+5),409);await reject(mutatePreparation(db,student2,{action:'joinClass',sessionId:opened.id},NOW+6),402);await mutatePreparation(db,student,{action:'joinClass',sessionId:opened.id},NOW+6);await mutatePreparation(db,student,{action:'classReady',sessionId:opened.id,ready:true},NOW+7);let s=(await readPreparation(db,teacher,NOW+8)).classSessions[0];assert.equal(s.status,'preparing');assert.equal(s.roster.length,2);assert.equal(s.roster.find(r=>r.student_id===student.id).online,true);assert.equal(s.roster.find(r=>r.student_id===student.id).ready,1);assert.equal(s.roster.find(r=>r.student_id===student2.id).joined_at,null);assert.equal((await readPreparation(db,other,NOW+8)).classSessions.length,0);s=(await readPreparation(db,teacher,NOW+80008)).classSessions[0];assert.equal(s.roster.find(r=>r.student_id===student.id).online,false);await mutatePreparation(db,student,{action:'classHeartbeat',sessionId:opened.id},NOW+600005);s=(await readPreparation(db,student,NOW+600005)).classSessions[0];assert.equal(s.status,'live');assert.equal(s.roster[0].online,true);await reject(mutatePreparation(db,student,{action:'endClass',sessionId:opened.id},NOW+600006),403);await mutatePreparation(db,teacher,{action:'endClass',sessionId:opened.id},NOW+600006);await reject(mutatePreparation(db,student,{action:'classHeartbeat',sessionId:opened.id},NOW+600007),409);assert.equal((await readPreparation(db,teacher,NOW+600008)).classSessions.length,0)});
test('classroom preparation prevents group crossing and another learner changing readiness',async()=>{await admit();await admit(student2);await subscribe();await subscribe(student2,'ALT1234567');const {id:roomId}=await mutateClassroom(db,teacher,{action:'createRoom',name:'Room A',description:''},NOW);await reject(mutatePreparation(db,other,{action:'openPreparation',startMode:'automatic',roomId,title:'Cross group'},NOW+4),403);await reject(mutatePreparation(db,student,{action:'openPreparation',startMode:'automatic',roomId,title:'Self class'},NOW+4),403);const {id:sessionId}=await mutatePreparation(db,teacher,{action:'openPreparation',startMode:'automatic',roomId,title:'Test class'},NOW+4);await mutatePreparation(db,student,{action:'joinClass',sessionId},NOW+5);await reject(mutatePreparation(db,student2,{action:'classReady',sessionId,ready:true},NOW+6),409);await mutatePreparation(db,student,{action:'leaveClass',sessionId},NOW+7);await reject(mutatePreparation(db,student,{action:'classHeartbeat',sessionId},NOW+8),409);await mutatePreparation(db,student,{action:'joinClass',sessionId},NOW+600005);const r=(await readPreparation(db,teacher,NOW+600006)).classSessions[0].roster.find(r=>r.student_id===student.id);assert.equal(r.late,false);assert.equal(r.online,true)});
const paymentConfig={MPESA_CONSUMER_KEY:'test-only-key',MPESA_CONSUMER_SECRET:'test-only-secret',MPESA_PASSKEY:'test-only-passkey',MPESA_SHORTCODE:'522533',MPESA_CALLBACK_URL:'https://gateway.example/confirmation',MPESA_LIVE_ENABLED:'true'};
const providerMock=(query={})=>async(url,options)=>{assert.match(url,/^https:\/\/api\.safaricom\.co\.ke\//);if(url.includes('/oauth/'))return Response.json({access_token:'test-only-provider-token'});const body=JSON.parse(options.body);if(url.includes('/processrequest')){assert.equal(body.Amount,200);assert.equal(body.PartyB,'522533');assert.equal(body.AccountReference,'8075575');return Response.json({ResponseCode:'0',CheckoutRequestID:'ws_test_checkout',MerchantRequestID:'merchant_test'})}assert.equal(body.CheckoutRequestID,'ws_test_checkout');return Response.json({CheckoutRequestID:'ws_test_checkout',MerchantRequestID:'merchant_test',ResultCode:'0',...query})};
async function plan(){await mutateEngagement(db,admin,{action:'subscriptionSettings',price:200,days:6},NOW)}
test('automatic payments fail closed without live configuration or admission',async()=>{await plan();await reject(mutatePayment(db,student,{action:'startPayment',phone:'0712345678'},paymentConfig,NOW),403);await admit();await reject(mutatePayment(db,student,{action:'startPayment',phone:'0712345678'},{},NOW),503);assert.equal(paymentConfiguration({...paymentConfig,MPESA_LIVE_ENABLED:'false'}).configured,false);assert.equal(paymentConfiguration({...paymentConfig,MPESA_CALLBACK_URL:'http://gateway.example'}).configured,false);assert.equal(paymentConfiguration({...paymentConfig,MPESA_SHORTCODE:'000000'}).configured,false);const d=await readPayments(db,student,paymentConfig);assert.equal('missing'in d.configuration,false)});
test('authenticated payment query alone grants access, once, from the server-priced intent',async()=>{await admit();await plan();const start=await mutatePayment(db,student,{action:'startPayment',phone:'0712345678'},paymentConfig,NOW+4,providerMock());assert.equal(start.status,'pending');assert.equal((await refreshAccess(db,student.id,NOW+5)),null);const reused=await mutatePayment(db,student,{action:'startPayment',phone:'0712345678'},paymentConfig,NOW+5,()=>{throw new Error('Should not send duplicate prompt')});assert.equal(reused.id,start.id);await reject(mutatePayment(db,student2,{action:'checkPayment',id:start.id},paymentConfig,NOW+6,providerMock()),403);await plan();const confirmed=await mutatePayment(db,student,{action:'checkPayment',id:start.id},paymentConfig,NOW+7,providerMock());assert.equal(confirmed.status,'confirmed');const access=await requirePaidAccess(db,student,NOW+8);assert.equal(access.expires_at,NOW+7+6*86400000);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM subscriptions').first()).n,1);await mutatePayment(db,student,{action:'checkPayment',id:start.id},paymentConfig,NOW+20000,providerMock());assert.equal((await requirePaidAccess(db,student,NOW+20001)).expires_at,access.expires_at);assert.equal((await readEngagement(db,student,NOW+20002)).videoCredit.allowance,1200)});
test('cancelled, malformed, or mismatched provider results never unlock learning',async()=>{await admit();await plan();const p=await mutatePayment(db,student,{action:'startPayment',phone:'0712345678'},paymentConfig,NOW+4,providerMock());await reject(mutatePayment(db,student,{action:'checkPayment',id:p.id},paymentConfig,NOW+5,providerMock({CheckoutRequestID:'wrong'})),502);assert.equal(await refreshAccess(db,student.id,NOW+6),null);await mutatePayment(db,student,{action:'checkPayment',id:p.id},paymentConfig,NOW+10006,providerMock({ResultCode:'1032'}));assert.equal(await refreshAccess(db,student.id,NOW+10007),null);assert.equal((await readPayments(db,student,paymentConfig)).paymentIntents.length,0);assert.equal((await db.prepare('SELECT status FROM payment_intents WHERE id=?').bind(p.id).first()).status,'failed')});
test('pending payments can reconcile while the learner is away',async()=>{await admit();await plan();await mutatePayment(db,student,{action:'startPayment',phone:'0712345678'},paymentConfig,NOW+4,providerMock());assert.deepEqual(await reconcilePayments(db,{},NOW+5,providerMock()),{connected:false,checked:0});const r=await reconcilePayments(db,paymentConfig,NOW+6,providerMock());assert.equal(r.checked,1);assert.ok(await requirePaidAccess(db,student,NOW+7))});
test('administrator grants and revokes CCTV monitoring without exposing other classroom records',async()=>{await admit();await subscribe();const {id:roomId}=await mutateClassroom(db,teacher,{action:'createRoom',name:'Science lab',description:''},NOW);const {id:cameraId}=await mutateClassroom(db,teacher,{action:'addCamera',roomId,name:'Lab CCTV',format:'hls',url:'https://camera.example/lab.m3u8'},NOW+1);assert.equal((await readClassroom(db,other,NOW+4)).cameras.length,0);await reject(mutateClassroom(db,teacher,{action:'setMonitor',roomId,teacherId:other.id,enabled:true},NOW+4),403);await reject(mutateClassroom(db,admin,{action:'setMonitor',roomId,teacherId:student.id,enabled:true},NOW+4),400);await mutateClassroom(db,admin,{action:'setMonitor',roomId,teacherId:other.id,enabled:true},NOW+4);await mutateClassroom(db,admin,{action:'setMonitor',roomId,teacherId:other.id,enabled:true},NOW+5);const view=await readClassroom(db,other,NOW+6);assert.equal(view.cameras[0].id,cameraId);assert.equal(view.monitoringRooms[0].id,roomId);assert.equal(view.rooms.length,0);assert.equal(view.calls.length,0);assert.equal(view.monitorGrants.length,0);assert.equal(view.monitoringTeachers.length,0);assert.equal((await readClassroom(db,admin,NOW+6)).monitorGrants.length,1);for(const action of [{action:'updateCamera',id:cameraId,name:'Changed',url:'https://camera.example/changed.m3u8',format:'hls'},{action:'deleteCamera',id:cameraId},{action:'cameraStatus',id:cameraId,enabled:false}])await reject(mutateClassroom(db,other,action,NOW+7),403);await mutateClassroom(db,admin,{action:'setMonitor',roomId,teacherId:other.id,enabled:false},NOW+8);assert.equal((await readClassroom(db,other,NOW+9)).cameras.length,0);assert.equal((await readClassroom(db,teacher,NOW+9)).cameras.length,1);assert.equal((await readClassroom(db,student,NOW+9)).monitoringRooms.length,0)});
test('camera owners can correct or remove their stream but learners cannot manage cameras',async()=>{await admit();await subscribe();const {id:roomId}=await mutateClassroom(db,teacher,{action:'createRoom',name:'Room B',description:''},NOW);const {id}=await mutateClassroom(db,teacher,{action:'addCamera',roomId,name:'Camera',format:'mjpeg',url:'https://camera.example/image'},NOW+1);await reject(mutateClassroom(db,student,{action:'deleteCamera',id},NOW+4),403);await reject(mutateClassroom(db,teacher,{action:'updateCamera',id,name:'Camera',format:'hls',url:'https://user:password@camera.example/stream'},NOW+4),400);await mutateClassroom(db,teacher,{action:'updateCamera',id,name:'Updated camera',format:'hls',url:'https://camera.example/new.m3u8'},NOW+4);assert.equal((await readClassroom(db,teacher,NOW+5)).cameras[0].name,'Updated camera');await mutateClassroom(db,teacher,{action:'deleteCamera',id},NOW+6);assert.equal((await readClassroom(db,teacher,NOW+7)).cameras.length,0)});
test('stream URLs reject raw protocols and embedded credentials',()=>{for(const url of ['rtsp://camera.example/live','http://camera.example/live','https://user:password@camera.example/live','https://camera.example/live?password=secret','https://camera.example/live?token=secret','https://camera.example/live#password'])assert.throws(()=>validateStreamUrl(url),e=>e.status===400);assert.equal(validateStreamUrl('https://camera.example/live.m3u8').protocol,'https:')});
test('microphone preferences tolerate malformed stored data and request the selected input',()=>{assert.deepEqual(parseAudioOptions(null),defaultAudioOptions);assert.deepEqual(parseAudioOptions({deviceId:123,echoCancellation:'false',noiseSuppression:null,autoGainControl:[]} ),defaultAudioOptions);const settings=parseAudioOptions({deviceId:'usb-classroom-microphone',echoCancellation:true,noiseSuppression:false,autoGainControl:false});assert.deepEqual(audioConstraints(settings),{deviceId:{exact:'usb-classroom-microphone'},echoCancellation:true,noiseSuppression:false,autoGainControl:false});assert.equal('deviceId'in audioConstraints(defaultAudioOptions),false);assert.equal(parseAudioOptions({deviceId:'x'.repeat(501)}).deviceId,'');assert.match(microphoneError({name:'NotAllowedError'}),/permission/);assert.match(microphoneError({name:'OverconstrainedError'}),/unavailable/)});
test('practical clip explanations stay within the teaching group and only owners or admin can edit',async()=>{await admit();const id=crypto.randomUUID();await db.prepare('INSERT INTO learning_videos(id,teacher_id,title,url,created_at) VALUES(?,?,?,?,?)').bind(id,teacher.id,'Circuit practical','r2:learning/test-only',NOW).run();const action=ClipAction.parse({action:'clipMetadata',id,title:'Teacher explains current',experiment:'circuit',explanation:'Observe the meter as resistance increases at constant voltage.'});await reject(updateClip(db,student,action),403);await reject(updateClip(db,other,action),403);await updateClip(db,teacher,action);let clip=(await readEngagement(db,student,NOW+4)).learningVideos[0];assert.equal(clip.explanation,action.explanation);assert.equal(clip.experiment,'circuit');assert.equal(clip.teacher_name,teacher.name);assert.equal(clip.url,undefined);assert.equal((await readEngagement(db,student2,NOW+4)).learningVideos.length,0);assert.equal((await readEngagement(db,other,NOW+4)).learningVideos.length,0);await updateClip(db,admin,{...action,explanation:'Reviewed explanation'});assert.equal((await readEngagement(db,teacher,NOW+5)).learningVideos[0].explanation,'Reviewed explanation')});
test('practical clip metadata validates topics and text bounds with backwards-compatible defaults',()=>{assert.deepEqual(ClipMetadata.parse({title:'Existing clip'}),{title:'Existing clip',experiment:'general',explanation:''});assert.equal(ClipMetadata.safeParse({title:'Invalid topic',experiment:'unrecognised'}).success,false);assert.equal(ClipMetadata.safeParse({title:'Explanation too long',explanation:'x'.repeat(6001)}).success,false);assert.equal(ClipMetadata.safeParse({title:'X'}).success,false)});
test('video uploads use bounded binary parts and complete in order',async()=>{const sizes=[],metadata=[];let completed,aborted=false;const bucket={createMultipartUpload:async(key,options)=>{metadata.push(key,options.httpMetadata.contentType);return {uploadPart:async(n,bytes)=>{assert.ok(bytes instanceof Uint8Array);sizes.push(bytes.byteLength);return {partNumber:n,etag:'test-part-'+n}},complete:async parts=>{completed=parts},abort:async()=>{aborted=true}}}};let emitted=false;const body=new ReadableStream({pull(c){if(emitted){c.close();return}emitted=true;c.enqueue(new Uint8Array(6*1024*1024))}});assert.equal((await storeClip(bucket,'test-only',body,'video/webm')).size,6*1024*1024);assert.deepEqual(sizes,[5*1024*1024,1024*1024]);assert.deepEqual(completed.map(p=>p.partNumber),[1,2]);assert.deepEqual(metadata,['test-only','video/webm']);assert.equal(aborted,false)});
test('empty or oversized video uploads abort without publishing incomplete objects',async()=>{for(const count of [0,51]){let aborted=false,completed=false,sent=0;const bucket={createMultipartUpload:async()=>({uploadPart:async n=>({partNumber:n,etag:'part'}),complete:async()=>{completed=true},abort:async()=>{aborted=true}})};const body=new ReadableStream({pull(c){if(sent===count){c.close();return}sent++;c.enqueue(new Uint8Array(1024*1024))}});await assert.rejects(storeClip(bucket,'test-only',body,'video/mp4'),e=>e.status===(count?413:400));assert.equal(aborted,true);assert.equal(completed,false)}});

test('camera check-ins require attendance and stay private to learner and assigned staff',async()=>{
 await admit();await admit(student2);await subscribe();await subscribe(student2,'CAM1234567');
 const {id:roomId}=await mutateClassroom(db,teacher,{action:'createRoom',name:'Camera room',description:''},NOW);
 const {id:sessionId}=await mutatePreparation(db,teacher,{action:'openPreparation',startMode:'automatic',roomId,title:'Camera class'},NOW);
 const frame='data:image/jpeg;base64,/9j/AAAA';
 await reject(mutatePreparation(db,student,{action:'cameraCheckIn',sessionId,frame},NOW+1),409);
 await mutatePreparation(db,student,{action:'joinClass',sessionId},NOW+2);
 await mutatePreparation(db,student,{action:'cameraCheckIn',sessionId,frame},NOW+3);
 const image=async u=>(await readPreparation(db,u,NOW+4)).classSessions[0]?.roster.find(r=>r.student_id===student.id)?.camera_frame;
 assert.equal(await image(teacher),frame);assert.equal(await image(admin),frame);assert.equal(await image(student),frame);assert.equal(await image(student2),undefined);assert.equal(await image(other),undefined);
 await reject(mutatePreparation(db,other,{action:'cameraCheckIn',sessionId,frame},NOW+5),403);
 await mutatePreparation(db,student,{action:'cameraCheckIn',sessionId,frame:null},NOW+6);assert.equal(await image(teacher),null);
 await mutatePreparation(db,student,{action:'cameraCheckIn',sessionId,frame},NOW+7);
 assert.equal((await readPreparation(db,teacher,NOW+45008)).classSessions[0].roster.find(r=>r.student_id===student.id).camera_frame,null);
 assert.equal(db.sqlite.prepare('SELECT camera_frame FROM class_attendance WHERE student_id=?').get(student.id).camera_frame,null);
});
test('leaving and ending a class remove camera images',async()=>{
 await admit();await subscribe();const {id:roomId}=await mutateClassroom(db,teacher,{action:'createRoom',name:'Camera room',description:''},NOW);const {id:sessionId}=await mutatePreparation(db,teacher,{action:'openPreparation',startMode:'automatic',roomId,title:'Camera class'},NOW);
 const frame='data:image/jpeg;base64,/9j/AAAA';await mutatePreparation(db,student,{action:'joinClass',sessionId},NOW+1);await mutatePreparation(db,student,{action:'cameraCheckIn',sessionId,frame},NOW+2);await mutatePreparation(db,student,{action:'leaveClass',sessionId},NOW+3);
 assert.equal(db.sqlite.prepare('SELECT camera_frame FROM class_attendance WHERE student_id=?').get(student.id).camera_frame,null);
 await mutatePreparation(db,student,{action:'joinClass',sessionId},NOW+4);await mutatePreparation(db,student,{action:'cameraCheckIn',sessionId,frame},NOW+5);await mutatePreparation(db,teacher,{action:'endClass',sessionId},NOW+6);assert.equal(db.sqlite.prepare('SELECT camera_frame FROM class_attendance WHERE student_id=?').get(student.id).camera_frame,null);
});


test('six-day IDs appear only after verification and reject login exactly at expiry',async()=>{
 await admit();await plan();const {id}=await mutateEngagement(db,student,{action:'claimSubscription',phone:'0712345678',receipt:'SIX1234567'},NOW+1);
 assert.equal(await refreshAccess(db,student.id,NOW+2),null);
 await mutateEngagement(db,admin,{action:'reviewSubscription',...await reviewEvidence(db,'tuition',id),id,status:'verified',note:'Statement verified'},NOW+3);
 const a=await refreshAccess(db,student.id,NOW+4);assert.match(a.login_id,/^JZT-[A-F0-9]{12}$/);assert.equal(a.expires_at,NOW+3+6*86400000);
 assert.equal((await verifyLoginId(db,student,a.login_id,a.expires_at-1)).dashboard,'/student');
 await reject(verifyLoginId(db,student,a.login_id,a.expires_at),402);
 assert.equal(EngagementSchema.safeParse({action:'subscriptionSettings',price:200,days:30}).success,false);
 assert.equal(EngagementSchema.safeParse({action:'subscriptionSettings',price:200,days:6}).success,true);
});

test('class-specific notes persist metadata and preserve author permissions',async()=>{
 const body=LabActionSchema.parse({action:'createLesson',title:'Form 3 circuits',summary:'Current teacher notes',content:'Reviewed circuit notes',subject:'physics',curriculum:'844',classLevel:'form-3',topic:'circuits',price:0});
 const {id}=await mutateFeature(db,teacher,body,NOW);const own=(await readFeatures(db,teacher,NOW+1)).lessons.find(l=>l.id===id);assert.equal(own.class_level,'form-3');assert.equal(own.topic,'circuits');assert.equal(own.content,'Reviewed circuit notes');assert.equal((await readFeatures(db,other,NOW+1)).lessons.some(l=>l.id===id),false);await reject(mutateFeature(db,student,body,NOW+2),403);
 await reject(mutateFeature(db,teacher,{...body,classLevel:'grade-7',curriculum:'844'},NOW+3),400);
 assert.equal(LabActionSchema.safeParse({...body,classLevel:'grade-99'}).success,false);
});
test('practicals save junior and senior class selections with their curriculum',async()=>{
 const id=await lab({classLevel:'grade-9',topic:'Scientific investigation'});const row=(await readFeatures(db,teacher,NOW+1)).labs.find(l=>l.id===id);assert.equal(row.class_level,'grade-9');assert.equal(row.topic,'Scientific investigation');
 await reject(lab({classLevel:'grade-10',curriculum:'cbe-junior'}),400);
 const senior=await lab({classLevel:'grade-10',curriculum:'cbe-senior',topic:'Acids and bases'});assert.equal((await readFeatures(db,teacher,NOW+1)).labs.find(l=>l.id===senior).class_level,'grade-10');
});
test('KICD subject choices are accepted when publishing teaching content',()=>{
 for(const subject of ['english','kiswahili','creative-arts','social-studies','pre-technical','computer-studies','core-mathematics','essential-mathematics','music-dance','marine-fisheries','theatre-film','indigenous-languages']){
  assert.equal(LabActionSchema.safeParse({action:'createLesson',classLevel:'grade-10',topic:'Teacher reviewed topic',title:'New subject notes',summary:'',content:'Teacher material',subject,curriculum:'cbe-senior',price:0}).success,true,subject);
 }
 assert.equal(LabActionSchema.safeParse({action:'createLesson',title:'Invalid',content:'Notes',summary:'',subject:'unknown-subject',curriculum:'cbe-senior',price:0}).success,false);
});
test('bulk topic imports persist drafts, isolate teacher ownership and preserve previous edits',async()=>{
 const action=LabActionSchema.parse({action:'importTopics',classLevel:'grade-7',subject:'general',topics:[{title:'Scientific investigation',notes:'Teacher draft notes'},{title:'Measurements'}]});
 await mutateFeature(db,teacher,action,NOW);
 await mutateFeature(db,teacher,{...action,topics:[{title:'Scientific investigation',notes:'Replacement should be ignored'}]},NOW+1);
 const topics=(await readFeatures(db,teacher,NOW+2)).topicLibrary;
 assert.equal(topics.length,2);assert.equal(topics.find(t=>t.title==='Scientific investigation').notes,'Teacher draft notes');
 assert.equal((await readFeatures(db,other,NOW+2)).topicLibrary.length,0);
 assert.equal((await readFeatures(db,student,NOW+2)).topicLibrary.length,0);
 assert.equal((await readFeatures(db,admin,NOW+2)).topicLibrary.length,2);
 assert.equal((await readFeatures(db,teacher,NOW+2)).lessons.length,0);
});
test('student topic imports and invalid class-subject placements are rejected',async()=>{
 const a=LabActionSchema.parse({action:'importTopics',classLevel:'grade-7',subject:'general',topics:[{title:'Observation'}]});
 await reject(mutateFeature(db,student,a,NOW),403);
 await reject(mutateFeature(db,teacher,{...a,classLevel:'all'},NOW),400);
 await reject(mutateFeature(db,teacher,{...a,subject:'core-mathematics'},NOW),400);
 assert.equal(LabActionSchema.safeParse({...a,topics:Array.from({length:101},()=>({title:'A'}))}).success,false);
});
test('admitted learners see topic headings but never unpublished draft notes',async()=>{
 await mutateFeature(db,teacher,LabActionSchema.parse({action:'importTopics',classLevel:'grade-7',subject:'general',topics:[{title:'Observation',notes:'Unpublished teacher material'}]}),NOW);
 await db.prepare("INSERT INTO admissions(student_id,teacher_id,status,phone,level,goals,requested_at,reviewed_at) VALUES(?,?,'approved','0712345678','Grade 7','',?,?)").bind(student.id,teacher.id,NOW,NOW).run();
 const rows=(await readFeatures(db,student,NOW+1)).topicLibrary;
 assert.equal(rows.length,1);assert.equal(rows[0].title,'Observation');assert.equal(rows[0].notes,undefined);
});
test('unpaid class joins are blocked, grouped into audit windows and scoped to the assigned teacher',async()=>{
 await admit();const {id:roomId}=await mutateClassroom(db,teacher,{action:'createRoom',name:'Classroom',description:''},NOW);
 const {id:sessionId}=await mutatePreparation(db,teacher,{action:'openPreparation',startMode:'automatic',roomId,title:'Class preparation'},NOW+1);
 await reject(mutatePreparation(db,student,{action:'joinClass',sessionId},NOW+4),402);
 await reject(mutatePreparation(db,student,{action:'joinClass',sessionId},NOW+5),402);
 assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM class_attendance').first()).n,0);
 const alerts=await readAccessAlerts(db,teacher,NOW+6);assert.equal(alerts.length,1);assert.equal(alerts[0].attempt_count,2);assert.equal(alerts[0].paid_now,0);
 assert.deepEqual(await readAccessAlerts(db,other,NOW+6),[]);assert.deepEqual(await readAccessAlerts(db,student,NOW+6),[]);assert.equal((await readAccessAlerts(db,admin,NOW+6)).length,1);
});
test('pending subscription claims do not allow protected video or class access',async()=>{
 await admit();await plan();await mutateEngagement(db,student,{action:'claimSubscription',phone:'0712345678',receipt:'PEND123456'},NOW+1);
 await reject(requirePaidAccess(db,student,NOW+2),402);await reject(authorizeVideo(db,student,null,'invented-lease',NOW+2),402);
});
test('revoked subscription cannot reuse a cached six-day login',async()=>{
 await admit();const id=await subscribe();const old=await refreshAccess(db,student.id,NOW+4);assert.ok(old.expires_at>NOW+100);
 await db.prepare("UPDATE subscriptions SET status='rejected' WHERE id=?").bind(id).run();
 await reject(requirePaidAccess(db,student,NOW+5),402);assert.equal((await refreshAccess(db,student.id,NOW+6)).expires_at,0);
 await reject(verifyLoginId(db,student,old.login_id,NOW+6),402);
});
test('revoked lesson payment no longer grants access through a historical payment grant',async()=>{
 await admit();const {id:lessonId}=await mutateFeature(db,teacher,LabActionSchema.parse({action:'createLesson',title:'Paid lesson',summary:'',content:'Lesson notes',subject:'general',curriculum:'cbe-junior',price:100}),NOW);
 const paymentId=crypto.randomUUID();await db.prepare("INSERT INTO payments(id,student_id,lesson_id,phone,receipt,amount,status,created_at,reviewed_at) VALUES(?,?,?,?,?,100,'verified',?,?)").bind(paymentId,student.id,lessonId,'254712345678','PAID123456',NOW,NOW).run();
 assert.ok(await requirePaidAccess(db,student,NOW+1));await db.prepare("UPDATE payments SET status='rejected' WHERE id=?").bind(paymentId).run();await reject(requirePaidAccess(db,student,NOW+2),402);
});
test('expired paid learners are removed from class, snapshots cleared and accepted calls ended',async()=>{
 await admit();const subId=await subscribe();await db.prepare('UPDATE subscriptions SET expires_at=? WHERE id=?').bind(NOW+600100,subId).run();
 const {id:roomId}=await mutateClassroom(db,teacher,{action:'createRoom',name:'Lab room',description:''},NOW+4);
 const {id:sessionId}=await mutatePreparation(db,teacher,{action:'openPreparation',startMode:'automatic',roomId,title:'Practical'},NOW+5);
 await mutatePreparation(db,student,{action:'joinClass',sessionId},NOW+6);
 await mutatePreparation(db,student,{action:'cameraCheckIn',sessionId,frame:'data:image/jpeg;base64,YWJj'},NOW+7);
 const {id:callId}=await mutateClassroom(db,student,{action:'requestCall',roomId,topic:'Explain this observation'},NOW+600008);
 await mutateClassroom(db,teacher,{action:'acceptCall',callId},NOW+600009);
 await readPreparation(db,teacher,NOW+600101);
 const attending=await db.prepare('SELECT * FROM class_attendance WHERE student_id=?').bind(student.id).first();assert.equal(attending.left_at,NOW+600101);assert.equal(attending.camera_frame,null);assert.equal(attending.ready,0);
 assert.equal((await db.prepare('SELECT status FROM classroom_calls WHERE id=?').bind(callId).first()).status,'ended');
 const alerts=await readAccessAlerts(db,teacher,NOW+600102);assert.equal(alerts.filter(a=>a.resource==='active_class_removed').length,1);
});
test('sweeping an old teaching group does not end the learner current-group call',async()=>{
 await admit();await subscribe();const {id:roomId}=await mutateClassroom(db,teacher,{action:'createRoom',name:'Old group',description:''},NOW);
 const {id:sessionId}=await mutatePreparation(db,teacher,{action:'openPreparation',startMode:'automatic',roomId,title:'Old class'},NOW+4);await mutatePreparation(db,student,{action:'joinClass',sessionId},NOW+5);
 await db.prepare('UPDATE admissions SET teacher_id=? WHERE student_id=?').bind(other.id,student.id).run();
 const {id:newRoom}=await mutateClassroom(db,other,{action:'createRoom',name:'New group',description:''},NOW+6);
 const {id:callId}=await mutateClassroom(db,student,{action:'requestCall',roomId:newRoom,topic:'A new group question'},NOW+7);await mutateClassroom(db,other,{action:'acceptCall',callId},NOW+8);
 await sweepUnpaidSessions(db,teacher,NOW+9);
 assert.equal((await db.prepare('SELECT status FROM classroom_calls WHERE id=?').bind(callId).first()).status,'accepted');
 assert.equal((await db.prepare('SELECT left_at FROM class_attendance WHERE student_id=?').bind(student.id).first()).left_at,NOW+9);
});
test('generated video access requires paid admission and a current account-bound lease',async()=>{
 await reject(authorizeVideo(db,student,null,null,NOW),403);await admit();await subscribe();await reject(authorizeVideo(db,student,null,null,NOW+4),402);
 const lease=await mutateEngagement(db,student,{action:'videoLease',leaseId:null},NOW+5);await authorizeVideo(db,student,null,lease.leaseId,NOW+6);
 await reject(authorizeVideo(db,student,null,lease.leaseId,lease.expiresAt),402);
 await admit(student2);await subscribe(student2,'TWO1234567');await reject(authorizeVideo(db,student2,null,lease.leaseId,NOW+7),402);
 await authorizeVideo(db,teacher,null,null,NOW+7);await reject(authorizeVideo(db,other,teacher.id,null,NOW+7),403);
});
test('generated clip byte ranges support seeking without invalid or overlapping range requests',()=>{
 assert.deepEqual(videoRange(null,100),{start:0,end:99,partial:false});assert.deepEqual(videoRange('bytes=10-19',100),{start:10,end:19,partial:true});assert.deepEqual(videoRange('bytes=-10',100),{start:90,end:99,partial:true});assert.deepEqual(videoRange('bytes=90-',100),{start:90,end:99,partial:true});
 for(const range of ['bytes=100-','bytes=20-10','bytes=0-5,10-15','not-a-range','bytes=-0'])assert.throws(()=>videoRange(range,100),e=>e.status===416);
});
test('access reports expire records after thirty days without exposing them to learners',async()=>{
 await admit();await reject(requirePaidAccess(db,student,NOW),402);assert.equal((await readAccessAlerts(db,teacher,NOW+1)).length,1);assert.equal((await readAccessAlerts(db,teacher,NOW+31*86400000)).length,0);
});

const assignmentQuestions=()=>[{text:'Which part controls cell activities?',choices:['Nucleus','Cell wall','Vacuole','Cytoplasm'],correct:0,explanation:'The nucleus controls cell activities.'},{text:'Which part surrounds the cell?',choices:['Nucleus','Cell membrane','Vacuole','Chromosome'],correct:1,explanation:'The cell membrane surrounds the cell.'}];
async function assignment(options={}){return (await mutateAssignment(db,teacher,{action:'saveAssignment',title:'Cells review',classLevel:'grade-9',subject:'general',topic:'Cells',questions:assignmentQuestions(),...options},NOW)).id}
async function assigned(who=student,id){const d=await readAssignments(db,who,NOW+10);return d.assignmentEntries.find(e=>e.assignment_id===id)}
async function publishAssignment(id){return mutateAssignment(db,teacher,{action:'publishAssignment',id,reviewed:true},NOW+4)}
async function answerAssignment(who,id,choices){const d=await readAssignments(db,who,NOW+10),a=d.assignments.find(a=>a.id===id),e=d.assignmentEntries.find(e=>e.assignment_id===id);for(let i=0;i<choices.length;i++)await mutateAssignment(db,who,{action:'saveAssignmentAnswer',entryId:e.id,questionId:a.questions[i].id,choice:choices[i]},NOW+11+i);return e}
test('assignment authoring validates class, unique choices and teacher permissions',async()=>{
 await reject(mutateAssignment(db,student,{action:'saveAssignment',title:'Fake work',classLevel:'grade-9',subject:'general',topic:'Cells',questions:assignmentQuestions()},NOW),403);
 await reject(assignment({subject:'core-mathematics'}),400);
 await reject(assignment({questions:[{...assignmentQuestions()[0],choices:['A','a','B','C']}]}),400);
 assert.equal(AssignmentAction.safeParse({action:'publishAssignment',id:crypto.randomUUID(),reviewed:false}).success,false);
 const id=await assignment();await reject(mutateAssignment(db,other,{action:'publishAssignment',id,reviewed:true},NOW),403);
 assert.equal((await readAssignments(db,other,NOW)).assignments.length,0);await reject(publishAssignment(id),409);
});
test('publishing assigns only admitted matching-class learners belonging to the teacher',async()=>{
 await admit();await admit(student2);await subscribe();await subscribe(student2,'SUB2234567');await db.prepare("UPDATE admissions SET level='Grade 8' WHERE student_id=?").bind(student2.id).run();
 const outsider=await initializeUser(db,identity('outsider','out@example.test','Other Class'),'owner@example.test',NOW);await admit(outsider);await db.prepare('UPDATE admissions SET teacher_id=? WHERE student_id=?').bind(other.id,outsider.id).run();
 const id=await assignment();assert.equal((await publishAssignment(id)).assigned,1);
 const d=await readAssignments(db,student,NOW+10);assert.equal(d.assignments[0].id,id);assert.equal(d.assignmentEntries.length,1);for(const q of d.assignments[0].questions){assert.equal(q.correct,undefined);assert.equal(q.explanation,undefined)}
 assert.equal((await readAssignments(db,student2,NOW+10)).assignments.length,0);assert.equal((await readAssignments(db,teacher,NOW)).assignmentEntries.length,1);
 await reject(mutateAssignment(db,teacher,{action:'saveAssignment',id,title:'Changed work',classLevel:'grade-9',subject:'general',topic:'Cells',questions:assignmentQuestions()},NOW+10),409);
 await reject(publishAssignment(id),409);assert.equal(normalizeClass('Junior School · Grade 9'),'grade-9');assert.equal(normalizeClass('Secondary · Form 3 (8-4-4)'),'form-3');
});
test('assignment marking uses saved answers, accepts zero-index choice and locks submissions',async()=>{
 await admit();await subscribe();const id=await assignment();await publishAssignment(id);const e=await answerAssignment(student,id,[0]);
 const result=await mutateAssignment(db,student,{action:'submitAssignment',entryId:e.id,score:999},NOW+20);assert.deepEqual(result,{score:1,total:2});
 assert.deepEqual(await mutateAssignment(db,student,{action:'submitAssignment',entryId:e.id},NOW+21),result);
 const d=await readAssignments(db,student,NOW+22);assert.equal(d.assignmentEntries[0].status,'submitted');assert.equal(d.assignmentRankings[0].rank,1);
 await reject(mutateAssignment(db,student,{action:'saveAssignmentAnswer',entryId:e.id,questionId:d.assignments[0].questions[1].id,choice:1},NOW+23),409);
 assert.equal(d.assignments[0].questions[0].correct,undefined);
});
test('assignment answers and results cannot be read or changed across learners',async()=>{
 await admit();await admit(student2);await subscribe();await subscribe(student2,'SUB2234567');const id=await assignment();await publishAssignment(id);const e=await assigned(student,id);const d=await readAssignments(db,student,NOW+10);
 await reject(mutateAssignment(db,student2,{action:'submitAssignment',entryId:e.id},NOW+20),403);
 await reject(mutateAssignment(db,student2,{action:'saveAssignmentAnswer',entryId:e.id,questionId:d.assignments[0].questions[0].id,choice:0},NOW+20),403);
 await reject(mutateAssignment(db,student,{action:'saveAssignmentAnswer',entryId:e.id,questionId:crypto.randomUUID(),choice:0},NOW+20),400);
 await mutateAssignment(db,student,{action:'submitAssignment',entryId:e.id},NOW+20);
 const own=await readAssignments(db,student2,NOW+21);assert.ok(own.assignmentEntries.every(e=>e.student_id===student2.id));assert.equal(own.assignmentRankings.length,0);
});
test('assignment rankings use competition ties and exclude drafts',async()=>{
 const third=await initializeUser(db,identity('third','third@example.test','Third Learner'),'owner@example.test',NOW);
 for(const [who,receipt] of [[student,'SUB1234567'],[student2,'SUB2234567'],[third,'SUB3234567']]){await admit(who);await subscribe(who,receipt)}
 const id=await assignment();await publishAssignment(id);
 for(const who of [student,student2]){const e=await answerAssignment(who,id,[0,1]);await mutateAssignment(db,who,{action:'submitAssignment',entryId:e.id},NOW+20)}
 let d=await readAssignments(db,teacher,NOW+21);assert.deepEqual(d.assignmentRankings.map(r=>r.rank),[1,1]);
 const e=await assigned(third,id);await mutateAssignment(db,third,{action:'submitAssignment',entryId:e.id},NOW+22);
 d=await readAssignments(db,teacher,NOW+23);assert.deepEqual(d.assignmentRankings.map(r=>r.rank),[1,1,3]);assert.ok(d.assignmentRankings.every(r=>r.ranked_count===3));
 const learner=await readAssignments(db,third,NOW+24);assert.equal(learner.assignmentRankings.length,1);assert.equal(learner.assignmentRankings[0].rank,3);assert.equal(learner.assignmentRankings[0].student_name,'');assert.equal((await readAssignments(db,other,NOW)).assignmentRankings.length,0);
});
test('assignment submission enforces due date, closure, class placement and paid access',async()=>{
 await admit();await subscribe();const id=await assignment({dueAt:NOW+1000});await publishAssignment(id);const e=await assigned(student,id);
 await reject(mutateAssignment(db,student,{action:'submitAssignment',entryId:e.id},NOW+1000),409);
 await db.prepare("UPDATE admissions SET level='Grade 8' WHERE student_id=?").bind(student.id).run();await reject(mutateAssignment(db,student,{action:'submitAssignment',entryId:e.id},NOW+20),403);
 await db.prepare("UPDATE admissions SET level='Grade 9' WHERE student_id=?").bind(student.id).run();
 await reject(mutateAssignment(db,student,{action:'closeAssignment',id},NOW+20),403);await mutateAssignment(db,teacher,{action:'closeAssignment',id},NOW+20);await reject(mutateAssignment(db,student,{action:'submitAssignment',entryId:e.id},NOW+21),409);
 await db.prepare("UPDATE subscriptions SET status='rejected' WHERE student_id=?").bind(student.id).run();await reject(mutateAssignment(db,student,{action:'submitAssignment',entryId:e.id},NOW+22),402);
});
test('extractive assignment drafts require real material and preserve one exact source answer',()=>{
 assert.throws(()=>draftFromNotes('Cells\nNucleus\nMembrane'),/four clear/);
 const notes='The nucleus contains genetic information and controls cell activities. The cell membrane controls the movement of substances into the cytoplasm. A plant cell wall supports the cell and provides protection. Chloroplasts contain chlorophyll and absorb light for photosynthesis. A vacuole stores water and helps to maintain cell pressure.';
 const qs=draftFromNotes(notes);assert.ok(qs.length>=4);for(const q of qs){assert.equal(q.choices.length,4);assert.equal(new Set(q.choices.map(c=>c.toLowerCase())).size,4);assert.ok(notes.includes(q.explanation));assert.ok(q.explanation.includes(q.choices[q.correct]));assert.ok(q.text.includes('____'));}
});

async function chatRoom(overrides={}){return (await mutateChat(db,teacher,{action:'createChat',classLevel:'grade-9',subject:'general',topic:'Cells',title:'Cells discussion',...overrides},NOW)).id}
async function topicLesson(overrides={}){return (await mutateFeature(db,teacher,{action:'createLesson',classLevel:'grade-9',topic:'Cells',title:'Cell structures',summary:'Teacher-reviewed notes',content:'The nucleus controls cell activities.',subject:'general',curriculum:'cbe-junior',price:0,...overrides},NOW)).id}
const chatSend=(who,roomId,body='Please explain the nucleus.',at=NOW+30,id=crypto.randomUUID())=>mutateChat(db,who,{action:'chatMessage',id,roomId,body},at);
test('class chatrooms are isolated by admitted teacher and canonical class',async()=>{
 await admit();await admit(student2);await subscribe();await subscribe(student2,'SUB2234567');await db.prepare("UPDATE admissions SET level='Grade 8' WHERE student_id=?").bind(student2.id).run();
 const id=await chatRoom();await chatSend(student,id);assert.equal((await readChat(db,student,NOW+31)).chatMessages.length,1);
 assert.equal((await readChat(db,student2,NOW+31)).chatRooms.length,0);await reject(chatSend(student2,id),403);await reject(chatSend(other,id),403);
 assert.equal((await readChat(db,other,NOW)).chatRooms.length,0);await reject(mutateChat(db,student,{action:'createChat',classLevel:'grade-9',subject:'general',topic:'Cells',title:'My room'},NOW),403);await reject(chatRoom({classLevel:'grade-10',subject:'mathematics'}),400);
 assert.equal((await readChat(db,admin,NOW)).chatRooms.length,1);
});
test('chat messages are durable, idempotent, plain data and rate limited',async()=>{
 await admit();await subscribe();const roomId=await chatRoom(),id=crypto.randomUUID();const body='<script>alert("not executed")</script> What is a cell?';await chatSend(student,roomId,body,NOW+30,id);await chatSend(student,roomId,body,NOW+31,id);
 let d=await readChat(db,teacher,NOW+32);assert.equal(d.chatMessages.length,1);assert.equal(d.chatMessages[0].body,body);assert.equal(d.chatMessages[0].sender_id,student.id);
 await reject(chatSend(student,roomId,'Changed retry',NOW+33,id),409);
 for(let i=1;i<20;i++)await chatSend(student,roomId,'Question '+i,NOW+40+i);await reject(chatSend(student,roomId,'Too fast',NOW+70),429);await chatSend(student,roomId,'After the rate window',NOW+61000);
 assert.equal(ChatAction.safeParse({action:'chatMessage',id:crypto.randomUUID(),roomId,body:' '}).success,false);
});
test('teacher lock and message removal cannot be bypassed by learners or other teachers',async()=>{
 await admit();await admit(student2);await subscribe();await subscribe(student2,'SUB2234567');const roomId=await chatRoom();const {id}=await chatSend(student,roomId);
 await reject(mutateChat(db,student2,{action:'removeChatMessage',id},NOW+31),403);await reject(mutateChat(db,other,{action:'removeChatMessage',id},NOW+31),403);
 await mutateChat(db,teacher,{action:'chatStatus',roomId,status:'locked'},NOW+32);await reject(chatSend(student,roomId),409);await reject(mutateChat(db,student,{action:'chatStatus',roomId,status:'open'},NOW+33),403);
 await mutateChat(db,teacher,{action:'removeChatMessage',id},NOW+34);const d=await readChat(db,student,NOW+35);assert.equal(d.chatMessages[0].body,'');assert.equal(d.chatMessages[0].removed_at,NOW+34);
 await mutateChat(db,teacher,{action:'chatStatus',roomId,status:'open'},NOW+36);const own=await chatSend(student,roomId,'Own message',NOW+37);await mutateChat(db,student,{action:'removeChatMessage',id:own.id},NOW+38);
});
test('topic notes share creates one room and enforces published exact class-subject-topic matching',async()=>{
 await admit();await subscribe();const lessonId=await topicLesson();await db.prepare("UPDATE lessons SET status='draft' WHERE id=?").bind(lessonId).run();await reject(mutateChat(db,teacher,{action:'shareTopicNotes',lessonId},NOW+1),409);
 await mutateFeature(db,teacher,{action:'lessonStatus',lessonId,status:'published'},NOW+2);
 const {id:roomId}=await mutateChat(db,teacher,{action:'shareTopicNotes',lessonId},NOW+3);assert.equal((await mutateChat(db,teacher,{action:'shareTopicNotes',lessonId},NOW+4)).id,roomId);
 let d=await readChat(db,student,NOW+5);assert.equal(d.chatRooms.length,1);assert.equal(d.sharedTopicNotes[0].content,'The nucleus controls cell activities.');
 const wrong=await topicLesson({topic:'Acids'});await mutateFeature(db,teacher,{action:'lessonStatus',lessonId:wrong,status:'published'},NOW+6);await reject(mutateChat(db,teacher,{action:'pinChatNotes',roomId,lessonId:wrong},NOW+7),400);
 await reject(mutateChat(db,other,{action:'shareTopicNotes',lessonId},NOW+7),403);await reject(mutateChat(db,student,{action:'pinChatNotes',roomId,lessonId},NOW+7),403);
 await mutateFeature(db,teacher,{action:'lessonStatus',lessonId,status:'archived'},NOW+8);assert.equal((await readChat(db,student,NOW+9)).sharedTopicNotes.length,0);
});
test('chat preserves paid lesson locks even with paid access earned from a different lesson',async()=>{
 await admit();const paid=await topicLesson({price:100});await mutateFeature(db,teacher,{action:'lessonStatus',lessonId:paid,status:'published'},NOW+1);await mutateChat(db,teacher,{action:'shareTopicNotes',lessonId:paid},NOW+2);
 const another=await lesson(50);await settings();const claim=await mutateFeature(db,student,{action:'claimPayment',lessonId:another,phone:'0712345678',receipt:'CHAT123456'},NOW+3);await mutateFeature(db,admin,{action:'reviewPayment',paymentId:claim.id,status:'verified',note:'Actual statement checked'},NOW+4);
 const d=await readChat(db,student,NOW+5);assert.equal(d.sharedTopicNotes[0].unlocked,false);assert.equal(d.sharedTopicNotes[0].content,undefined);
 await subscribe();assert.equal((await readChat(db,student,NOW+6)).sharedTopicNotes[0].unlocked,true);
});
test('chat and shared notes are unavailable with expired access or an active assessment',async()=>{
 await admit();await subscribe();const roomId=await chatRoom();await start(await exam());const d=await readChat(db,student,NOW+10);assert.equal(d.chatRooms.length,0);assert.match(d.chatNotice,/active assessment/);await reject(chatSend(student,roomId),409);
 await db.prepare("UPDATE sessions SET status='submitted' WHERE student_id=?").bind(student.id).run();await db.prepare("UPDATE subscriptions SET status='rejected' WHERE student_id=?").bind(student.id).run();await reject(chatSend(student,roomId),402);await reject(readChat(db,student,NOW+40),402);
});

test('every original revision pack aligns to an actual class topic and generates grounded draft questions',()=>{
 const packs=JSON.parse(fs.readFileSync('app/curriculum/revision-notes.json','utf8')),courses=JSON.parse(fs.readFileSync('app/curriculum/reference-topics.json','utf8'));
 assert.equal(packs.length,36);assert.equal(new Set(packs.map(p=>p.level)).size,7);assert.equal(new Set(packs.map(p=>p.id)).size,36);
 for(const p of packs){const c=courses.find(c=>c.level===p.level&&c.subject===p.subject);assert.ok(c?.topics.some(t=>t.title===p.topic));assert.match(p.author,/original/);assert.match(p.review,/Teacher review required/);const qs=draftFromNotes(p.content);assert.ok(qs.length>=4,p.id+' '+p.topic);for(const q of qs){assert.ok(p.content.includes(q.explanation));assert.equal(new Set(q.choices.map(c=>c.toLowerCase())).size,4);assert.ok(q.explanation.includes(q.choices[q.correct]));assert.doesNotMatch(q.text,/Learning goal|Complete the statement from your lesson notes: Practice/);}}
});
test('automatic note selection isolates class and subject, prefers published teacher notes, and excludes empty drafts',()=>{
 const lessons=[{id:'a',title:'Teacher cells',class_level:'grade-8',subject:'general',topic:'The Cell',status:'published',content:'Published teacher content'}, {id:'b',title:'Wrong class',class_level:'grade-9',subject:'general',topic:'The Cell',status:'published',content:'Wrong'}, {id:'c',title:'Archived',class_level:'grade-8',subject:'general',topic:'The Cell',status:'archived',content:'Archived'}, {id:'d',title:'Wrong subject',class_level:'grade-8',subject:'english',topic:'The Cell',status:'published',content:'Wrong'}];
 const drafts=[{id:'e',class_level:'grade-8',subject:'general',title:'The Cell',notes:'Teacher draft'},{id:'f',class_level:'grade-8',subject:'general',title:'The Cell',notes:''}];
 const packs=JSON.parse(fs.readFileSync('app/curriculum/revision-notes.json','utf8'));const sources=sourcesForTopic('grade-8','general','the cell',lessons,drafts,packs);assert.deepEqual(sources.map(s=>s.kind),['published','teacher-draft','revision']);assert.equal(sources[0].id,'lesson:a');assert.equal(sourcesForTopic('grade-8','general','',lessons,drafts,packs).length,0);assert.equal(sourcesForTopic('grade-8','general','Unknown topic',lessons,drafts,packs).length,0);
});

fs.writeFileSync('.sites-runtime/conference-test.mjs',ts.transpileModule(fs.readFileSync('app/conference/service.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("'../service'","'./service-test.mjs'"));
const {claimConference,conferenceHash}=await import('../.sites-runtime/conference-test.mjs');
async function conferencePass(code='CONF-TEST-ONE'){await db.prepare('INSERT INTO conference_passes(code_hash,redeem_by) VALUES(?,?)').bind(await conferenceHash(code),NOW+86400000).run();return code}
test('Conference pass grants one student exactly 30 minutes without a payment',async()=>{
 await admit();await admit(student2);const code=await conferencePass();const r=await claimConference(db,student,code,teacher.id,'Grade 9',NOW);
 assert.equal(r.expiresAt,NOW+1800000);assert.equal((await requirePaidAccess(db,student,NOW+1799999)).expires_at,r.expiresAt);
 await assert.rejects(()=>requirePaidAccess(db,student,NOW+1800000),/verified payment/);
 assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM subscriptions').get().n,0);
 assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM payments').get().n,0);
 assert.equal((await claimConference(db,student,code,teacher.id,'Grade 9',NOW+100)).expiresAt,r.expiresAt);
 await assert.rejects(()=>claimConference(db,student2,code,teacher.id,'Grade 9',NOW+100),/unavailable/);
 const otherCode=await conferencePass('CONF-TEST-TWO');await assert.rejects(()=>claimConference(db,student,otherCode,teacher.id,'Grade 9',NOW+1800001),/already used/);
});
test('Conference does not override rejected admission or change an approved teacher',async()=>{
 await admit();await claimConference(db,student,await conferencePass(),other.id,'Grade 7',NOW);
 assert.equal(db.sqlite.prepare('SELECT teacher_id FROM admissions WHERE student_id=?').get(student.id).teacher_id,teacher.id);
 await admit(student2);await mutateEngagement(db,admin,{action:'reviewAdmission',studentId:student2.id,status:'rejected',note:'Review required'},NOW);
 await assert.rejects(()=>claimConference(db,student2,'CONF-TEST-ONE',teacher.id,'Grade 9',NOW),/admission/);
 await assert.rejects(async()=>claimConference(db,student2,await conferencePass('CONF-REJECT'),teacher.id,'Grade 9',NOW),/admission/);
});
test('Conference rejects expired codes and disabled students; lesson notes unlock only during pass',async()=>{
 await admit();const code=await conferencePass();await assert.rejects(()=>claimConference(db,student,code,teacher.id,'Grade 9',NOW+86400001),/unavailable/);
 await assert.rejects(()=>claimConference(db,{...student,disabled:1},code,teacher.id,'Grade 9',NOW),/enabled student/);
 await claimConference(db,student,code,teacher.id,'Grade 9',NOW);
 const id=await lesson(100);
 await canReadLesson(db,student,id,NOW+1);assert.equal((await readFeatures(db,student,NOW+1)).lessons.find(l=>l.id===id).unlocked,true);await assert.rejects(()=>canReadLesson(db,student,id,NOW+1800000),/verified payment/);
});

const {TeacherSignup,requestTeacherSignup,teacherSignupState}=await import('../.sites-runtime/portal-test.mjs');
test('Teacher signup stays student until admin approval; decisions cannot be self-approved or replayed',async()=>{
 const input=TeacherSignup.parse({fullName:'Applicant Teacher',phone:'0712345678',subject:'Mathematics'});
 await requestTeacherSignup(db,student,input,NOW);
 assert.equal((await initializeUser(db,identity('student','student@example.test','Student'),'owner@example.test',NOW)).role,'student');
 const application=(await teacherSignupState(db,student)).application;
 assert.equal(application.status,'pending');assert.equal((await readPortalAccounts(db,teacher)).teacherApplications.length,0);
 await reject(mutatePortal(db,student,{action:'reviewTeacherSignup',id:application.id,status:'approved',note:''},NOW),403);
 await reject(mutatePortal(db,teacher,{action:'reviewTeacherSignup',id:application.id,status:'approved',note:''},NOW),403);
 await mutatePortal(db,admin,{action:'reviewTeacherSignup',id:application.id,status:'approved',note:'Welcome'},NOW+1);
 assert.equal((await initializeUser(db,identity('student','student@example.test','Student'),'owner@example.test',NOW+2)).role,'teacher');
 assert.equal((await readPortalAccounts(db,admin)).teacherAccounts[0].user_id,student.id);
 await reject(mutatePortal(db,admin,{action:'reviewTeacherSignup',id:application.id,status:'rejected',note:'Late'},NOW+3),409);
});
test('Rejected teacher applications do not grant roles; duplicate applications preserve admin decisions',async()=>{
 const input=TeacherSignup.parse({fullName:'Applicant',phone:'0712345678',subject:'English'});
 await requestTeacherSignup(db,student,input,NOW);const application=(await teacherSignupState(db,student)).application;
 await mutatePortal(db,admin,{action:'reviewTeacherSignup',id:application.id,status:'rejected',note:'Contact admin'},NOW+1);
 await reject(requestTeacherSignup(db,student,input,NOW+2),409);
 assert.equal((await teacherSignupState(db,student)).application.note,'Contact admin');
 assert.equal((await initializeUser(db,identity('student','student@example.test','Student'),'owner@example.test',NOW+3)).role,'student');
 assert.equal((await readPortalAccounts(db,admin)).teacherAccounts.length,0);
 await reject(requestTeacherSignup(db,teacher,input,NOW),403);
 assert.equal(TeacherSignup.safeParse({...input,phone:''}).success,false);
});

for(const [src,out,replacements] of [
 ['app/hub/service.ts','hub',[["'../classroom/preparation'","'./preparation-test.mjs'"],["'../classroom/enrollment'","'./enrollment-test.mjs'"],["'../classroom/lifecycle'","'./lesson-lifecycle-test.mjs'"],["'../service'","'./service-test.mjs'"],["'../classroom/access'","'./class-access-test.mjs'"],["'../teaching/catalog'","'./teaching-catalog-test.mjs'"],["'../assignments/service'","'./assignments-test.mjs'"]]],
 ['app/registration-fee/service.ts','registration-fee',[["'../payments/review'","'./payment-review-test.mjs'"],["'../service'","'./service-test.mjs'"],["'../engagement/service'","'./engagement-test.mjs'"]]],
]){let code=ts.transpileModule(fs.readFileSync(src,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;for(const [a,b] of replacements)code=code.replaceAll(a,b);fs.writeFileSync('.sites-runtime/'+out+'-test.mjs',code)}
const {HubAction,mutateHub,readHub,readDisplay,teachingClassAccess}=await import('../.sites-runtime/hub-test.mjs');
const {RegistrationAction,mutateRegistrationFee,readRegistrationFees}=await import('../.sites-runtime/registration-fee-test.mjs');
async function teachingClass(u=teacher,level='grade-9'){return (await mutateHub(db,u,{action:'createTeachingClass',name:'Grade class Mathematics',classLevel:level,subject:'mathematics',topic:'Equations'},NOW)).id}
test('Class hub isolates teaching groups and students by admitted class and paid access',async()=>{
 await admit();const id=await teachingClass();const otherId=await teachingClass(other);await reject(readHub(db,student,id,undefined,NOW),402);await subscribe();
 assert.equal((await readHub(db,student,id,undefined,NOW+3)).classes.length,1);assert.equal((await readHub(db,student,id,undefined,NOW+3)).roster.length,0);
 await reject(readHub(db,other,id,undefined,NOW),403);await reject(readHub(db,student,otherId,undefined,NOW+3),403);
 const grade8=await teachingClass(teacher,'grade-8');await reject(readHub(db,student,grade8,undefined,NOW+3),403);
 await reject(mutateHub(db,student,{action:'createTeachingClass',name:'Attack',classLevel:'grade-9',subject:'mathematics',topic:'Equations'},NOW),403);
 assert.equal((await readHub(db,admin,undefined,undefined,NOW)).classes.length,3);
});
test('Timetable persists, rejects overlapping teacher or room bookings, and allows adjacent slots after cancellation',async()=>{
 const id=await teachingClass(),otherId=await teachingClass(other);const slot={action:'scheduleLesson',classId:id,weekday:0,startMinute:480,endMinute:520,location:'Lab 2'};
 const first=await mutateHub(db,teacher,slot,NOW);await reject(mutateHub(db,teacher,{...slot,location:'Different room'},NOW),409);
 await reject(mutateHub(db,other,{...slot,classId:otherId,location:'lab 2'},NOW),409);
 await mutateHub(db,other,{...slot,classId:otherId,location:'Room 3'},NOW);
 await mutateHub(db,teacher,{...slot,startMinute:520,endMinute:560},NOW);
 await reject(mutateHub(db,teacher,{...slot,endMinute:400},NOW),400);
 await reject(mutateHub(db,other,{action:'cancelTimetableSlot',id:first.id},NOW),403);
 await mutateHub(db,teacher,{action:'cancelTimetableSlot',id:first.id},NOW);await mutateHub(db,teacher,slot,NOW);
 assert.equal((await readHub(db,teacher,id,undefined,NOW)).timetable.length,2);
});
test('Daily attendance is teacher-owned, durable, class-specific, and separate from online presence',async()=>{
 await admit();const id=await teachingClass();const date=(await readHub(db,teacher,id,undefined,NOW)).day;
 await mutateHub(db,teacher,{action:'markClassRoll',classId:id,studentId:student.id,day:date,status:'present'},NOW);
 let roster=(await readHub(db,teacher,id,date,NOW)).roster;assert.equal(roster[0].attendance,'present');assert.equal(roster[0].online,false);assert.equal(roster[0].average,null);
 await mutateHub(db,teacher,{action:'markClassRoll',classId:id,studentId:student.id,day:date,status:'excused'},NOW+1);
 assert.equal((await readHub(db,teacher,id,date,NOW+2)).roster[0].attendance,'excused');
 assert.equal(HubAction.safeParse({action:'markClassRoll',classId:id,studentId:student.id,day:'2026-02-30',status:'present'}).success,false);
 await reject(mutateHub(db,teacher,{action:'markClassRoll',classId:id,studentId:student2.id,day:date,status:'present'},NOW),403);
});
test('Lesson boards sync only published notes, clear after stop, and are hidden during active exams',async()=>{
 await admit();await subscribe();const id=await teachingClass();const body={action:'publishLessonBoard',classId:id,title:'Equations',body:'Teacher-authored lesson notes',live:false};
 await mutateHub(db,teacher,body,NOW);assert.equal((await readDisplay(db,student,id,NOW+2)).board,null);
 await mutateHub(db,teacher,{...body,live:true},NOW+3);assert.equal((await readDisplay(db,student,id,NOW+4)).board.body,body.body);
 const displayId=crypto.randomUUID();await mutateHub(db,student,{action:'displayHeartbeat',classId:id,id:displayId},NOW+5);
 assert.equal((await readHub(db,teacher,id,undefined,NOW+6)).classes[0].display_count,1);
 await reject(mutateHub(db,student,{...body,live:true},NOW+6),403);await reject(readDisplay(db,other,id,NOW+6),403);
 const sid=await start(await exam(),student,NOW+7);assert.equal((await readDisplay(db,student,id,NOW+8)).board,null);
 await mutate(db,student,{action:'submit',sessionId:sid},NOW+9);await mutateHub(db,teacher,{action:'stopLessonBoard',classId:id},NOW+10);
 assert.equal((await readDisplay(db,student,id,NOW+11)).board,null);assert.equal((await readHub(db,teacher,id,undefined,NOW+11)).classes[0].display_count,0);
});
test('Registration manual payment is distinct from tuition and never grants access or video credit',async()=>{
 await admit();await plan();const p=await mutateRegistrationFee(db,student,{action:'claimRegistrationFee',phone:'0712345678',receipt:'REG1234567'},NOW);
 await reject(mutateRegistrationFee(db,teacher,{action:'reviewRegistrationFee',...await reviewEvidence(db,'registration',p.id),id:p.id,status:'verified',note:'Teacher cannot verify'},NOW),403);
 await mutateRegistrationFee(db,admin,{action:'reviewRegistrationFee',...await reviewEvidence(db,'registration',p.id),id:p.id,status:'verified',note:'Statement reconciled'},NOW+1);
 assert.equal(await refreshAccess(db,student.id,NOW+2),null);assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM subscriptions').get().n,0);assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM video_credits').get().n,0);
 assert.equal((await readRegistrationFees(db,admin)).payments[0].amount,100);
 await reject(mutateEngagement(db,student,{action:'claimSubscription',phone:'0712345678',receipt:'REG1234567'},NOW+3),409);
 await reject(mutateRegistrationFee(db,admin,{action:'reviewRegistrationFee',id:p.id,status:'rejected',note:'Overwrite'},NOW+3),409);
 await reject(mutateRegistrationFee(db,student,{action:'claimRegistrationFee',phone:'0712345678',receipt:'REG2345678'},NOW+3),409);
});
test('Registration cannot reuse a tuition or lesson receipt; fee changes do not reprice existing records',async()=>{
 await admit();await plan();await mutateEngagement(db,student,{action:'claimSubscription',phone:'0712345678',receipt:'TU12345678'},NOW);
 await reject(mutateRegistrationFee(db,student,{action:'claimRegistrationFee',phone:'0712345678',receipt:'TU12345678'},NOW+1),409);
 const p=await mutateRegistrationFee(db,student,{action:'claimRegistrationFee',phone:'0712345678',receipt:'RE12345678'},NOW+2);
 await mutateRegistrationFee(db,admin,{action:'registrationFeeSettings',amount:150},NOW+3);
 const state=await readRegistrationFees(db,admin);assert.equal(state.settings.amount,150);assert.equal(state.payments[0].amount,100);assert.equal(state.tuitionPlan.price,200);
 const id=await lesson();await settings();await reject(mutateFeature(db,student,{action:'claimPayment',lessonId:id,phone:'0712345678',receipt:'RE12345678'},NOW+4),409);
 assert.equal((await readRegistrationFees(db,other)).payments.length,0);assert.equal((await readRegistrationFees(db,student2)).payments.length,0);
});
test('Provider-confirmed registration is server-priced, idempotent, and grants no tuition entitlement',async()=>{
 await admit();await plan();const fetcher=async(url,options)=>{if(url.includes('/oauth/'))return Response.json({access_token:'test-only-token'});const b=JSON.parse(options.body);if(url.includes('/processrequest')){assert.equal(b.Amount,100);assert.equal(b.TransactionDesc,'Registration');assert.ok(b.TransactionDesc.length<=13);return Response.json({ResponseCode:'0',CheckoutRequestID:'reg_checkout',MerchantRequestID:'reg_merchant'})}return Response.json({CheckoutRequestID:'reg_checkout',MerchantRequestID:'reg_merchant',ResultCode:'0'})};
 const p=await mutatePayment(db,student,{action:'startPayment',phone:'0712345678',purpose:'registration'},paymentConfig,NOW+1,fetcher);
 assert.equal(p.purpose,'registration');assert.equal(p.days,0);
 await mutateRegistrationFee(db,admin,{action:'registrationFeeSettings',amount:200},NOW+2);
 const confirmed=await mutatePayment(db,student,{action:'checkPayment',id:p.id},paymentConfig,NOW+3,fetcher);assert.equal(confirmed.status,'confirmed');
 await mutatePayment(db,student,{action:'checkPayment',id:p.id},paymentConfig,NOW+4,fetcher);
 assert.equal((await readRegistrationFees(db,admin)).payments[0].amount,100);assert.equal((await readRegistrationFees(db,admin)).payments.length,1);assert.equal(await refreshAccess(db,student.id,NOW+5),null);
 assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM subscriptions').get().n,0);
 assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM video_credits').get().n,0);
});

const {advanceLessonClock,microphoneAllowed}=await import('../.sites-runtime/lesson-lifecycle-test.mjs');
const {PreparationAction}=await import('../.sites-runtime/preparation-test.mjs');
async function timedLesson(){await admit();await subscribe();const {id:roomId}=await mutateClassroom(db,teacher,{action:'createRoom',name:'Timed classroom',description:''},NOW);const opened=await mutatePreparation(db,teacher,PreparationAction.parse({action:'openPreparation',startMode:'automatic',roomId,title:'Timed science lesson',preparationMinutes:1,durationMinutes:2}),NOW);await mutatePreparation(db,student,{action:'joinClass',sessionId:opened.id},NOW+1);return {...opened,roomId}}
test('Lesson clock starts only after preparation and automatically ends after chosen teaching time',async()=>{
 const s=await timedLesson();assert.equal(s.startsAt,NOW+60000);assert.equal(s.endsAt,NOW+180000);
 await reject(mutatePreparation(db,teacher,{action:'startClass',sessionId:s.id},NOW+59999),409);
 await reject(mutateClassroom(db,student,{action:'requestCall',roomId:s.roomId,topic:'Ask too early'},NOW+59999),409);
 assert.equal((await readPreparation(db,teacher,NOW+59999)).classSessions[0].status,'preparing');
 await mutatePreparation(db,teacher,{action:'startClass',sessionId:s.id},NOW+60000);
 assert.equal((await readPreparation(db,teacher,NOW+60000)).classSessions[0].status,'live');
 await mutatePreparation(db,student,{action:'cameraCheckIn',sessionId:s.id,frame:'data:image/jpeg;base64,YWJj'},NOW+179999);
 const ended=await readPreparation(db,teacher,NOW+180000);assert.equal(ended.classSessions.length,0);assert.equal(ended.recentEnded[0].ended_at,NOW+180000);
 const attendance=db.sqlite.prepare('SELECT * FROM class_attendance WHERE session_id=?').get(s.id);assert.equal(attendance.left_at,NOW+180000);assert.equal(attendance.camera_frame,null);
 await reject(mutatePreparation(db,student,{action:'classHeartbeat',sessionId:s.id},NOW+180001),409);
 await reject(mutateClassroom(db,student,{action:'requestCall',roomId:s.roomId,topic:'Lesson has ended'},NOW+180001),409);
 assert.equal(PreparationAction.safeParse({action:'openPreparation',startMode:'automatic',roomId:s.roomId,title:'Bad duration',durationMinutes:0}).success,false);
 assert.equal(PreparationAction.safeParse({action:'openPreparation',startMode:'automatic',roomId:s.roomId,title:'Too long preparation',preparationMinutes:31}).success,false);
});
test('Teacher mute-all and per-student microphone permission persist and cannot be changed by learners or other teachers',async()=>{
 const s=await timedLesson();const now=NOW+60000;
 await mutatePreparation(db,teacher,{action:'classMuteAll',sessionId:s.id,muted:true},now);
 assert.equal((await readPreparation(db,student,now)).classSessions[0].roster[0].mic_allowed,false);
 await reject(mutatePreparation(db,student,{action:'classMuteAll',sessionId:s.id,muted:false},now),403);
 await reject(mutatePreparation(db,other,{action:'classStudentMicrophone',sessionId:s.id,studentId:student.id,muted:false},now),403);
 await mutatePreparation(db,teacher,{action:'classStudentMicrophone',sessionId:s.id,studentId:student.id,muted:false},now+1);
 assert.equal((await readPreparation(db,student,now+1)).classSessions[0].roster[0].mic_allowed,true);
 await mutatePreparation(db,teacher,{action:'classMuteAll',sessionId:s.id,muted:true},now+2);
 assert.equal((await readPreparation(db,student,now+2)).classSessions[0].roster[0].mic_allowed,false);
 await mutatePreparation(db,teacher,{action:'classMuteAll',sessionId:s.id,muted:false},now+3);
 assert.equal((await readPreparation(db,student,now+3)).classSessions[0].roster[0].mic_allowed,true);
 await mutatePreparation(db,teacher,{action:'classStudentMicrophone',sessionId:s.id,studentId:student.id,muted:true},now+4);
 assert.equal((await readPreparation(db,student,now+4)).classSessions[0].roster[0].mic_allowed,false);
 assert.equal(microphoneAllowed({status:'live',starts_at:NOW,ends_at:NOW+10,mute_all:0},{mic_policy:'allowed',left_at:null},NOW+10),false);
});
test('Linked live calls receive mute state and close on manual end or the lesson deadline',async()=>{
 const s=await timedLesson();let now=NOW+60000;
 const {id:callId}=await mutateClassroom(db,student,{action:'requestCall',roomId:s.roomId,topic:'Explain the lesson'},now);
 await mutateClassroom(db,teacher,{action:'acceptCall',callId},now+1);
 assert.equal((await readSignals(db,student,callId,0,now+2)).call.lesson_ends_at,s.endsAt);
 await mutatePreparation(db,teacher,{action:'classMuteAll',sessionId:s.id,muted:true},now+3);
 assert.equal((await readSignals(db,teacher,callId,0,now+4)).call.audio_blocked,true);
 const ended=await readSignals(db,student,callId,0,s.endsAt);assert.equal(ended.call.status,'ended');assert.equal(ended.call.audio_blocked,true);
 await reject(mutateClassroom(db,student,{action:'signal',callId,type:'ice',payload:'null'},s.endsAt+1),409);
 const next=await mutatePreparation(db,teacher,{action:'openPreparation',startMode:'automatic',roomId:s.roomId,title:'Next lesson',preparationMinutes:1,durationMinutes:2},s.endsAt+1);
 await mutatePreparation(db,student,{action:'joinClass',sessionId:next.id},s.endsAt+2);
 now=next.startsAt;const call2=await mutateClassroom(db,student,{action:'requestCall',roomId:s.roomId,topic:'Another question'},now);
 await mutatePreparation(db,teacher,{action:'endClass',sessionId:next.id},now+1);
 assert.equal((await readSignals(db,student,call2.id,0,now+2)).call.status,'ended');
});
test('Shared classroom displays clear when a timed lesson ends',async()=>{
 await admit();await subscribe();const id=await teachingClass();const course=(await readHub(db,teacher,id,undefined,NOW)).selected;
 await mutateHub(db,teacher,{action:'publishLessonBoard',classId:id,title:'Current lesson',body:'Notes for this timed lesson',live:true},NOW);
 const s=await mutatePreparation(db,teacher,{action:'openPreparation',startMode:'automatic',roomId:course.room_id,title:'Board lesson',preparationMinutes:1,durationMinutes:1},NOW);
 assert.equal((await readDisplay(db,student,id,NOW+1)).board,null);
 assert.equal((await readDisplay(db,student,id,s.startsAt)).board.title,'Current lesson');
 assert.equal((await readDisplay(db,student,id,s.endsAt)).board,null);
 assert.equal((await readDisplay(db,teacher,id,s.endsAt)).board,null);
});

async function teacherStartedLesson(){await admit();await subscribe();const {id:roomId}=await mutateClassroom(db,teacher,{action:'createRoom',name:'Teacher-start classroom',description:''},NOW);const opened=await mutatePreparation(db,teacher,{action:'openPreparation',roomId,title:'Teacher starts this lesson',preparationMinutes:1,durationMinutes:2},NOW);await mutatePreparation(db,student,{action:'joinClass',sessionId:opened.id},NOW+1);return {...opened,roomId}}
test('Teacher can join during preparation; lesson waits for teacher start and preserves full duration',async()=>{
 const s=await teacherStartedLesson();assert.equal(s.endsAt,null);
 await mutatePreparation(db,teacher,{action:'joinTeacherClass',sessionId:s.id},NOW+2);
 let state=(await readPreparation(db,student,NOW+3)).classSessions[0];assert.equal(state.status,'preparing');assert.equal(state.teacher_online,true);assert.equal(state.teacher_present_id,teacher.id);assert.equal(state.active_teacher_name,teacher.name);
 await reject(mutatePreparation(db,teacher,{action:'startClass',sessionId:s.id},NOW+59999),409);
 state=(await readPreparation(db,student,NOW+300000)).classSessions[0];assert.equal(state.status,'waiting');assert.equal(state.ends_at,null);assert.equal(state.teacher_online,false);
 await reject(mutateClassroom(db,student,{action:'requestCall',roomId:s.roomId,topic:'Still waiting for teacher'},NOW+300000),409);
 const started=await mutatePreparation(db,teacher,{action:'startClass',sessionId:s.id},NOW+300001);assert.equal(started.endsAt,NOW+420001);assert.equal(started.startedAt,NOW+300001);
 state=(await readPreparation(db,student,NOW+300002)).classSessions[0];assert.equal(state.status,'live');assert.equal(state.teacher_online,true);assert.equal(state.started_by,teacher.id);assert.equal(state.roster[0].late,false);
 const again=await mutatePreparation(db,teacher,{action:'startClass',sessionId:s.id},NOW+310000);assert.equal(again.endsAt,started.endsAt);assert.equal(again.startedAt,started.startedAt);
 assert.equal((await readPreparation(db,student,started.endsAt)).classSessions.length,0);
});
test('Learners and other teachers cannot join or start a teacher-owned lesson',async()=>{
 const s=await teacherStartedLesson();for(const action of ['joinTeacherClass','startClass','teacherClassHeartbeat','leaveTeacherClass']){await reject(mutatePreparation(db,student,{action,sessionId:s.id},NOW+60001),403);await reject(mutatePreparation(db,other,{action,sessionId:s.id},NOW+60001),403)}
 await reject(mutatePreparation(db,teacher,{action:'teacherClassHeartbeat',sessionId:s.id},NOW+2),409);
 await mutatePreparation(db,teacher,{action:'joinTeacherClass',sessionId:s.id},NOW+3);
 await mutatePreparation(db,teacher,{action:'teacherClassHeartbeat',sessionId:s.id},NOW+70000);
 assert.equal((await readPreparation(db,student,NOW+70001)).classSessions[0].teacher_online,true);
 await mutatePreparation(db,teacher,{action:'leaveTeacherClass',sessionId:s.id},NOW+70002);
 assert.equal((await readPreparation(db,student,NOW+70003)).classSessions[0].teacher_online,false);
});
test('Teacher can join and start in one step after preparation; rejoining does not restart the clock',async()=>{
 const s=await teacherStartedLesson();const first=await mutatePreparation(db,teacher,{action:'startClass',sessionId:s.id},NOW+60000);assert.equal(first.endsAt,NOW+180000);
 await mutatePreparation(db,teacher,{action:'leaveTeacherClass',sessionId:s.id},NOW+61000);await mutatePreparation(db,teacher,{action:'joinTeacherClass',sessionId:s.id},NOW+70000);
 const state=(await readPreparation(db,student,NOW+70001)).classSessions[0];assert.equal(state.ends_at,first.endsAt);assert.equal(state.status,'live');assert.equal(state.teacher_online,true);
 await mutatePreparation(db,teacher,{action:'endClass',sessionId:s.id},NOW+71000);await reject(mutatePreparation(db,teacher,{action:'startClass',sessionId:s.id},NOW+71001),409);
});

for(const [src,out,replacements] of [
 ['app/live/service.ts','live',[["'../orientation/access'","'./orientation-test.mjs'"],["'../subject-store/access'","'./subject-access-test.mjs'"],["'../service'","'./service-test.mjs'"],["'../hub/service'","'./hub-test.mjs'"],["'../classroom/enrollment'","'./enrollment-test.mjs'"],["'../classroom/lifecycle'","'./lesson-lifecycle-test.mjs'"],["'../classroom/access'","'./class-access-test.mjs'"],["'../engagement/service'","'./engagement-test.mjs'"]]],
 ['app/live/events.ts','live-events',[]],
]){let code=ts.transpileModule(fs.readFileSync(src,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;for(const [a,b] of replacements)code=code.replaceAll(a,b);fs.writeFileSync('.sites-runtime/'+out+'-test.mjs',code)}
const {liveSnapshot,mutateLive,authorizeSharedMedia,ingestTelemetry,clipAnalytics,adminLiveLessons}=await import('../.sites-runtime/live-test.mjs');
const {classroomEvents}=await import('../.sites-runtime/live-events-test.mjs');
async function cascadeFixture(){await admit();await subscribe();const classId=await teachingClass(),course=(await readHub(db,teacher,classId,undefined,NOW)).selected;const session=await mutatePreparation(db,teacher,{action:'openPreparation',roomId:course.room_id,title:'Live clip lesson',preparationMinutes:1,durationMinutes:2},NOW);await mutatePreparation(db,student,{action:'joinClass',sessionId:session.id},NOW+1);await mutatePreparation(db,teacher,{action:'startClass',sessionId:session.id},NOW+60000);const clipId=crypto.randomUUID();await db.prepare('INSERT INTO learning_videos(id,teacher_id,title,url,created_at) VALUES(?,?,?,?,?)').bind(clipId,teacher.id,'Teacher practical clip','r2:learning/test-only-clip',NOW).run();return {classId,session,course,clipId,at:NOW+60001}}
async function shareFixture(f,duration=20){await mutateLive(db,teacher,{action:'cascadeClip',classId:f.classId,sessionId:f.session.id,clipId:f.clipId,durationSeconds:duration,displayOrder:1},f.at);return (await liveSnapshot(db,student,f.classId,f.at)).cascadedClips[0]}
test('Single classroom onboarding uses real identity, isolates class levels and honors removed enrollment',async()=>{
 const f=await cascadeFixture();let state=await liveSnapshot(db,student,f.classId,f.at);assert.equal(state.classInfo.id,f.classId);assert.equal(state.user.id,student.id);assert.equal(state.library.length,0);assert.equal(state.members.length,0);
 const grade8=await teachingClass(teacher,'grade-8'),c=(await readHub(db,teacher,grade8,undefined,NOW)).selected;await reject(mutatePreparation(db,student,{action:'openPreparation',roomId:c.room_id,title:'Self class'},f.at),403);await reject(mutateClassroom(db,student,{action:'requestCall',roomId:c.room_id,topic:'Wrong grade'},f.at),403);
 await mutateLive(db,teacher,{action:'classEnrollment',classId:f.classId,studentId:student.id,active:false},f.at+1);await reject(liveSnapshot(db,student,f.classId,f.at+2),403);
 state=await liveSnapshot(db,teacher,f.classId,f.at+3);assert.equal(state.members.find(m=>m.student_id===student.id).status,'removed');assert.equal(state.onlineStudents.length,0);
 await mutateLive(db,teacher,{action:'classEnrollment',classId:f.classId,studentId:student.id,active:true},f.at+4);assert.ok(await liveSnapshot(db,student,f.classId,f.at+5));
 await reject(mutateLive(db,student,{action:'classEnrollment',classId:f.classId,studentId:student.id,active:true},f.at+6),403);
});
test('Only the class teacher or admin can cascade owned clips in a live lesson; duplicates update one durable item',async()=>{
 const f=await cascadeFixture(),action={action:'cascadeClip',classId:f.classId,sessionId:f.session.id,clipId:f.clipId,durationSeconds:20,displayOrder:1};
 await reject(mutateLive(db,student,action,f.at),403);await reject(mutateLive(db,other,action,f.at),403);
 const foreign=crypto.randomUUID();await db.prepare('INSERT INTO learning_videos(id,teacher_id,title,url,created_at) VALUES(?,?,?,?,?)').bind(foreign,other.id,'Other teacher clip','r2:other',NOW).run();await reject(mutateLive(db,teacher,{...action,clipId:foreign},f.at),403);
 await mutateLive(db,teacher,action,f.at);await mutateLive(db,teacher,{...action,displayOrder:2},f.at+1);
 const state=await liveSnapshot(db,student,f.classId,f.at+2);assert.equal(state.cascadedClips.length,1);assert.equal(state.cascadedClips[0].display_order,2);assert.equal(state.cascadedClips[0].url,undefined);
 await mutatePreparation(db,teacher,{action:'endClass',sessionId:f.session.id},f.at+3);await reject(mutateLive(db,teacher,action,f.at+4),409);assert.equal((await liveSnapshot(db,student,f.classId,f.at+5)).cascadedClips.length,0);
});
test('Clip reservations charge credit once, belong to one user and expire with lesson or access',async()=>{
 const f=await cascadeFixture(),clip=await shareFixture(f);const before=db.sqlite.prepare('SELECT used FROM video_credits WHERE student_id=?').get(student.id).used;
 const permit=await mutateLive(db,student,{action:'reserveClip',classId:f.classId,id:clip.id},f.at+1);assert.equal(permit.reservedSeconds,20);assert.equal(db.sqlite.prepare('SELECT used FROM video_credits WHERE student_id=?').get(student.id).used,before+20);
 const repeat=await mutateLive(db,student,{action:'reserveClip',classId:f.classId,id:clip.id},f.at+2);assert.equal(repeat.id,permit.id);assert.equal(db.sqlite.prepare('SELECT used FROM video_credits WHERE student_id=?').get(student.id).used,before+20);
 assert.equal((await authorizeSharedMedia(db,student,permit.id,f.at+3)).clip_id,f.clipId);await reject(authorizeSharedMedia(db,student2,permit.id,f.at+3),403);await reject(authorizeSharedMedia(db,student,permit.id,permit.expiresAt),403);
 await mutateLive(db,teacher,{action:'archiveCascade',classId:f.classId,id:clip.id},f.at+4);await reject(authorizeSharedMedia(db,student,permit.id,f.at+5),403);
});
test('Classroom clips require joined attendance, active paid access and no live assessment',async()=>{
 const f=await cascadeFixture(),clip=await shareFixture(f);await mutatePreparation(db,student,{action:'leaveClass',sessionId:f.session.id},f.at+1);await reject(mutateLive(db,student,{action:'reserveClip',classId:f.classId,id:clip.id},f.at+2),409);
 await mutatePreparation(db,student,{action:'joinClass',sessionId:f.session.id},f.at+3);const examId=await start(await exam(),student,f.at+4);assert.equal((await liveSnapshot(db,student,f.classId,f.at+5)).cascadedClips.length,0);await reject(mutateLive(db,student,{action:'reserveClip',classId:f.classId,id:clip.id},f.at+5),409);
 await mutate(db,student,{action:'submit',sessionId:examId},f.at+6);await db.prepare('UPDATE subscriptions SET expires_at=? WHERE student_id=?').bind(f.at+7,student.id).run();await reject(mutateLive(db,student,{action:'reserveClip',classId:f.classId,id:clip.id},f.at+8),402);
});
test('Offline telemetry is account-bound, timestamp bounded and idempotent; it does not alter grades',async()=>{
 const f=await cascadeFixture(),clip=await shareFixture(f),p=await mutateLive(db,student,{action:'reserveClip',classId:f.classId,id:clip.id},f.at+1);
 const event={id:crypto.randomUUID(),permitId:p.id,kind:'progress',position:5,watchedMs:5000,occurredAt:f.at+5001,studentId:student2.id};
 const r=await ingestTelemetry(db,student,{events:[event]},f.at+200000);assert.deepEqual(r.accepted,[event.id]);await ingestTelemetry(db,student,{events:[event]},f.at+200001);assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM clip_telemetry').get().n,1);assert.equal(db.sqlite.prepare('SELECT student_id FROM clip_telemetry').get().student_id,student.id);
 const wrong=await ingestTelemetry(db,student2,{events:[{...event,id:crypto.randomUUID()}]},f.at+200002);assert.equal(wrong.rejected.length,1);
 const expired=await ingestTelemetry(db,student,{events:[{...event,id:crypto.randomUUID(),occurredAt:p.expiresAt+5000}]},f.at+200003);assert.equal(expired.rejected.length,1);
 await reject(clipAnalytics(db,student,f.classId,f.at+200004),403);const report=await clipAnalytics(db,teacher,f.classId,f.at+200004);assert.equal(report.clips[0].students[0].watchedSeconds,5);assert.equal(report.clips[0].students[0].completion,25);assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM sessions').get().n,0);
});
test('Admin live monitor rejects teachers/students, counts actual recent presence and clears completed lessons',async()=>{
 const f=await cascadeFixture();await mutatePreparation(db,student,{action:'classHeartbeat',sessionId:f.session.id},f.at);await shareFixture(f);
 await reject(adminLiveLessons(db,student,f.at),403);await reject(adminLiveLessons(db,teacher,f.at),403);const list=await adminLiveLessons(db,admin,f.at);assert.equal(list.lessons.length,1);assert.equal(list.lessons[0].online_students,1);assert.equal(list.lessons[0].clips,1);assert.equal(list.lessons[0].teacher_online,true);
 const stale=await adminLiveLessons(db,admin,f.at+80000);assert.equal(stale.lessons[0].online_students,0);assert.equal(stale.lessons[0].teacher_online,false);
 await mutatePreparation(db,teacher,{action:'endClass',sessionId:f.session.id},f.at+80001);assert.equal((await adminLiveLessons(db,admin,f.at+80002)).lessons.length,0);
});
test('SSE event deltas do not duplicate cascades and include teacher status and presence changes',()=>{
 const first={classInfo:{title:'A class',teacherName:'Teacher'},session:{id:'lesson',status:'live',startedAt:1,teacherOnline:true},cascadedClips:[{id:'clip',shared_at:1}],onlineStudents:[{id:'student',name:'Student'}]};
 const events=classroomEvents(null,first);assert.equal(events.filter(e=>e.event==='CLIP_CASCADED').length,1);assert.ok(events.some(e=>e.event==='TEACHER_STATUS_CHANGE'));assert.ok(events.some(e=>e.event==='PRESENCE_LIST'));assert.equal(classroomEvents(first,first).length,0);
 const ended=classroomEvents(first,{...first,session:{...first.session,status:'ended'},cascadedClips:[],onlineStudents:[]});assert.equal(ended.find(e=>e.event==='TEACHER_STATUS_CHANGE').data.status,'completed');
});
const vm=await import('node:vm');const workerContext={Response,Request,URL,Map,Set,Number,Date,performance,importScripts(){},addEventListener(){}};workerContext.self=workerContext;vm.createContext(workerContext);vm.runInContext(fs.readFileSync('public/classroom/sw.js','utf8')+'\nthis.rangeTest=rangeResponse;',workerContext);
test('Reserved clip cache handles full, suffix and open ranges and rejects invalid ranges',async()=>{
 const bytes=new Uint8Array([0,1,2,3,4]).buffer;let r=workerContext.rangeTest(bytes,'video/mp4','bytes=1-3');assert.equal(r.status,206);assert.equal(r.headers.get('content-range'),'bytes 1-3/5');assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],[1,2,3]);
 r=workerContext.rangeTest(bytes,'video/mp4','bytes=-2');assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],[3,4]);assert.equal(workerContext.rangeTest(bytes,'video/mp4','bytes=9-').status,416);assert.equal(workerContext.rangeTest(bytes,'video/mp4','bytes=3-1').status,416);assert.equal(workerContext.rangeTest(bytes,'video/mp4','bytes=-0').status,416);assert.equal(workerContext.rangeTest(bytes,'video/mp4',null).status,200);
});

test('Shared-pause alerts need at least three distinct reporting learners and deduplicate the same clip bucket',async()=>{
 const f=await cascadeFixture();await admit(student2);await subscribe(student2,'AL12345678');const student3=await initializeUser(db,identity('third-student','third@example.test','Third learner'),'owner@example.test',NOW);await admit(student3);await subscribe(student3,'TH12345678');const clip=await shareFixture(f);
 for(const [i,u] of [student,student2,student3].entries()){
 if(u.id!==student.id)await mutatePreparation(db,u,{action:'joinClass',sessionId:f.session.id},f.at+1);
 const p=await mutateLive(db,u,{action:'reserveClip',classId:f.classId,id:clip.id},f.at+2);
 await ingestTelemetry(db,u,{events:[{id:crypto.randomUUID(),permitId:p.id,kind:'pause',position:5,watchedMs:0,occurredAt:f.at+1002}]},f.at+1003);
 const report=await clipAnalytics(db,teacher,f.classId,f.at+1004);assert.equal(report.clips[0].alerts.length,i<2?0:1);
 }
 await clipAnalytics(db,teacher,f.classId,f.at+1005);assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM clip_alerts').get().n,1);
});
test('Video credit and clip permits remain atomic when reservation storage fails',async()=>{
 const f=await cascadeFixture(),clip=await shareFixture(f);const originalBatch=db.batch.bind(db);db.batch=async statements=>{if(statements.length===2){statements[1]={run:async()=>{throw Error('Injected storage error')}}}return originalBatch(statements)};
 await assert.rejects(()=>mutateLive(db,student,{action:'reserveClip',classId:f.classId,id:clip.id},f.at+1),/Injected storage/);
 db.batch=originalBatch;assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM clip_permits').get().n,0);assert.equal(db.sqlite.prepare('SELECT used FROM video_credits WHERE student_id=?').get(student.id).used,0);
});

test('Single classroom serves shared notes only for its live lesson and hides them during assessments',async()=>{
 const f=await cascadeFixture();
 await mutateHub(db,teacher,{action:'publishLessonBoard',classId:f.classId,title:'Practical observations',body:'Teacher notes for this class only.',live:true},f.at);
 let state=await liveSnapshot(db,student,f.classId,f.at+1);
 assert.equal(state.board.body,'Teacher notes for this class only.');assert.deepEqual(state.notes,[]);
 await mutateHub(db,teacher,{action:'stopLessonBoard',classId:f.classId},f.at+2);
 assert.equal((await liveSnapshot(db,student,f.classId,f.at+3)).board,null);
 assert.equal((await liveSnapshot(db,teacher,f.classId,f.at+3)).board.body,'Teacher notes for this class only.');
 await mutateHub(db,teacher,{action:'publishLessonBoard',classId:f.classId,title:'Practical observations',body:'Teacher notes for this class only.',live:true},f.at+4);
 await start(await exam(),student,f.at+5);
 assert.equal((await liveSnapshot(db,student,f.classId,f.at+6)).board,null);
 await mutatePreparation(db,teacher,{action:'endClass',sessionId:f.session.id},f.at+7);
 assert.equal((await liveSnapshot(db,student,f.classId,f.at+8)).board,null);
});

for(const [src,out,replacements] of [
 ['app/live/gallery-policy.ts','gallery-policy',[]],
 ['app/live/camera-state.ts','camera-state',[]],
 ['app/live/conference-service.ts','conference-media',[["'../classroom/access'","'./class-access-test.mjs'"],["'./gallery-policy'","'./gallery-policy-test.mjs'"],["'../classroom/enrollment'","'./enrollment-test.mjs'"],["'../service'","'./service-test.mjs'"],["'../hub/service'","'./hub-test.mjs'"],["'../classroom/lifecycle'","'./lesson-lifecycle-test.mjs'"],["'./service'","'./live-test.mjs'"]]],
 ['app/student/subjects-service.ts','subjects',[["'../service'","'./service-test.mjs'"],["'../teaching/catalog'","'./teaching-catalog-test.mjs'"],["'../classroom/enrollment'","'./enrollment-test.mjs'"]]],
 ['app/live/hls-service.ts','hls',[["'../service'","'./service-test.mjs'"]]],
]){let code=ts.transpileModule(fs.readFileSync(src,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;for(const [a,b] of replacements)code=code.replaceAll(a,b);fs.writeFileSync('.sites-runtime/'+out+'-test.mjs',code)}
const {watchCamera}=await import('../.sites-runtime/camera-state-test.mjs');
const {galleryOfferer,galleryPage}=await import('../.sites-runtime/gallery-policy-test.mjs');
const {conferenceState,mutateConference}=await import('../.sites-runtime/conference-media-test.mjs');
const {studentSubjects,setStudentSubject}=await import('../.sites-runtime/subjects-test.mjs');
const {hlsPath,rewritePlaylist,beginHls,uploadHls,finishHls,removeHlsDraft}=await import('../.sites-runtime/hls-test.mjs');
function mediaAction(f,action,peerId,extra={}){return {action,classId:f.classId,sessionId:f.session.id,peerId,...extra}}
test('Subject exemptions are teacher-controlled, visible to the learner, and block all course entry',async()=>{
 const f=await cascadeFixture();let profile=await studentSubjects(db,student,student.id,f.at);assert.equal(profile.classLevel,'grade-9');assert.equal(profile.subjects.find(s=>s.id==='mathematics').status,'attend');
 const change={studentId:student.id,classLevel:'grade-9',subject:'mathematics',status:'exempt',note:'Authorised exemption'};
 await reject(setStudentSubject(db,student,change,f.at),403);await reject(setStudentSubject(db,other,change,f.at),403);await reject(studentSubjects(db,student,student2.id,f.at),403);
 const peerId=crypto.randomUUID();await mutateConference(db,student,mediaAction(f,'join',peerId),f.at);
 await setStudentSubject(db,teacher,change,f.at+1);profile=await studentSubjects(db,student,student.id,f.at+2);assert.equal(profile.subjects[0].status,'exempt');assert.equal(profile.subjects[0].note,'Authorised exemption');
 await reject(liveSnapshot(db,student,f.classId,f.at+2),403);await reject(mutatePreparation(db,student,{action:'joinClass',sessionId:f.session.id},f.at+2),403);await reject(conferenceState(db,student,f.classId,f.session.id,peerId,0,f.at+2),403);
 assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM conference_peers WHERE user_id=?').get(student.id).n,0);assert.equal((await readPreparation(db,teacher,f.at+2)).classSessions[0].roster.length,0);
 await setStudentSubject(db,teacher,{...change,status:'attend'},f.at+3);assert.ok(await liveSnapshot(db,student,f.classId,f.at+4));
 await mutateLive(db,teacher,{action:'classEnrollment',classId:f.classId,studentId:student.id,active:false},f.at+5);await setStudentSubject(db,teacher,{...change,status:'attend'},f.at+6);await reject(liveSnapshot(db,student,f.classId,f.at+7),403);
});
test('Group media uses real participants, teacher offers, isolated signaling and current microphone policy',async()=>{
 const f=await cascadeFixture(),t=crypto.randomUUID(),s=crypto.randomUUID();await mutateConference(db,teacher,mediaAction(f,'join',t),f.at);let state=await mutateConference(db,student,mediaAction(f,'join',s),f.at+1);assert.equal(state.peers.length,2);assert.equal(state.peers.find(p=>p.id===t).publisher,true);
 const offer=mediaAction(f,'signal',t,{toPeer:s,eventId:crypto.randomUUID(),kind:'offer',payload:JSON.stringify({type:'offer',sdp:'v=0'})});await mutateConference(db,teacher,offer,f.at+2);await mutateConference(db,teacher,offer,f.at+3);
 state=await conferenceState(db,student,f.classId,f.session.id,s,0,f.at+4);assert.equal(state.signals.length,1);assert.equal(state.signals[0].from_peer,t);
 await reject(mutateConference(db,student,{...offer,peerId:s,toPeer:t,eventId:crypto.randomUUID()},f.at+5),403);
 await reject(mutateConference(db,other,mediaAction(f,'join',crypto.randomUUID()),f.at+5),403);
 await mutatePreparation(db,teacher,{action:'classMuteAll',sessionId:f.session.id,muted:true},f.at+6);state=await conferenceState(db,student,f.classId,f.session.id,s,0,f.at+7);assert.equal(state.peers.find(p=>p.id===s).micAllowed,false);
 await mutatePreparation(db,teacher,{action:'classStudentMicrophone',sessionId:f.session.id,studentId:student.id,muted:false},f.at+8);state=await conferenceState(db,student,f.classId,f.session.id,s,0,f.at+9);assert.equal(state.peers.find(p=>p.id===s).micAllowed,true);
 await mutatePreparation(db,teacher,{action:'endClass',sessionId:f.session.id},f.at+10);await reject(conferenceState(db,student,f.classId,f.session.id,s,0,f.at+11),409);assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM conference_peers').get().n,0);
 assert.equal((await mutateConference(db,student,mediaAction(f,'leave',s),f.at+12)).ok,true);
});
test('Group media caps ten audience connections atomically and expires stale joins',async()=>{
 const f=await cascadeFixture();for(let i=0;i<10;i++){const u=i===0?student:await initializeUser(db,identity('audience-'+i,'audience-'+i+'@example.test','Audience '+i),'owner@example.test',NOW);if(i){await admit(u);await subscribe(u,'AUD'+String(i).padStart(7,'0'))}await mutatePreparation(db,u,{action:'joinClass',sessionId:f.session.id},f.at);await mutateConference(db,u,mediaAction(f,'join',crypto.randomUUID()),f.at)}
 const id=crypto.randomUUID();await mutateConference(db,teacher,mediaAction(f,'join',id),f.at);assert.equal((await conferenceState(db,teacher,f.classId,f.session.id,id,0,f.at+1)).peers.length,11);
 await admit(student2);await subscribe(student2,'EXTRA12345');await mutatePreparation(db,student2,{action:'joinClass',sessionId:f.session.id},f.at+2);await reject(mutateConference(db,student2,mediaAction(f,'join',crypto.randomUUID()),f.at+3),409);
 await mutateConference(db,student2,mediaAction(f,'join',crypto.randomUUID()),f.at+75001);assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM conference_peers').get().n,1);
});
test('HLS playlists reject traversal, external assets, encryption, missing media and live playlists',()=>{
 for(const path of ['../private.ts','/root.ts','https://other.test/file.ts','a/%2e%2e/file.ts','a//b.ts'])assert.throws(()=>hlsPath(path));
 const known=new Set(['low/index.m3u8','low/seg.ts']);assert.equal(rewritePlaylist('#EXTM3U\n#EXTINF:6,\nseg.ts\n#EXT-X-ENDLIST','low/index.m3u8','/protected/',known).includes('/protected/low/seg.ts'),true);
 for(const text of ['#EXTM3U\n#EXTINF:6,\nseg.ts','#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="key"\n#EXT-X-ENDLIST','#EXTM3U\nmissing.ts\n#EXT-X-ENDLIST','#EXTM3U\nhttps://evil.test/a.ts\n#EXT-X-ENDLIST'])assert.throws(()=>rewritePlaylist(text,'low/index.m3u8','/protected/',known));
});
test('HLS publication requires owned complete VOD assets; published packages cannot be overwritten',async()=>{
 const f=await cascadeFixture(),objects=new Map(),bucket={put:async(k,bytes)=>objects.set(k,new Uint8Array(bytes)),get:async k=>objects.has(k)?{text:async()=>new TextDecoder().decode(objects.get(k))}:null,delete:async k=>objects.delete(k)};
 await reject(beginHls(db,other,f.clipId,f.at),403);const {id}=await beginHls(db,teacher,f.clipId,f.at);
 const body=text=>new ReadableStream({start(c){c.enqueue(new TextEncoder().encode(text));c.close()}});
 await uploadHls(db,bucket,teacher,id,'master.m3u8',body('#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=250000\nlow/index.m3u8'));
 await reject(finishHls(db,bucket,teacher,id,'master.m3u8'),400);
 await uploadHls(db,bucket,teacher,id,'low/index.m3u8',body('#EXTM3U\n#EXTINF:6,\nsegment.ts\n#EXT-X-ENDLIST'));
 await uploadHls(db,bucket,teacher,id,'low/segment.ts',body('test-only-media'));await finishHls(db,bucket,teacher,id,'master.m3u8');
 await reject(uploadHls(db,bucket,teacher,id,'low/segment.ts',body('overwrite')),409);
 const clip=await shareFixture(f);const permit=await mutateLive(db,student,{action:'reserveClip',classId:f.classId,id:clip.id},f.at+1);assert.ok(permit.hlsUrl.endsWith('/'+id+'/master.m3u8'));assert.ok(permit.hlsPrefix.includes(permit.id));
});

test('Subject exemption prevents marking the learner absent or present for an exempted subject',async()=>{
 const f=await cascadeFixture();await setStudentSubject(db,teacher,{studentId:student.id,classLevel:'grade-9',subject:'mathematics',status:'exempt'},f.at);
 await reject(mutateHub(db,teacher,{action:'markClassRoll',classId:f.classId,studentId:student.id,day:'2026-10-12',status:'absent'},f.at+1),409);
});
test('Closed-tab report sync retains events on an account change and only deletes acknowledged records',async()=>{
 const source=fs.readFileSync('public/classroom/sync-queue.js','utf8'),events=[{id:'first',userId:'account-a',occurredAt:Date.now(),kind:'pause'},{id:'private',userId:'account-b',occurredAt:Date.now(),kind:'pause'}];let removed=[],posts=0,switched=true;
 const context={self:{addEventListener(){}},Date,Set,Error,fetch:async(_url,options)=>{if(!options?.method)return Response.json({userId:'account-a'});posts++;return Response.json({userId:switched?'account-b':'account-a',accepted:['first'],rejected:[]})}};vm.createContext(context);vm.runInContext(source,context);context.syncRead=async id=>events.filter(e=>e.userId===id&&!removed.includes(e.id));context.syncRemove=async ids=>{removed.push(...ids)};
 await context.syncClassroomReports();assert.deepEqual(removed,[]);assert.equal(posts,1);switched=false;await context.syncClassroomReports();assert.deepEqual(removed,['first']);assert.ok(!removed.includes('private'));
});
test('Closed-tab report sync keeps unacknowledged data when the network fails',async()=>{
 const context={self:{addEventListener(){}},Date,Set,Error,fetch:async(_url,options)=>{if(!options?.method)return Response.json({userId:'account-a'});throw Error('Temporary connection loss')}};vm.createContext(context);vm.runInContext(fs.readFileSync('public/classroom/sync-queue.js','utf8'),context);let removed=false;context.syncRead=async()=>[{id:'pending',userId:'account-a',occurredAt:Date.now()}];context.syncRemove=async ids=>{if(ids.length)removed=true};await assert.rejects(context.syncClassroomReports(),/connection loss/);assert.equal(removed,false);
});
fs.writeFileSync('.sites-runtime/relay-test.mjs',ts.transpileModule(fs.readFileSync('app/classroom/relay.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
const {relaySettings}=await import('../.sites-runtime/relay-test.mjs');
test('TURN setup returns temporary HMAC credentials and never exposes the shared secret',async()=>{
 assert.equal((await relaySettings({},student.id,NOW+60000,NOW)).relayConfigured,false);assert.equal((await relaySettings({TURN_URLS:'https://relay.invalid',TURN_SHARED_SECRET:'test-only-secret'},student.id,NOW+60000,NOW)).relayConfigured,false);
 const settings=await relaySettings({TURN_URLS:'turn:relay.example.test:3478?transport=udp',TURN_SHARED_SECRET:'test-only-secret'},student.id,NOW+60000,NOW);assert.equal(settings.relayConfigured,true);assert.equal(settings.iceServers.length,2);const turn=settings.iceServers[1];assert.equal(Number(turn.username.split(':')[0]),Math.floor((NOW+60000)/1000));assert.ok(turn.credential);assert.ok(!JSON.stringify(settings).includes('test-only-secret'));
 const {createHmac}=await import('node:crypto');assert.equal(turn.credential,createHmac('sha1','test-only-secret').update(turn.username).digest('base64'));
});

let scaleCode=ts.transpileModule(fs.readFileSync('app/live/scale-service.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
for(const [a,b] of [["'../service'","'./service-test.mjs'"],["'../hub/service'","'./hub-test.mjs'"],["'../classroom/lifecycle'","'./lesson-lifecycle-test.mjs'"],["'../classroom/access'","'./class-access-test.mjs'"],["'../classroom/enrollment'","'./enrollment-test.mjs'"],["'./service'","'./live-test.mjs'"]])scaleCode=scaleCode.replaceAll(a,b);
fs.writeFileSync('.sites-runtime/scale-test.mjs',scaleCode);
const {issueScaleToken,scaleAccess,scaleConfiguration,participantPolicies,reconcileScaleRoom,reconcileScaleEvent}=await import('../.sites-runtime/scale-test.mjs');
const {TokenVerifier,TrackSource}=await import('livekit-server-sdk');
const TEST_SFU={LIVEKIT_URL:'wss://media.example.test',LIVEKIT_API_KEY:'fixture-api-key',LIVEKIT_API_SECRET:'fixture-secret-at-least-thirty-two-characters'};
function fakeSfu(){const state={created:[],removed:[],updated:[],deleted:[],participants:[],listed:0};return {state,async createRoom(o){state.created.push(o);return o},async deleteRoom(name){state.deleted.push(name);state.participants=[]},async listParticipants(){state.listed++;return [...state.participants]},async removeParticipant(room,id){state.removed.push({room,id});state.participants=state.participants.filter(p=>p.identity!==id)},async updateParticipant(room,id,opts){state.updated.push({room,id,...opts});const p=state.participants.find(p=>p.identity===id);if(p)p.permission=opts.permission;return p}}}
async function schoolScaleFixture(n=600){const f=await cascadeFixture();db.sqlite.prepare("UPDATE class_sessions SET media_mode='sfu',learner_limit=2000,ends_at=? WHERE id=?").run(f.at+3600000,f.session.id);const until=f.at+86400000,users=[student];
 const insertUser=db.sqlite.prepare("INSERT INTO users(id,email,name,role,created_at) VALUES(?,?,?,'student',?)"),insertAdmission=db.sqlite.prepare("INSERT INTO admissions(student_id,teacher_id,phone,level,goals,status,requested_at) VALUES(?,?,'0712345678','Grade 9','Fixture only','approved',?)"),insertSubscription=db.sqlite.prepare("INSERT INTO subscriptions(id,student_id,phone,receipt,amount,days,status,verified_at,expires_at,created_at) VALUES(?,?,'0712345678',?,200,6,'verified',?,?,?)"),insertAccess=db.sqlite.prepare('INSERT INTO learner_access(student_id,login_id,expires_at,issued_at) VALUES(?,?,?,?)'),insertAttendance=db.sqlite.prepare('INSERT INTO class_attendance(id,session_id,student_id,joined_at,last_seen) VALUES(?,?,?,?,?)');
 db.sqlite.exec('BEGIN');for(let i=1;i<n;i++){const id='scale-'+String(i).padStart(4,'0'),u={id,email:id+'@example.test',name:'Scale learner '+String(i).padStart(4,'0'),role:'student',disabled:0};insertUser.run(id,u.email,u.name,NOW);insertAdmission.run(id,teacher.id,NOW);insertSubscription.run(crypto.randomUUID(),id,'SCL'+String(i).padStart(7,'0'),NOW,until,NOW);insertAccess.run(id,'FIXTURE-'+id,until,NOW);insertAttendance.run(crypto.randomUUID(),f.session.id,id,f.at,f.at);users.push(u)}db.sqlite.exec('COMMIT');await liveSnapshot(db,teacher,f.classId,f.at);return {...f,users,until};}
function countQueries(){const original=db.prepare.bind(db),stats={queries:0,writes:0};db.prepare=sql=>{stats.queries++;const instrument=s=>({...s,bind:(...v)=>instrument(s.bind(...v)),run:async()=>{stats.writes++;return s.run()}});return instrument(original(sql))};return stats}

test('600 enrolled learners use bounded roster pages and a read-only classroom refresh path',async()=>{
 const f=await schoolScaleFixture(),first=await liveSnapshot(db,teacher,f.classId,f.at+1,{offset:0,limit:50}),second=await liveSnapshot(db,teacher,f.classId,f.at+1,{offset:50,limit:50});assert.equal(first.enrolled,600);assert.equal(first.onlineCount,600);assert.equal(first.members.length,50);assert.equal(second.members.length,50);assert.equal(new Set([...first.members,...second.members].map(m=>m.student_id)).size,100);
 const prep=await readPreparation(db,teacher,f.at+1,{roomId:f.course.room_id,offset:550,limit:50});assert.equal(prep.classSessions[0].rosterTotal,600);assert.equal(prep.classSessions[0].onlineCount,600);assert.equal(prep.classSessions[0].roster.length,50);
 const own=await readPreparation(db,student,f.at+1,{roomId:f.course.room_id});assert.equal(own.classSessions[0].roster.length,1);assert.equal(own.classSessions[0].roster[0].student_id,student.id);
 const metrics=countQueries(),start=performance.now();let largest=0;for(let i=0;i<f.users.length;i+=30)await Promise.all(f.users.slice(i,i+30).map(async u=>{const d=await liveSnapshot(db,u,f.classId,f.at+2);assert.equal(d.members.length,0);assert.equal(d.onlineCount,600);assert.ok(d.onlineStudents.length<=50);largest=Math.max(largest,JSON.stringify(d).length)}));
 assert.equal(metrics.writes,0);assert.ok(metrics.queries<=600*25,'Steady-state query count must stay independent of class size');assert.ok(largest<30000,'Classroom payload must not grow to include all 600 learners');
 fs.writeFileSync('.sites-runtime/scale-benchmark.json',JSON.stringify({environment:'In-process SQLite D1 adapter; not a production HTTP or media capacity test',learners:600,requests:600,promiseConcurrency:30,sqlQueries:metrics.queries,sqlWrites:metrics.writes,maxPayloadBytes:largest,elapsedMs:Math.round(performance.now()-start)},null,2));
});
test('More than 500 simultaneous lesson records are paginated in the admin monitor and class hub',async()=>{
 const f=await schoolScaleFixture(10);const room=db.sqlite.prepare('INSERT INTO classroom_rooms(id,teacher_id,name,description,created_at) VALUES(?,?,?,?,?)'),course=db.sqlite.prepare('INSERT INTO teaching_classes(id,teacher_id,name,class_level,subject,topic,room_id,created_at) VALUES(?,?,?,?,?,?,?,?)'),lesson=db.sqlite.prepare("INSERT INTO class_sessions(id,room_id,title,status,opens_at,starts_at,ends_at,teacher_present_id,teacher_last_seen,started_at) VALUES(?,?,?,'live',?,?,?,?,?,?)");
 db.sqlite.exec('BEGIN');for(let i=0;i<550;i++){const r=crypto.randomUUID(),c=crypto.randomUUID(),s=crypto.randomUUID();room.run(r,teacher.id,'Class '+i,'Fixture only',f.at);course.run(c,teacher.id,'Class '+i,'grade-9','mathematics','Equations',r,f.at);lesson.run(s,r,'Lesson '+i,f.at,f.at,f.at+3600000,teacher.id,f.at,f.at)}db.sqlite.exec('COMMIT');const metrics=countQueries();
 const a=await adminLiveLessons(db,admin,f.at+1,{offset:0,limit:50}),b=await adminLiveLessons(db,admin,f.at+1,{offset:500,limit:50});assert.equal(a.total,551);assert.equal(a.stats.running,551);assert.equal(a.lessons.length,50);assert.equal(b.lessons.length,50);assert.equal(new Set([...a.lessons,...b.lessons].map(s=>s.id)).size,100);assert.ok(metrics.queries<15,'Admin monitor must not issue a query per classroom');
 const before=metrics.queries,hub=await readHub(db,admin,undefined,undefined,f.at+1,{offset:500,rosterOffset:0});assert.equal(hub.total,551);assert.equal(hub.classes.length,50);assert.ok(metrics.queries-before<10,'Class list must not issue a query per class');
});
test('Bulk subscription revocation closes 600 learners using a bounded statement batch',async()=>{
 const f=await schoolScaleFixture();db.sqlite.prepare("UPDATE subscriptions SET status='rejected'").run();const metrics=countQueries();await sweepUnpaidSessions(db,teacher,f.at+1);assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM class_attendance WHERE left_at IS NULL').get().n,0);assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM lesson_access_events WHERE resource='active_class_removed'").get().n,600);assert.ok(metrics.queries<10);assert.ok(metrics.writes<=5);
});
test('Large-class join tokens use an isolated room, restricted grants and explicit microphone approval',async()=>{
 const f=await schoolScaleFixture(20),media=fakeSfu();await reject(issueScaleToken(db,{},student,f.classId,f.session.id,f.at+1,media),503);assert.equal(media.state.created.length,0);
 const t=await issueScaleToken(db,TEST_SFU,teacher,f.classId,f.session.id,f.at+1,media),s=await issueScaleToken(db,TEST_SFU,student,f.classId,f.session.id,f.at+2,media),verify=new TokenVerifier(TEST_SFU.LIVEKIT_API_KEY,TEST_SFU.LIVEKIT_API_SECRET),tc=await verify.verify(t.token),sc=await verify.verify(s.token);
 assert.equal(media.state.created.length,1);assert.equal(media.state.created[0].maxParticipants,2010);assert.equal(tc.video.roomJoin,true);assert.equal(tc.video.canPublish,true);assert.equal(sc.video.canPublish,true);assert.deepEqual(sc.video.canPublishSources,['camera']);assert.equal(sc.video.canPublishData,false);assert.equal(sc.video.roomAdmin,undefined);assert.equal(sc.video.room,tc.video.room);assert.equal(sc.sub,student.id);assert.ok(!JSON.stringify(s).includes(TEST_SFU.LIVEKIT_API_SECRET));
 await mutatePreparation(db,teacher,{action:'classStudentMicrophone',sessionId:f.session.id,studentId:student.id,muted:false},f.at+3);const allowed=await issueScaleToken(db,TEST_SFU,student,f.classId,f.session.id,f.at+4,media),claims=await verify.verify(allowed.token);assert.equal(claims.video.canPublish,true);assert.deepEqual(claims.video.canPublishSources,['camera','microphone']);await reject(scaleAccess(db,other,f.classId,f.session.id,f.at+4),403);
});
test('600 media participant policies use two bulk SQL reads and cap learner speakers at eleven',async()=>{
 const f=await schoolScaleFixture(),s=db.sqlite.prepare('SELECT * FROM class_sessions WHERE id=?').get(f.session.id);Object.assign(s,{class_id:f.classId,class_level:'grade-9',subject:'mathematics',teacher_id:teacher.id});db.sqlite.prepare("UPDATE class_attendance SET mic_policy='allowed'").run();const metrics=countQueries(),policy=await participantPolicies(db,s,f.users.map(u=>u.id),f.at+1);assert.equal(policy.size,600);assert.equal([...policy.values()].filter(p=>p.permission.canPublishSources.includes(TrackSource.MICROPHONE)).length,11);assert.ok([...policy.values()].every(p=>p.valid));assert.equal(metrics.queries,2);
});
test('SFU moderation removes unauthorised viewers, updates permissions, and deletes ended rooms',async()=>{
 const f=await schoolScaleFixture(20),media=fakeSfu();await issueScaleToken(db,TEST_SFU,teacher,f.classId,f.session.id,f.at,media);media.state.participants=f.users.map(u=>({identity:u.id,permission:{canPublish:false,canSubscribe:true,canPublishData:false,canPublishSources:[]}}));media.state.participants.push({identity:'unknown-account',permission:{canPublish:true,canSubscribe:true}});
 await setStudentSubject(db,teacher,{studentId:student.id,classLevel:'grade-9',subject:'mathematics',status:'exempt'},f.at+1);const result=await reconcileScaleRoom(db,TEST_SFU,f.session.id,f.at+2,media,true);assert.equal(result.removed,2);assert.ok(media.state.removed.some(r=>r.id===student.id));assert.ok(media.state.removed.some(r=>r.id==='unknown-account'));
 await mutatePreparation(db,teacher,{action:'endClass',sessionId:f.session.id},f.at+3);const end=await reconcileScaleRoom(db,TEST_SFU,f.session.id,f.at+4,media,true);assert.equal(end.closed,true);assert.equal(media.state.deleted.length,1);
});
test('SFU reconciliation leases prevent duplicate supervisors, and provider failures remain retryable',async()=>{
 const f=await schoolScaleFixture(3),media=fakeSfu();await issueScaleToken(db,TEST_SFU,teacher,f.classId,f.session.id,f.at,media);await Promise.all([reconcileScaleRoom(db,TEST_SFU,f.session.id,f.at+1,media,true),reconcileScaleRoom(db,TEST_SFU,f.session.id,f.at+1,media,true)]);assert.equal(media.state.listed,1);
 media.listParticipants=async()=>{throw Error('Test provider unavailable')};await reject(reconcileScaleRoom(db,TEST_SFU,f.session.id,f.at+20000,media,true),503);assert.equal(db.sqlite.prepare('SELECT lease_until FROM sfu_rooms WHERE session_id=?').get(f.session.id).lease_until,0);
});
test('Lesson capacity allows 600 joined learners and rejects the next join when configured full',async()=>{
 const f=await schoolScaleFixture();db.sqlite.prepare('UPDATE class_sessions SET learner_limit=600 WHERE id=?').run(f.session.id);await mutatePreparation(db,student,{action:'joinClass',sessionId:f.session.id},f.at+1);await admit(student2);await subscribe(student2,'CAP1234567');await reject(mutatePreparation(db,student2,{action:'joinClass',sessionId:f.session.id},f.at+2),409);
});

test('Class roster search finds learners beyond the first page without loading the full roster',async()=>{
 const f=await schoolScaleFixture();const metrics=countQueries(),result=await readHub(db,teacher,f.classId,undefined,f.at+1,{offset:0,rosterOffset:0,search:'0599'});assert.equal(result.rosterTotal,1);assert.equal(result.roster.length,1);assert.equal(result.roster[0].student_id,'scale-0599');assert.ok(metrics.queries<15);
});
test('SFU join tokens remain bound to fresh account role and authoritative tuition expiry',async()=>{
 const f=await schoolScaleFixture(3),media=fakeSfu(),until=f.at+10000;db.sqlite.prepare('UPDATE subscriptions SET expires_at=? WHERE student_id=?').run(until,student.id);
 const token=await issueScaleToken(db,TEST_SFU,{...student,role:'admin'},f.classId,f.session.id,f.at+1,media),claims=await new TokenVerifier(TEST_SFU.LIVEKIT_API_KEY,TEST_SFU.LIVEKIT_API_SECRET).verify(token.token);assert.equal(token.publisher,false);assert.equal(claims.video.canPublish,true);assert.deepEqual(claims.video.canPublishSources,['camera']);assert.equal(token.expiresAt,until);
 db.sqlite.prepare("UPDATE subscriptions SET status='rejected' WHERE student_id=?").run(student.id);await reject(scaleAccess(db,student,f.classId,f.session.id,f.at+2),402);
});
test('A media webhook can remove an invalid participant without listing the whole SFU room',async()=>{
 const f=await schoolScaleFixture(3),media=fakeSfu();await issueScaleToken(db,TEST_SFU,teacher,f.classId,f.session.id,f.at,media);const metrics=countQueries();await reconcileScaleEvent(db,TEST_SFU,f.session.id,{identity:'unauthorised-fixture',permission:{canPublish:true}},f.at+1,media);assert.equal(media.state.listed,0);assert.equal(media.state.removed[0].id,'unauthorised-fixture');assert.ok(metrics.queries<6);
});

// Teacher agreements use real-service logic with isolated in-memory records only.
fs.writeFileSync('.sites-runtime/teacher-pay-test.mjs',ts.transpileModule(fs.readFileSync('app/teacher-pay/service.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("'../service'","'./service-test.mjs'"));
const {readTeacherPay,mutateTeacherPay,TeacherPayAction}=await import('../.sites-runtime/teacher-pay-test.mjs');
async function payProposal(extra={}){return mutateTeacherPay(db,admin,{action:'propose',teacherId:teacher.id,rateCents:12550,startsAt:NOW+60000,endsAt:NOW+3600000,terms:'KES rate per distinct tuition-paying learner; pay after period closure.',replacesId:null,...extra},NOW)}
async function paidAttendance(who,sessionId,at=NOW+120000){await db.prepare('INSERT INTO class_attendance(id,session_id,student_id,joined_at,last_seen,ready) VALUES(?,?,?,?,?,1)').bind(crypto.randomUUID(),sessionId,who.id,at,at+1000).run()}
async function payLesson(){const {id:room}=await mutateClassroom(db,teacher,{action:'createRoom',name:'Pay-period science',description:''},NOW);const id=crypto.randomUUID();await db.prepare("INSERT INTO class_sessions(id,room_id,title,status,opens_at,starts_at,started_at,started_by,teacher_present_id,ends_at) VALUES(?,?,?,'live',?,?,?,?,?,?)").bind(id,room,'Circuits',NOW+60000,NOW+120000,NOW+120000,teacher.id,teacher.id,NOW+3600000).run();return id}
test('teacher pay permissions use fresh roles and isolate each teacher',async()=>{await reject(payProposal({teacherId:student.id}),400);await reject(mutateTeacherPay(db,{...student,role:'admin'},{action:'propose',teacherId:teacher.id,rateCents:100,startsAt:NOW+60000,endsAt:NOW+90000,terms:'An agreed pay proposal',replacesId:null},NOW),403);const {id}=await payProposal();assert.equal((await readTeacherPay(db,other)).agreements.length,0);await reject(mutateTeacherPay(db,other,{action:'respond',id,accept:true},NOW+1),404);await reject(mutateTeacherPay(db,admin,{action:'respond',id,accept:true},NOW+1),403);await reject(readTeacherPay(db,student),403);await mutateTeacherPay(db,teacher,{action:'respond',id,accept:true},NOW+1);assert.equal((await readTeacherPay(db,teacher)).agreements[0].status,'accepted')});
test('pay proposals reject retroactive terms, invalid rates and overlapping acceptance',async()=>{assert.equal(TeacherPayAction.safeParse({action:'propose',teacherId:teacher.id,rateCents:1.5,startsAt:NOW+1,endsAt:NOW+2,terms:'Invalid fractional cents'}).success,false);await reject(payProposal({startsAt:NOW}),400);const first=await payProposal(),second=await payProposal();await mutateTeacherPay(db,teacher,{action:'respond',id:first.id,accept:true},NOW+1);await reject(mutateTeacherPay(db,teacher,{action:'respond',id:second.id,accept:true},NOW+2),409);await reject(mutateTeacherPay(db,admin,{action:'finalize',id:first.id},NOW+300000),409)});
test('rate revisions preserve accepted terms until the teacher accepts and block changes after start',async()=>{const {id}=await payProposal();await mutateTeacherPay(db,teacher,{action:'respond',id,accept:true},NOW+1);const changed=await payProposal({rateCents:20000,replacesId:id});assert.equal((await db.prepare('SELECT status FROM teacher_pay_agreements WHERE id=?').bind(id).first()).status,'accepted');await mutateTeacherPay(db,teacher,{action:'respond',id:changed.id,accept:true},NOW+2);assert.equal((await db.prepare('SELECT status FROM teacher_pay_agreements WHERE id=?').bind(id).first()).status,'superseded');const revised=(await readTeacherPay(db,teacher)).agreements.find(x=>x.id===changed.id);assert.equal(revised.rate_cents,20000);await reject(mutateTeacherPay(db,admin,{action:'propose',teacherId:teacher.id,rateCents:30000,startsAt:NOW+7200000,endsAt:NOW+9000000,terms:'Late revision attempt',replacesId:changed.id},NOW+120000),409)});
test('statements count distinct paid live attendees, exclude pending and guest access, and freeze counts',async()=>{await admit();await admit(student2);await subscribe();const {id}=await payProposal();await mutateTeacherPay(db,teacher,{action:'respond',id,accept:true},NOW+1);const s1=await payLesson(),s2=await payLesson();await paidAttendance(student,s1);await paidAttendance(student,s2);await paidAttendance(student2,s1);await db.prepare("INSERT INTO conference_passes(code_hash,redeem_by,student_id,claimed_at,expires_at) VALUES('guest',2000090000000,?,?,?)").bind(student2.id,NOW,NOW+9000000).run();let preview=await readTeacherPay(db,admin,0,id,NOW+300000);assert.equal(preview.detail.count,1);assert.equal(preview.detail.amountCents,12550);const result=await mutateTeacherPay(db,admin,{action:'finalize',id},NOW+3600001);assert.equal((await mutateTeacherPay(db,admin,{action:'finalize',id},NOW+3600002)).id,result.id);let statement=await db.prepare('SELECT * FROM teacher_pay_statements WHERE id=?').bind(result.id).first();assert.equal(statement.learner_count,1);assert.equal(statement.amount_cents,12550);await db.prepare("UPDATE subscriptions SET status='rejected' WHERE student_id=?").bind(student.id).run();assert.equal((await readTeacherPay(db,admin,0,id)).detail.count,1);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM teacher_pay_learners WHERE statement_id=?').bind(result.id).first()).n,1)});
test('confirmed external payment recording is admin-only, idempotent and immutable',async()=>{await admit();await subscribe();const {id}=await payProposal();await mutateTeacherPay(db,teacher,{action:'respond',id,accept:true},NOW+1);await paidAttendance(student,await payLesson());const statement=await mutateTeacherPay(db,admin,{action:'finalize',id},NOW+3600001);const pay={action:'recordPayment',id:statement.id,reference:'PAY123456789',confirmed:true};await reject(mutateTeacherPay(db,teacher,pay,NOW+3600002),403);await mutateTeacherPay(db,admin,pay,NOW+3600002);await mutateTeacherPay(db,admin,pay,NOW+3600003);await reject(mutateTeacherPay(db,admin,{...pay,reference:'OTHER12345'},NOW+3600004),409);assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM teacher_pay_audit WHERE action='external_payment_recorded'").first()).n,1)});
test('expired access-state reads close attendance, media peers and signaling without affecting other learners',async()=>{await admit();await admit(student2);await subscribe();await subscribe(student2,'UNIQUEPAY22');const lesson=await payLesson();await paidAttendance(student,lesson);await paidAttendance(student2,lesson);for(const who of [student,student2])await db.prepare('INSERT INTO conference_peers(id,session_id,user_id,joined_at,last_seen) VALUES(?,?,?,?,?)').bind('peer-'+who.id,lesson,who.id,NOW+120000,NOW+120000).run();await db.prepare("INSERT INTO conference_signals(event_id,session_id,from_peer,to_peer,kind,payload,created_at) VALUES('expiry-test',?,?,?,'offer','{}',?)").bind(lesson,'peer-student','peer-student2',NOW+120000).run();await db.prepare('UPDATE subscriptions SET expires_at=? WHERE student_id=?').bind(NOW+120001,student.id).run();const state=await accessState(db,student,NOW+120002);assert.equal(state.active,false);assert.equal((await db.prepare('SELECT left_at FROM class_attendance WHERE student_id=?').bind(student.id).first()).left_at,NOW+120002);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM conference_peers WHERE user_id=?').bind(student.id).first()).n,0);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM conference_peers WHERE user_id=?').bind(student2.id).first()).n,1);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM conference_signals').first()).n,0);await reject(verifyLoginId(db,student,state.access.login_id,NOW+120002),402)});

let resourceCatalog=ts.transpileModule(fs.readFileSync('app/resources/catalog.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
resourceCatalog=resourceCatalog.replace(/import primary from [^;]+;/,'const primary='+fs.readFileSync('app/primary/resources.json','utf8')+';').replace(/import materials from [^;]+;/,'const materials='+fs.readFileSync('app/curriculum/lesson-materials.json','utf8')+';').replace(/import clips from [^;]+;/,'const clips='+fs.readFileSync('app/curriculum/videos.json','utf8')+';').replace(/import documents from [^;]+;/,'const documents='+fs.readFileSync('app/curriculum/documents.json','utf8')+';').replace("'../teaching/catalog'","'./teaching-catalog-test.mjs'");fs.writeFileSync('.sites-runtime/resources-catalog-test.mjs',resourceCatalog);
let resourceService=ts.transpileModule(fs.readFileSync('app/resources/service.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;for(const [a,b] of [["'../service'","'./service-test.mjs'"],["'../classroom/enrollment'","'./enrollment-test.mjs'"],["'../hub/service'","'./hub-test.mjs'"],["'./catalog'","'./resources-catalog-test.mjs'"]])resourceService=resourceService.replaceAll(a,b);fs.writeFileSync('.sites-runtime/resources-test.mjs',resourceService);
const {readResources,mutateResource}=await import('../.sites-runtime/resources-test.mjs');
const {resourceFor,officialResources}=await import('../.sites-runtime/resources-catalog-test.mjs');
test('official resource links are allowlisted, class matched and never accept arbitrary redirects',()=>{assert.equal(resourceFor('javascript:alert(1)','grade-9','mathematics'),null);assert.equal(resourceFor('index-grade-7','grade-9','mathematics'),null);assert.ok(resourceFor('index-grade-9','grade-9','mathematics'));for(const r of officialResources){assert.equal(new URL(r.url).protocol,'https:');assert.ok(['kicd.ac.ke','lms.kec.ac.ke','drive.google.com'].includes(new URL(r.url).hostname));}});
test('teachers share official materials into their live class and cannot control other teaching groups',async()=>{const f=await cascadeFixture(),a={action:'share',classId:f.classId,sessionId:f.session.id,resourceKey:'index-grade-9',instructions:'Read the mathematics design and discuss the selected topic.'};await reject(mutateResource(db,other,a,f.at),403);await reject(mutateResource(db,{...student,role:'admin'},a,f.at),403);const first=await mutateResource(db,teacher,a,f.at),again=await mutateResource(db,teacher,a,f.at+1);assert.equal(first.id,again.id);const state=await readResources(db,student,f.classId,0,f.at+2);assert.equal(state.resources.length,1);assert.equal(state.resources[0].resource.id,a.resourceKey);assert.ok(state.catalog.some(r=>r.id===a.resourceKey));assert.ok(state.catalog.every(r=>(!r.level||r.level==='grade-9')&&(!r.subject||r.subject==='mathematics')));await mutateResource(db,teacher,{action:'withdraw',classId:f.classId,id:first.id},f.at+3);assert.equal((await readResources(db,student,f.classId,0,f.at+4)).resources.length,0)});
test('shared resources close for expired access, unjoined lessons, exemptions and active assessments',async()=>{const f=await cascadeFixture();await mutateResource(db,teacher,{action:'share',classId:f.classId,sessionId:f.session.id,resourceKey:'educhannel',instructions:'Watch the selected segment and write a question.'},f.at);await db.prepare('UPDATE class_attendance SET left_at=? WHERE student_id=?').bind(f.at,student.id).run();await reject(readResources(db,student,f.classId,0,f.at+1),409);await db.prepare('UPDATE class_attendance SET left_at=NULL WHERE student_id=?').bind(student.id).run();await start(await exam());await reject(readResources(db,student,f.classId,0,f.at+1),409);await db.prepare("UPDATE sessions SET status='submitted' WHERE student_id=?").bind(student.id).run();await setStudentSubject(db,teacher,{studentId:student.id,classLevel:'grade-9',subject:'mathematics',status:'exempt'},f.at);await reject(readResources(db,student,f.classId,0,f.at+1),403);await setStudentSubject(db,teacher,{studentId:student.id,classLevel:'grade-9',subject:'mathematics',status:'attend'},f.at);await db.prepare('UPDATE subscriptions SET expires_at=? WHERE student_id=?').bind(f.at,student.id).run();await reject(readResources(db,student,f.classId,0,f.at+2),402)});
test('resources disappear at the lesson deadline and teachers cannot share into preparing or ended sessions',async()=>{const f=await cascadeFixture();await db.prepare("UPDATE class_sessions SET status='preparing' WHERE id=?").bind(f.session.id).run();await reject(mutateResource(db,teacher,{action:'share',classId:f.classId,sessionId:f.session.id,resourceKey:'educhannel',instructions:'Watch a clip together.'},f.at),409);await db.prepare("UPDATE class_sessions SET status='live' WHERE id=?").bind(f.session.id).run();await reject(readResources(db,student,f.classId,0,f.at+500000),409)});
test('admin read and mutation paths reject forged roles and disabled identities',async()=>{const {authorizedUser}=await import('../.sites-runtime/service-test.mjs');await reject(authorizedUser(db,{...teacher,role:'admin'},'admin'),403);assert.equal((await readState(db,{...student,role:'admin'},NOW)).users.length,0);await reject(mutate(db,{...student,role:'admin'},{action:'userRole',userId:teacher.id,role:'student',disabled:true},NOW),403);await reject(mutatePortal(db,{...teacher,role:'admin'},{action:'addTeacher',fullName:'Forged role',email:'notallowed@example.test',phone:'',subject:'Math'},NOW),403);await db.prepare('UPDATE users SET disabled=1 WHERE id=?').bind(teacher.id).run();await reject(readState(db,teacher,NOW),403)});
test('company agreement acceptance requires the named teacher, explicit acknowledgement and typed name',async()=>{const company={companyName:'JEZTECH ENTERPRISES',representative:'Company Representative',teacherName:'Teacher Full Name',duties:'Prepare and teach agreed classes.',paymentSchedule:'After approved period-end statement.',termination:'Give the agreed written notice.',conduct:'Protect learner privacy and use approved materials.',companyConfirmed:true};const {id}=await payProposal({company});const stored=(await readTeacherPay(db,teacher)).agreements.find(a=>a.id===id);assert.equal(JSON.parse(stored.company_contract).companyName,company.companyName);await reject(mutateTeacherPay(db,teacher,{action:'respond',id,accept:true},NOW+1),400);await reject(mutateTeacherPay(db,teacher,{action:'respond',id,accept:true,acknowledged:true,signedName:'Wrong person'},NOW+1),400);await mutateTeacherPay(db,teacher,{action:'respond',id,accept:true,acknowledged:true,signedName:'Teacher Full Name'},NOW+2);const row=(await readTeacherPay(db,teacher)).agreements.find(a=>a.id===id);assert.equal(row.accepted_name,'Teacher Full Name');assert.equal(row.accepted_at,NOW+2);assert.equal(JSON.parse(row.company_contract).duties,company.duties)});

let financeCode=ts.transpileModule(fs.readFileSync('app/finance/service.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("'../service'","'./service-test.mjs'").replace("'../teacher-pay/service'","'./teacher-pay-test.mjs'");fs.writeFileSync('.sites-runtime/finance-test.mjs',financeCode);const {readFinance}=await import('../.sites-runtime/finance-test.mjs');
test('finance totals are admin-only and empty ledgers show actual zero amounts',async()=>{await reject(readFinance(db,teacher,NOW),403);await reject(readFinance(db,{...student,role:'admin'},NOW),403);const r=await readFinance(db,admin,NOW);assert.equal(r.collections.collectedCents,0);assert.equal(r.teacherPayments.dueCents,0);assert.equal(r.teacherPayments.provisionalCents,0);assert.equal(r.afterFinalizedDuesCents,0);assert.deepEqual(r.teachers,[])});
test('verified collection totals separate registration tuition and lessons without adding STK intents again',async()=>{await admit();const sub=await subscribe();const lessonId=await lesson(50);await db.prepare("INSERT INTO registration_payments(id,student_id,phone,receipt,amount,status,created_at,verified_at) VALUES(?,?,?,'REGPAY1234',100,'verified',?,?)").bind(crypto.randomUUID(),student.id,'0712345678',NOW,NOW).run();await db.prepare("INSERT INTO payments(id,lesson_id,student_id,phone,amount,receipt,status,created_at,reviewed_at) VALUES(?,?,?,?,50,'LESSPAY123','verified',?,?)").bind(crypto.randomUUID(),lessonId,student.id,'0712345678',NOW,NOW).run();await db.prepare("INSERT INTO payment_intents(id,student_id,phone,amount,days,status,checkout_id,created_at) VALUES(?,?,?,200,6,'confirmed','checkout-test',?)").bind(sub,student.id,'0712345678',NOW).run();await db.prepare("INSERT INTO subscriptions(id,student_id,phone,receipt,amount,days,status,created_at) VALUES(?,?,?,'PENDPAY123',900,6,'pending',?)").bind(crypto.randomUUID(),student.id,'0712345678',NOW).run();const r=await readFinance(db,admin,NOW+20);assert.equal(r.collections.collectedCents,35000);assert.equal(r.collections.registrationCents,10000);assert.equal(r.collections.tuitionCents,20000);assert.equal(r.collections.lessonCents,5000);assert.equal(r.collections.verifiedReceipts,3);assert.equal(r.review.pendingRecords,1);assert.equal((await readFinance(db,admin,NOW+8*86400000)).collections.collectedCents,35000)});
test('matching receipt copies count once while conflicting verified receipts are excluded for reconciliation',async()=>{await admit();await subscribe();for(let i=0;i<2;i++)await db.prepare("INSERT INTO subscriptions(id,student_id,phone,receipt,amount,days,status,created_at,verified_at,expires_at) VALUES(?,?,?,?,300,6,'verified',?,?,?)").bind(crypto.randomUUID(),student.id,'0712345678',i?'dup1234567':'DUP1234567',NOW,NOW,NOW+86400000).run();for(const amount of [400,500])await db.prepare("INSERT INTO subscriptions(id,student_id,phone,receipt,amount,days,status,created_at,verified_at,expires_at) VALUES(?,?,?,?,?,6,'verified',?,?,?)").bind(crypto.randomUUID(),student.id,'0712345678',amount===400?'CONFLICT12':'conflict12',amount,NOW,NOW,NOW+86400000).run();const r=await readFinance(db,admin,NOW+10);assert.equal(r.collections.collectedCents,50000);assert.equal(r.collections.duplicateRecordsExcluded,1);assert.equal(r.collections.reconciliationRecords,2);assert.equal(r.collections.verifiedReceipts,2)});
test('finance separates accrued estimates from fixed teacher dues and recorded payments without double counting',async()=>{await admit();await subscribe();const {id}=await payProposal();await mutateTeacherPay(db,teacher,{action:'respond',id,accept:true},NOW+1);await paidAttendance(student,await payLesson());let r=await readFinance(db,admin,NOW+180000);assert.equal(r.teacherPayments.provisionalCents,12550);assert.equal(r.teacherPayments.dueCents,0);assert.equal(r.teachers[0].provisional_cents,12550);const stmt=await mutateTeacherPay(db,admin,{action:'finalize',id},NOW+3600001);r=await readFinance(db,admin,NOW+3600002);assert.equal(r.teacherPayments.provisionalCents,0);assert.equal(r.teacherPayments.dueCents,12550);assert.equal(r.afterFinalizedDuesCents,7450);await mutateTeacherPay(db,admin,{action:'recordPayment',id:stmt.id,reference:'REALREF1234',confirmed:true},NOW+3600003);r=await readFinance(db,admin,NOW+3600004);assert.equal(r.teacherPayments.dueCents,0);assert.equal(r.teacherPayments.paidCents,12550);assert.equal(r.afterRecordedTeacherPaymentsCents,7450);assert.equal(r.afterFinalizedDuesCents,7450);assert.equal((await readFinance(db,admin,NOW+3600004,{offset:0,compact:true})).teachers.length,0)});

test('payment ledgers and monetary totals are visible only to current admins while students can submit renewal receipts',async()=>{await admit();await subscribe();await settings();const lessonId=await lesson(50),claim=await mutateFeature(db,student,{action:'claimPayment',lessonId,phone:'0712345678',receipt:'PRIVATE123'},NOW+4);await reject(mutateFeature(db,teacher,{action:'reviewPayment',paymentId:claim.id,status:'verified',note:'Teacher must not verify funds'},NOW+5),403);await mutateFeature(db,admin,{action:'reviewPayment',paymentId:claim.id,status:'verified',note:'Admin checked actual receipt'},NOW+6);await mutateRegistrationFee(db,admin,{action:'registrationFeeSettings',amount:100},NOW);const reg=await mutateRegistrationFee(db,student,{action:'claimRegistrationFee',phone:'0712345678',receipt:'REGONLY123'},NOW+7);await mutateRegistrationFee(db,admin,{action:'reviewRegistrationFee',...await reviewEvidence(db,'registration',reg.id),id:reg.id,status:'verified',note:'Verified by admin'},NOW+8);for(const who of [student,teacher]){assert.deepEqual((await readFeatures(db,who,NOW+9)).payments,[]);assert.deepEqual((await readEngagement(db,who,NOW+9)).subscriptions,[]);assert.deepEqual((await readRegistrationFees(db,who)).payments,[]);await reject(readFinance(db,who,NOW+9),403);}assert.equal((await readRegistrationFees(db,student)).ownStatus,'verified');assert.deepEqual((await accessState(db,student,NOW+9)).receipts,[]);assert.equal((await readFeatures(db,admin,NOW+9)).payments.length,1);assert.equal((await readRegistrationFees(db,admin)).payments.length,1);assert.equal((await readEngagement(db,admin,NOW+9)).subscriptions.length,1)});
test('teachers can accept pay terms but only admins can view payout statements and payment history',async()=>{await admit();await subscribe();const {id}=await payProposal();await mutateTeacherPay(db,teacher,{action:'respond',id,accept:true},NOW+1);await paidAttendance(student,await payLesson());const statement=await mutateTeacherPay(db,admin,{action:'finalize',id},NOW+3600001);await mutateTeacherPay(db,admin,{action:'recordPayment',id:statement.id,reference:'SECRETREF123',confirmed:true},NOW+3600002);const view=await readTeacherPay(db,teacher),agreement=view.agreements.find(a=>a.id===id);assert.equal(agreement.rate_cents,12550);for(const key of ['statement_id','learner_count','amount_cents','paid_at','payment_reference'])assert.equal(agreement[key],null);assert.ok(view.audit.every(e=>!['statement_issued','external_payment_recorded'].includes(e.action)));await reject(readTeacherPay(db,teacher,0,id),403);assert.equal((await readTeacherPay(db,admin)).agreements.find(a=>a.id===id).payment_reference,'SECRETREF123')});

async function practicePack(){const id=crypto.randomUUID();const qs=[...assignmentQuestions(),...assignmentQuestions()];await db.prepare("INSERT INTO subject_question_sets(id,teacher_id,source_key,class_level,subject,title,questions,status,created_at) VALUES(?,?,?,'grade-9','mathematics','Practice',?,'draft',?)").bind(id,teacher.id,'test:'+id,JSON.stringify(qs),NOW).run();return {id,qs};}
async function publishPack(){const p=await practicePack();await mutateStore(db,teacher,{action:'reviewSet',id:p.id,title:'Reviewed practice',questions:p.qs,reviewed:true,publish:true},NOW);return p;}
async function buySubject(product='questions',receipt='SHOP123456'){await mutateStore(db,student,{action:'claim',subject:'mathematics',product,topic:product==='tutorials'?'fractions':'',receipt,phone:'0712345678',amount:1},NOW+10);const p=await db.prepare('SELECT * FROM subject_purchases WHERE receipt=?').bind(receipt).first();await mutateStore(db,admin,{action:'reviewPurchase',id:p.id,status:'verified',note:'Exact transaction checked'},NOW+11);return p;}
async function verifiedRegistration(){await db.prepare("INSERT INTO registration_payments(id,student_id,phone,receipt,amount,status,created_at,verified_at) VALUES(?,?,?,'REGONLY123',100,'verified',?,?)").bind(crypto.randomUUID(),student.id,'254712345678',NOW,NOW).run();}
test('seeded revision packs are drafts and never available for sale before review',async()=>{const seed=await db.prepare('SELECT COUNT(*) AS n,SUM(json_array_length(questions)) AS questions FROM subject_question_sets').first();assert.equal(seed.n,24);assert.equal(seed.questions,118);await admit();await subscribe();await reject(mutateStore(db,student,{action:'claim',subject:'mathematics',product:'questions',receipt:'EMPTY12345',phone:'0712345678'},NOW+10),409);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM subject_purchases').first()).n,0)});
test('subject purchases charge server prices and unlock only reviewed class content after admin verification',async()=>{await admit();await subscribe();const {id}=await publishPack();await reject(readStore(db,student,'grade-9','mathematics',id,0,NOW+8),402);const p=await buySubject();assert.equal(p.amount,10);const d=await readStore(db,student,'grade-7','mathematics',id,0,NOW+12);assert.equal(d.level,'grade-9');assert.equal(d.selected.questions[0].correct,undefined);assert.equal(d.selected.questions[0].explanation,undefined);assert.deepEqual(d.purchases,[]);assert.deepEqual((await readStore(db,teacher,'grade-9','mathematics',undefined,0,NOW+12)).purchases,[]);const r=await mutateStore(db,student,{action:'submit',setId:id,answers:[0,1,0,1],score:999},NOW+13);assert.equal(r.score,4);assert.equal((await mutateStore(db,student,{action:'submit',setId:id,answers:[1,0,1,0]},NOW+14)).score,4);await reject(readStore(db,student,'grade-9','mathematics',id,0,NOW+6*86400000+20),402)});
test('teachers cannot approve purchases, forge roles, publish others drafts or bypass tuition',async()=>{await admit();await subscribe();const p=await publishPack();await buySubject();const row=await db.prepare('SELECT id FROM subject_purchases').first();await reject(mutateStore(db,teacher,{action:'reviewPurchase',id:row.id,status:'verified',note:'Not authorized'},NOW+20),403);await reject(mutateStore(db,{...teacher,role:'admin'},{action:'reviewPurchase',id:row.id,status:'verified',note:'Forged admin'},NOW+20),403);const otherPack=await practicePack();await reject(mutateStore(db,other,{action:'reviewSet',id:otherPack.id,title:'Stolen practice',questions:otherPack.qs,reviewed:true,publish:true},NOW),403);await db.prepare("UPDATE subscriptions SET status='rejected'").run();await reject(readStore(db,student,'grade-9','mathematics',p.id,0,NOW+21),402)});
test('tutorial purchases cost 10 per topic and do not grant question passes, tuition or playback credits',async()=>{await admit();await subscribe();const video=crypto.randomUUID();await db.prepare("INSERT INTO learning_videos(id,teacher_id,title,url,created_at) VALUES(?,?,'Tutorial','r2:protected.webm',?)").bind(video,teacher.id,NOW).run();await mutateStore(db,teacher,{action:'linkTutorial',videoId:video,classLevel:'grade-9',subject:'mathematics',topic:'Fractions',title:'Fractions tutorial',description:'An original worked example.'},NOW);await reject(requireTutorialVideo(db,student,video,NOW+5),402);const p=await buySubject('tutorials');assert.equal(p.amount,10);await requireTutorialVideo(db,student,video,NOW+12);const d=await readStore(db,student,'grade-9','mathematics',undefined,0,NOW+12);assert.equal(d.passes.questions,null);assert.ok(d.tutorialPasses[d.tutorials[0].id]);await db.prepare("UPDATE admissions SET level='Grade 8' WHERE student_id=?").bind(student.id).run();await reject(requireTutorialVideo(db,student,video,NOW+13),402);});
test('receipt uniqueness spans tuition and subject purchases and empty tutorials cannot be purchased',async()=>{await admit();await subscribe();await publishPack();await reject(mutateStore(db,student,{action:'claim',subject:'mathematics',product:'questions',receipt:'SUB1234567',phone:'0712345678'},NOW+10),409);await reject(mutateStore(db,student,{action:'claim',subject:'mathematics',product:'tutorials',topic:'fractions',receipt:'NOCLIP1234',phone:'0712345678'},NOW+10),409);});
test('CSV uploads mark on the server, ratings and item analysis follow the published school bands',async()=>{await admit();await subscribe();const id=await assignment();await publishAssignment(id);const e=await assigned(student,id);assert.equal((await mutateAssignment(db,student,{action:'uploadAssignment',entryId:e.id,format:'csv',content:'question,answer\n1,A\n2,B'},NOW+20)).score,2);const d=await readAssignments(db,teacher,NOW+21);assert.equal(d.assignmentEntries[0].rating,'EE · Exceeding expectations');assert.equal(d.assignmentAnalyses[0].mean,100);assert.equal(d.assignmentAnalyses[0].questions[0].correct,1);assert.deepEqual((await readAssignments(db,student,NOW+21)).assignmentAnalyses,[]);await reject(mutateAssignment(db,student,{action:'uploadAssignment',entryId:e.id,format:'csv',content:'1,D\n2,D'},NOW+22),409);});
test('written uploads await the owning teacher and never receive invented automatic marks',async()=>{await admit();await subscribe();const id=await assignment();await publishAssignment(id);const e=await assigned(student,id);await mutateAssignment(db,student,{action:'uploadAssignment',entryId:e.id,format:'text',content:'My written explanation of cell structures.'},NOW+20);let d=await readAssignments(db,teacher,NOW+21);assert.equal(d.assignmentEntries[0].score,null);assert.equal(d.assignmentRankings.length,0);assert.equal(d.assignmentAnalyses[0].pendingReview,1);await reject(mutateAssignment(db,other,{action:'markUploadedAssignment',entryId:e.id,score:1,feedback:'Not the owning teacher'},NOW+22),403);await reject(mutateAssignment(db,teacher,{action:'markUploadedAssignment',entryId:e.id,score:3,feedback:'Too many marks awarded'},NOW+22),400);await mutateAssignment(db,teacher,{action:'markUploadedAssignment',entryId:e.id,score:1,feedback:'One structure explained correctly; revise the second.'},NOW+23);d=await readAssignments(db,student,NOW+24);assert.equal(d.assignmentEntries[0].rating,'AE · Approaching expectations');assert.equal(d.assignmentEntries[0].score,1);assert.equal(d.assignmentRankings[0].rank,1);await reject(mutateAssignment(db,teacher,{action:'markUploadedAssignment',entryId:e.id,score:2,feedback:'Cannot overwrite locked marks'},NOW+25),409)});
test('CSV parsing rejects duplicates missing rows and injected fields; school ratings use exact boundaries',()=>{assert.deepEqual(parseAnswerSheet('2,b\n1,A',2),[0,1]);for(const x of ['1,A\n1,B','1,A','1,=1+1\n2,B','1,E\n2,B'])assert.throws(()=>parseAnswerSheet(x,2));assert.equal(rating(80,100,defaultBands('form-3')),'A');assert.equal(rating(79,100,defaultBands('grade-9')),'ME · Meeting expectations');});
test('orientation requires verified registration and approved admission; starts once and expires exactly',async()=>{await reject(readOrientation(db,student,true,NOW),403);await verifiedRegistration();await reject(readOrientation(db,student,true,NOW),403);await admit();const first=await readOrientation(db,student,true,NOW+4);assert.equal(first.session.expires_at,NOW+4+43200000);await requirePaidAccess(db,student,NOW+4+43200000-1);await requirePaidAccess(db,student,NOW+5);assert.equal((await readOrientation(db,student,true,NOW+100)).session.started_at,NOW+4);await reject(requirePaidAccess(db,student,first.session.expires_at),402);await readOrientation(db,student,true,first.session.expires_at+1);await reject(requirePaidAccess(db,student,first.session.expires_at+2),402);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM subscriptions').first()).n,0)});
test('orientation waives subject and video charges but preserves class scope and ends without a renewed pass',async()=>{await admit();await verifiedRegistration();await readOrientation(db,student,true,NOW);const {id}=await publishPack();const d=await readStore(db,student,'grade-9','mathematics',id,0,NOW+12);assert.equal(d.passes.questions.id,'orientation');await authorizeVideo(db,student,teacher.id,null,NOW+15);await reject(authorizeVideo(db,student,other.id,null,NOW+15),403);await reject(readStore(db,student,'grade-9','mathematics',id,0,NOW+43200000),402);await reject(authorizeVideo(db,student,teacher.id,null,NOW+43200000),402);});
test('rejected registration immediately revokes orientation and finance excludes orientation grants',async()=>{await admit();await verifiedRegistration();await readOrientation(db,student,true,NOW);await db.prepare("UPDATE registration_payments SET status='rejected'").run();await reject(requirePaidAccess(db,student,NOW+10),402);const totals=await readFinance(db,admin,NOW+10);assert.equal(totals.collections.collectedCents,0)});
test('publishing explanatory lesson notes generates draft questions once and preserves teacher corrections',async()=>{const content=JSON.parse(fs.readFileSync('app/curriculum/revision-notes.json','utf8'))[0].content;const {id}=await mutateFeature(db,teacher,{action:'createLesson',title:'Fractions lesson',summary:'Class practice',content,subject:'mathematics',curriculum:'cbe-junior',classLevel:'grade-7',topic:'Fractions',price:0},NOW);await mutateFeature(db,teacher,{action:'lessonStatus',lessonId:id,status:'published'},NOW+1);let rows=(await db.prepare('SELECT * FROM subject_question_sets WHERE lesson_id=?').bind(id).all()).results;assert.equal(rows.length,1);assert.equal(rows[0].status,'draft');await mutateStore(db,teacher,{action:'reviewSet',id:rows[0].id,title:'Teacher corrected title',questions:JSON.parse(rows[0].questions),reviewed:true,publish:true},NOW+2);await mutateStore(db,teacher,{action:'generate',after:''},NOW+3);rows=(await db.prepare('SELECT * FROM subject_question_sets WHERE lesson_id=?').bind(id).all()).results;assert.equal(rows.length,1);assert.equal(rows[0].title,'Teacher corrected title');});
test('subject passes honor exemptions and active exams and finance includes only verified subject receipts',async()=>{await admit();await subscribe();await publishPack();await buySubject();const f=await readFinance(db,admin,NOW+20);assert.equal(f.collections.questionCents,1000);assert.equal(f.collections.tutorialCents,0);assert.equal(f.collections.collectedCents,21000);await db.prepare("INSERT INTO learner_subjects(id,student_id,class_level,subject,status,updated_by,updated_at) VALUES(?,?,'grade-9','mathematics','exempt',?,?)").bind(crypto.randomUUID(),student.id,admin.id,NOW).run();await reject(readStore(db,student,'grade-9','mathematics',undefined,0,NOW+21),403);await db.prepare('DELETE FROM learner_subjects').run();await start(await exam());await reject(readStore(db,student,'grade-9','mathematics',undefined,0,NOW+22),409);});
test('orientation notes remain limited to assigned teacher, class and non-exempt subjects',async()=>{await admit();await verifiedRegistration();await readOrientation(db,student,true,NOW);const create=async(level)=>{const {id}=await mutateFeature(db,teacher,{action:'createLesson',title:'Orientation notes '+level,summary:'Study content',content:'Classroom notes for orientation.',subject:'mathematics',curriculum:'cbe-junior',classLevel:level,topic:'Fractions',price:100},NOW);await mutateFeature(db,teacher,{action:'lessonStatus',lessonId:id,status:'published'},NOW+1);return id};const own=await create('grade-9'),wrong=await create('grade-7');const d=await readFeatures(db,student,NOW+2);assert.equal(d.lessons.find(l=>l.id===own).content,'Classroom notes for orientation.');assert.equal(d.lessons.find(l=>l.id===wrong).content,undefined);await canReadLesson(db,student,own,NOW+2);await reject(canReadLesson(db,student,wrong,NOW+2),403);});

test('admission approval immediately enrolls matching classes without payment or fabricated attendance',async()=>{const own=await teachingClass(),otherLevel=await teachingClass(teacher,'grade-8'),otherTeacher=await teachingClass(other);await mutateEngagement(db,student,{action:'requestAdmission',teacherId:teacher.id,phone:'0712345678',level:'Grade 9',goals:'Learn mathematics'},NOW);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM class_enrollments').first()).n,0);await mutateEngagement(db,admin,{action:'reviewAdmission',studentId:student.id,status:'approved',note:'Approved class'},NOW+1);let rows=(await db.prepare('SELECT * FROM class_enrollments WHERE student_id=?').bind(student.id).all()).results;assert.deepEqual(rows.map(r=>r.class_id),[own]);assert.ok(!rows.some(r=>[otherLevel,otherTeacher].includes(r.class_id)));await mutateEngagement(db,admin,{action:'reviewAdmission',studentId:student.id,status:'approved',note:'Repeated approval'},NOW+2);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM class_enrollments WHERE student_id=?').bind(student.id).first()).n,1);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM class_attendance').first()).n,0);await reject(readHub(db,student,own,undefined,NOW+3),402)});
test('new teaching classes automatically enroll existing admitted learners while skipping exempt subjects',async()=>{await admit();const one=await teachingClass();assert.ok(await db.prepare('SELECT id FROM class_enrollments WHERE class_id=? AND student_id=?').bind(one,student.id).first());await db.prepare("INSERT INTO learner_subjects(id,student_id,class_level,subject,status,updated_by,updated_at) VALUES(?,?,'grade-9','mathematics','exempt',?,?)").bind(crypto.randomUUID(),student.id,admin.id,NOW).run();const two=await teachingClass();assert.equal(await db.prepare('SELECT id FROM class_enrollments WHERE class_id=? AND student_id=?').bind(two,student.id).first(),null)});
test('join class selector joins the teacher to the selected open lesson and preserves the start timer',async()=>{const id=await teachingClass();const c=await db.prepare('SELECT * FROM teaching_classes WHERE id=?').bind(id).first();const session=await mutatePreparation(db,teacher,{action:'openPreparation',roomId:c.room_id,title:'Prepare fractions',preparationMinutes:1,durationMinutes:30,startMode:'teacher'},NOW);const joined=await mutateHub(db,teacher,{action:'joinTeachingClass',classId:id},NOW+10);assert.equal(joined.joined,true);assert.equal(joined.sessionId,session.id);assert.equal(joined.url,'/classroom/'+id);const persisted=await db.prepare('SELECT * FROM class_sessions WHERE id=?').bind(session.id).first();assert.equal(persisted.teacher_present_id,teacher.id);assert.equal(persisted.status,'preparing');assert.equal(persisted.started_at,null);await reject(mutatePreparation(db,teacher,{action:'startClass',sessionId:session.id},NOW+11),409);assert.equal((await readHub(db,teacher,undefined,undefined,NOW+12)).classes[0].lesson_status,'preparing')});
test('join class selector rejects learners, other teachers, forged admins and disabled teachers',async()=>{await admit();await subscribe();const id=await teachingClass();await reject(mutateHub(db,student,{action:'joinTeachingClass',classId:id},NOW+5),403);await reject(mutateHub(db,other,{action:'joinTeachingClass',classId:id},NOW+5),403);await reject(mutateHub(db,{...other,role:'admin'},{action:'joinTeachingClass',classId:id},NOW+5),403);await db.prepare('UPDATE users SET disabled=1 WHERE id=?').bind(teacher.id).run();await reject(mutateHub(db,teacher,{action:'joinTeachingClass',classId:id},NOW+5),403)});
test('joining a class with no open lesson opens preparation workspace without inventing a session',async()=>{const id=await teachingClass();const r=await mutateHub(db,teacher,{action:'joinTeachingClass',classId:id},NOW);assert.equal(r.joined,false);assert.equal(r.sessionId,null);assert.equal(r.url,'/classroom/'+id);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM class_sessions').first()).n,0)});
test('student class discovery backfills membership but never restores a teacher-removed enrollment',async()=>{await admit();await subscribe();const id=await teachingClass();await db.prepare('DELETE FROM class_enrollments WHERE class_id=?').bind(id).run();assert.equal((await readHub(db,student,undefined,undefined,NOW+5)).classes.length,1);await db.prepare("UPDATE class_enrollments SET status='removed' WHERE class_id=?").bind(id).run();assert.equal((await readHub(db,student,undefined,undefined,NOW+6)).classes.length,0);assert.equal((await db.prepare('SELECT status FROM class_enrollments WHERE class_id=?').bind(id).first()).status,'removed')});
test('existing short orientation grants extend to twelve hours from original start without restarting',async()=>{await admit();await verifiedRegistration();await db.prepare('INSERT INTO learner_orientation(student_id,started_at,expires_at) VALUES(?,?,?)').bind(student.id,NOW,NOW+1800000).run();const sql=fs.readFileSync('drizzle/0036_orientation_twelve_hours.sql','utf8');await db.prepare(sql).run();await db.prepare(sql).run();const d=await readOrientation(db,student,true,NOW+3600000);assert.equal(d.session.started_at,NOW);assert.equal(d.session.expires_at,NOW+43200000);await requirePaidAccess(db,student,NOW+43200000-1);await reject(requirePaidAccess(db,student,NOW+43200000),402);await readOrientation(db,student,true,NOW+43200000+1);await reject(requirePaidAccess(db,student,NOW+43200000+2),402)});
test('disabled signed-in accounts produce an explicit page state instead of an unhandled homepage error',async()=>{await db.prepare('UPDATE users SET disabled=1 WHERE id=?').bind(student.id).run();const r=await loadAccount(db,identity(student.id,student.email,student.name),'owner@example.test',NOW);assert.equal(r.user,null);assert.equal(r.problem.kind,'restricted');assert.match(r.problem.message,/disabled/);assert.equal((await db.prepare('SELECT disabled FROM users WHERE id=?').bind(student.id).first()).disabled,1);await reject(initializeUser(db,identity(student.id,student.email,student.name),'owner@example.test',NOW),403)});
test('account page loading retains assigned roles and returns a safe recovery state on database failure',async()=>{const r=await loadAccount(db,identity(teacher.id,teacher.email,teacher.name),'owner@example.test',NOW);assert.equal(r.user.role,'teacher');assert.equal(r.problem,null);const broken={prepare(){throw new Error('private connection details must not be rendered')}};const failed=await loadAccount(broken,identity(student.id,student.email,student.name),'owner@example.test',NOW);assert.equal(failed.problem.kind,'unavailable');assert.ok(!failed.problem.message.includes('private connection'));assert.equal(failed.user,null)});
test('admins can edit names roles and access while verified sign-in email remains unchanged',async()=>{await mutate(db,admin,{action:'editUser',userId:student.id,name:'Corrected learner name',role:'student',disabled:false,email:'different@example.test'},NOW+1);const row=await db.prepare('SELECT * FROM users WHERE id=?').bind(student.id).first();assert.equal(row.name,'Corrected learner name');assert.equal(row.email,student.email);assert.equal(row.disabled,0);const audit=await db.prepare("SELECT * FROM user_account_audit WHERE target_id=? AND action='editUser'").bind(student.id).first();assert.equal(audit.actor_id,admin.id);assert.equal(JSON.parse(audit.before).name,student.name);assert.equal(JSON.parse(audit.after).name,'Corrected learner name');});
test('user editing deletion and restoration are admin-only and protect the owner',async()=>{for(const action of ['editUser','deleteUser','restoreUser']){const a={action,userId:student.id,name:'Changed name',role:'teacher',disabled:false,confirmEmail:student.email};await reject(mutate(db,teacher,a,NOW),403);await reject(mutate(db,{...student2,role:'admin'},a,NOW),403);await reject(mutate(db,admin,{...a,userId:admin.id,confirmEmail:admin.email},NOW),400)}await reject(mutate(db,admin,{action:'deleteUser',userId:student.id,confirmEmail:student2.email},NOW),400);assert.equal((await db.prepare('SELECT disabled FROM users WHERE id=?').bind(student.id).first()).disabled,0)});
test('deletion blocks sign-in, retains payment history and membership, and is idempotent',async()=>{await admit();await subscribe();const course=await teachingClass();const before=(await readFinance(db,admin,NOW+4)).collections.collectedCents;await mutate(db,admin,{action:'deleteUser',userId:student.id,confirmEmail:student.email},NOW+5);await mutate(db,admin,{action:'deleteUser',userId:student.id,confirmEmail:student.email},NOW+6);await reject(initializeUser(db,identity(student.id,student.email,student.name),'owner@example.test',NOW+7),403);await reject(readState(db,student,NOW+7),403);const row=await db.prepare('SELECT * FROM users WHERE id=?').bind(student.id).first();assert.equal(row.deleted_at,NOW+5);assert.equal(row.disabled,1);assert.equal((await readFinance(db,admin,NOW+7)).collections.collectedCents,before);assert.ok(await db.prepare('SELECT id FROM class_enrollments WHERE class_id=? AND student_id=?').bind(course,student.id).first());assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM user_account_audit WHERE target_id=? AND action='deleteUser'").bind(student.id).first()).n,1)});
test('restoration preserves records and keeps access disabled until an explicit admin edit',async()=>{await mutate(db,admin,{action:'deleteUser',userId:student.id,confirmEmail:student.email},NOW);await reject(mutate(db,admin,{action:'userRole',userId:student.id,role:'teacher',disabled:false},NOW+1),409);await mutate(db,admin,{action:'restoreUser',userId:student.id},NOW+2);let row=await db.prepare('SELECT * FROM users WHERE id=?').bind(student.id).first();assert.equal(row.deleted_at,null);assert.equal(row.disabled,1);await reject(initializeUser(db,identity(student.id,student.email,student.name),'owner@example.test',NOW+3),403);await mutate(db,admin,{action:'editUser',userId:student.id,name:student.name,role:'student',disabled:false},NOW+4);assert.equal((await initializeUser(db,identity(student.id,student.email,student.name),'owner@example.test',NOW+5)).disabled,0)});
test('teacher account toggles cannot bypass deleted status and deletion closes open lessons',async()=>{const record=await mutatePortal(db,admin,{action:'addTeacher',fullName:teacher.name,email:teacher.email,phone:'',subject:'Mathematics'},NOW);const classId=await teachingClass(),c=await db.prepare('SELECT * FROM teaching_classes WHERE id=?').bind(classId).first();const session=await mutatePreparation(db,teacher,{action:'openPreparation',roomId:c.room_id,title:'Teacher preparation'},NOW);await mutate(db,admin,{action:'deleteUser',userId:teacher.id,confirmEmail:teacher.email},NOW+1);assert.equal((await db.prepare('SELECT status FROM class_sessions WHERE id=?').bind(session.id).first()).status,'ended');await reject(mutatePortal(db,admin,{action:'teacherAccountStatus',id:record.id,enabled:true},NOW+2),409);assert.equal((await db.prepare('SELECT disabled FROM users WHERE id=?').bind(teacher.id).first()).disabled,1)});
test('classmate video signaling is scoped to joined learners and cannot bypass microphone moderation',async()=>{const f=await cascadeFixture();await admit(student2);await subscribe(student2,'GALLERY123');await mutatePreparation(db,student2,{action:'joinClass',sessionId:f.session.id},f.at);await mutatePreparation(db,teacher,{action:'classMuteAll',sessionId:f.session.id,muted:true},f.at);const t='00000000-0000-4000-a000-000000000001',s='00000000-0000-4000-a000-000000000002',p='00000000-0000-4000-a000-000000000003';for(const [u,id] of [[teacher,t],[student,s],[student2,p]])await mutateConference(db,u,mediaAction(f,'join',id),f.at);const signal=(kind,sdp)=>mediaAction(f,'signal',s,{toPeer:p,eventId:crypto.randomUUID(),kind,payload:JSON.stringify({type:kind,sdp})});await mutateConference(db,student,signal('offer','v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n'),f.at+1);let d=await conferenceState(db,student2,f.classId,f.session.id,p,0,f.at+2);assert.equal(d.signals.length,1);assert.equal(d.peers.find(x=>x.id===s).micAllowed,false);assert.ok(!JSON.stringify(d.peers).includes(student.email));await reject(mutateConference(db,student,signal('offer','v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n'),f.at+3),403);await reject(mutateConference(db,student2,mediaAction(f,'signal',p,{toPeer:s,eventId:crypto.randomUUID(),kind:'offer',payload:JSON.stringify({type:'offer',sdp:'v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n'})}),f.at+3),403);await mutateConference(db,student2,mediaAction(f,'signal',p,{toPeer:s,eventId:crypto.randomUUID(),kind:'answer',payload:JSON.stringify({type:'answer',sdp:'v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n'})}),f.at+4);await setStudentSubject(db,teacher,{studentId:student2.id,classLevel:'grade-9',subject:'mathematics',status:'exempt',note:'Authorised exemption'},f.at+5);await reject(mutateConference(db,student,signal('offer','v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n'),f.at+6),403)});
test('classmate gallery peers exclude a revoked recipient subscription without trusting cached access',async()=>{const f=await cascadeFixture();await admit(student2);await subscribe(student2,'RECIP12345');await mutatePreparation(db,student2,{action:'joinClass',sessionId:f.session.id},f.at);const s=crypto.randomUUID(),p=crypto.randomUUID();await mutateConference(db,student,mediaAction(f,'join',s),f.at);await mutateConference(db,student2,mediaAction(f,'join',p),f.at);await db.prepare("UPDATE subscriptions SET status='rejected' WHERE student_id=?").bind(student2.id).run();const d=await conferenceState(db,student,f.classId,f.session.id,s,0,f.at+1);assert.ok(!d.peers.some(x=>x.id===p))});
test('gallery offer election is deterministic and gallery pages keep the teacher with bounded classmates',()=>{const teacher={id:'z',publisher:true},a={id:'a',publisher:false},b={id:'b',publisher:false};assert.equal(galleryOfferer(teacher,a),true);assert.equal(galleryOfferer(a,teacher),false);assert.equal(galleryOfferer(a,b),true);assert.equal(galleryOfferer(b,a),false);const members=[{id:'teacher'},...Array.from({length:600},(_,i)=>({id:'student-'+i}))];const first=galleryPage(members,'teacher',0),next=galleryPage(members,'teacher',11);assert.equal(first.teacher.id,'teacher');assert.equal(next.teacher.id,'teacher');assert.equal(first.others.length,11);assert.equal(next.others.length,11);assert.ok(!first.others.some(m=>next.others.some(n=>n.id===m.id)));assert.equal(next.total,600)});
test('SFU camera permission never grants unapproved microphone screen sharing or data access',async()=>{const f=await schoolScaleFixture(2),media=fakeSfu(),token=await issueScaleToken(db,TEST_SFU,student,f.classId,f.session.id,f.at,media),claims=await new TokenVerifier(TEST_SFU.LIVEKIT_API_KEY,TEST_SFU.LIVEKIT_API_SECRET).verify(token.token);assert.equal(token.canPublish,false);assert.deepEqual(claims.video.canPublishSources,['camera']);assert.equal(claims.video.canPublishData,false);assert.equal(claims.video.roomAdmin,undefined);await mutatePreparation(db,teacher,{action:'classStudentMicrophone',sessionId:f.session.id,studentId:student.id,muted:false},f.at+1);const allowed=await issueScaleToken(db,TEST_SFU,student,f.classId,f.session.id,f.at+2,media);assert.deepEqual((await new TokenVerifier(TEST_SFU.LIVEKIT_API_KEY,TEST_SFU.LIVEKIT_API_SECRET).verify(allowed.token)).video.canPublishSources,['camera','microphone']);await mutatePreparation(db,teacher,{action:'classStudentMicrophone',sessionId:f.session.id,studentId:student.id,muted:true},f.at+3);const muted=await issueScaleToken(db,TEST_SFU,student,f.classId,f.session.id,f.at+4,media);assert.deepEqual((await new TokenVerifier(TEST_SFU.LIVEKIT_API_KEY,TEST_SFU.LIVEKIT_API_SECRET).verify(muted.token)).video.canPublishSources,['camera'])});
test('camera placeholders recover when video arrives after audio and stop observing after leaving',()=>{const stream=new EventTarget(),tracks=[];stream.getVideoTracks=()=>tracks;const states=[],stop=watchCamera(stream,v=>states.push(v));assert.equal(states.at(-1),false);const track=Object.assign(new EventTarget(),{enabled:true,muted:true,readyState:'live'});tracks.push(track);stream.dispatchEvent(new Event('addtrack'));assert.equal(states.at(-1),false);track.muted=false;track.dispatchEvent(new Event('unmute'));assert.equal(states.at(-1),true);tracks.length=0;stream.dispatchEvent(new Event('removetrack'));assert.equal(states.at(-1),false);stop();const n=states.length;tracks.push(track);stream.dispatchEvent(new Event('addtrack'));track.dispatchEvent(new Event('mute'));assert.equal(states.length,n)});
test('student email registration needs no phone and uses only the verified signed-in email',async()=>{await mutateEngagement(db,student,{action:'requestAdmission',teacherId:teacher.id,fullName:'Email learner',contactMethod:'email',phone:'',email:'untrusted@example.test',level:'Grade 9',goals:'Join lessons'},NOW);const d=await admissionState(db,student);assert.equal(d.admission.contact_method,'email');assert.equal(d.admission.phone,'');assert.equal((await db.prepare('SELECT email,role FROM users WHERE id=?').bind(student.id).first()).email,student.email);assert.equal(d.admission.status,'pending');await reject(requirePaidAccess(db,student,NOW+1),403)});
test('phone registration accepts Kenyan local/international forms and rejects incomplete numbers',async()=>{await reject(mutateEngagement(db,student,{action:'requestAdmission',teacherId:teacher.id,contactMethod:'phone',phone:'12345',level:'Grade 9',goals:'Join lessons'},NOW),400);assert.equal(await db.prepare('SELECT student_id FROM admissions WHERE student_id=?').bind(student.id).first(),null);await mutateEngagement(db,student,{action:'requestAdmission',teacherId:teacher.id,contactMethod:'phone',phone:'+254 712 345 678',level:'Grade 9',goals:'Join lessons'},NOW);let d=await admissionState(db,student);assert.equal(d.admission.contact_method,'phone');assert.equal(d.admission.phone,'254712345678');await mutateEngagement(db,student,{action:'requestAdmission',teacherId:teacher.id,contactMethod:'email',phone:'',level:'Grade 9',goals:'Prefer email'},NOW+1);d=await admissionState(db,student);assert.equal(d.admission.contact_method,'email');assert.equal(d.admission.phone,'')});
test('teacher email applications remain pending until admin approval and preserve email contact',async()=>{const input={fullName:'Email teacher',contactMethod:'email',subject:'Mathematics',experience:''};assert.equal(TeacherSignup.safeParse(input).success,true);await requestTeacherSignup(db,student,input,NOW);let d=await teacherSignupState(db,student);assert.equal(d.application.contact_method,'email');assert.equal(d.application.phone,'');assert.equal((await db.prepare('SELECT role FROM users WHERE id=?').bind(student.id).first()).role,'student');await reject(mutatePortal(db,teacher,{action:'reviewTeacherSignup',id:d.application.id,status:'approved',note:''},NOW+1),403);await mutatePortal(db,admin,{action:'reviewTeacherSignup',id:d.application.id,status:'approved',note:'Reviewed email applicant'},NOW+2);assert.equal((await db.prepare('SELECT role FROM users WHERE id=?').bind(student.id).first()).role,'teacher');const account=await db.prepare('SELECT email,phone FROM teacher_accounts WHERE user_id=?').bind(student.id).first();assert.equal(account.email,student.email);assert.equal(account.phone,'')});
test('teacher phone applications validate and normalize numbers while the email branch ignores an unused phone',async()=>{const input={fullName:'Phone teacher',contactMethod:'phone',phone:'0712345678',subject:'Science',experience:''};assert.equal(TeacherSignup.safeParse({...input,phone:''}).success,false);assert.equal(TeacherSignup.safeParse({...input,contactMethod:'whatsapp'}).success,false);await requestTeacherSignup(db,student,input,NOW);const d=await teacherSignupState(db,student);assert.equal(d.application.contact_method,'phone');assert.equal(d.application.phone,'254712345678')});

const paymentCallback=(checkout='ws_test_checkout',merchant='merchant_test')=>({Body:{stkCallback:{CheckoutRequestID:checkout,MerchantRequestID:merchant,ResultCode:0,CallbackMetadata:{Item:[{Name:'Amount',Value:999999},{Name:'MpesaReceiptNumber',Value:'UNTRUSTED'}]},purpose:'registration'}}});
test('callback only records tuition after independent provider confirmation, once, with original price and purpose',async()=>{
 await admit();await plan();const p=await mutatePayment(db,student,{action:'startPayment',phone:'0712345678'},paymentConfig,NOW+1,providerMock());
 const id=await acceptPaymentCallback(db,paymentCallback(),NOW+2);assert.equal(id,p.id);
 assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM subscriptions').get().n,0);
 await verifyCallbackPayment(db,id,paymentConfig,NOW+3,providerMock());
 const row=db.sqlite.prepare('SELECT * FROM subscriptions').get();assert.equal(row.amount,200);assert.equal(row.status,'verified');assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM registration_payments').get().n,0);
 assert.equal(await acceptPaymentCallback(db,paymentCallback(),NOW+4),null);
 await verifyCallbackPayment(db,id,paymentConfig,NOW+20000,providerMock());assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM subscriptions').get().n,1);assert.equal(db.sqlite.prepare('SELECT expires_at FROM subscriptions').get().expires_at,row.expires_at);
});
test('unknown or mismatched callback identifiers never schedule a provider query or change ledgers',async()=>{
 await admit();await plan();await mutatePayment(db,student,{action:'startPayment',phone:'0712345678'},paymentConfig,NOW+1,providerMock());
 for(const payload of [paymentCallback('unknown'),paymentCallback('ws_test_checkout','wrong')])assert.equal(await acceptPaymentCallback(db,payload,NOW+2),null);
 await reject(acceptPaymentCallback(db,{Body:{stkCallback:{CheckoutRequestID:'ws_test_checkout'}}},NOW+2),400);
 assert.equal(db.sqlite.prepare('SELECT callback_received_at FROM payment_intents').get().callback_received_at,null);assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM subscriptions').get().n,0);
});
test('forged success callback remains pending on provider failure and can later reconcile without learner presence',async()=>{
 await admit();await plan();const p=await mutatePayment(db,student,{action:'startPayment',phone:'0712345678'},paymentConfig,NOW+1,providerMock());
 await acceptPaymentCallback(db,paymentCallback(),NOW+2);
 await verifyCallbackPayment(db,p.id,paymentConfig,NOW+3,async()=>{throw new Error('network failure')});
 const failed=db.sqlite.prepare('SELECT * FROM payment_intents').get();assert.equal(failed.status,'pending');assert.equal(failed.callback_received_at,NOW+2);assert.ok(failed.recording_error);assert.equal(await refreshAccess(db,student.id,NOW+4),null);
 await reconcilePayments(db,paymentConfig,NOW+10004,providerMock());assert.equal(db.sqlite.prepare('SELECT status,recording_error FROM payment_intents').get().status,'confirmed');assert.equal(db.sqlite.prepare('SELECT recording_error FROM payment_intents').get().recording_error,'');
});
test('callback registration recording grants no tuition access and ignores untrusted amount changes',async()=>{
 await admit();await plan();const fetcher=async(url,options)=>{if(url.includes('/oauth/'))return Response.json({access_token:'test-only-token'});const b=JSON.parse(options.body);if(url.includes('/processrequest')){assert.equal(b.Amount,100);assert.ok(b.TransactionDesc.length<=13);return Response.json({ResponseCode:'0',CheckoutRequestID:'reg_cb',MerchantRequestID:'reg_m'})}return Response.json({CheckoutRequestID:'reg_cb',MerchantRequestID:'reg_m',ResultCode:0})};
 const p=await mutatePayment(db,student,{action:'startPayment',phone:'0712345678',purpose:'registration'},paymentConfig,NOW+1,fetcher);
 await acceptPaymentCallback(db,paymentCallback('reg_cb','reg_m'),NOW+2);await verifyCallbackPayment(db,p.id,paymentConfig,NOW+3,fetcher);
 assert.equal(db.sqlite.prepare('SELECT amount,status FROM registration_payments').get().amount,100);assert.equal(db.sqlite.prepare('SELECT status FROM registration_payments').get().status,'verified');assert.equal(await refreshAccess(db,student.id,NOW+4),null);assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM subscriptions').get().n,0);
});
test('reconciliation queue is admin-only and rejects forged admin roles',async()=>{
 await admit();await plan();await mutatePayment(db,student,{action:'startPayment',phone:'0712345678'},paymentConfig,NOW+1,providerMock());
 for(const u of [student,teacher,{...student,role:'admin'}])await reject(mutatePayment(db,u,{action:'reconcilePayments'},paymentConfig,NOW+2,providerMock()),403);
 for(const u of [student,teacher,{...student,role:'admin'}])assert.equal((await readPayments(db,u,paymentConfig)).recording,undefined);
 const data=await readPayments(db,admin,paymentConfig);assert.equal(data.recording.pendingTuition,1);assert.equal(data.recording.pendingRegistration,0);
 assert.equal((await mutatePayment(db,admin,{action:'reconcilePayments'},paymentConfig,NOW+3,providerMock())).checked,1);
 assert.equal((await readPayments(db,admin,paymentConfig)).recording.pendingTuition,0);
});

test('student signup saves admission and registration receipt atomically as pending, never as tuition or login',async()=>{
 const action={action:'requestAdmission',teacherId:teacher.id,fullName:'New learner',contactMethod:'phone',phone:'0712345678',level:'Grade 9',goals:'Join lessons',registrationPayment:{phone:'+254712345678',receipt:'AB12345678'}};
 await mutateEngagement(db,student,action,NOW);
 assert.equal((await admissionState(db,student)).registrationStatus,'pending');assert.equal((await admissionState(db,student)).admission.status,'pending');
 const row=db.sqlite.prepare('SELECT * FROM registration_payments').get();assert.equal(row.receipt,'AB12345678');assert.equal(row.phone,'254712345678');assert.equal(row.status,'pending');assert.equal(row.student_id,student.id);
 assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM subscriptions').get().n,0);await reject(requirePaidAccess(db,student,NOW+1),403);
 await mutateEngagement(db,student,action,NOW+2);assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM registration_payments').get().n,1);
});
test('duplicate signup receipt cannot bind another learner or leave a partial admission',async()=>{
 const a={action:'requestAdmission',teacherId:teacher.id,contactMethod:'phone',phone:'0712345678',level:'Grade 9',goals:'Join lessons',registrationPayment:{phone:'0712345678',receipt:'CD12345678'}};
 await mutateEngagement(db,student,a,NOW);await reject(mutateEngagement(db,student2,{...a,fullName:'Must not persist'},NOW+1),409);
 assert.equal(await db.prepare('SELECT student_id FROM admissions WHERE student_id=?').bind(student2.id).first(),null);assert.equal((await db.prepare('SELECT name FROM users WHERE id=?').bind(student2.id).first()).name,student2.name);
 assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM payment_receipt_reservations').get().n,1);
});
test('signup registration rejects PIN-like codes, invalid payment phones and receipts reserved for tuition',async()=>{
 const base={action:'requestAdmission',teacherId:teacher.id,contactMethod:'phone',phone:'0712345678',level:'Grade 9',goals:'Join lessons'};
 for(const payment of [{phone:'0712345678',receipt:'1234'},{phone:'12345',receipt:'EF12345678'}])await reject(mutateEngagement(db,student,{...base,registrationPayment:payment},NOW),400);
 await db.prepare("INSERT INTO payment_receipt_reservations(receipt,kind,payment_id,created_at) VALUES('GH12345678','tuition','reserved-test',?)").bind(NOW).run();
 await reject(mutateEngagement(db,student,{...base,registrationPayment:{phone:'0712345678',receipt:'GH12345678'}},NOW+1),409);
 assert.equal(await db.prepare('SELECT student_id FROM admissions WHERE student_id=?').bind(student.id).first(),null);
});
test('administrator verification of a signup receipt leaves registration and tuition separate',async()=>{
 await mutateEngagement(db,student,{action:'requestAdmission',teacherId:teacher.id,contactMethod:'phone',phone:'0712345678',level:'Grade 9',goals:'Join lessons',registrationPayment:{phone:'0712345678',receipt:'IJ12345678'}},NOW);
 const {id}=db.sqlite.prepare('SELECT id FROM registration_payments').get();await reject(mutateRegistrationFee(db,teacher,{action:'reviewRegistrationFee',...await reviewEvidence(db,'registration',id),id,status:'verified',note:'Not allowed'},NOW+1),403);
 await mutateRegistrationFee(db,admin,{action:'reviewRegistrationFee',...await reviewEvidence(db,'registration',id),id,status:'verified',note:'Matched to provider statement'},NOW+2);
 assert.equal((await admissionState(db,student)).registrationStatus,'verified');assert.equal((await admissionState(db,student)).admission.status,'pending');assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM subscriptions').get().n,0);
});

test('pending teacher registration can be edited, deleted and restored without granting an unverified teacher role',async()=>{
 const {id}=await mutatePortal(db,admin,{action:'addTeacher',fullName:'Pending Teacher',email:'pending-edit@example.test',phone:'',subject:'Science'},NOW);
 await mutatePortal(db,admin,{action:'editTeacherRegistration',id,fullName:'Updated Teacher',phone:'0712345678',subject:'Mathematics'},NOW+1);
 let row=await db.prepare('SELECT * FROM teacher_accounts WHERE id=?').bind(id).first();assert.equal(row.full_name,'Updated Teacher');assert.equal(row.subject,'Mathematics');assert.equal(row.status,'pending');
 await reject(mutatePortal(db,admin,{action:'deleteTeacherRegistration',id,confirmEmail:'wrong@example.test'},NOW+2),400);
 await mutatePortal(db,admin,{action:'deleteTeacherRegistration',id,confirmEmail:'pending-edit@example.test'},NOW+3);
 assert.equal((await db.prepare('SELECT status FROM teacher_accounts WHERE id=?').bind(id).first()).status,'deleted');
 await reject(mutatePortal(db,admin,{action:'teacherAccountStatus',id,enabled:true},NOW+4),409);
 let signed=await initializeUser(db,identity('pending-edit','pending-edit@example.test','Native name'),'owner@example.test',NOW+5);assert.equal(signed.role,'student');
 await mutatePortal(db,admin,{action:'restoreTeacherRegistration',id},NOW+6);
 signed=await initializeUser(db,identity('pending-edit','pending-edit@example.test','Native name'),'owner@example.test',NOW+7);assert.equal(signed.role,'teacher');assert.equal(signed.name,'Updated Teacher');
 await reject(mutatePortal(db,admin,{action:'editTeacherRegistration',id,fullName:'Bypass',phone:'',subject:''},NOW+8),409);
 await reject(mutatePortal(db,admin,{action:'deleteTeacherRegistration',id,confirmEmail:'pending-edit@example.test'},NOW+8),409);
});
test('pending teacher editing deletion and restoration reject non-admin and forged admin identities',async()=>{
 const {id}=await mutatePortal(db,admin,{action:'addTeacher',fullName:'Pending Teacher',email:'pending-protected@example.test',phone:'',subject:''},NOW);
 for(const actor of [student,teacher,{...student,role:'admin'}])for(const action of [{action:'editTeacherRegistration',id,fullName:'Changed',phone:'',subject:''},{action:'deleteTeacherRegistration',id,confirmEmail:'pending-protected@example.test'},{action:'restoreTeacherRegistration',id}])await reject(mutatePortal(db,actor,action,NOW+1),403);
 assert.equal((await db.prepare('SELECT status FROM teacher_accounts WHERE id=?').bind(id).first()).status,'pending');
});

test('restricted student can load and submit registration but cannot enter the learning workspace',async()=>{
 await mutate(db,admin,{action:'userRole',userId:student.id,role:'student',disabled:true},NOW);
 const verified=identity(student.id,student.email,student.name);await reject(initializeUser(db,verified,'owner@example.test',NOW+1),403);
 const applicant=await initializeAdmissionUser(db,verified,'owner@example.test',NOW+1);assert.equal(applicant.disabled,1);assert.equal((await admissionState(db,applicant)).accountReviewRequired,true);
 await mutateEngagement(db,applicant,{action:'requestAdmission',teacherId:teacher.id,fullName:'Student application',contactMethod:'phone',phone:'0712345678',level:'Grade 9',goals:'Please review my account'},NOW+2);
 const state=await admissionState(db,applicant);assert.equal(state.admission.status,'pending');assert.equal(state.user.disabled,1);assert.equal(state.user.role,'student');
 await reject(readState(db,applicant,NOW+3),403);await reject(mutateEngagement(db,applicant,{action:'presence',page:'student'},NOW+3),403);await reject(mutatePayment(db,applicant,{action:'startPayment',phone:'0712345678'},paymentConfig,NOW+3,providerMock()),403);
});
test('admin admission approval restores restricted student sign-in with an audit and does not invent payment access',async()=>{
 await admit();await mutate(db,admin,{action:'userRole',userId:student.id,role:'student',disabled:true},NOW+1);
 const applicant=await initializeAdmissionUser(db,identity(student.id,student.email,student.name),'owner@example.test',NOW+2);
 await mutateEngagement(db,applicant,{action:'requestAdmission',teacherId:teacher.id,contactMethod:'phone',phone:'0712345678',level:'Grade 9',goals:'Reapply'},NOW+3);assert.equal((await admissionState(db,applicant)).admission.status,'pending');
 const approval={action:'reviewAdmission',studentId:student.id,status:'approved',note:'Account reviewed; restore sign-in'};
 await reject(mutateEngagement(db,teacher,approval,NOW+4),403);await reject(mutateEngagement(db,{...student2,role:'admin'},approval,NOW+4),403);
 await mutateEngagement(db,admin,approval,NOW+5);
 const restored=await initializeUser(db,identity(student.id,student.email,student.name),'owner@example.test',NOW+6);assert.equal(restored.disabled,0);assert.equal((await admissionState(db,restored)).admission.status,'approved');
 const audit=await db.prepare("SELECT * FROM user_account_audit WHERE target_id=? AND action='admissionReactivation'").bind(student.id).first();assert.equal(audit.actor_id,admin.id);assert.equal(JSON.parse(audit.before).disabled,1);assert.equal(JSON.parse(audit.after).disabled,0);
 assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM subscriptions').get().n,0);assert.equal(await refreshAccess(db,student.id,NOW+7),null);
});
test('registration exception never restores deleted students or restricted staff',async()=>{
 await admit();await mutate(db,admin,{action:'deleteUser',userId:student.id,confirmEmail:student.email},NOW+1);
 await reject(initializeAdmissionUser(db,identity(student.id,student.email,student.name),'owner@example.test',NOW+2),403);await reject(admissionState(db,student),403);
 await reject(mutateEngagement(db,student,{action:'requestAdmission',teacherId:teacher.id,contactMethod:'phone',phone:'0712345678',level:'Grade 9',goals:'Cannot restore deletion'},NOW+2),403);
 await reject(mutateEngagement(db,admin,{action:'reviewAdmission',studentId:student.id,status:'approved',note:'Must restore deletion separately'},NOW+2),409);
 await mutate(db,admin,{action:'userRole',userId:teacher.id,role:'teacher',disabled:true},NOW+3);
 await reject(initializeAdmissionUser(db,identity(teacher.id,teacher.email,teacher.name),'owner@example.test',NOW+4),403);await reject(admissionState(db,teacher),403);
 assert.equal((await db.prepare('SELECT disabled FROM users WHERE id=?').bind(student.id).first()).disabled,1);
});
test('declining a restricted student application keeps the account restricted',async()=>{
 await mutate(db,admin,{action:'userRole',userId:student.id,role:'student',disabled:true},NOW);
 const applicant=await initializeAdmissionUser(db,identity(student.id,student.email,student.name),'owner@example.test',NOW+1);
 await mutateEngagement(db,applicant,{action:'requestAdmission',teacherId:teacher.id,contactMethod:'phone',phone:'0712345678',level:'Grade 9',goals:'Registration review'},NOW+2);
 await mutateEngagement(db,admin,{action:'reviewAdmission',studentId:student.id,status:'rejected',note:'Review declined'},NOW+3);
 assert.equal((await admissionState(db,applicant)).admission.status,'rejected');await reject(initializeUser(db,identity(student.id,student.email,student.name),'owner@example.test',NOW+4),403);
});

fs.writeFileSync('.sites-runtime/b2b-test.mjs',ts.transpileModule(fs.readFileSync('app/payments/b2b/service.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("'../../service'","'./service-test.mjs'"));
const {submitB2B,readB2B,receiveB2BCallback,b2bConfiguration}=await import('../.sites-runtime/b2b-test.mjs');
const b2bConfig={MPESA_CONSUMER_KEY:'test-only-key',MPESA_CONSUMER_SECRET:'test-only-secret',MPESA_B2B_INITIATOR:'test-initiator',MPESA_B2B_SECURITY_CREDENTIAL:'test-encrypted-credential',MPESA_B2B_SENDER_SHORTCODE:'600000',MPESA_B2B_CALLBACK_BASE_URL:'https://site.example',MPESA_B2B_SANDBOX_ENABLED:'true'};
const b2bAction=()=>({action:'sandboxB2B',idempotencyKey:crypto.randomUUID(),receiverShortcode:'600001',amount:10,accountReference:'TEST001',remarks:'Sandbox test',confirmSandbox:true});
test('B2B sandbox fails closed without configuration and excludes non-admin and forged roles',async()=>{
 const a=b2bAction();for(const actor of [student,teacher,{...student,role:'admin'}]){await reject(submitB2B(db,actor,a,b2bConfig,NOW),403);await reject(readB2B(db,actor,b2bConfig),403)}
 await reject(submitB2B(db,admin,a,{},NOW),503);await reject(submitB2B(db,admin,{...a,confirmSandbox:false},b2bConfig,NOW),400);await reject(submitB2B(db,admin,{...a,endpoint:'https://api.safaricom.co.ke/mpesa/b2b/v1/paymentrequest'},b2bConfig,NOW),400);
 assert.equal(b2bConfiguration({...b2bConfig,MPESA_B2B_CALLBACK_BASE_URL:'http://site.example'}).configured,false);assert.equal(b2bConfiguration({...b2bConfig,MPESA_B2B_SANDBOX_ENABLED:'false'}).configured,false);assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM mpesa_b2b_requests').get().n,0);
});
test('B2B sends the supplied sandbox endpoint and encrypted credential once, retaining no client-visible secret',async()=>{
 const a=b2bAction();let sends=0,payload;const fetcher=async(url,init)=>{assert.match(url,/^https:\/\/sandbox\.safaricom\.co\.ke\//);if(url.includes('/oauth/'))return Response.json({access_token:'test-bearer'});sends++;payload=JSON.parse(init.body);assert.equal(url,'https://sandbox.safaricom.co.ke/mpesa/b2b/v1/paymentrequest');assert.equal(payload.CommandID,'BusinessPayBill');assert.equal(payload.SecurityCredential,b2bConfig.MPESA_B2B_SECURITY_CREDENTIAL);assert.equal(payload.RecieverIdentifierType,'4');assert.equal(payload.PartyA,'600000');assert.equal(payload.PartyB,a.receiverShortcode);return Response.json({ResponseCode:'0',ConversationID:'conv-test',OriginatorConversationID:'origin-test'})};
 const sent=await submitB2B(db,admin,a,b2bConfig,NOW,fetcher);assert.equal(sent.status,'accepted_not_completed');await submitB2B(db,admin,a,b2bConfig,NOW+1,fetcher);assert.equal(sends,1);
 await reject(submitB2B(db,admin,{...a,amount:20},b2bConfig,NOW+2,fetcher),409);
 const view=JSON.stringify(await readB2B(db,admin,b2bConfig));for(const secret of ['test-encrypted-credential','test-only-secret','test-bearer',new URL(payload.ResultURL).searchParams.get('key')])assert.equal(view.includes(secret),false);
 const result={Result:{ConversationID:'conv-test',OriginatorConversationID:'origin-test',ResultCode:0}};const q=new URL(payload.ResultURL).searchParams;
 await receiveB2BCallback(db,a.idempotencyKey,'wrong','result',result,NOW+3);assert.equal((await readB2B(db,admin,b2bConfig)).requests[0].status,'accepted_not_completed');
 await receiveB2BCallback(db,a.idempotencyKey,q.get('key'),'result',result,NOW+4);assert.equal((await readB2B(db,admin,b2bConfig)).requests[0].status,'sandbox_result_received');
 for(const table of ['subscriptions','registration_payments','payments','teacher_pay_statements'])assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM '+table).get().n,0);
});
test('uncertain B2B response is persisted and never automatically resubmitted',async()=>{
 const a=b2bAction();let calls=0;const fail=async()=>{calls++;throw Error('Offline')};await reject(submitB2B(db,admin,a,b2bConfig,NOW,fail),502);assert.equal((await submitB2B(db,admin,a,b2bConfig,NOW+1,fail)).status,'unknown');assert.equal(calls,1);
 await reject(submitB2B(db,admin,b2bAction(),b2bConfig,NOW+2,fail),429);
});

const sponsored=(target,purpose,receipt)=>({action:'adminRecordStudentPayment',id:crypto.randomUUID(),studentId:target.id,purpose,expectedAmount:purpose==='registration'?100:200,expectedDays:purpose==='registration'?0:6,phone:'0712345678',receipt,note:'Checked exact amount against provider statement',confirmed:true});
test('admin can pay tuition by phone for only the selected registered student',async()=>{
 await admit();await admit(student2);await plan();const start=await mutatePayment(db,admin,{action:'adminStartStudentPayment',studentId:student2.id,purpose:'tuition',expectedAmount:200,expectedDays:6,phone:'0712345678',confirmed:true},paymentConfig,NOW+4,providerMock());
 assert.equal(start.studentId,student2.id);assert.equal((await db.prepare('SELECT initiated_by FROM payment_intents WHERE id=?').bind(start.id).first()).initiated_by,admin.id);
 await reject(mutatePayment(db,student,{action:'checkPayment',id:start.id},paymentConfig,NOW+5,providerMock()),404);
 await mutatePayment(db,admin,{action:'adminCheckStudentPayment',id:start.id},paymentConfig,NOW+6,providerMock());assert.ok(await refreshAccess(db,student2.id,NOW+7));assert.equal(await refreshAccess(db,student.id,NOW+7),null);
 assert.equal((await db.prepare('SELECT student_id FROM subscriptions').first()).student_id,student2.id);
});
test('admin payment options and sponsoring are unavailable to students, teachers or forged admin roles',async()=>{
 await admit();await plan();for(const actor of [student,teacher,{...student,role:'admin'}]){
 await reject(readStudentPaymentAdmin(db,actor,paymentConfig),403);
 await reject(mutatePayment(db,actor,{action:'adminStartStudentPayment',studentId:student.id,purpose:'tuition',expectedAmount:200,expectedDays:6,phone:'0712345678',confirmed:true},paymentConfig,NOW+3,providerMock()),403);
 await reject(mutatePayment(db,actor,sponsored(student,'tuition','KL12345678'),paymentConfig,NOW+3,providerMock()),403);
 await reject(mutatePayment(db,actor,{action:'adminCheckStudentPayment',id:crypto.randomUUID()},paymentConfig,NOW+3,providerMock()),403);
 }
 assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM subscriptions').get().n,0);
});
test('admin recorded tuition uses the configured amount, affects one student and is idempotent',async()=>{
 await admit();await admit(student2);await plan();const a=sponsored(student2,'tuition','MN12345678');await mutatePayment(db,admin,{...a,amount:999999},paymentConfig,NOW+3);
 const first=db.sqlite.prepare('SELECT * FROM subscriptions').get();assert.equal(first.amount,200);assert.equal(first.student_id,student2.id);assert.equal(first.days,6);
 await mutatePayment(db,admin,a,paymentConfig,NOW+4);assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM subscriptions').get().n,1);assert.equal(db.sqlite.prepare('SELECT expires_at FROM subscriptions').get().expires_at,first.expires_at);
 const audit=db.sqlite.prepare('SELECT * FROM student_payment_audit').get();assert.equal(audit.actor_id,admin.id);assert.equal(audit.student_id,student2.id);assert.equal(audit.amount,200);
 assert.equal(await refreshAccess(db,student.id,NOW+5),null);assert.ok(await refreshAccess(db,student2.id,NOW+5));
 await reject(mutatePayment(db,admin,{...a,studentId:student.id},paymentConfig,NOW+6),409);
 assert.equal((await readFinance(db,admin,NOW+7)).collections.tuitionCents,20000);
});
test('admin can record one registration before admission approval without granting tuition or changing admission',async()=>{
 await mutateEngagement(db,student,{action:'requestAdmission',teacherId:teacher.id,phone:'0712345678',level:'Grade 9',goals:'Register'},NOW);
 const a=sponsored(student,'registration','OP12345678');await mutatePayment(db,admin,a,paymentConfig,NOW+1);await mutatePayment(db,admin,a,paymentConfig,NOW+2);
 const row=db.sqlite.prepare('SELECT * FROM registration_payments').get();assert.equal(row.amount,100);assert.equal(row.reviewed_by,admin.id);assert.equal(row.status,'verified');assert.equal((await admissionState(db,student)).admission.status,'pending');
 assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM subscriptions').get().n,0);assert.equal(await refreshAccess(db,student.id,NOW+3),null);
 await reject(mutatePayment(db,admin,sponsored(student,'registration','QR12345678'),paymentConfig,NOW+4),409);
 await reject(mutatePayment(db,admin,sponsored(student,'tuition','ST12345678'),paymentConfig,NOW+4),403);
});
test('sponsored payment refuses duplicate receipts, pending phone requests, disabled targets and unconfirmed records',async()=>{
 await admit();await admit(student2);await plan();const a=sponsored(student,'tuition','UV12345678');await reject(mutatePayment(db,admin,{...a,confirmed:false},paymentConfig,NOW+3),400);await mutatePayment(db,admin,a,paymentConfig,NOW+3);
 await reject(mutatePayment(db,admin,sponsored(student2,'registration','UV12345678'),paymentConfig,NOW+4),409);assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM registration_payments').get().n,0);assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM student_payment_audit').get().n,1);
 await mutatePayment(db,admin,{action:'adminStartStudentPayment',studentId:student2.id,purpose:'tuition',expectedAmount:200,expectedDays:6,phone:'0712345678',confirmed:true},paymentConfig,NOW+5,providerMock());
 await reject(mutatePayment(db,admin,sponsored(student2,'tuition','WX12345678'),paymentConfig,NOW+6),409);
 await mutate(db,admin,{action:'deleteUser',userId:student2.id,confirmEmail:student2.email},NOW+7);
 await reject(mutatePayment(db,admin,sponsored(student2,'registration','YZ12345678'),paymentConfig,NOW+8),403);
 await reject(mutatePayment(db,admin,sponsored(teacher,'registration','ZZ12345678'),paymentConfig,NOW+8),403);
});

test('admin student payments reject a stale fee quote before requesting or recording money',async()=>{
 await admit();await plan();const a=sponsored(student,'tuition','ZA12345678');await mutateEngagement(db,admin,{action:'subscriptionSettings',price:250,days:6},NOW+2);
 await reject(mutatePayment(db,admin,a,paymentConfig,NOW+3),409);
 await reject(mutatePayment(db,admin,{action:'adminStartStudentPayment',studentId:student.id,purpose:'tuition',expectedAmount:200,expectedDays:6,phone:'0712345678',confirmed:true},paymentConfig,NOW+3,()=>{throw Error('Must not contact provider')}),409);
 assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM student_payment_audit').get().n,0);assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM payment_intents').get().n,0);assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM subscriptions').get().n,0);
});

test('Form Four lessons use 8-4-4 and reject a mismatched curriculum',async()=>{
 const body=LabActionSchema.parse({action:'createLesson',title:'Form Four teacher notes',summary:'Teacher prepared',content:'Original teacher notes for this class.',subject:'physics',curriculum:'844',classLevel:'form-4',topic:'Teacher-selected topic',price:0});
 const {id}=await mutateFeature(db,teacher,body,NOW);assert.equal((await readFeatures(db,teacher,NOW+1)).lessons.find(l=>l.id===id).class_level,'form-4');await reject(mutateFeature(db,teacher,{...body,curriculum:'cbe-senior'},NOW+2),400);
 assert.equal(normalizeClass('Secondary · Form 4 (8-4-4)'),'form-4');assert.equal(rating(80,100,defaultBands('form-4')),'A');
});
test('Form Four registrations enroll in Form Four and stay separate from Form Three',async()=>{
 const f4=await teachingClass(teacher,'form-4'),f3=await teachingClass(teacher,'form-3');
 await mutateEngagement(db,student,{action:'requestAdmission',teacherId:teacher.id,phone:'0712345678',level:'Secondary · Form 4 (8-4-4)',goals:'Join Form Four'},NOW+1);
 await mutateEngagement(db,admin,{action:'reviewAdmission',studentId:student.id,status:'approved',note:'Form Four approved'},NOW+2);
 assert.ok(await db.prepare('SELECT id FROM class_enrollments WHERE class_id=? AND student_id=?').bind(f4,student.id).first());assert.equal(await db.prepare('SELECT id FROM class_enrollments WHERE class_id=? AND student_id=?').bind(f3,student.id).first(),null);
});
test('conference class validation accepts Form Four',async()=>{
 await mutateEngagement(db,student,{action:'requestAdmission',teacherId:teacher.id,phone:'0712345678',level:'Form 4',goals:'Form Four learning'},NOW);await mutateEngagement(db,admin,{action:'reviewAdmission',studentId:student.id,status:'approved',note:'Approved'},NOW+1);
 await claimConference(db,student,await conferencePass('FORM-FOUR-TEST'),teacher.id,'Form 4',NOW);
 assert.equal((await admissionState(db,student)).admission.level,'Form 4');
});

test('direct class invitations require the approved matching class and active access',async()=>{
 const id=await teachingClass();await reject(teachingClassAccess(db,student,id,NOW),403);
 await admit();await reject(teachingClassAccess(db,student,id,NOW+2),402);
 await subscribe();assert.equal((await teachingClassAccess(db,student,id,NOW+5)).id,id);
 await mutateEngagement(db,student2,{action:'requestAdmission',teacherId:teacher.id,phone:'0712345678',level:'Grade 8',goals:'Different class'},NOW+1);await mutateEngagement(db,admin,{action:'reviewAdmission',studentId:student2.id,status:'approved',note:'Grade Eight'},NOW+2);
 // Wrong-class invitations fail before offering payment activation.
 await reject(teachingClassAccess(db,student2,id,NOW+5),403);
 await db.prepare("INSERT INTO learner_subjects(id,student_id,class_level,subject,status,updated_by,updated_at) VALUES(?,?,?,'mathematics','exempt',?,?)").bind(crypto.randomUUID(),student.id,'grade-9',teacher.id,NOW+6).run();
 await reject(teachingClassAccess(db,student,id,NOW+7),403);
});

async function reviewEvidence(database,kind,id){const row=await database.prepare('SELECT * FROM '+(kind==='registration'?'registration_payments':'subscriptions')+' WHERE id=?').bind(id).first();return {studentId:row.student_id,expectedAmount:row.amount,expectedReceipt:row.receipt,confirmed:true}}

test('registration approval is bound to the selected student, amount and receipt and records the reviewer',async()=>{
 await admit();await admit(student2);const p=await mutateRegistrationFee(db,student,{action:'claimRegistrationFee',phone:'0712345678',receipt:'RV12345678'},NOW+2);const evidence=await reviewEvidence(db,'registration',p.id);
 const decision={action:'reviewRegistrationFee',id:p.id,status:'verified',note:'Matched student and receipt on provider statement',...evidence};
 await reject(mutateRegistrationFee(db,admin,{...decision,studentId:student2.id},NOW+3),409);
 await reject(mutateRegistrationFee(db,admin,{...decision,expectedAmount:999},NOW+3),409);
 await reject(mutateRegistrationFee(db,admin,{...decision,expectedReceipt:'DIFFERENT1'},NOW+3),409);
 await reject(mutateRegistrationFee(db,admin,{...decision,confirmed:false},NOW+3),400);
 assert.equal((await db.prepare('SELECT status FROM registration_payments WHERE id=?').bind(p.id).first()).status,'pending');
 await mutateRegistrationFee(db,admin,decision,NOW+4);
 const row=(await readRegistrationFees(db,admin)).payments.find(r=>r.id===p.id);assert.equal(row.student_id,student.id);assert.equal(row.student_email,student.email);assert.equal(row.student_class,'Grade 9');assert.equal(row.reviewer_name,admin.name);
 const audit=await db.prepare('SELECT * FROM payment_review_audit WHERE payment_id=?').bind(p.id).first();assert.equal(audit.student_id,student.id);assert.equal(audit.actor_id,admin.id);assert.equal(audit.amount,100);assert.equal(audit.status,'verified');
 await reject(mutateRegistrationFee(db,admin,decision,NOW+5),409);assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM payment_review_audit').get().n,1);assert.equal(await refreshAccess(db,student2.id,NOW+6),null);
});
test('tuition review cannot activate another student or add access twice',async()=>{
 await admit();await admit(student2);await plan();const p=await mutateEngagement(db,student,{action:'claimSubscription',phone:'0712345678',receipt:'RV22345678'},NOW+2),evidence=await reviewEvidence(db,'tuition',p.id);
 const decision={action:'reviewSubscription',id:p.id,status:'verified',note:'Matched selected student and amount',...evidence};
 await reject(mutateEngagement(db,admin,{...decision,studentId:student2.id},NOW+3),409);await reject(mutateEngagement(db,admin,{...decision,expectedAmount:300},NOW+3),409);
 assert.equal(await refreshAccess(db,student.id,NOW+3),null);await mutateEngagement(db,admin,decision,NOW+4);
 const access=await refreshAccess(db,student.id,NOW+5);assert.ok(access);assert.equal(await refreshAccess(db,student2.id,NOW+5),null);await reject(mutateEngagement(db,admin,decision,NOW+6),409);assert.equal((await refreshAccess(db,student.id,NOW+7)).expires_at,access.expires_at);
 const s=(await readEngagement(db,admin,NOW+8)).subscriptions.find(r=>r.id===p.id);assert.equal(s.student_email,student.email);assert.equal(s.student_class,'Grade 9');assert.equal(s.reviewer_name,admin.name);
});
test('rejecting a receipt is audited against its student and grants no access',async()=>{
 await admit();await plan();const p=await mutateEngagement(db,student,{action:'claimSubscription',phone:'0712345678',receipt:'RV32345678'},NOW+2);
 await mutateEngagement(db,admin,{action:'reviewSubscription',id:p.id,studentId:student.id,status:'rejected',note:'Reference not found on statement'},NOW+3);
 const audit=await db.prepare('SELECT * FROM payment_review_audit WHERE payment_id=?').bind(p.id).first();assert.equal(audit.status,'rejected');assert.equal(audit.student_id,student.id);assert.equal(await refreshAccess(db,student.id,NOW+4),null);
});

test('separate verified tuition receipts extend the same student period once each',async()=>{
 await admit();await plan();const first=await mutateEngagement(db,student,{action:'claimSubscription',phone:'0712345678',receipt:'RV42345678'},NOW+1),second=await mutateEngagement(db,student,{action:'claimSubscription',phone:'0712345678',receipt:'RV52345678'},NOW+2);
 for(const [i,p] of [first,second].entries())await mutateEngagement(db,admin,{action:'reviewSubscription',id:p.id,...await reviewEvidence(db,'tuition',p.id),status:'verified',note:'Separate receipt matched to student'},NOW+3+i);
 assert.equal((await refreshAccess(db,student.id,NOW+5)).expires_at,NOW+3+12*86400000);assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM payment_review_audit').get().n,2);
});

test('admin student payment screen returns reviewable pending receipts only for the selected student',async()=>{
 await admit();await admit(student2);await plan();
 const registration=await mutateRegistrationFee(db,student,{action:'claimRegistrationFee',phone:'0712345678',receipt:'AB76543210'},NOW+1);
 const tuition=await mutateEngagement(db,student,{action:'claimSubscription',phone:'0712345678',receipt:'CD76543210'},NOW+2);
 await mutateEngagement(db,student2,{action:'claimSubscription',phone:'0712345678',receipt:'EF76543210'},NOW+2);
 const view=await readStudentPaymentAdmin(db,admin,paymentConfig,'',student.id);
 assert.equal(view.selected.pendingPayments.length,2);assert.ok(view.selected.pendingPayments.every(p=>p.student_id===student.id&&p.student_email===student.email));
 for(const p of view.selected.pendingPayments){const body={id:p.id,studentId:p.student_id,expectedAmount:p.amount,expectedReceipt:p.receipt,confirmed:true,status:'verified',note:'Matched provider statement for selected student'};
 if(p.purpose==='registration')await mutateRegistrationFee(db,admin,{action:'reviewRegistrationFee',...body},NOW+3);else await mutateEngagement(db,admin,{action:'reviewSubscription',...body},NOW+3);}
 assert.equal((await readStudentPaymentAdmin(db,admin,paymentConfig,'',student.id)).selected.pendingPayments.length,0);
 assert.equal((await readStudentPaymentAdmin(db,admin,paymentConfig,'',student2.id)).selected.pendingPayments.length,1);
 assert.equal((await db.prepare('SELECT status FROM registration_payments WHERE id=?').bind(registration.id).first()).status,'verified');
 assert.ok(await refreshAccess(db,student.id,NOW+4));assert.equal(await refreshAccess(db,student2.id,NOW+4),null);
 assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM registration_payments').get().n,1);
 assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM subscriptions').get().n,2);
});

test('clip resume is per student, follows latest seek rather than maximum position and reuses reservations',async()=>{
 const f=await cascadeFixture(),clip=await shareFixture(f,90),p=await mutateLive(db,student,{action:'reserveClip',classId:f.classId,id:clip.id},f.at+1);
 for(const [position,time] of [[60,2],[25,3]])await ingestTelemetry(db,student,{events:[{id:crypto.randomUUID(),permitId:p.id,kind:'seek',position,watchedMs:0,occurredAt:f.at+time}]},f.at+time);
 const before=db.sqlite.prepare('SELECT used FROM video_credits WHERE student_id=?').get(student.id).used;
 const reopened=await mutateLive(db,student,{action:'reserveClip',classId:f.classId,id:clip.id},f.at+4);assert.equal(reopened.id,p.id);assert.equal(reopened.resumePosition,25);assert.equal((await liveSnapshot(db,student,f.classId,f.at+4)).cascadedClips[0].resume_position,25);assert.equal(db.sqlite.prepare('SELECT used FROM video_credits WHERE student_id=?').get(student.id).used,before);
 assert.equal((await mutateLive(db,teacher,{action:'reserveClip',classId:f.classId,id:clip.id},f.at+4)).resumePosition,0);
});
test('teacher clip presentation persists, cannot be changed by learners, and disappears after withdrawal or lesson end',async()=>{
 const f=await cascadeFixture(),clip=await shareFixture(f,90),action={action:'presentClip',classId:f.classId,id:clip.id,position:35,playing:true,following:true};
 await reject(mutateLive(db,student,action,f.at+1),403);await reject(mutateLive(db,teacher,{...action,position:91},f.at+1),400);
 await mutateLive(db,teacher,action,f.at+2);const snapshot=await liveSnapshot(db,student,f.classId,f.at+5000);assert.equal(snapshot.presentation.position,35);assert.equal(snapshot.presentation.playing,1);
 const p=await mutateLive(db,student,{action:'reserveClip',classId:f.classId,id:clip.id},f.at+5001);assert.equal(p.presentation.cascade_id,clip.id);
 await mutateLive(db,teacher,{...action,position:50,playing:false},f.at+6000);assert.equal((await liveSnapshot(db,student,f.classId,f.at+7000)).presentation.position,50);
 await mutateLive(db,teacher,{...action,following:false},f.at+8000);assert.equal((await liveSnapshot(db,student,f.classId,f.at+8001)).presentation.following,0);
 await mutateLive(db,teacher,{action:'archiveCascade',classId:f.classId,id:clip.id},f.at+9000);assert.equal((await liveSnapshot(db,student,f.classId,f.at+9001)).presentation,null);await reject(mutateLive(db,teacher,action,f.at+9002),404);
});

async function topicTutorial(topic){const video=crypto.randomUUID();await db.prepare("INSERT INTO learning_videos(id,teacher_id,title,url,created_at) VALUES(?,?,?,'r2:topic-test.webm',?)").bind(video,teacher.id,topic,NOW).run();await mutateStore(db,teacher,{action:'linkTutorial',videoId:video,classLevel:'grade-9',subject:'mathematics',topic,title:topic+' tutorial',description:'Original teacher explanation for this topic.'},NOW);return video;}
test('KSh 10 tutorial purchases isolate topics and support simultaneous pending topic payments',async()=>{
 await admit();await subscribe();const fractions=await topicTutorial('Fractions'),algebra=await topicTutorial('Algebra');
 const claim=(topic,receipt)=>mutateStore(db,student,{action:'claim',subject:'mathematics',product:'tutorials',topic,receipt,phone:'0712345678',amount:1},NOW+10);
 await reject(claim('','TP00000000'),400);await claim('  FRACTIONS  ','TP00000001');await claim('Algebra','TP00000002');
 const rows=await db.prepare('SELECT * FROM subject_purchases ORDER BY receipt').all();assert.equal(rows.results.length,2);assert.ok(rows.results.every(p=>p.amount===10));assert.equal(rows.results[0].topic,'fractions');
 await reject(claim('fractions','TP00000003'),409);await mutateStore(db,admin,{action:'reviewPurchase',id:rows.results[0].id,status:'verified',note:'Student and topic payment verified'},NOW+11);
 await requireTutorialVideo(db,student,fractions,NOW+12);await reject(requireTutorialVideo(db,student,algebra,NOW+12),402);
 const listing=await readStore(db,student,'grade-9','mathematics',undefined,0,NOW+12);assert.ok(listing.tutorialPasses[listing.tutorials.find(t=>t.video_id===fractions).id]);assert.equal(listing.tutorialPasses[listing.tutorials.find(t=>t.video_id===algebra).id],null);
 assert.equal((await readFinance(db,admin,NOW+12)).collections.tutorialCents,1000);
 await reject(requireTutorialVideo(db,student,fractions,NOW+6*86400000+20),402);
});
test('earlier KSh 20 whole-subject tutorial purchases keep their original access',async()=>{
 await admit();await subscribe();const v=await topicTutorial('Fractions'),v2=await topicTutorial('Algebra'),id=crypto.randomUUID();
 await db.prepare("INSERT INTO subject_purchases(id,student_id,teacher_id,class_level,subject,product,topic,amount,receipt,phone,created_at) VALUES(?,?,?,'grade-9','mathematics','tutorials','',20,'OLD0000001','254712345678',?)").bind(id,student.id,teacher.id,NOW).run();
 await reject(mutateStore(db,student,{action:'claim',subject:'mathematics',product:'tutorials',topic:'fractions',receipt:'NEW0000001',phone:'0712345678'},NOW+1),409);await mutateStore(db,admin,{action:'reviewPurchase',id,status:'verified',note:'Earlier quoted KSh 20 subject payment confirmed'},NOW+1);await requireTutorialVideo(db,student,v,NOW+2);await requireTutorialVideo(db,student,v2,NOW+2);assert.equal((await db.prepare('SELECT amount FROM subject_purchases WHERE id=?').bind(id).first()).amount,20);
});
test('source revision drafts require material and teacher review and return saved electronic results',async()=>{
 await admit();await subscribe();const material='The nucleus contains genetic information and controls cell activities. The cell membrane controls the movement of substances into the cytoplasm. A plant cell wall supports the cell and provides protection. Chloroplasts contain chlorophyll and absorb light for photosynthesis. A vacuole stores water and helps to maintain cell pressure.';
 const a={action:'draftSource',classLevel:'grade-9',subject:'mathematics',topic:'Teacher supplied explanatory material',sourceUrl:'https://kicd.ac.ke/curriculum-designs/',material};
 await reject(mutateStore(db,student,a,NOW),403);await reject(mutateStore(db,teacher,{...a,sourceUrl:'https://example.com/source'},NOW),400);await reject(mutateStore(db,teacher,{...a,material:'Topic heading only\n'.repeat(12)},NOW),400);
 const {id}=await mutateStore(db,teacher,a,NOW);const draft=await db.prepare('SELECT * FROM subject_question_sets WHERE id=?').bind(id).first();assert.equal(draft.status,'draft');assert.equal(draft.source_url,a.sourceUrl);const qs=JSON.parse(draft.questions);assert.ok(qs.every(q=>material.includes(q.explanation)));
 await reject(mutateStore(db,student,{action:'claim',subject:'mathematics',product:'questions',receipt:'DRAFT00001',phone:'0712345678'},NOW+1),409);
 await mutateStore(db,teacher,{action:'reviewSet',id,title:'Reviewed class revision',questions:qs,reviewed:true,publish:true},NOW+2);await buySubject();
 const answers=qs.map(q=>q.correct);const result=await mutateStore(db,student,{action:'submit',setId:id,answers},NOW+12);assert.equal(result.percentage,100);
 const view=await readStore(db,student,'grade-9','mathematics',id,0,NOW+13);assert.equal(view.selected.attempt.percentage,100);assert.equal(view.selected.attempt.feedback.length,qs.length);assert.equal(view.selected.sourceUrl,a.sourceUrl);assert.equal(view.selected.questions[0].correct,undefined);
});


test('Tuition receipt retries return the learner’s existing record without duplicating or approving it',async()=>{
 await admit();await admit(student2);await plan();
 const first=await mutateEngagement(db,student,{action:'claimSubscription',phone:'0712345678',receipt:'RT12345678'},NOW);
 const retry=await mutateEngagement(db,student,{action:'claimSubscription',phone:'0712345678',receipt:'rt12345678'},NOW+1);
 assert.equal(retry.id,first.id);assert.equal(retry.alreadyRecorded,true);assert.equal(retry.status,'pending');
 assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM subscriptions').get().n,1);
 await reject(mutateEngagement(db,student2,{action:'claimSubscription',phone:'0712345678',receipt:'RT12345678'},NOW+2),409);
 const state=await accessState(db,student,NOW+3);assert.equal(state.active,false);assert.deepEqual(state.receipts,[]);assert.equal(state.receiptStatuses.length,1);assert.deepEqual(Object.keys(state.receiptStatuses[0]).sort(),['created_at','id','status']);
 assert.equal((await accessState(db,student2,NOW+3)).receiptStatuses.length,0);assert.equal((await accessState(db,teacher,NOW+3)).receiptStatuses.length,0);
 await mutateEngagement(db,admin,{action:'reviewSubscription',...await reviewEvidence(db,'tuition',first.id),id:first.id,status:'verified',note:'Statement checked'},NOW+4);
 const verified=await mutateEngagement(db,student,{action:'claimSubscription',phone:'0712345678',receipt:'RT12345678'},NOW+5);
 assert.equal(verified.status,'verified');assert.equal((await accessState(db,student,NOW+5)).active,true);
});


test('Primary classes validate lessons and expose only their grade resources',async()=>{
 const action=LabActionSchema.parse({action:'createLesson',classLevel:'grade-1',curriculum:'cbe-primary',subject:'environmental',title:'Our home',summary:'Observe safely',content:'Observe the things in your home with a caregiver.',topic:'Our home',price:0});
 const result=await mutateFeature(db,teacher,action,NOW);assert.ok(result.id);
 assert.equal(resourceFor('primary-1-video','grade-1','english').level,'grade-1');
 assert.equal(resourceFor('primary-1-video','grade-4','english'),null);
 await reject(mutateFeature(db,teacher,{...action,curriculum:'cbe-senior'},NOW),400);
});


test('Primary fee quotes apply KSh 50 registration and KSh 200 tuition without repricing other learners or existing receipts',async()=>{
 await admit();await admit(student2);await mutateEngagement(db,admin,{action:'subscriptionSettings',price:450,days:6},NOW);
 await db.prepare("UPDATE admissions SET level='Lower Primary · Grade 2' WHERE student_id=?").bind(student.id).run();
 const registration=await readRegistrationFees(db,student);assert.equal(registration.settings.amount,50);assert.equal(registration.tuitionPlan.price,200);
 assert.equal((await readPayments(db,student,paymentConfig)).plan.price,200);assert.equal((await accessState(db,student,NOW)).plan.price,200);
 const selected=await readStudentPaymentAdmin(db,admin,paymentConfig,'',student.id);assert.equal(selected.registrationFee.amount,50);assert.equal(selected.tuitionPlan.price,200);
 assert.equal((await readPayments(db,student2,paymentConfig)).plan.price,450);
 const reg=await mutateRegistrationFee(db,student,{action:'claimRegistrationFee',phone:'0712345678',receipt:'PR12345678'},NOW);
 assert.equal((await db.prepare('SELECT amount FROM registration_payments WHERE id=?').bind(reg.id).first()).amount,50);
 await reject(mutateRegistrationFee(db,student,{action:'claimRegistrationFee',phone:'0712345678',receipt:'PR22345678'},NOW+1),409);
 const sub=await mutateEngagement(db,student,{action:'claimSubscription',phone:'0712345678',receipt:'PT12345678'},NOW+2);
 assert.equal((await db.prepare('SELECT amount,days FROM subscriptions WHERE id=?').bind(sub.id).first()).amount,200);
 assert.equal((await accessState(db,student,NOW+3)).active,false);
 await db.prepare("UPDATE admissions SET level='Upper Primary · Grade 6' WHERE student_id=?").bind(student.id).run();
 assert.equal((await readPayments(db,student,paymentConfig)).plan.price,200);
 await db.prepare("UPDATE admissions SET level='Grade 9' WHERE student_id=?").bind(student.id).run();
 assert.equal((await readPayments(db,student,paymentConfig)).plan.price,450);
 assert.equal((await db.prepare('SELECT amount FROM subscriptions WHERE id=?').bind(sub.id).first()).amount,200);
});

test('Primary admission receipt and administrator-sponsored tuition use the class fee on the server',async()=>{
 await plan();await mutateEngagement(db,student,{action:'requestAdmission',teacherId:teacher.id,phone:'0712345678',level:'Lower Primary · Grade 1',goals:'Learn',registrationPayment:{phone:'0712345678',receipt:'PA12345678'}},NOW);
 assert.equal((await db.prepare('SELECT amount FROM registration_payments WHERE student_id=?').bind(student.id).first()).amount,50);
 await mutateEngagement(db,admin,{action:'reviewAdmission',studentId:student.id,status:'approved',note:'Approved primary class'},NOW+1);
 await reject(mutatePayment(db,admin,{action:'adminRecordStudentPayment',id:crypto.randomUUID(),studentId:student.id,purpose:'tuition',expectedAmount:450,expectedDays:6,phone:'0712345678',receipt:'AP12345678',note:'Checked statement',confirmed:true},paymentConfig,NOW+2),409);
 const result=await mutatePayment(db,admin,{action:'adminRecordStudentPayment',id:crypto.randomUUID(),studentId:student.id,purpose:'tuition',expectedAmount:200,expectedDays:6,phone:'0712345678',receipt:'AP12345678',note:'Checked statement',confirmed:true},paymentConfig,NOW+3);
 assert.equal(result.amount,200);assert.equal((await requirePaidAccess(db,student,NOW+4)).expires_at,NOW+3+6*86400000);
});


fs.writeFileSync('.sites-runtime/timed-access-test.mjs',ts.transpileModule(fs.readFileSync('app/timed-access/service.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("'../service'","'./service-test.mjs'"));
const {requireSubjectPass}=await import('../.sites-runtime/subject-access-test.mjs');
const {readTimedAccess,mutateTimedAccess}=await import('../.sites-runtime/timed-access-test.mjs');
const unlockRequest=()=>({action:'unlock',id:crypto.randomUUID(),hours:12,note:'Approved learning open day',confirmed:true});
test('Only the current administrator can create or inspect timed learner access',async()=>{
 await admit();for(const who of [teacher,student,{...student,role:'admin'}]){await reject(readTimedAccess(db,who,NOW),403);await reject(mutateTimedAccess(db,who,unlockRequest(),NOW),403)}
 await reject(mutateTimedAccess(db,admin,{...unlockRequest(),hours:0},NOW),400);
 await reject(mutateTimedAccess(db,admin,{...unlockRequest(),confirmed:false},NOW),400);
 assert.equal((await readTimedAccess(db,admin,NOW)).windows.length,0);
});
test('Timed access snapshots approved registered learners, retries do not restart it, and exact expiry blocks access without a payment',async()=>{
 await admit();const a=unlockRequest(),grant=await mutateTimedAccess(db,admin,a,NOW+10);
 assert.equal(grant.expiresAt,NOW+10+12*3600000);assert.equal((await readTimedAccess(db,admin,NOW+11)).windows[0].learners,1);
 await requirePaidAccess(db,student,NOW+11);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM subscriptions').first()).n,0);
 await admit(student2);assert.equal((await mutateTimedAccess(db,admin,a,NOW+1000)).expiresAt,grant.expiresAt);
 await reject(requirePaidAccess(db,student2,NOW+1001),402);
 await requirePaidAccess(db,student,grant.expiresAt-1);await reject(requirePaidAccess(db,student,grant.expiresAt),402);
 assert.equal((await accessState(db,student,grant.expiresAt)).active,false);
});
test('Disabled registered learners stay blocked; early closure preserves independently paid access and the audit history',async()=>{
 await admit();await admit(student2);await db.prepare('UPDATE users SET disabled=1 WHERE id=?').bind(student2.id).run();
 const a=unlockRequest();await mutateTimedAccess(db,admin,a,NOW+10);
 assert.equal((await readTimedAccess(db,admin,NOW+11)).windows[0].learners,1);
 await reject(requirePaidAccess(db,{...student2,disabled:1},NOW+12),403);
 await mutateTimedAccess(db,admin,{action:'revoke',id:a.id,confirmed:true},NOW+20);await reject(requirePaidAccess(db,student,NOW+21),402);
 await subscribe();const b=unlockRequest();await mutateTimedAccess(db,admin,b,NOW+30);await mutateTimedAccess(db,admin,{action:'revoke',id:b.id,confirmed:true},NOW+40);
 await requirePaidAccess(db,student,NOW+41);assert.equal((await readTimedAccess(db,admin,NOW+42)).windows.length,2);
});
test('Timed learning waives subject charges only within the learner class and expires without restarting orientation',async()=>{
 await admit();const a=unlockRequest();await mutateTimedAccess(db,admin,a,NOW+10);
 const pack=await requireSubjectPass(db,student,'mathematics','questions',NOW+11);assert.equal(pack.expiresAt,NOW+10+12*3600000);
 assert.equal(await db.prepare('SELECT student_id FROM learner_orientation WHERE student_id=?').bind(student.id).first(),null);
 await reject(requireSubjectPass(db,student,'mathematics','questions',NOW+10+12*3600000),402);
});


test('Conference passes require full registration approval and never create or approve admissions',async()=>{
 const code=await conferencePass('REGISTER-FIRST');
 await reject(claimConference(db,student,code,teacher.id,'Grade 9',NOW),403);
 assert.equal(await db.prepare('SELECT student_id FROM admissions WHERE student_id=?').bind(student.id).first(),null);
 await mutateEngagement(db,student,{action:'requestAdmission',fullName:'Registered Learner',teacherId:teacher.id,phone:'0712345678',level:'Grade 9',goals:'Learn science'},NOW+1);
 await reject(claimConference(db,student,code,teacher.id,'Grade 9',NOW+2),403);
 assert.equal((await admissionState(db,student)).admission.status,'pending');
 assert.equal((await db.prepare('SELECT student_id FROM conference_passes WHERE code_hash=?').bind(await conferenceHash(code)).first()).student_id,null);
 await mutateEngagement(db,admin,{action:'reviewAdmission',studentId:student.id,status:'approved',note:'Registration checked'},NOW+3);
 await claimConference(db,student,code,other.id,'Grade 7',NOW+4);
 const saved=(await admissionState(db,student)).admission;assert.equal(saved.level,'Grade 9');assert.equal(saved.teacher_id,teacher.id);assert.equal(saved.note,'Registration checked');
 await mutateEngagement(db,admin,{action:'reviewAdmission',studentId:student.id,status:'rejected',note:'Review registration'},NOW+5);
 await reject(claimConference(db,student,code,teacher.id,'Grade 9',NOW+6),403);
});
test('Legacy conference-only accounts must complete registration before learning or timed access',async()=>{
 await db.prepare("INSERT INTO admissions(student_id,teacher_id,phone,level,goals,status,note,requested_at,reviewed_at) VALUES(?,?,'','Grade 9','Conference system testing','approved','Conference pass admission',?,?)").bind(student.id,teacher.id,NOW,NOW).run();
 assert.equal((await admissionState(db,student)).registrationIncomplete,true);
 await reject(requirePaidAccess(db,student,NOW),403);await reject(mutateTimedAccess(db,admin,unlockRequest(),NOW),409);
 await reject(mutateEngagement(db,admin,{action:'reviewAdmission',studentId:student.id,status:'approved',note:'Skip registration'},NOW+1),409);
 await mutateEngagement(db,student,{action:'requestAdmission',fullName:'Registered Learner',teacherId:teacher.id,phone:'0712345678',level:'Grade 9',goals:'Learn with my teacher'},NOW+2);
 assert.equal((await admissionState(db,student)).admission.status,'pending');assert.equal((await admissionState(db,student)).registrationIncomplete,false);
 await mutateEngagement(db,admin,{action:'reviewAdmission',studentId:student.id,status:'approved',note:'Complete profile checked'},NOW+3);
 await mutateTimedAccess(db,admin,unlockRequest(),NOW+4);await requirePaidAccess(db,student,NOW+5);
});


let schoolCode=ts.transpileModule(fs.readFileSync('app/school/service.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
for(const [a,b] of [["'../service'","'./service-test.mjs'"],["'../hub/service'","'./hub-test.mjs'"],["'../classroom/access'","'./class-access-test.mjs'"],["'../classroom/enrollment'","'./enrollment-test.mjs'"]])schoolCode=schoolCode.replaceAll(a,b);
fs.writeFileSync('.sites-runtime/school-test.mjs',schoolCode);
const {readSchoolClassroom,markSchoolAttendance}=await import('../.sites-runtime/school-test.mjs');
test('School portal is restricted to approved staff and isolates teaching classes',async()=>{
 const id=await teachingClass(),otherId=await teachingClass(other);
 await reject(readSchoolClassroom(db,student),403);await reject(readSchoolClassroom(db,{...student,role:'admin'}),403);
 assert.equal((await readSchoolClassroom(db,teacher)).classes.length,1);
 await reject(readSchoolClassroom(db,teacher,otherId),403);assert.equal((await readSchoolClassroom(db,admin)).classes.length,2);
 await reject(markSchoolAttendance(db,other,{classId:id,students:[student.id],confirmed:true},NOW),403);
});
test('Classroom attendance records real approved eligible students without creating online presence or payments',async()=>{
 await admit();await subscribe();const id=await teachingClass();const roster=await readSchoolClassroom(db,teacher,id,0,'',NOW+10);
 assert.equal(roster.roster[0].eligible,true);
 const result=await markSchoolAttendance(db,teacher,{classId:id,students:[student.id,student.id],confirmed:true},NOW+11);
 assert.equal(result.marked,1);assert.equal(result.requested,1);assert.equal((await db.prepare('SELECT status FROM class_rolls WHERE class_id=? AND student_id=?').bind(id,student.id).first()).status,'present');
 assert.equal(await db.prepare('SELECT student_id FROM learning_presence WHERE student_id=?').bind(student.id).first(),null);
 assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM class_attendance').first()).n,0);
 await reject(markSchoolAttendance(db,teacher,{classId:id,students:[student.id],confirmed:false},NOW+12),400);
 await markSchoolAttendance(db,teacher,{classId:id,students:[student.id],confirmed:true},NOW+13);
 assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM class_rolls').first()).n,1);
});
test('School attendance rejects expired, exempt, other-class and unregistered learners before writing',async()=>{
 await admit();const id=await teachingClass();await readSchoolClassroom(db,teacher,id,0,'',NOW+10);
 await reject(markSchoolAttendance(db,teacher,{classId:id,students:[student.id],confirmed:true},NOW+11),403);
 await subscribe();await db.prepare("INSERT INTO learner_subjects(id,student_id,class_level,subject,status,updated_by,updated_at) VALUES(?,?,'grade-9','mathematics','exempt',?,?)").bind(crypto.randomUUID(),student.id,teacher.id,NOW).run();
 await reject(markSchoolAttendance(db,teacher,{classId:id,students:[student.id],confirmed:true},NOW+12),403);
 await db.prepare('DELETE FROM learner_subjects WHERE student_id=?').bind(student.id).run();
 await reject(markSchoolAttendance(db,teacher,{classId:id,students:[student.id,student2.id],confirmed:true},NOW+13),403);
 assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM class_rolls').first()).n,0);
 await db.prepare("UPDATE admissions SET level='Grade 8' WHERE student_id=?").bind(student.id).run();
 await reject(markSchoolAttendance(db,teacher,{classId:id,students:[student.id],confirmed:true},NOW+14),403);
});
