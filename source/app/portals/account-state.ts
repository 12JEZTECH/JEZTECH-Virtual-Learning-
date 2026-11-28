import {initializeUser,AppError,type User} from '../service';
type Identity={userId:string;email:string;displayName:string};
export type AccountState={user:User;problem:null}|{user:null;problem:{kind:'restricted'|'unavailable';message:string}};
/** Expected account restrictions belong in the page, not an unhandled server-render error. */
export async function loadAccount(db:D1Database,identity:Identity,ownerEmail:string,now=Date.now()):Promise<AccountState>{
 try{return {user:await initializeUser(db,identity,ownerEmail,now),problem:null}}
 catch(e){if(e instanceof AppError)return {user:null,problem:{kind:e.status===403?'restricted':'unavailable',message:e.message}};console.error('Account loading unavailable');return {user:null,problem:{kind:'unavailable',message:'Your account could not be loaded right now. Please retry shortly.'}}}
}
