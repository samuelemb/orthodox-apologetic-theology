"use client";
import {useLanguage} from '@/i18n/language-provider';
import {publicTeachingCopy} from '@/i18n/public-teachings';
export function PublicTeachingError(){const {language}=useLanguage(),t=publicTeachingCopy[language];return <div role="alert" className="empty-results"><p>{t.error}</p><button className="button button-secondary" onClick={()=>location.reload()}>{t.retry}</button></div>;}
