'use client';
import {classTopicOptions} from './topic-options';
import {useState} from 'react';
import TopicPicker from './topic-picker';
import {classLevels,subjectsForLevel} from './catalog';
const topicsFor=classTopicOptions;
export default function ClassFields(){
 const [level,setLevel]=useState('grade-7'),[subject,setSubject]=useState('general'),[topic,setTopic]=useState(()=>topicsFor('grade-7','general')[0]||'');const school=classLevels.find(c=>c.id===level)!;
 function select(nextLevel:string,nextSubject:string){setLevel(nextLevel);setSubject(nextSubject);setTopic(topicsFor(nextLevel,nextSubject)[0]||'')}
 return <div className="form-grid"><label>Class / level<select name="classLevel" value={level} onChange={e=>{const next=e.target.value;select(next,subjectsForLevel(next).some(s=>s.id===subject)?subject:subjectsForLevel(next)[0].id)}}>{classLevels.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label><label>Subject<select name="subject" value={subject} onChange={e=>select(level,e.target.value)}>{subjectsForLevel(level).map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label><TopicPicker key={level+':'+subject} topics={topicsFor(level,subject)} name="topic" value={topic} onChange={setTopic} label="Choose or write topic"/><input type="hidden" name="curriculum" value={school.curriculum}/></div>
}
