import {z} from 'zod';
import {AppError,type User} from '../service';
const inputs=z.discriminatedUnion('experiment',[
 z.object({experiment:z.literal('circuit'),voltage:z.number().min(0).max(12),resistance:z.number().min(10).max(1000),closed:z.boolean()}),
 z.object({experiment:z.literal('titration'),acidConcentration:z.number().min(.01).max(1),acidVolume:z.number().min(5).max(50),baseConcentration:z.number().min(.01).max(1),baseVolume:z.number().min(0).max(100)}),
 z.object({experiment:z.literal('microscope'),objective:z.union([z.literal(4),z.literal(10),z.literal(40)]),focus:z.number().min(0).max(100),specimen:z.enum(['plant','animal'])}),
]);
export const VirtualAction=z.object({action:z.literal('saveVirtualRun'),inputs,notes:z.string().trim().min(3).max(3000)});
export type VirtualInputs=z.infer<typeof inputs>;
export {calculateVirtual} from './model';
import {calculateVirtual} from './model';
export async function mutateVirtual(db:D1Database,u:User,a:z.infer<typeof VirtualAction>,now=Date.now()){
 if(u.role!=='student')throw new AppError(403,'Only learners save practical journals');const id=crypto.randomUUID();const results=calculateVirtual(a.inputs);await db.prepare('INSERT INTO virtual_runs(id,student_id,experiment,inputs,results,notes,created_at) VALUES(?,?,?,?,?,?,?)').bind(id,u.id,a.inputs.experiment,JSON.stringify(a.inputs),JSON.stringify(results),a.notes,now).run();return {id,results};
}
export async function readVirtual(db:D1Database,u:User){
 const where=u.role==='student'?'v.student_id=?':u.role==='teacher'?'EXISTS(SELECT 1 FROM admissions a WHERE a.student_id=v.student_id AND a.teacher_id=?)':'1=1';const rows=(await db.prepare(`SELECT v.*,us.name AS student_name FROM virtual_runs v JOIN users us ON us.id=v.student_id WHERE ${where} ORDER BY v.created_at DESC LIMIT 100`).bind(...(u.role==='admin'?[]:[u.id])).all<any>()).results;return {virtualRuns:rows.map(r=>({...r,inputs:JSON.parse(r.inputs),results:JSON.parse(r.results)}))};
}
