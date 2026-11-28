import {env} from 'cloudflare:workers';
import {requireChatGPTUser} from '../../chatgpt-auth';
import {loadAccount} from '../../portals/account-state';
import AccountNotice from '../../portals/account-notice';
import {teachingClassAccess} from '../../hub/service';
import {AppError} from '../../service';
import LiveClassroom from '../../live/page-panel';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params,returnPath='/classroom/'+encodeURIComponent(id),identity=await requireChatGPTUser(returnPath);
 if(!env.DB)return <AccountNotice message="Classroom storage is temporarily unavailable. Please retry shortly."/>;
 const account=await loadAccount(env.DB,identity,'jezreelch@gmail.com');if(!account.user)return <AccountNotice message={account.problem.message} restricted={account.problem.kind==='restricted'}/>;
 try{await teachingClassAccess(env.DB,account.user,id)}catch(e){if(!(e instanceof AppError))throw e;
 if(![402,403,404,409].includes(e.status))throw e;
 const payment=e.status===402,missing=e.status===404;
 return <main className="simple-signup"><a className="login-brand" href="/login">JEZTECH Learning</a><section className="panel"><span className="eyebrow">STUDENT CLASS INVITATION</span><h1>{missing?'Class not found':payment?'Activate your class access':'Class approval and registration'}</h1><p role="status">{e.message}</p><p>{missing?'Ask your teacher for a current class invitation link.':payment?'Your class link is valid, but live lessons require current tuition access or an available orientation period.':'This link opens only for the approved students registered with this teacher, class level and subject. If you already applied, ask the administrator to review your registration. Contact your teacher about an exemption or removed enrolment.'}</p><div className="actions">{!missing&&account.user.role==='student'&&<>{payment?<><a className="button-link" href="/activate">Activate tuition access</a><a className="button-link secondary" href="/registration-fee">Registration / orientation</a></>:<a className="button-link" href="/register">Student registration / account review</a>}<a className="button-link secondary" href={returnPath}>Check approval and access again</a></>}<a className="button-link secondary" href="/">Open my dashboard</a></div><p className="small">Keep the class link and reopen it after approval or payment confirmation. The invitation does not grant approval or paid access by itself.</p></section></main>;
 }
 return <LiveClassroom classId={id}/>;
}
