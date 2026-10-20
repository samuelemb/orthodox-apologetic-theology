"use client";

import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import { useLanguage } from "@/i18n/language-provider";

export function Brand({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const { dictionary: t } = useLanguage();
  return (
    <Link href="/" className={`brand ${compact ? "brand-compact" : ""}`} onClick={onNavigate}>
      <Image src={site.logo} alt="" width={80} height={80} className="brand-logo" preload={!compact} />
      <span className="brand-name"><span>{t.brandFirst}</span><span>{t.brandSecond}</span></span>
    </Link>
  );
}
