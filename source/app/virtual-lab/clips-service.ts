import {z} from 'zod';
import {AppError,type User} from '../service';
export const ClipMetadata=z.object({title:z.string().trim().min(2).max(160),experiment:z.enum(['general','circuit','titration','microscope']).default('general'),explanation:z.string().trim().max(6000).default('')});
export const ClipAction=ClipMetadata.extend({action:z.literal('clipMetadata'),id:z.string().uuid()});
export async function updateClip(db:D1Database,u:User,a:z.infer<typeof ClipAction>){if(u.role==='student')throw new AppError(403,'Teacher access required');const clip=await db.prepare('SELECT teacher_id FROM learning_videos WHERE id=?').bind(a.id).first<{teacher_id:string}>();if(!clip)throw new AppError(404,'Clip not found');if(u.role!=='admin'&&clip.teacher_id!==u.id)throw new AppError(403,'This clip belongs to another teacher');await db.prepare('UPDATE learning_videos SET title=?,experiment=?,explanation=? WHERE id=?').bind(a.title,a.experiment,a.explanation,a.id).run();return {ok:true}}
