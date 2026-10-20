"use client";
import {useLanguage} from '@/i18n/language-provider';
import {teachingAdminCopy} from '@/i18n/teaching-admin';
export default function ErrorPage({reset}:{reset:()=>void}){const {language}=useLanguage();const t=teachingAdminCopy[language];return <div role="alert"><p>{t.listError}</p><button className="button button-secondary" onClick={reset}>{t.retry}</button></div>;}
