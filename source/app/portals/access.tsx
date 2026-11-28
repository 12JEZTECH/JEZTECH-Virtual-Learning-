import {loadAccount} from './account-state';
import AccountNotice from './account-notice';
import {env} from 'cloudflare:workers';
import {redirect} from 'next/navigation';
import {requireChatGPTUser} from '../chatgpt-auth';
import {authorizedUser} from '../service';
import {requirePaidAccess} from '../classroom/access';
import {AppError} from '../service';
import Workspace from '../workspace';
export default async function Portal({role}:{role:'admin'|'teacher'|'student'}){
 const identity=await requireChatGPTUser('/'+role);if(!env.DB)return <AccountNotice message="The learning database is temporarily unavailable. Please retry shortly."/>;const account=await loadAccount(env.DB,identity,'jezreelch@gmail.com');if(!account.user)return <AccountNotice message={account.problem.message} restricted={account.problem.kind==='restricted'}/>;const user=account.user;
 if(role==='teacher'&&user.role==='student')redirect('/register/teacher');
 if(role==='student'&&user.role==='student'&&await env.DB.prepare("SELECT id FROM teacher_applications WHERE user_id=? AND status='pending'").bind(user.id).first())redirect('/register/teacher');
 if(user.role!==role)redirect('/login/'+role+'?mismatch=1');
 if(role==='student'&&!await env.DB.prepare("SELECT student_id FROM admissions WHERE student_id=? AND status='approved' AND NOT (goals='Conference system testing' AND note='Conference pass admission')").bind(user.id).first())redirect('/register');
 if(role==='student')try{await requirePaidAccess(env.DB,user)}catch(e){if(e instanceof AppError&&e.status===402)redirect('/activate');throw e}
 await authorizedUser(env.DB,user,role);return <Workspace portal={role}/>;
}
