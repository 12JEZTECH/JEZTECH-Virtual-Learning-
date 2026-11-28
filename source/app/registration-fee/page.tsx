import {requireChatGPTUser} from '../chatgpt-auth';
import RegistrationFees from './panel';
export const dynamic='force-dynamic';
export default async function Page(){await requireChatGPTUser('/registration-fee');return <main className="registration-fee-page"><a href="/login">← Login / dashboard</a><RegistrationFees/></main>}
