"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/i18n/language-provider";
import { isActivePath, navigation } from "@/lib/site";
import { Brand } from "./brand";
import { Container } from "./container";

export function SiteHeader() {
  const pathname = usePathname();
  const { language, dictionary: t, setLanguage } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    }
    const desktop = window.matchMedia("(min-width: 64rem)");
    function handleResize() { if (desktop.matches) setMenuOpen(false); }
    document.addEventListener("keydown", handleEscape);
    desktop.addEventListener("change", handleResize);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      desktop.removeEventListener("change", handleResize);
    };
  }, [menuOpen]);

  return (
    <header className="site-header">
      <Container>
        <div className="header-inner">
          <Brand onNavigate={() => setMenuOpen(false)} />
          <button ref={menuButton} className="menu-toggle" type="button" aria-controls="public-navigation" aria-expanded={menuOpen} aria-label={menuOpen ? t.closeMenu : t.openMenu} onClick={() => setMenuOpen(!menuOpen)}>
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <path d="m7 7 16 16M23 7 7 23" /> : <path d="M4 7h22M4 15h22M4 23h22" />}
            </svg>
          </button>
          <nav id="public-navigation" className={`main-navigation ${menuOpen ? "is-open" : ""}`} aria-label={t.primaryNavigation}>
            {navigation.map(({ href, key }) => (
              <Link key={key} href={href} className="nav-link" aria-current={isActivePath(pathname, href) ? "page" : undefined} onClick={() => setMenuOpen(false)}>{t.nav[key]}</Link>
            ))}
          </nav>
          <div className="language-control" role="group" aria-label={t.languageControl}>
            <button type="button" lang="en" aria-label="English" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button>
            <span aria-hidden="true">|</span>
            <button type="button" lang="am" aria-label="አማርኛ" aria-pressed={language === "am"} onClick={() => setLanguage("am")}>አማርኛ</button>
          </div>
        </div>
      </Container>
    </header>
  );
}
