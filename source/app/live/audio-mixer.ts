// Teacher-side mix-minus: each learner hears the teacher and allowed classmates,
// never a loopback of their own microphone. No audio leaves this class's peers.
export class ClassroomMixer{
 private context:AudioContext;
 private inputs=new Map<string,{source:MediaStreamAudioSourceNode;gain:GainNode}>();
 private outputs=new Map<string,MediaStreamAudioDestinationNode>();
 constructor(){this.context=new AudioContext();void this.context.resume().catch(()=>{})}
 async resume(){await this.context.resume();if(this.context.state!=='running')throw new Error('Teacher audio mixer is paused. Tap Enable class sound again.')}
 input(id:string,track:MediaStreamTrack,enabled:boolean){this.removeInput(id);const source=this.context.createMediaStreamSource(new MediaStream([track])),gain=this.context.createGain();gain.gain.value=enabled?1:0;source.connect(gain);this.inputs.set(id,{source,gain});for(const [target,output] of this.outputs)if(target!==id)gain.connect(output)}
 allow(id:string,enabled:boolean){const input=this.inputs.get(id);if(input)input.gain.gain.value=enabled?1:0}
 output(id:string){let output=this.outputs.get(id);if(!output){output=this.context.createMediaStreamDestination();this.outputs.set(id,output);for(const [source,input] of this.inputs)if(source!==id)input.gain.connect(output)}return output.stream.getAudioTracks()[0]}
 removeInput(id:string){const i=this.inputs.get(id);if(i){i.source.disconnect();i.gain.disconnect();this.inputs.delete(id)}}
 remove(id:string){this.removeInput(id);const output=this.outputs.get(id);if(output){for(const input of this.inputs.values())try{input.gain.disconnect(output)}catch{}output.stream.getTracks().forEach(t=>t.stop());this.outputs.delete(id)}}
 close(){for(const id of this.inputs.keys())this.removeInput(id);for(const output of this.outputs.values())output.stream.getTracks().forEach(t=>t.stop());this.outputs.clear();void this.context.close().catch(()=>{})}
}
