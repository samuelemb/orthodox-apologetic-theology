import {redirect} from 'next/navigation';
import {requireOwner} from '@/lib/supabase/owner';
import {readAdminTeachings} from '@/lib/admin-teachings-server';
import {TeachingList} from '@/components/admin/teaching-list';
export default async function Page(){
 try{await requireOwner();}catch{redirect('/admin/login');}
 let entries: Awaited<ReturnType<typeof readAdminTeachings>> = []; let error=false;
 try{entries=await readAdminTeachings();}catch{error=true;}
 return <TeachingList entries={entries} error={error}/>;
}
