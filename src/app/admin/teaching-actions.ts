"use server";
import { requireOwner } from '@/lib/supabase/owner';
import { revalidatePath } from 'next/cache';
import { validateSaveRequest, editorFromSnapshot, type EditorTeaching, type EditorError } from '@/lib/admin-teachings';
import {inputTeachingIssues,type ValidationIssue} from '@/lib/teaching-editor-validation';
import type { Json } from '@/lib/supabase/database.types';
export type SaveResult = { ok: true; teaching: EditorTeaching } | { ok: false; error: EditorError; issues?:ValidationIssue[] };
async function duplicateSlugIssues(client:Awaited<ReturnType<typeof requireOwner>>['client'],payload:ReturnType<typeof validateSaveRequest>){
 const {data,error}=await client.from('teaching_translations').select('teaching_id,language,slug').in('slug',payload.versions.map(v=>v.slug)).abortSignal(AbortSignal.timeout(20000));
 if(error)return null;
 return payload.versions.filter(v=>data.some(row=>row.slug===v.slug&&(row.teaching_id!==payload.id||row.language!==v.language))).map(v=>({language:v.language,field:'slug' as const,code:'duplicate' as const,value:v.slug}));
}
export async function saveTeaching(input: unknown): Promise<SaveResult> {
 let session: Awaited<ReturnType<typeof requireOwner>>;
 try { session = await requireOwner(); } catch { return {ok:false,error:'access'}; }
 let payload: ReturnType<typeof validateSaveRequest>;
 try { payload = validateSaveRequest(input); } catch(e) { return {ok:false,error:e instanceof Error && e.message === 'video' ? 'video' : 'invalid',issues:e instanceof Error&&e.message==='payload'?[{field:'article',code:'payload'}]:inputTeachingIssues(input)}; }
 try {
  const duplicates=await duplicateSlugIssues(session.client,payload);
  if(duplicates===null)return {ok:false,error:'unavailable'};
  if(duplicates.length)return {ok:false,error:'duplicate',issues:duplicates};
  const {data,error} = await session.client.rpc('save_admin_teaching',{p_payload:payload as unknown as Json}).retry(false).abortSignal(AbortSignal.timeout(20000));
  if(error?.code==='23505'){const issues=await duplicateSlugIssues(session.client,payload);return {ok:false,error:'duplicate',issues:issues?.length?issues:payload.versions.map(v=>({language:v.language,field:'slug',code:'duplicate',value:v.slug}))};}
  if (error) return {ok:false,error:error.code==='23505'?'duplicate':['40001','PT409'].includes(error.code)?'conflict':['23514','23503','22023','22P02'].includes(error.code)?'invalid':error.code==='42501'?'access':'unavailable'};
  const teaching=editorFromSnapshot(data);
  revalidatePath('/admin/teachings');
  revalidatePath('/admin/teachings/'+payload.id);
  revalidatePath('/admin/teachings/'+payload.id+'/preview');
  return {ok:true,teaching};
 } catch { return {ok:false,error:'unavailable'}; }
}
