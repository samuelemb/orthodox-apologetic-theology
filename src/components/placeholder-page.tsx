"use client";

import { useLanguage } from "@/i18n/language-provider";
import type { PageKey } from "@/lib/site";
import { Container } from "./container";

export function PlaceholderPage({ page }: { page: PageKey }) {
  const { dictionary: t } = useLanguage();
  return (
    <Container className="placeholder-page">
      <div className="reading-width">
        <p className="eyebrow">{t.library}</p>
        <h1>{t.nav[page]}</h1>
        <p className="page-introduction">{t.pages[page]}</p>
      </div>
    </Container>
  );
}
