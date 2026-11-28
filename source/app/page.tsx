import {env} from 'cloudflare:workers';
import {redirect} from 'next/navigation';
import {getChatGPTUser} from './chatgpt-auth';
import {loadAccount} from './portals/account-state';
import AccountNotice from './portals/account-notice';
import {portalPath} from './portals/service';
export const dynamic='force-dynamic';
export default async function Page(){const identity=await getChatGPTUser();if(!identity)redirect('/login');if(!env.DB)return <AccountNotice message="The learning database is temporarily unavailable. Please retry shortly."/>;const account=await loadAccount(env.DB,identity,'jezreelch@gmail.com');if(!account.user)return <AccountNotice message={account.problem.message} restricted={account.problem.kind==='restricted'}/>;redirect(portalPath(account.user.role))}
