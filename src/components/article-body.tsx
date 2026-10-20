"use client";
import { useLanguage } from '@/i18n/language-provider';
type Section = { id:string; heading:string; paragraphs?:readonly string[]; video?:{id?:string;title:string} };
/** Shared public/admin rendering: plain React text and a fixed YouTube embed origin. */
export function ArticleBody({ sections, title, language }: {sections:readonly Section[];title:string;language:'en'|'am'}) {
 const {dictionary:t,language:uiLanguage}=useLanguage(); const c=t.teachingDetails;
 return <article lang={language} className="teaching-article" aria-label={title}>{sections.map(section => <section key={section.id} aria-labelledby={section.id}><h2 id={section.id} tabIndex={-1}>{section.heading}</h2>{section.paragraphs?.map((paragraph,i)=><p key={i}>{paragraph}</p>)}{section.video && (/^[A-Za-z0-9_-]{11}$/.test(section.video.id ?? '') ? <iframe className="teaching-video" src={'https://www.youtube-nocookie.com/embed/'+section.video.id} title={section.video.title} loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen /> : <div className="video-preview"><span className="preview-cross" aria-hidden="true">☦</span><strong>{section.video.title}</strong><span lang={uiLanguage}>{c.preview}</span><small lang={uiLanguage}>{c.pending}</small></div>)}</section>)}</article>;
}
