import RegistrationEntry from '../../registration/entry';
import {getChatGPTUser} from '../../chatgpt-auth';
import TeacherSignup from './panel';
export const dynamic='force-dynamic';
export default async function Page(){if(!await getChatGPTUser())return <RegistrationEntry returnTo="/register/teacher" teacher/>;return <TeacherSignup/>}
