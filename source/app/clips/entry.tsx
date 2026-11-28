import {env} from 'cloudflare:workers';
import {redirect} from 'next/navigation';
import {requireChatGPTUser} from '../chatgpt-auth';
import {loadAccount} from '../portals/account-state';
import AccountNotice from '../portals/account-notice';
import {clipDashboard,clipLinkPath} from './link';
export default async function ClipEntry({id}:{id?:string}){
 const identity=await requireChatGPTUser(id?clipLinkPath(id):'/clips');if(!env.DB)return <AccountNotice message="The learning database is temporarily unavailable. Please retry shortly."/>;
 const account=await loadAccount(env.DB,identity,'jezreelch@gmail.com');if(!account.user)return <AccountNotice message={account.problem.message} restricted={account.problem.kind==='restricted'}/>;
 redirect(clipDashboard(account.user.role,id));
}
