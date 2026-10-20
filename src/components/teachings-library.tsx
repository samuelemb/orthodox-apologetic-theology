"use client";

import Link from "next/link";
import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicTeachingError } from "@/components/public-teaching-error";
import { publicTeachingCopy } from "@/i18n/public-teachings";
import { Container } from "@/components/container";
import { TeachingCard } from "@/components/home/teaching-card";
import { topics, type Teaching } from "@/lib/teaching-model";
import { useLanguage } from "@/i18n/language-provider";
import { filterTeachings, libraryUrl, pageSize, readFilters, type TeachingFilters } from "@/lib/teaching-filters";

export function LibraryLoading() {
  const { dictionary: t } = useLanguage();
  return <Container><p role="status">{t.teachingsLibrary.loading}</p></Container>;
}

export function TeachingsLibrary({teachings,error=false}:{teachings:readonly Teaching[];error?:boolean}) {
  const { dictionary: t, language } = useLanguage();
  const copy = t.teachingsLibrary;
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const params = useSearchParams();
  const filters = readFilters(params);
  const matches = filterTeachings(teachings, filters, language);
  const shown = matches.slice(0, filters.limit);
  const resultCount = matches.length === 0 ? copy.zeroResults
    : shown.length < matches.length ? copy.results.replace("{visible}", String(shown.length)).replace("{total}", String(matches.length))
    : matches.length === 1 ? copy.oneResult : copy.found.replace("{total}", String(matches.length));

  function update(next: Partial<TeachingFilters>) {
    router.push(libraryUrl({ ...filters, limit: pageSize, ...next }), { scroll: false });
  }
  function clear() {
    formRef.current?.reset();
    router.push("/teachings", { scroll: false });
  }

  return (
    <Container className="library-page">
      <nav aria-label={copy.breadcrumb} className="breadcrumbs"><Link className="text-link" href="/">{t.nav.home}</Link><span aria-hidden="true">/</span><span aria-current="page">{t.nav.teachings}</span></nav>
      <h1>{copy.title}</h1>
      <p className="library-introduction">{copy.introduction}</p>
      <form ref={formRef} className="library-controls" onSubmit={event => {
        event.preventDefault();
        update({ q: String(new FormData(event.currentTarget).get("q") ?? "") });
      }}>
        <div className="home-search library-search" role="search" aria-label={t.home.search}>
          <label className="sr-only" htmlFor="library-search">{copy.searchPlaceholder}</label>
          <div className="search-input-wrap"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 6 6"/></svg><input key={filters.q} id="library-search" className="form-field" type="search" name="q" defaultValue={filters.q} placeholder={copy.searchPlaceholder}/></div>
          <button className="button button-primary" type="submit">{t.home.search}</button>
        </div>
        <div className="library-filters">
          <div><label htmlFor="topic-filter" className="form-label">{copy.topic}</label><select id="topic-filter" className="form-field" value={filters.topic} onChange={event => update({ topic: event.target.value as TeachingFilters["topic"] })}><option value="">{copy.allTopics}</option>{topics.map(topic => <option key={topic} value={topic}>{t.home.topics[topic]}</option>)}</select></div>
          <div><label htmlFor="language-filter" className="form-label">{copy.language}</label><select id="language-filter" className="form-field" value={filters.language} onChange={event => update({ language: event.target.value as TeachingFilters["language"] })}><option value="">{copy.allLanguages}</option><option value="en">{copy.english}</option><option value="am">{copy.amharic}</option></select></div>
          <button type="button" className="text-link clear-filters" onClick={clear}>{copy.clear}</button>
        </div>
      </form>
      {error ? <PublicTeachingError /> : <>
      <p role="status" className="results-status">{resultCount}</p>
      {shown.length ? <div className="library-grid">{shown.map(({ teaching, version }) => <TeachingCard key={teaching.id} teaching={teaching} version={version} libraryUrl={libraryUrl(filters)} copy={t.home} languageLabel={version.language === "en" ? copy.english : copy.amharic} />)}</div> : <section className="empty-results" aria-labelledby="empty-title"><h2 id="empty-title">{copy.emptyTitle}</h2><p>{teachings.length ? copy.emptyDescription : publicTeachingCopy[language].empty}</p><button className="button button-secondary" type="button" onClick={clear}>{copy.clear}</button></section>}
      {shown.length < matches.length && <div className="load-more"><button type="button" className="button button-primary" onClick={() => update({ limit: Math.min(filters.limit + pageSize, matches.length) })}>{copy.loadMore}<span aria-hidden="true">→</span></button></div>}
      </>}
    </Container>
  );
}
