import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {getSupabaseConfig} from '@/lib/supabase/config';
import type {Database} from '@/lib/supabase/database.types';
import {groupTeachingVersions,topics,type TeachingVersion,type Topic} from '@/lib/teaching-model';
import {isArticleContent} from '@/lib/article-content';
/** Deliberately has NO cookie adapter, owner JWT, persisted session or auth storage. */
function publicClient(){
 const {url,key}=getSupabaseConfig();
 return createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store',signal:AbortSignal.timeout(20000)})}});
}
export async function readPublishedTeachings(){
 const client=publicClient();const versions:TeachingVersion[]=[];let after:string|undefined;
 for(;;){
  let query=client.from('teaching_translations').select('id,teaching_id,language,title,excerpt,slug,published_at,teachings!inner(topic_id)').eq('status','published').order('id').limit(200);
  if(after)query=query.gt('id',after);const {data,error}=await query;if(error)throw new Error('Public teachings unavailable');
  for(const row of data){
   const topic=row.teachings.topic_id;
   if(!topics.includes(topic as Topic)||(row.language!=='en'&&row.language!=='am'))throw new Error('Invalid public teaching');
   versions.push({id:row.id,teachingId:row.teaching_id,topic:topic as Topic,language:row.language,title:row.title,description:row.excerpt,slug:row.slug,status:'published',sections:[],publishedAt:row.published_at??undefined});
  }
  if(data.length<200)break;after=data[data.length-1].id;
 }
 versions.sort((a,b)=>(b.publishedAt??'').localeCompare(a.publishedAt??'')||a.id.localeCompare(b.id));
 return groupTeachingVersions(versions);
}
export async function readPublishedArticle(slug:string):Promise<TeachingVersion|null>{
 if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)||slug.length>160)return null;
 const {data:row,error}=await publicClient().from('teaching_translations').select('id,teaching_id,language,title,excerpt,slug,article_content,youtube_video_id,teachings!inner(topic_id)').eq('status','published').eq('slug',slug).maybeSingle();
 if(error)throw new Error('Public article unavailable');if(!row)return null;
 if(!isArticleContent(row.article_content)||!topics.includes(row.teachings.topic_id as Topic)||(row.language!=='en'&&row.language!=='am')||(row.youtube_video_id!==null&&!/^[A-Za-z0-9_-]{11}$/.test(row.youtube_video_id)))throw new Error('Invalid public article');
 return {id:row.id,teachingId:row.teaching_id,topic:row.teachings.topic_id as Topic,language:row.language,title:row.title,description:row.excerpt,slug:row.slug,status:'published',sections:row.article_content.sections.map(section=>({...section,...(section.video?{video:{...section.video,id:row.youtube_video_id??undefined}}:{})}))};
}
