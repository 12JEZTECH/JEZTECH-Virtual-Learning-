export type ImportedTopic={title:string;notes:string};
/** RFC-style quoted CSV, including embedded newlines; plain text uses one topic per line. */
export function parseTopics(text:string,format:'csv'|'txt'):ImportedTopic[]{
 if(text.length>120000)throw new Error('Keep each import below 120 KB. Split larger files.');
 if(format==='txt')return validate(text.replace(/^\uFEFF/,'').split(/\r?\n/).map(title=>({title:title.trim(),notes:''})).filter(t=>t.title));
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;const s=text.replace(/^\uFEFF/,'');
 for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){if(quoted&&s[i+1]==='"'){cell+='"';i++}else if(!cell||quoted)quoted=!quoted;else throw new Error('Invalid quote in CSV field.')}else if(c===','&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&s[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell=''}else cell+=c;}
 if(quoted)throw new Error('An opening CSV quote has no closing quote.');row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
 const headers=rows.shift()?.map(v=>v.trim().toLowerCase())||[];const title=headers.indexOf('topic'),notes=headers.indexOf('notes');if(title<0)throw new Error('CSV needs a topic header and an optional notes header.');
 return validate(rows.map(r=>({title:(r[title]||'').trim(),notes:notes<0?'':(r[notes]||'').trim()})));
}
function validate(rows:ImportedTopic[]){if(!rows.length||rows.length>100)throw new Error('Import between 1 and 100 topics at a time.');for(const r of rows)if(!r.title||r.title.length>160||r.notes.length>30000)throw new Error('Every topic needs a title of 1–160 characters; notes must be at most 30,000 characters.');return rows;}
