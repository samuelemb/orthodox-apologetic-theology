import {notFound,redirect} from 'next/navigation';
import {requireOwner} from '@/lib/supabase/owner';
import {readAdminTeaching} from '@/lib/admin-teachings-server';
import {TeachingEditor} from '@/components/admin/teaching-editor';
export default async function Page({params}:{params:Promise<{id:string}>}){try{await requireOwner();}catch{redirect('/admin/login');}const {id}=await params;const teaching=await readAdminTeaching(id);if(!teaching)notFound();return <TeachingEditor key={id} initial={teaching}/>;}
