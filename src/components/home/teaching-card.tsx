"use client";
import Link from "next/link";
import {useLanguage} from "@/i18n/language-provider";
import {publicTeachingCopy} from "@/i18n/public-teachings";
import { teachingUrl } from "@/lib/teaching-model";
import type { Teaching, TeachingVersion } from "@/lib/teaching-model";
import type { Dictionary } from "@/i18n/en";

export function TeachingCard({ teaching, version, copy, languageLabel, noticeId, libraryUrl }: { teaching: Teaching; version: TeachingVersion; copy: Dictionary["home"]; languageLabel: string; noticeId?: string; libraryUrl?: string }) {
  const {language}=useLanguage();
  return (
    <article className="teaching-card" data-teaching-id={teaching.id} aria-labelledby={`${teaching.id}-title`}>
      <p className="teaching-category">{copy.topics[teaching.topic]}{languageLabel && <> · {languageLabel}</>}</p>
      {version.language !== language ? <p className="related-language">{publicTeachingCopy[language].fallback.replace("{language}",languageLabel)}</p> : null}
      <h3 id={`${teaching.id}-title`} lang={version.language}>{version.title}</h3>
      <p className="teaching-description" lang={version.language}>{version.description}</p>
      <div className="teaching-card-actions">
        <Link className="text-link preview-link" prefetch={false} href={teachingUrl(version, libraryUrl)} aria-describedby={noticeId}>{copy.readTeaching}<span aria-hidden="true">→</span></Link>
      </div>
    </article>
  );
}
