"use client";
import Image from 'next/image';
import { useActionState, useState } from 'react';
import { signIn } from '@/app/admin/actions';
import { useLanguage } from '@/i18n/language-provider';
import { adminCopy } from '@/i18n/admin';
import { site } from '@/lib/site';
export function LoginForm({ next }: { next: string }) {
 const { language } = useLanguage(); const t = adminCopy[language];
 const [state, action, pending] = useActionState(signIn, { error: false });
 const [visible, setVisible] = useState(false);
 return <main id="main-content" className="admin-login-main"><section className="admin-login-card" aria-labelledby="login-title"><Image src={site.logo} alt="" width={124} height={124} className="admin-login-logo" /><h1 id="login-title">{t.welcome}</h1><p className="admin-subtitle">{t.subtitle}</p><form action={action} aria-busy={pending}><input type="hidden" name="next" value={next} /><label className="form-label" htmlFor="email">{t.email}</label><input id="email" name="email" type="email" autoComplete="username" required maxLength={254} className="form-field" aria-describedby={state.error ? 'login-error' : undefined} /><label className="form-label" htmlFor="password">{t.password}</label><div className="admin-password"><input id="password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required maxLength={1024} className="form-field" aria-describedby={state.error ? 'login-error' : undefined} /><button type="button" aria-label={visible ? t.hide : t.show} aria-pressed={visible} onClick={() => setVisible(!visible)}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{visible ? <path d="m3 3 18 18"/> : null}</svg></button></div>{state.error ? <p id="login-error" role="alert" className="admin-error">{t.error}</p> : null}<button type="submit" className="button button-primary admin-submit" disabled={pending}>{pending ? t.submitting : t.signIn}<span aria-hidden="true">→</span></button></form><p className="admin-owner-note">{t.ownerOnly}</p></section></main>;
}
