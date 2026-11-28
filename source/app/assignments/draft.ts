export type DraftQuestion={text:string;choices:string[];correct:number;explanation:string};
// Extractive cloze practice, using only supplied notes. Teachers review before publication.
export function draftFromNotes(material:string):DraftQuestion[]{
 const sentences=material.replace(/<[^>]*>/g,' ').replace(/[#*_`]/g,'').split(/(?<=[.!?])\s+|\n+/).map(s=>s.trim()).filter(s=>s.length>=45&&s.length<=350&&s.split(/\s+/).length>=8&&!/^(learning goal|worked example|practice|teacher activity|check|safety|find\b|calculate\b|explain\b|compare\b|draw\b|write\b|identify\b|plan\b|prepare\b|interpret\b|evaluate\b|state\b|make\b|listen\b|read\b|use\b|do not\b)/i.test(s));
 const stop=new Set('about after again also another because before being between could every first from have into lesson other should their there these they this those through topic under using very were what when where which while with would your'.split(' '));
 const candidates=sentences.map(sentence=>{const words=[...sentence.matchAll(/\b[\p{L}][\p{L}-]{3,}\b/gu)].filter(w=>!stop.has(w[0].toLowerCase()));const term=candidatesLast(words);return term?{sentence,word:term[0],at:term.index!}:null}).filter((x):x is {sentence:string;word:string;at:number}=>!!x);
 const unique=[...new Map(candidates.map(c=>[c.word.toLowerCase(),c])).values()];if(unique.length<4)throw new Error('Add at least four clear explanatory sentences with distinct terms, or write the questions manually. Topic headings alone are not enough.');
 return unique.slice(0,5).map((c,i)=>{const distractors=unique.filter(t=>t.word.toLowerCase()!==c.word.toLowerCase()).slice(0,3).map(t=>t.word);const correct=i%4;const choices=[...distractors];choices.splice(correct,0,c.word);return {text:'Complete the statement from your lesson notes: '+c.sentence.slice(0,c.at)+'____'+c.sentence.slice(c.at+c.word.length),choices,correct,explanation:c.sentence}});
}
function candidatesLast<T>(a:T[]){return a[a.length-1]}
