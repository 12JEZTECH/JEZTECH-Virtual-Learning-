import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
fs.mkdirSync('.sites-runtime',{recursive:true});
for(const file of ['playback','audio-mixer'])fs.writeFileSync('.sites-runtime/'+file+'-test.mjs',ts.transpileModule(fs.readFileSync('app/live/'+file+'.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
const {receiveTrack,enablePlayback}=await import('../.sites-runtime/playback-test.mjs');
const {ClassroomMixer}=await import('../.sites-runtime/audio-mixer-test.mjs');
test('streamless remote tracks retain audio when video arrives later and deduplicate track events',()=>{
 const tracks=[],stream={getTracks:()=>tracks,addTrack:t=>tracks.push(t)},audio={id:'audio',kind:'audio'},video={id:'video',kind:'video'};
 receiveTrack(stream,audio);receiveTrack(stream,video);receiveTrack(stream,audio);assert.deepEqual(tracks,[audio,video]);
 const reverse=[],second={getTracks:()=>reverse,addTrack:t=>reverse.push(t)};receiveTrack(second,video);receiveTrack(second,audio);assert.deepEqual(reverse,[video,audio]);
});
test('sound unlock starts all remote audio and the teacher mixer before awaiting browser promises',async()=>{
 const calls=[];let finish;const mixer=new Promise(r=>finish=r);const elements=[1,2].map(id=>({muted:true,volume:0,play:()=>{calls.push(id);return Promise.resolve()}}));
 const work=enablePlayback(elements,()=>{calls.push('resume');return mixer});assert.deepEqual(calls,['resume',1,2]);assert.ok(elements.every(e=>!e.muted&&e.volume===1));finish();await work;
});
test('a rejected autoplay attempt is reported while other audio still starts',async()=>{
 let played=false;await assert.rejects(enablePlayback([{play:()=>Promise.reject(Error('NotAllowedError'))},{play:()=>{played=true;return Promise.resolve()}}]),/Sound is blocked/);assert.ok(played);
});
class Node {constructor(){this.links=new Set();this.gain={value:1}}connect(n){this.links.add(n)}disconnect(n){if(n)this.links.delete(n);else this.links.clear()}}
class Context {static instance;constructor(){Context.instance=this;this.state='suspended';this.sources=[];this.gains=[]}resume(){this.state='running';return Promise.resolve()}close(){this.state='closed';return Promise.resolve()}createMediaStreamSource(){const n=new Node();this.sources.push(n);return n}createGain(){const n=new Node();this.gains.push(n);return n}createMediaStreamDestination(){const n=new Node();n.stream={getAudioTracks:()=>[{stop(){}}],getTracks:()=>[{stop(){}}]};return n}}
globalThis.AudioContext=Context;globalThis.MediaStream=class {constructor(tracks){this.tracks=tracks}};
test('teacher mixer resumes and sends teacher and approved peers without self loopback',async()=>{
 const mixer=new ClassroomMixer(),ctx=Context.instance;ctx.state='suspended';await mixer.resume();assert.equal(ctx.state,'running');
 mixer.input('teacher',{},true);mixer.input('student',{},false);mixer.output('student');mixer.output('other');
 assert.equal(ctx.gains[0].links.size,2);assert.equal(ctx.gains[1].links.size,1);assert.equal(ctx.gains[1].gain.value,0);
 mixer.allow('student',true);assert.equal(ctx.gains[1].gain.value,1);mixer.allow('student',false);assert.equal(ctx.gains[1].gain.value,0);mixer.close();assert.equal(ctx.state,'closed');
});
test('teacher mixer reports a browser context that cannot resume',async()=>{
 const mixer=new ClassroomMixer(),ctx=Context.instance;ctx.state='suspended';ctx.resume=async()=>{};await assert.rejects(mixer.resume(),/audio mixer is paused/);mixer.close();
});
