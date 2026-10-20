import { isArticleContent } from './article-content';
import { normalizeYouTube, teachingTopics, type ContentLanguage, type EditorTeaching } from './admin-teachings';
export type EditorField = 'title'|'excerpt'|'slug'|'topic'|'heading'|'paragraph'|'videoTitle'|'video'|'sections'|'sectionContent'|'article'|'form';
export type ValidationIssue = {language?:ContentLanguage;field:EditorField;sectionId?:string;paragraphIndex?:number;code:'required'|'max'|'slug'|'duplicate'|'video'|'videoSection'|'structure'|'sectionsMin'|'sectionsMax'|'paragraphsMax'|'videoMax'|'payload';limit?:number;value?:string};
export function issueKey(i:ValidationIssue){return [i.language??'all',i.field,i.sectionId??'',i.paragraphIndex??'',i.code].join('-');}
export function issueFieldId(i:ValidationIssue){
 switch(i.field){case 'topic':return 'editor-topic';case 'heading':return 'heading-'+i.sectionId;case 'paragraph':return 'paragraph-'+i.sectionId+'-'+i.paragraphIndex;case 'videoTitle':return 'video-title-'+i.sectionId;case 'sectionContent':return 'add-paragraph-'+i.sectionId;case 'sections':case 'article':return 'add-text-section';case 'form':return 'version-title';default:return 'version-'+i.field;}
}
/** UX diagnostics only: validateSaveRequest and database constraints remain authoritative. */
export function collectTeachingIssues(t:EditorTeaching):ValidationIssue[]{
 const issues:ValidationIssue[]=[];
 if(!teachingTopics.includes(t.topic_id as typeof teachingTopics[number]))issues.push({field:'topic',code:'required'});
 const slugs=new Map<string,number>();for(const v of t.versions)if(v.slug)slugs.set(v.slug,(slugs.get(v.slug)??0)+1);
 for(const v of t.versions){
  const add=(i:Omit<ValidationIssue,'language'>)=>issues.push({language:v.language,...i});
  const text=(value:string,field:EditorField,max:number,sectionId?:string,paragraphIndex?:number)=>{if(!value.trim())add({field,sectionId,paragraphIndex,code:'required'});else if(Array.from(value.trim()).length>max)add({field,sectionId,paragraphIndex,code:'max',limit:max});};
  text(v.title,'title',300);text(v.excerpt,'excerpt',2000);
  if(!v.slug) add({field:'slug',code:'required'});else if(v.slug.length>160)add({field:'slug',code:'max',limit:160});else if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.slug))add({field:'slug',code:'slug'});else if((slugs.get(v.slug)??0)>1)add({field:'slug',code:'duplicate',value:v.slug});
  const sections=v.article_content.sections;
  if(!sections.length)add({field:'sections',code:'sectionsMin'});
  if(sections.length>100)add({field:'sections',code:'sectionsMax'});
  if(sections.filter(s=>s.video).length>1)add({field:'video',code:'videoMax'});
  let video:string|null=null;
  try{video=normalizeYouTube(v.video_input);if(v.video_input.length>2048)add({field:'video',code:'max',limit:2048});}catch{add({field:'video',code:'video'});}
  if(video&&!sections.some(s=>s.video))add({field:'video',code:'videoSection'});
  for(const s of sections){
   text(s.heading,'heading',300,s.id);
   if(!s.paragraphs?.length&&!s.video)add({field:'sectionContent',sectionId:s.id,code:'required'});
   if((s.paragraphs?.length??0)>200)add({field:'heading',sectionId:s.id,code:'paragraphsMax'});
   s.paragraphs?.forEach((p,i)=>text(p,'paragraph',10000,s.id,i));
   if(s.video)text(s.video.title,'videoTitle',300,s.id);
  }
  if(!isArticleContent(v.article_content)&&!issues.some(i=>i.language===v.language&&['heading','paragraph','videoTitle','sections','sectionContent','video'].includes(i.field)))add({field:'article',code:'structure'});
 }
 // The serialized server payload is checked separately by validateSaveRequest.
 return issues;
}
/** Do not assume an arbitrary server-action argument has the editor's shape. */
export function inputTeachingIssues(input:unknown):ValidationIssue[]{
 try{
  const t=(input as {teaching:EditorTeaching}).teaching;
  if(!t||!Array.isArray(t.versions)||typeof t.topic_id!=='string')return [];
  for(const v of t.versions){if(!['en','am'].includes(v.language)||![v.title,v.excerpt,v.slug,v.video_input].every(s=>typeof s==='string')||!Array.isArray(v.article_content?.sections))return [];
   for(const s of v.article_content.sections){if(typeof s.id!=='string'||typeof s.heading!=='string'||(s.paragraphs!==undefined&&(!Array.isArray(s.paragraphs)||!s.paragraphs.every(p=>typeof p==='string')))||(s.video!==undefined&&typeof s.video?.title!=='string'))return [];}
  }
  return collectTeachingIssues(t);
 }catch{return [];}
}
