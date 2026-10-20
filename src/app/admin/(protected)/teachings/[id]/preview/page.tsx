import {notFound,redirect} from 'next/navigation';
import {requireOwner} from '@/lib/supabase/owner';
import {readAdminTeaching} from '@/lib/admin-teachings-server';
import {SavedTeachingPreview} from '@/components/admin/teaching-preview';
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{language?:string}>}){try{await requireOwner();}catch{redirect('/admin/login');}const {id}=await params;const query=await searchParams;const teaching=await readAdminTeaching(id);const language=query.language==='am'?'am':'en';if(!teaching||!teaching.versions.some(v=>v.language===language))notFound();return <SavedTeachingPreview teaching={teaching} contentLanguage={language}/>;}
