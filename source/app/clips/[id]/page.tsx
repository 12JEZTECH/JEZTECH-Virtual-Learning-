import ClipEntry from '../entry';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!/^[a-zA-Z0-9_-]{1,200}$/.test(id))notFound();return <ClipEntry id={id}/>}
