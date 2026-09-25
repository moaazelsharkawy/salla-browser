import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Language } from '../types';

type LanguageContextValue = {
  language: Language;
  dir: 'rtl' | 'ltr';
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem('salla-browser-language') === 'en' ? 'en' : 'ar'));

  const setLanguage = (next: Language) => {
    localStorage.setItem('salla-browser-language', next);
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
