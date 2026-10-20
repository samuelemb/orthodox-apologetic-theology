"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/i18n/language-provider";
import { isActivePath, navigation, site } from "@/lib/site";
import { Brand } from "./brand";
import { Container } from "./container";

export function SiteFooter() {
  const { dictionary: t } = useLanguage();
  const pathname = usePathname();
  return (
    <footer className="site-footer">
      <Container>
        <div className="footer-inner">
          <Brand compact />
          <nav className="footer-navigation" aria-label={t.footerNavigation}>
            {navigation.filter(({ key }) => key !== "home").map(({ href, key }) => (
              <Link key={key} href={href} aria-current={isActivePath(pathname, href) ? "page" : undefined}>{t.nav[key]}</Link>
            ))}
          </nav>
          <a className="text-link telegram-link" href={site.telegramUrl}>{t.telegram}<span aria-hidden="true"> ↗</span></a>
        </div>
      </Container>
    </footer>
  );
}
