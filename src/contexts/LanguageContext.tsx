import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Language } from '../types';

type LanguageContextValue = {
  language: Language;
  dir: 'rtl' | 'ltr';
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
};

const STORAGE_KEY = 'salla-browser-language';
const LanguageContext = createContext<LanguageContextValue | null>(null);

function detectInitialLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'ar' || stored === 'en') return stored;

    const preferred = [
      ...(Array.isArray(window.navigator.languages) ? window.navigator.languages : []),
      window.navigator.language,
    ].filter(Boolean);

    return preferred.some((value) => String(value).toLowerCase().startsWith('ar')) ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);

  const setLanguage = (next: Language) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Language still changes for the current page even if storage is unavailable.
    }
    setLanguageState(next);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const value = useMemo(() => ({
    language,
    dir: language === 'ar' ? 'rtl' as const : 'ltr' as const,
    setLanguage,
    toggleLanguage: () => setLanguage(language === 'ar' ? 'en' : 'ar')
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}
