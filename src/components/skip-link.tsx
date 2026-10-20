"use client";

import { useLanguage } from "@/i18n/language-provider";

export function SkipLink() {
  const { dictionary: t } = useLanguage();
  return <a className="skip-link" href="#main-content">{t.skipToContent}</a>;
}
