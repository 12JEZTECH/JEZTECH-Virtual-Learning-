import type {ReactNode} from 'react';
import {env} from 'cloudflare:workers';
import {requireChatGPTUser} from '../chatgpt-auth';
import {loadAccount} from '../portals/account-state';
import AccountNotice from '../portals/account-notice';
import {schoolStaff} from './service';
import {teachingClassAccess} from '../hub/service';
import {AppError} from '../service';
export default async function SchoolGate({children,classId}:{children:ReactNode;classId?:string}){const identity=await requireChatGPTUser('/school'+(classId?'/'+encodeURIComponent(classId):''));if(!env.DB)return <AccountNotice message="Classroom storage is temporarily unavailable."/>;const account=await loadAccount(env.DB,identity,'jezreelch@gmail.com');if(!account.user)return <AccountNotice message={account.problem.message} restricted/>;try{const u=await schoolStaff(env.DB,account.user);if(classId)await teachingClassAccess(env.DB,u,classId)}catch(e){if(e instanceof AppError)return <AccountNotice message={e.message} restricted/>;throw e}return children;}
