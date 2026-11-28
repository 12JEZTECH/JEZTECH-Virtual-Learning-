import {requireChatGPTUser} from '../chatgpt-auth';
import {env} from 'cloudflare:workers';
import {loadAccount} from '../portals/account-state';
import AccountNotice from '../portals/account-notice';
import SchoolWorkspace from './panel';
export const dynamic='force-dynamic';
export default async function Page(){const identity=await requireChatGPTUser('/schools');if(!env.DB)return <AccountNotice message="School storage is temporarily unavailable."/>;const account=await loadAccount(env.DB,identity,'jezreelch@gmail.com');if(!account.user)return <AccountNotice message={account.problem.message} restricted/>;return <SchoolWorkspace/>}
