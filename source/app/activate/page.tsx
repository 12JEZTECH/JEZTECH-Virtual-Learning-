import {requireChatGPTUser} from '../chatgpt-auth';
import Activation from './panel';
export const dynamic='force-dynamic';
export default async function Page(){await requireChatGPTUser('/activate');return <Activation/>}
