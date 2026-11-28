import {AppError} from '../service';
const PART=5*1024*1024,MAX=50*1024*1024;
export async function storeClip(bucket:R2Bucket,key:string,body:ReadableStream<Uint8Array>,contentType:string){
 const upload=await bucket.createMultipartUpload(key,{httpMetadata:{contentType}});const reader=body.getReader();const parts:R2UploadedPart[]=[];let chunks:Uint8Array[]=[],buffered=0,total=0;
 async function flush(){if(!buffered)return;const buffer=new Uint8Array(buffered);let at=0;for(const chunk of chunks){buffer.set(chunk,at);at+=chunk.byteLength}parts.push(await upload.uploadPart(parts.length+1,buffer));chunks=[];buffered=0}
 try{while(true){const {value,done}=await reader.read();if(done)break;if(!value?.byteLength)continue;total+=value.byteLength;if(total>MAX)throw new AppError(413,'Video must be at most 50 MB');let offset=0;while(offset<value.byteLength){const length=Math.min(PART-buffered,value.byteLength-offset);chunks.push(value.subarray(offset,offset+length));buffered+=length;offset+=length;if(buffered===PART)await flush()}}if(!total)throw new AppError(400,'Video file is empty');await flush();await upload.complete(parts);return {size:total}}catch(e){try{await reader.cancel()}catch{}try{await upload.abort()}catch{}throw e}finally{reader.releaseLock()}
}
