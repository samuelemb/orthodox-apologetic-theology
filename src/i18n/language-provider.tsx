"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { en, type Dictionary } from "./en";
import { am } from "./am";

type Language = "en" | "am";
const preferenceKey = "oat-interface-language";
const changeEvent = "oat-language-change";
let memoryPreference: Language = "en";

function readPreference(): Language {
  try {
    const stored = localStorage.getItem(preferenceKey);
    return stored === "en" || stored === "am" ? stored : memoryPreference;
  } catch {
    return memoryPreference;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(changeEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(changeEvent, callback);
  };
}

function setLanguage(language: Language) {
  memoryPreference = language;
  try {
    localStorage.setItem(preferenceKey, language);
  } catch {
    // Switching still works for this session when storage is unavailable.
  }
  window.dispatchEvent(new Event(changeEvent));
}

const LanguageContext = createContext<{
  language: Language;
  dictionary: Dictionary;
  setLanguage: typeof setLanguage;
} | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // The server and initial hydration both render English. The saved device
  // preference is applied after hydration without suppressing React warnings.
  const language = useSyncExternalStore(subscribe, readPreference, () => "en" as const);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, dictionary: language === "am" ? am : en, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage requires LanguageProvider");
  return context;
}
