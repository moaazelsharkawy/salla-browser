import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'salla-browser-country';

type CountryContextValue = { country: string; setCountry: (code: string) => void };
const CountryContext = createContext<CountryContextValue | null>(null);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [country, setCountryState] = useState(() => {
    try { return (localStorage.getItem(STORAGE_KEY) || 'ALL').toUpperCase(); }
    catch { return 'ALL'; }
  });

  const setCountry = useCallback((code: string) => {
    const next = String(code || 'ALL').toUpperCase();
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* local preference only */ }
    setCountryState(next);
  }, []);

  const value = useMemo(() => ({ country, setCountry }), [country, setCountry]);

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}

export function useCountry() {
  const value = useContext(CountryContext);
  if (!value) throw new Error('useCountry must be used inside CountryProvider');
  return value;
}
