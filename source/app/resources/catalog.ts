import primary from '../primary/resources.json';
import materials from '../curriculum/lesson-materials.json';
import clips from '../curriculum/videos.json';
import documents from '../curriculum/documents.json';
import {curriculumSource} from '../teaching/catalog';
export type Resource={id:string;title:string;url:string;kind:'design'|'video'|'audio'|'accessible'|'library';level:string|null;subject:string|null;guidance?:string};
const cloud='https://lms.kec.ac.ke/course/index.php?categoryid=';
export const officialResources:Resource[]=[
 ...primary.map(r=>({id:r.id,title:'Grade '+r.grade+' · '+r.title,url:r.url,kind:(r.kind==='interactive'?'library':r.kind) as Resource['kind'],level:'grade-'+r.grade,subject:null,guidance:'Official KICD / Kenya Education Cloud category. Choose a subject on the publisher page. Checked '+r.checked+'. Publisher access rules apply.'})),
 ...materials.map(m=>({...m,kind:m.kind as Resource['kind']})),
 ...clips.map(v=>({id:'clip-'+v.id,title:v.title,url:v.url,kind:'video' as const,level:null,subject:v.subject,guidance:v.guidance})),
 {id:'kec',title:'Kenya Education Cloud · digital lessons',url:'https://lms.kec.ac.ke/',kind:'library',level:null,subject:null},
 {id:'educhannel',title:'KICD Educhannel teaching clips',url:cloud+'232',kind:'video',level:null,subject:null},
 {id:'accessible',title:'KICD accessible digital textbooks',url:cloud+'344',kind:'accessible',level:null,subject:null},
 {id:'oer',title:'Kenya Education Cloud · open resources',url:cloud+'304',kind:'library',level:null,subject:null},
 ...[['grade-7','102'],['grade-8','107'],['grade-9','653'],['form-3','115']].map(([level,id])=>({id:'cloud-'+level,title:level.replace('-',' ')+' · TV, radio and interactive lessons',url:cloud+id,kind:'library' as const,level,subject:null})),
 ...['grade-7','grade-8','grade-9','grade-10','grade-11','grade-12'].map(level=>({id:'index-'+level,title:level.replace('-',' ')+' · official curriculum designs',url:curriculumSource(level),kind:'design' as const,level,subject:null})),
 ...documents.filter(d=>!d.gradeWarning).map(d=>({id:'design-'+d.level+'-'+d.subject,title:d.label+' · '+d.level.replace('-',' ')+' design',url:d.preview,kind:'design' as const,level:d.level,subject:d.subject})),
];
export function resourceFor(id:string,level:string,subject:string){const r=officialResources.find(r=>r.id===id);return r&&(!r.level||r.level===level)&&(!r.subject||r.subject===subject)?r:null;}
