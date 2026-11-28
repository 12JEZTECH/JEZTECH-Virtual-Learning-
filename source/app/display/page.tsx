import {requireChatGPTUser} from '../chatgpt-auth';
import Display from '../hub/display';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{class?:string}>}){const p=await searchParams;await requireChatGPTUser('/display'+(p.class?'?class='+encodeURIComponent(p.class):''));return <Display classId={p.class||''}/>}
