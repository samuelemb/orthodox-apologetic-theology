"use client";

import Link from "next/link";
import {feedbackSubmitCopy} from "@/i18n/feedback-submit";
import { useRef, useState, type FormEvent } from "react";
import { Container } from "@/components/container";
import { useLanguage } from "@/i18n/language-provider";
import { site } from "@/lib/site";
import { validateFeedback,normalizeFeedback, type FeedbackErrors, type FeedbackValues } from "@/lib/feedback-validation";

function FeedbackIcon({ kind }: { kind: "question" | "idea" | "correction" | "book" | "telegram" }) {
  return <svg className="feedback-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "question" && <path d="M40 21c0 10-10 17-21 14L8 40l3-10C0 15 13 5 24 5c9 0 16 7 16 16Z" />}
    {kind === "idea" && <><path d="M15 33c0-7-7-9-7-17a16 16 0 0 1 32 0c0 8-7 10-7 17H15Zm1 6h16m-13 5h10" /></>}
    {kind === "correction" && <><path d="m19 5 1-3h8l1 3 2 4 5-1 5 6-2 4 2 3 4 1v8l-4 1-2 3 2 4-5 6-5-1-2 4h-10l-2-4-5 1-5-6 2-4-2-3-4-1v-8l4-1 2-3-2-4 5-6 5 1 2-4Z" /><circle cx="24" cy="25" r="8" /></>}
    {kind === "book" && <path d="M24 9C17 5 9 5 3 8v32c6-3 14-3 21 1 7-4 15-4 21-1V8c-6-3-14-3-21 1Zm0 0v32" />}
    {kind === "telegram" && <path d="m3 22 42-17-9 38-13-11-8 8v-14L38 11 19 29 3 22Z" />}
  </svg>;
}

