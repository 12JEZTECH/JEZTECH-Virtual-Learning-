import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
fs.mkdirSync('.sites-runtime',{recursive:true});
fs.writeFileSync('.sites-runtime/curriculum-import-test.mjs',ts.transpileModule(fs.readFileSync('app/curriculum/import.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
const {parseTopics}=await import('../.sites-runtime/curriculum-import-test.mjs');
test('CSV imports preserve quoted commas, newlines and escaped quotes',()=>{
 assert.deepEqual(parseTopics('\uFEFFtopic,notes\r\n"Data, graphs","Explain \"\"units\"\"\nand scales"\r\nAlgebra,\r\n','csv'),[{title:'Data, graphs',notes:'Explain "units"\nand scales'},{title:'Algebra',notes:''}]);
});
test('plain outlines and malformed/oversized imports have clear validation',()=>{
 assert.deepEqual(parseTopics('Numbers\r\n\r\nAlgebra','txt'),[{title:'Numbers',notes:''},{title:'Algebra',notes:''}]);
 assert.throws(()=>parseTopics('title,notes\nA,B','csv'),/topic header/);
 assert.throws(()=>parseTopics('topic,notes\n"Unclosed','csv'),/closing quote/);
 assert.throws(()=>parseTopics('x'.repeat(120001),'txt'),/120 KB/);
 assert.throws(()=>parseTopics('a\n'.repeat(101),'txt'),/100 topics/);
});
test('official design catalogue has one source per subject and grade and flags known mismatch',()=>{
 const docs=JSON.parse(fs.readFileSync('app/curriculum/documents.json','utf8'));
 assert.equal(docs.length,165);assert.equal(new Set(docs.map(d=>d.level+':'+d.subject)).size,165);
 for(const d of docs){assert.match(d.preview,/^https:\/\/drive\.google\.com\/file\/d\/[\w-]+\/preview$/);assert.equal(new URL(d.source).hostname,'kicd.ac.ke');}
 for(const grade of [7,8,9,10,11,12])assert.equal(docs.filter(d=>d.level==='grade-'+grade).length,grade<10?16:39);
 assert.equal(docs.find(d=>d.level==='grade-10'&&d.subject==='marine-fisheries').gradeWarning,true);
});
test('practical videos are verified MP4 resources hosted on the official source',()=>{
 const videos=JSON.parse(fs.readFileSync('app/curriculum/videos.json','utf8'));assert.equal(videos.length,6);
 for(const v of videos){assert.equal(v.verifiedMedia,true);assert.equal(new URL(v.url).hostname,'lms.kec.ac.ke');assert.match(v.url,/\.mp4$/);assert.equal(new URL(v.source).hostname,'lms.kec.ac.ke');}
});

test('reference outlines are isolated by class and subject and carry provenance',()=>{
 const courses=JSON.parse(fs.readFileSync('app/curriculum/reference-topics.json','utf8'));
 const catalogue=fs.readFileSync('app/teaching/catalog.ts','utf8');
 const subjects=JSON.parse(catalogue.match(/export const teachingSubjects=(.*?);/)[1]);
 const allowed=new Set(subjects.map(s=>s.id));const keys=new Set(),ids=new Set();
 for(const c of courses){
  const key=c.level+':'+c.subject;assert.ok(!keys.has(key));keys.add(key);
  assert.ok(allowed.has(c.subject));assert.ok(c.topics.length>0);assert.match(c.review,/review required/i);
  assert.equal(new URL(c.source).protocol,'https:');assert.ok(c.sourceTitle);assert.match(c.checked,/^\d{4}-\d{2}-\d{2}$/);
  if(c.level==='grade-12')assert.equal(c.olderEdition,true);
  for(const t of c.topics){assert.ok(!ids.has(t.id));ids.add(t.id);assert.ok(t.title.trim());assert.ok(t.title.length<=150);assert.doesNotMatch(t.title,/contentReference|<script|By the end|Specific Learning Outcomes|^Sub-Strands$/i);}
 }
 for(const n of [7,8,9,10,11])assert.equal(courses.filter(c=>c.level==='grade-'+n).length,n<10?16:39);
 assert.ok(courses.some(c=>c.level==='form-3'&&c.subject==='physics'&&c.topics.some(t=>t.title==='Linear Motion')));
 assert.ok(courses.some(c=>c.level==='grade-7'&&c.subject==='mathematics'&&c.topics.some(t=>t.title==='Whole Numbers')));
 assert.ok(courses.every(c=>!('notes' in c)&&c.topics.every(t=>!('notes' in t))),'topic outlines must not masquerade as reviewed lesson notes');
});

test('topic suggestions use the selected class and preserve teacher outlines and published notes',()=>{
 const desk=fs.readFileSync('app/teaching/desk.tsx','utf8');const library=fs.readFileSync('app/curriculum/library.tsx','utf8');
 assert.ok(desk.includes('referenceTopics(level,subject)'));
 assert.ok(desk.includes('topicLibrary.filter(o=>o.class_level===level&&o.subject===subject)'));
 assert.ok(desk.includes('Load imported draft notes'));assert.ok(library.includes('Topic outline pending'));
 assert.ok(library.includes('c.missing.map(s=>s.label)'));assert.ok(library.includes('Older source edition'));
});

test('source index includes every registered resource with accurate provenance and safe links',async()=>{
 fs.writeFileSync('.sites-runtime/source-index-test.mjs',ts.transpileModule(fs.readFileSync('app/curriculum/source-index.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
 fs.writeFileSync('.sites-runtime/source-teaching-test.mjs',ts.transpileModule(fs.readFileSync('app/teaching/catalog.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
 const {buildSourceIndex}=await import('../.sites-runtime/source-index-test.mjs');const {teachingTopics}=await import('../.sites-runtime/source-teaching-test.mjs');
 const read=n=>JSON.parse(fs.readFileSync('app/curriculum/'+n+'.json','utf8'));const docs=read('documents'),courses=read('reference-topics'),notes=read('revision-notes'),videos=read('videos'),materials=read('lesson-materials');const sources=buildSourceIndex(docs,courses,notes,teachingTopics,videos,materials);
 assert.equal(sources.length,368);assert.equal(new Set(sources.map(s=>s.id)).size,sources.length);
 for(const [kind,count] of [['design',165],['outline',136],['revision',36],['starter',8],['video',6],['lesson',17]])assert.equal(sources.filter(s=>s.kind===kind).length,count);
 for(const s of sources){assert.ok(s.title);assert.ok(s.author);for(const url of [s.url,s.relatedUrl,s.mediaUrl].filter(Boolean))assert.equal(new URL(url).protocol,'https:');if(s.kind==='revision'||s.kind==='starter'){assert.equal(s.url,null);assert.match(s.author,/original/i)}if(s.kind==='outline')assert.doesNotMatch(s.author,/^Kenya Institute/);}
 assert.match(sources.find(s=>s.id==='design:grade-10:marine-fisheries').warning,/another grade/);
 for(const s of sources.filter(s=>s.kind==='revision'&&s.level==='grade-12'))assert.match(s.warning,/older/);
 assert.ok(sources.filter(s=>s.kind==='outline').every(s=>!s.title.includes('Payment Has Started')));
});

test('missing topic imports are explicitly tracked when official source owners disable downloads',()=>{const status=JSON.parse(fs.readFileSync('app/curriculum/import-status.json','utf8'));assert.equal(status.length,33);assert.equal(new Set(status.map(s=>s.level+':'+s.subject)).size,33);for(const s of status){assert.equal(s.status,'download-disabled-by-owner');assert.equal(s.level,'grade-12');assert.equal(new URL(s.source).hostname,'drive.google.com');}});

fs.writeFileSync('.sites-runtime/topic-catalog-test.mjs',ts.transpileModule(fs.readFileSync('app/teaching/catalog.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
const topicCourses=JSON.parse(fs.readFileSync('app/curriculum/reference-topics.json','utf8'));
fs.writeFileSync('.sites-runtime/topic-reference-test.mjs','const courses='+JSON.stringify(topicCourses)+';export function referenceTopics(level,subject){return courses.find(c=>c.level===level&&c.subject===subject)?.topics||[]}');
fs.writeFileSync('.sites-runtime/topic-options-test.mjs',ts.transpileModule(fs.readFileSync('app/teaching/topic-options.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("'./catalog'","'./topic-catalog-test.mjs'").replace("'../curriculum/reference'","'./topic-reference-test.mjs'"));
const {classTopicOptions}=await import('../.sites-runtime/topic-options-test.mjs');
test('class topic options automatically load the selected outline and exclude other class notes',()=>{
 const course=topicCourses.find(c=>c.level==='grade-9'&&c.subject==='mathematics');assert.ok(course.topics.length);
 const options=classTopicOptions(course.level,course.subject,[{class_level:course.level,subject:course.subject,topic:'Class teacher topic',status:'published'},{class_level:'grade-8',subject:course.subject,topic:'Wrong grade'},{class_level:course.level,subject:'english',topic:'Wrong subject'},{class_level:course.level,subject:course.subject,topic:'Archived',status:'archived'},{class_level:course.level,subject:course.subject,topic:course.topics[0].title}]);
 assert.ok(options.includes(course.topics[0].title));assert.ok(options.includes('Class teacher topic'));for(const text of ['Wrong grade','Wrong subject','Archived'])assert.equal(options.includes(text),false);assert.equal(options.length,new Set(options).size);
 assert.deepEqual(classTopicOptions('unknown','mathematics'),[]);assert.deepEqual(classTopicOptions('grade-7','physics'),[]);
});

test('Form Four exposes 8-4-4 subjects without borrowing Form Three reference outlines',async()=>{
 const {classLevels,subjectsForLevel}=await import('../.sites-runtime/topic-catalog-test.mjs');
 assert.equal(classLevels.find(c=>c.id==='form-4').curriculum,'844');assert.ok(subjectsForLevel('form-4').some(s=>s.id==='history-government'));assert.equal(subjectsForLevel('form-4').some(s=>s.id==='core-mathematics'),false);
 const options=classTopicOptions('form-4','mathematics',[{class_level:'form-3',subject:'mathematics',topic:'Form Three only'},{class_level:'form-4',subject:'mathematics',topic:'Teacher Form Four topic'}]);assert.ok(options.includes('Teacher Form Four topic'));assert.equal(options.includes('Form Three only'),false);
});


test('primary tutorial shelf has separate watch, listen and interactive routes for every grade',()=>{
 const rows=JSON.parse(fs.readFileSync('app/primary/resources.json','utf8'));
 assert.equal(rows.length,18);assert.equal(new Set(rows.map(r=>r.id)).size,18);
 for(let grade=1;grade<=6;grade++){
  assert.deepEqual(rows.filter(r=>r.grade===grade).map(r=>r.kind).sort(),['audio','interactive','video']);
 }
 for(const r of rows){assert.equal(new URL(r.url).hostname,'lms.kec.ac.ke');assert.equal(new URL(r.url).protocol,'https:');}
});
