#!/usr/bin/env node
// Read-only, authenticated HTTP acceptance runner. Credentials enter on stdin,
// remain in memory and are never included in logs or saved reports.
import {readFileSync} from 'node:fs';
const origin='https://jeztech-learning.snugrhino8.chatgpt.site';
let input;try{input=JSON.parse(readFileSync(0,'utf8'))}catch{throw Error('Supply JSON on stdin with cases [{classId,cookie}], concurrency and rounds. Do not put credentials in shell arguments.')}
const cases=input.cases;if(!Array.isArray(cases)||cases.length<1||cases.length>5000||cases.some(c=>!c||!/^[-a-f0-9]{36}$/i.test(c.classId)||typeof c.cookie!=='string'||!c.cookie||/[\r\n]/.test(c.cookie)))throw Error('Provide 1–5000 authorised learner test sessions and class UUIDs.');
const concurrency=Math.max(1,Math.min(600,Math.floor(input.concurrency||30))),rounds=Math.max(1,Math.min(100,Math.floor(input.rounds||1))),latencies=[],statuses={};let index=0;
const started=performance.now(),total=cases.length*rounds;
async function worker(){while(index<total){const item=cases[index++%cases.length],begin=performance.now();let code='network_error';try{const r=await fetch(origin+'/api/live-classroom?class='+item.classId,{headers:{Cookie:item.cookie},redirect:'manual',signal:AbortSignal.timeout(30000)});code=String(r.status);await r.body?.cancel()}catch{}statuses[code]=(statuses[code]||0)+1;latencies.push(performance.now()-begin)}}
await Promise.all(Array.from({length:Math.min(concurrency,total)},worker));latencies.sort((a,b)=>a-b);const percentile=p=>Math.round(latencies[Math.min(latencies.length-1,Math.floor(latencies.length*p))]);
process.stdout.write(JSON.stringify({test:'Read-only real authenticated HTTP classroom snapshots; excludes live media bandwidth',cases:cases.length,requests:total,concurrency,statuses,p50Ms:percentile(.5),p95Ms:percentile(.95),p99Ms:percentile(.99),elapsedMs:Math.round(performance.now()-started)},null,2)+'\n');
if(Object.keys(statuses).some(c=>c!=='200'))process.exitCode=1;
