import RegistrationEntry from '../registration/entry';
import {getChatGPTUser} from '../chatgpt-auth';
import Admission from '../admission/request';
export const dynamic='force-dynamic';
export default async function Register(){if(!await getChatGPTUser())return <RegistrationEntry returnTo="/register"/>;return <Admission registration/>}
