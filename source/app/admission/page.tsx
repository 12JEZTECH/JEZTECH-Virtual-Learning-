import RegistrationEntry from '../registration/entry';
import {getChatGPTUser} from '../chatgpt-auth';
import Admission from './request';
export const dynamic='force-dynamic';
export default async function Page(){if(!await getChatGPTUser())return <RegistrationEntry returnTo="/admission"/>;return <Admission/>}
