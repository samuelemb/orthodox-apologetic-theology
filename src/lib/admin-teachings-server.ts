import 'server-only';
import { requireOwner } from '@/lib/supabase/owner';
import { editorFromSnapshot, type TeachingListEntry } from './admin-teachings';
export async function readAdminTeaching(id: string) {
 const { client } = await requireOwner();
 if (!/^[a-z][a-z0-9-]{0,79}$/.test(id)) return null;
 const { data, error } = await client.rpc('get_admin_teaching', { p_id: id }).abortSignal(AbortSignal.timeout(20000));
 if (error) throw new Error('Teaching read unavailable');
 return data ? editorFromSnapshot(data) : null;
}
export async function readAdminTeachings(): Promise<TeachingListEntry[]> {
 const { client } = await requireOwner();
 // Keyset paging avoids silently dropping records at the Data API row limit.
 const result: TeachingListEntry[] = []; let after = '';
 for (;;) {
  const {data,error} = await client.from('teachings').select('id,topic_id,updated_at').gt('id',after).order('id').limit(200).abortSignal(AbortSignal.timeout(20000));
  if (error || !data) throw new Error('Teaching list unavailable'); if (!data.length) break;
  const versions = await client.from('teaching_translations').select('teaching_id,language,title,status').in('teaching_id',data.map(t=>t.id)).abortSignal(AbortSignal.timeout(20000));
  if (versions.error || !versions.data) throw new Error('Versions unavailable');
  for (const t of data) result.push({...t,versions:versions.data.filter(v=>v.teaching_id===t.id).map(({language,title,status})=>{
   if ((language!=='en' && language!=='am') || (status!=='draft' && status!=='published')) throw new Error('Invalid stored version');
   return {language,title,status};
  })});
  after = data[data.length-1].id; if (data.length<200) break;
 }
 return result.sort((a,b)=>b.updated_at.localeCompare(a.updated_at));
}
