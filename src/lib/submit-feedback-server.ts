import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {getSupabaseConfig} from '@/lib/supabase/config';
import type {FeedbackValues} from '@/lib/feedback-validation';
/** The only application operation performed with this privileged credential. */
export async function insertPublicFeedback(values:FeedbackValues):Promise<'accepted'|'limited'>{
 const {url}=getSupabaseConfig();
 const key=process.env.SUPABASE_SECRET_KEY?.trim()||process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
 if(!key)throw new Error('Feedback unavailable');
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store',signal:AbortSignal.timeout(15000)})}});
 const {data,error}=await client.rpc('submit_public_feedback',{p_name:values.name||null,p_email:values.email||null,p_message:values.message});
 if(error||(data!=='accepted'&&data!=='limited'))throw new Error('Feedback unavailable');
 return data;
}
