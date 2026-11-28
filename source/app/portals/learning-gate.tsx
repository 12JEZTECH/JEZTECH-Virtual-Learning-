import type {ReactNode} from 'react';
import {env} from 'cloudflare:workers';
import {redirect} from 'next/navigation';
import {requireChatGPTUser} from '../chatgpt-auth';
import {loadAccount} from './account-state';
import AccountNotice from './account-notice';
import {AppError,requireStudentRegistration} from '../service';
import {requirePaidAccess} from '../classroom/access';
export default async function LearningGate({children,path,registrationOnly=false}:{children:ReactNode;path:string;registrationOnly?:boolean}){
 const identity=await requireChatGPTUser(path);if(!env.DB)return <AccountNotice message="The learning database is temporarily unavailable. Please retry shortly."/>;
 const account=await loadAccount(env.DB,identity,'jezreelch@gmail.com');if(!account.user)return <AccountNotice message={account.problem.message} restricted={account.problem.kind==='restricted'}/>;
 let registered;try{registered=await requireStudentRegistration(env.DB,account.user)}catch(e){if(e instanceof AppError&&e.status===403&&account.user.role==='student')redirect('/register');throw e}
 if(registered.user.role==='student'&&!registrationOnly)try{await requirePaidAccess(env.DB,registered.user)}catch(e){if(e instanceof AppError&&e.status===402)redirect('/activate');throw e}
 return children;
}
