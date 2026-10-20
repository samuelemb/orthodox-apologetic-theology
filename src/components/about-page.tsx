"use client";

import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/container";
import { useLanguage } from "@/i18n/language-provider";
import { site } from "@/lib/site";
import { topics } from "@/lib/teaching-model";

export function AboutPageContent() {
  const { dictionary: t } = useLanguage();
  const copy = t.about;
  return (
    <Container className="about-page">
      <nav className="breadcrumbs" aria-label={t.teachingsLibrary.breadcrumb}>
        <Link className="text-link" href="/">{t.nav.home}</Link>
        <span aria-hidden="true">/</span><span aria-current="page">{t.nav.about}</span>
      </nav>
      <header className="about-hero">
        <div><p className="eyebrow">{copy.purpose}</p><h1>{copy.title}</h1><p className="about-introduction">{copy.introduction}</p></div>
        <Image className="about-logo" src={site.logo} alt={site.name} width={320} height={320} sizes="(min-width: 1024px) 260px, 180px" />
      </header>
      <div className="about-layout">
        <div className="about-copy">
          <section aria-labelledby="about-why"><h2 id="about-why">{copy.whyTitle}</h2><p>{copy.whyBody}</p></section>
          <section aria-labelledby="about-find"><h2 id="about-find">{copy.findTitle}</h2><p>{copy.findBody}</p></section>
          <section aria-labelledby="about-use"><h2 id="about-use">{copy.useTitle}</h2><p>{copy.useBody}</p></section>
        </div>
        <nav className="about-topics" aria-labelledby="about-topics-heading">
          <h2 id="about-topics-heading">{copy.topicsTitle}</h2>
          <ul>{topics.map(topic => <li key={topic}><Link href={`/teachings?topic=${topic}`}><span>{t.home.topics[topic]}</span><span aria-hidden="true">→</span></Link></li>)}</ul>
        </nav>
      </div>
      <section className="ministry-callout about-callout" aria-labelledby="about-continue">
        <div><h2 id="about-continue">{copy.calloutTitle}</h2><p>{copy.calloutBody}</p></div>
        <Link className="button button-primary" href="/teachings">{copy.browse}<span aria-hidden="true">→</span></Link>
        <a className="text-link telegram-link" href={site.telegramUrl}>{copy.telegram}<span aria-hidden="true">↗</span></a>
      </section>
    </Container>
  );
}
