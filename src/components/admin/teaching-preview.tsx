"use client";
import Link from 'next/link';
import {ArticleBody} from '@/components/article-body';
import {useLanguage} from '@/i18n/language-provider';
import {teachingAdminCopy} from '@/i18n/teaching-admin';
import {normalizeYouTube,type EditorTeaching,type EditorVersion} from '@/lib/admin-teachings';
export function TeachingPreview({version,saved=false,id}:{version:EditorVersion;saved?:boolean;id?:string}) {
 const {language}=useLanguage();const t=teachingAdminCopy[language];const videoId=normalizeYouTube(version.video_input);
 const sections=version.article_content.sections.map(s=>({...s,...(s.video?{video:{...s.video,...(videoId?{id:videoId}:{})}}:{})}));
 return <div className="admin-article-preview"><p className="admin-info">{saved?t.savedPreviewNotice:t.previewNotice}</p><p className="admin-info">{t.sampleNotice}</p>{saved&&id?<Link className="text-link" href={'/admin/teachings/'+id}>{t.closePreview}</Link>:null}<header className="article-header"><h1 lang={version.language}>{version.title}</h1><p className="detail-introduction" lang={version.language}>{version.excerpt}</p><span>{version.language==='en'?t.english:t.amharic} · {t[version.status]}</span></header><ArticleBody sections={sections} title={version.title} language={version.language}/></div>;
}
export function SavedTeachingPreview({teaching,contentLanguage}:{teaching:EditorTeaching;contentLanguage:'en'|'am'}){const version=teaching.versions.find(v=>v.language===contentLanguage);return version?<TeachingPreview version={version} saved id={teaching.id}/>:null;}
