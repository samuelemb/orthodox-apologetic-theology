"use client";
import Link from 'next/link';
import { Brand } from '@/components/brand';
import { useLanguage } from '@/i18n/language-provider';
import { adminCopy } from '@/i18n/admin';
export function AdminHeader() {
 const { language, setLanguage, dictionary } = useLanguage(); const t = adminCopy[language];
 return <header className="admin-header"><Brand /><div className="admin-header-controls"><div className="language-control" role="group" aria-label={dictionary.languageControl}><button type="button" lang="en" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button><button type="button" lang="am" aria-pressed={language === 'am'} onClick={() => setLanguage('am')}>አማርኛ</button></div><Link href="/" className="admin-back">{t.back} <span aria-hidden="true">↗</span></Link></div></header>;
}
