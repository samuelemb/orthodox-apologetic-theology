import { isArticleContent, type ArticleContent } from './article-content';
export const teachingTopics = ['repentance','sacraments','fathers','apologetics'] as const;
export type ContentLanguage = 'en' | 'am';
export type EditorVersion = { language: ContentLanguage; title: string; excerpt: string; slug: string; article_content: ArticleContent; video_input: string; status: 'draft' | 'published'; saved: boolean };
export type EditorTeaching = { id: string; topic_id: string; revision: number; versions: EditorVersion[]; isNew: boolean };
export type TeachingListEntry = { id: string; topic_id: string; updated_at: string; versions: { language: ContentLanguage; title: string; status: 'draft' | 'published' }[] };
export type SaveRequest = { teaching: EditorTeaching; requestId: string; mode: 'save' | 'publish' | 'unpublish'; target: ContentLanguage };
export type EditorError = 'access' | 'invalid' | 'video' | 'duplicate' | 'conflict' | 'unavailable';
export function normalizeYouTube(input: unknown): string | null {
 if (typeof input !== 'string') throw new Error('video');
 const value = input.trim(); if (!value) return null;
 if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
 let url: URL; try { url = new URL(value); } catch { throw new Error('video'); }
 if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('video');
 let id: string | null = null;
 if (url.hostname === 'youtu.be' && /^\/[A-Za-z0-9_-]{11}$/.test(url.pathname)) id = url.pathname.slice(1);
 if (['youtube.com','www.youtube.com','m.youtube.com'].includes(url.hostname)) {
  if (url.pathname === '/watch') id = url.searchParams.get('v');
  else if (/^\/(shorts|embed|live)\/[A-Za-z0-9_-]{11}$/.test(url.pathname)) id = url.pathname.split('/')[2];
 }
 if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) throw new Error('video'); return id;
}
const record = (v: unknown): v is Record<string,unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const bounded = (v: unknown, n: number): v is string => typeof v === 'string' && !!v.trim() && Array.from(v.trim()).length <= n;
const onlyKeys = (v: Record<string,unknown>, keys: string[]) => Object.keys(v).every(k => keys.includes(k));
export function validateSaveRequest(input: unknown) {
 if (!record(input) || !onlyKeys(input,['teaching','requestId','mode','target']) || !record(input.teaching)) throw new Error('invalid');
 const t = input.teaching;
 if (!onlyKeys(t,['id','topic_id','revision','versions','isNew']) || typeof t.id !== 'string' || !/^[a-z][a-z0-9-]{0,79}$/.test(t.id) || !teachingTopics.includes(t.topic_id as typeof teachingTopics[number]) || !Number.isSafeInteger(t.revision) || (t.revision as number)<0 || (t.revision as number)>2147483646 || typeof t.isNew !== 'boolean' || typeof input.requestId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(input.requestId) || !['save','publish','unpublish'].includes(input.mode as string) || !['en','am'].includes(input.target as string) || !Array.isArray(t.versions) || t.versions.length<1 || t.versions.length>2) throw new Error('invalid');
 const seen = new Set<string>();
 const versions = t.versions.map(v => {
  if (!record(v) || !onlyKeys(v,['language','title','excerpt','slug','article_content','video_input','status','saved']) || !['en','am'].includes(v.language as string) || seen.has(v.language as string) || !bounded(v.title,300) || !bounded(v.excerpt,2000) || typeof v.slug !== 'string' || v.slug.length>160 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.slug) || !isArticleContent(v.article_content) || typeof v.video_input !== 'string' || v.video_input.length>2048) throw new Error('invalid');
  seen.add(v.language as string);
  const video = normalizeYouTube(v.video_input);
  if (video && !v.article_content.sections.some(s => s.video)) throw new Error('video');
  return { language: v.language as ContentLanguage, title: v.title.trim(), excerpt: v.excerpt.trim(), slug: v.slug, article_content: v.article_content, youtube_video_id: video };
 });
 if (input.mode !== 'save' && !seen.has(input.target as string)) throw new Error('invalid');
 const payload = { id: t.id, topic_id: t.topic_id as string, revision: t.revision as number, create: t.isNew, request_id: input.requestId, mode: input.mode as SaveRequest['mode'], target: input.target as ContentLanguage, versions };
 if (new TextEncoder().encode(JSON.stringify(payload)).length>900000) throw new Error('payload');
 return payload;
}
export function editorFromSnapshot(input: unknown): EditorTeaching {
 if (!record(input) || typeof input.id !== 'string' || typeof input.topic_id !== 'string' || typeof input.revision !== 'number' || !Array.isArray(input.versions)) throw new Error('Invalid database snapshot');
 return { id: input.id, topic_id: input.topic_id, revision: input.revision, isNew: false, versions: input.versions.map(v => {
  if (!record(v) || !['en','am'].includes(v.language as string) || !isArticleContent(v.article_content) || !['draft','published'].includes(v.status as string) || typeof v.title !== 'string' || typeof v.excerpt !== 'string' || typeof v.slug !== 'string') throw new Error('Invalid version');
  return { language: v.language as ContentLanguage, title: v.title, excerpt: v.excerpt, slug: v.slug, article_content: v.article_content, video_input: typeof v.youtube_video_id === 'string' ? v.youtube_video_id : '', status: v.status as EditorVersion['status'], saved: true };
 }).sort((a,b)=>Number(a.language==='am')-Number(b.language==='am')) };
}
export function emptyVersion(language: ContentLanguage): EditorVersion {
 return { language, title: '', excerpt: '', slug: '', article_content: {version:1,sections:[{id:'section-1',heading:'',paragraphs:['']}]}, video_input:'',status:'draft',saved:false };
}
