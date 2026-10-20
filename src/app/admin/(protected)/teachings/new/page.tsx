import {randomUUID} from 'node:crypto';
import {redirect} from 'next/navigation';
import {requireOwner} from '@/lib/supabase/owner';
import {emptyVersion} from '@/lib/admin-teachings';
import {TeachingEditor} from '@/components/admin/teaching-editor';
export default async function Page(){try{await requireOwner();}catch{redirect('/admin/login');}return <TeachingEditor initial={{id:'teaching-'+randomUUID(),topic_id:'repentance',revision:0,versions:[emptyVersion('en')],isNew:true}}/>;}
