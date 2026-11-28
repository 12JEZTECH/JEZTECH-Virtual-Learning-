import SchoolGate from '../gate';
import LiveClassroom from '../../live/page-panel';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <SchoolGate classId={id}><LiveClassroom classId={id} schoolMode/></SchoolGate>}