export function FeedbackPageContent() {
  const { dictionary: t,language } = useLanguage();
  const submitCopy=feedbackSubmitCopy[language];
  const copy = t.feedback;
  const [values, setValues] = useState<FeedbackValues>({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<FeedbackErrors>({});
  const [pending,setPending]=useState(false);
  const pendingRef=useRef(false);
  const [website,setWebsite]=useState('');
  const [status,setStatus]=useState<''|'success'|'rate'|'failure'|'size'>('');
  const failureRef=useRef<HTMLParagraphElement>(null);
  const form = useRef<HTMLFormElement>(null);
  function change(field: keyof FeedbackValues, value: string) {
    setValues(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: undefined }));
    setStatus('');
  }
  async function check(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();if(pendingRef.current)return;
    setStatus('');
    const nextErrors=validateFeedback(normalizeFeedback(values));setErrors(nextErrors);
    const invalidField=(Object.keys(nextErrors) as (keyof FeedbackValues)[])[0];
    if(invalidField){form.current?.querySelector<HTMLElement>(`#feedback-${invalidField}`)?.focus();return;}
    pendingRef.current=true;setPending(true);
    try{
      const response=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...values,website}),signal:AbortSignal.timeout(20000)});
      const result=await response.json();
      if(response.status===201&&result.ok===true){setValues({name:'',email:'',message:''});setWebsite('');setErrors({});setStatus('success');}
      else if(response.status===422&&result.fields){setErrors(result.fields);const first=(['name','email','message'] as const).find(key=>result.fields[key]);requestAnimationFrame(()=>{if(first)form.current?.querySelector<HTMLElement>(`#feedback-${first}`)?.focus();});}
      else{setStatus(response.status===429?'rate':response.status===413?'size':'failure');requestAnimationFrame(()=>failureRef.current?.focus());}
    }catch{setStatus('failure');requestAnimationFrame(()=>failureRef.current?.focus());}
    finally{pendingRef.current=false;setPending(false);}
  }
  const hasErrors = Object.values(errors).some(Boolean);
  return <Container className="feedback-page">
    <nav className="breadcrumbs" aria-label={t.teachingsLibrary.breadcrumb}><Link className="text-link" href="/">{t.nav.home}</Link><span aria-hidden="true">/</span><span aria-current="page">{t.nav.feedback}</span></nav>
    <header className="feedback-heading"><h1>{copy.title}</h1><p>{copy.introduction}</p></header>
    <div className="feedback-layout">
      <form ref={form} className="feedback-form" onSubmit={check} noValidate aria-label={t.nav.feedback} aria-describedby="feedback-privacy" aria-busy={pending}>
        <p id="feedback-privacy" className="field-help">{submitCopy.privacy}</p>
        <div className="feedback-honeypot" aria-hidden="true"><label htmlFor="feedback-website">{submitCopy.honeypot}</label><input id="feedback-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={event=>setWebsite(event.target.value)} /></div>
        <p className="feedback-error-summary" role="alert">{hasErrors ? copy.fixErrors : ""}</p>
        <div className="feedback-field">
          <label className="form-label" htmlFor="feedback-name">{copy.name} <span className="field-optional">({copy.optional})</span></label>
          <input disabled={pending} id="feedback-name" className="form-field" type="text" autoComplete="name" maxLength={100} value={values.name} onChange={event => change("name", event.target.value)} placeholder={copy.namePlaceholder} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "feedback-name-error" : undefined} />
          {errors.name && <p id="feedback-name-error" className="field-error">{copy[errors.name]}</p>}
        </div>
        <div className="feedback-field">
          <label className="form-label" htmlFor="feedback-email">{copy.email} <span className="field-optional">({copy.optional})</span></label>
          <input disabled={pending} id="feedback-email" className="form-field" type="email" autoComplete="email" value={values.email} onChange={event => change("email", event.target.value)} placeholder={copy.emailPlaceholder} aria-invalid={Boolean(errors.email)} aria-describedby={`feedback-email-help${errors.email ? " feedback-email-error" : ""}`} />
          <p id="feedback-email-help" className="field-help">{copy.emailHelp}</p>
          {errors.email && <p id="feedback-email-error" className="field-error">{copy[errors.email]}</p>}
        </div>
        <div className="feedback-field">
          <label className="form-label" htmlFor="feedback-message">{copy.message} <span className="field-required">({copy.required})</span></label>
          <textarea disabled={pending} id="feedback-message" className="form-field" rows={6} required maxLength={5000} autoComplete="off" value={values.message} onChange={event => change("message", event.target.value)} placeholder={copy.messagePlaceholder} aria-invalid={Boolean(errors.message)} aria-describedby={`feedback-message-help${errors.message ? " feedback-message-error" : ""}`} />
          <p id="feedback-message-help" className="field-help">{copy.messageHelp}</p>
          {errors.message && <p id="feedback-message-error" className="field-error">{copy[errors.message]}</p>}
        </div>
        <button className="button button-primary" type="submit" disabled={pending}>{pending?submitCopy.pending:submitCopy.submit}<span aria-hidden="true">→</span></button>
        <p className="feedback-status" role="status" aria-live="polite" aria-atomic="true">{pending?submitCopy.pending:status==='success'?submitCopy.success:''}</p>
        <p ref={failureRef} tabIndex={-1} role="alert" className="field-error">{status&&status!=='success'?submitCopy[status]:''}</p>
      </form>
      <aside className="feedback-panel" aria-labelledby="feedback-share">
        <section><h2 id="feedback-share">{copy.shareTitle}</h2><ul>{([ ["question", copy.questions], ["idea", copy.suggestions], ["correction", copy.corrections] ] as const).map(([kind, text]) => <li key={kind}><FeedbackIcon kind={kind} /><span>{text}</span></li>)}</ul></section>
        <section className="feedback-panel-section"><h2>{copy.lookingTitle}</h2><div className="feedback-panel-link"><FeedbackIcon kind="book" /><Link className="text-link preview-link" href="/teachings">{copy.browse}<span aria-hidden="true">→</span></Link></div></section>
        <div className="feedback-panel-section feedback-panel-link"><FeedbackIcon kind="telegram" /><a className="text-link telegram-link" href={site.telegramUrl}>{copy.telegram}<span aria-hidden="true">↗</span></a></div>
      </aside>
    </div>
  </Container>;
}
