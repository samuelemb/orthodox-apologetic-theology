"use client";

import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/container";
import { useLanguage } from "@/i18n/language-provider";
import { site } from "@/lib/site";
import { preferredVersion, topics, type Teaching } from "@/lib/teaching-model";
import { PublicTeachingError } from "@/components/public-teaching-error";
import { publicTeachingCopy } from "@/i18n/public-teachings";
import { TopicCard } from "./topic-card";
import { TeachingCard } from "./teaching-card";

export function HomePageContent({teachings,error=false}:{teachings:readonly Teaching[];error?:boolean}) {
  const { language, dictionary: t } = useLanguage();
  const copy = t.home;
  return (
    <Container className="home-page">
      <section className="home-hero" aria-labelledby="home-heading">
        <div className="hero-copy">
          <p className="eyebrow">{t.library}</p>
          <h1 id="home-heading">{copy.headline}{language === "am" ? " " : null}<span>{copy.headlineAccent}</span></h1>
          <p className="hero-description">{copy.description}</p>
          <form action="/teachings" method="get" className="home-search" role="search" aria-label={copy.search}>
            <label className="sr-only" htmlFor="home-search">{copy.searchPlaceholder}</label>
            <div className="search-input-wrap">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7.5" /><path d="m16 16 6 6" /></svg>
              <input className="form-field" id="home-search" name="q" type="search" placeholder={copy.searchPlaceholder} />
            </div>
            <button className="button button-primary" type="submit">{copy.search}</button>
          </form>
          <Link className="text-link purpose-link" href="/about">{copy.purpose}<span aria-hidden="true">→</span></Link>

        </div>
        <Image className="hero-logo" src={site.logo} alt={site.name} width={320} height={320} sizes="(min-width: 1024px) 22vw, 1px" />
      </section>
      <section className="home-section" aria-labelledby="topics-heading">
        <h2 id="topics-heading">{copy.topicsHeading}</h2>
        <div className="topic-grid">{topics.map(topic => <TopicCard key={topic} topic={topic} label={copy.topics[topic]} />)}</div>
      </section>
      <section className="home-section latest-section" aria-labelledby="latest-heading">
        <div className="section-heading"><h2 id="latest-heading">{copy.latestHeading}</h2><Link className="text-link preview-link" href="/teachings">{copy.viewAll}<span aria-hidden="true">→</span></Link></div>
        {error ? <PublicTeachingError /> : !teachings.length ? <p role="status">{publicTeachingCopy[language].empty}</p> : null}
        <div className="teaching-grid">{teachings.slice(0, 3).map(teaching => {
          const version = preferredVersion(teaching.versions, language);
          return <TeachingCard key={teaching.id} teaching={teaching} version={version} copy={copy} languageLabel={version.language === "en" ? t.teachingsLibrary.english : t.teachingsLibrary.amharic} />;
        })}</div>
      </section>
      <section className="ministry-callout" aria-labelledby="ministry-heading">
        <div><h2 id="ministry-heading">{copy.calloutHeading}</h2><p>{copy.calloutDescription}</p></div>
        <Link href="/about" className="button button-primary">{copy.about}<span aria-hidden="true">→</span></Link>
        <a href={site.telegramUrl} className="text-link telegram-link">{t.telegram}<span aria-hidden="true">↗</span></a>
      </section>
    </Container>
  );
}
