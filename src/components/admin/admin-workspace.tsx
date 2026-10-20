"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { signOut } from '@/app/admin/actions';
import { useLanguage } from '@/i18n/language-provider';
import { adminCopy } from '@/i18n/admin';
export function AdminWorkspace({ children }: { children: React.ReactNode }) {
 const { language } = useLanguage(); const t = adminCopy[language]; const pathname = usePathname();
 const [pending, startTransition] = useTransition(); const [error, setError] = useState(false);
 useEffect(() => { const reload = (event: PageTransitionEvent) => { if (event.persisted) window.location.reload(); }; window.addEventListener('pageshow', reload); return () => window.removeEventListener('pageshow', reload); }, []);
 return <><a className="skip-link" href="#main-content">{t.skip}</a><div className="admin-workspace"><aside className="admin-sidebar"><nav aria-label={t.navigation}>{[['/admin',t.overview],['/admin/teachings',t.teachings],['/admin/feedback',t.feedback]].map(([href,label]) => <Link href={href} key={href} prefetch={false} aria-current={(pathname === href || (href === '/admin/teachings' && pathname.startsWith('/admin/teachings/'))) ? 'page' : undefined}>{label}</Link>)}</nav><button data-admin-signout className="button button-secondary" disabled={pending} onClick={() => { setError(false); startTransition(async () => { try { await signOut(); } catch { setError(true); } }); }}>{pending ? t.signingOut : t.signOut}</button>{error ? <p role="alert" className="admin-error">{t.signOutError}</p> : null}</aside><main id="main-content" tabIndex={-1} className="admin-content">{children}</main></div></>;
}
export function AdminOverview({ section }: { section?: 'teachings' | 'feedback' }) {
 const { language } = useLanguage(); const t = adminCopy[language];
 return <><p className="eyebrow">{t.ownerOnly}</p><h1>{section ? t[section] : t.title}</h1><p className="admin-subtitle">{section ? t.next : t.intro}</p><div className="admin-section-grid">{(['teachings','feedback'] as const).filter(key => !section || key === section).map(key => <section className="admin-section-card" key={key}><h2>{t[key]}</h2><span className="admin-coming">{t[key]}</span><p><Link className="text-link" href={key === 'teachings' ? '/admin/teachings' : '/admin/feedback'}>{t[key]} →</Link></p></section>)}</div></>;
}
