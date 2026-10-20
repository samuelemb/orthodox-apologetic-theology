"use client";
import Link from "next/link";
import { ArticleBody } from "./article-body";
import {readFilters} from "@/lib/teaching-filters";
import {publicTeachingCopy} from "@/i18n/public-teachings";
import { Container } from "@/components/container";
import { preferredVersion, teachingUrl, type TeachingVersion, type Teaching } from "@/lib/teaching-model";
import { useLanguage } from "@/i18n/language-provider";

export function MissingTeaching() {
 const { dictionary: t } = useLanguage();
 return <Container className="placeholder-page"><h1>{t.teachingDetails.missing}</h1><p>{t.teachingDetails.missingBody}</p><Link className="text-link preview-link" href="/teachings">{t.teachingDetails.back}</Link></Container>;
}
export function TeachingDetails({ teaching, library,teachings }: { teaching: TeachingVersion; library: string;teachings:readonly Teaching[] }) {
 const { dictionary: t, language } = useLanguage();
 const c = t.teachingDetails;
 const translation = teachings.find(item=>item.id===teaching.teachingId)?.versions.find(item => item.language !== teaching.language);
 const requestedLanguage=readFilters(new URLSearchParams(library.split("?")[1])).language;
 const related = teachings.filter(item => item.id !== teaching.teachingId)
   .filter(item=>!requestedLanguage||item.versions.some(v=>v.language===requestedLanguage))
   .sort((a,b) => Number(b.topic === teaching.topic)-Number(a.topic === teaching.topic)).slice(0,2);
 const links = <ul>{teaching.sections.map(section => <li key={section.id}><a href={"#"+section.id} lang={teaching.language}>{section.heading}</a></li>)}</ul>;
 return <Container className="detail-page">
  <nav className="breadcrumbs" aria-label={t.teachingsLibrary.breadcrumb}><Link className="text-link" href="/">{t.nav.home}</Link><span aria-hidden="true">/</span><Link className="text-link" href={library}>{t.nav.teachings}</Link><span aria-hidden="true">/</span><span aria-current="page">{t.home.topics[teaching.topic]}</span></nav>
  <div className="detail-layout">
   <nav className="desktop-toc" aria-label={c.toc}><h2>{c.toc}</h2>{links}</nav>
   <div className="detail-content">
    <header className="article-header"><p className="teaching-category">{t.home.topics[teaching.topic]}</p><h1 lang={teaching.language}>{teaching.title}</h1><p className="detail-introduction" lang={teaching.language}>{teaching.description}</p><div className="article-language"><span>{c.articleLanguage}:</span><span>{teaching.language === "en" ? t.teachingsLibrary.english : t.teachingsLibrary.amharic}</span>{translation && <><span aria-hidden="true">|</span><Link className="text-link preview-link" prefetch={false} href={teachingUrl(translation, library)}>{translation.language === "am" ? c.readAm : c.readEn}<span aria-hidden="true">→</span></Link></>}</div></header>
    <details className="mobile-toc"><summary>{c.toc}</summary><nav aria-label={c.toc}>{links}</nav></details>
    <ArticleBody sections={teaching.sections} title={teaching.title} language={teaching.language} />
    <section className="related-teachings" aria-labelledby="related-title"><h2 id="related-title">{c.related}</h2>{related.map(item => {
      const version = preferredVersion(item.versions, requestedLanguage||language);
      return <div key={item.id} className="related-teaching" data-teaching-id={item.id}><Link className="text-link preview-link" prefetch={false} href={teachingUrl(version, library)}><span lang={version.language}>{version.title}</span><span aria-hidden="true">→</span></Link><span className="related-language">{version.language !== (requestedLanguage||language) ? publicTeachingCopy[language].fallback.replace("{language}",version.language === "en" ? t.teachingsLibrary.english : t.teachingsLibrary.amharic) : version.language === "en" ? t.teachingsLibrary.english : t.teachingsLibrary.amharic}</span></div>;
    })}</section>
   </div>
  </div>
 </Container>;
}
