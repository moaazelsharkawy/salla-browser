import { Check, Globe2, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getCountries, getCountry } from '../lib/countries';

export function CountryPickerButton({ value, onClick, compact = false }: { value: string; onClick: () => void; compact?: boolean }) {
  const { language } = useLanguage();
  const country = getCountry(value);
  return (
    <button type="button" className={`country-picker-button ${compact ? 'is-compact' : ''}`} onClick={onClick}>
      <span className="country-picker-flag" aria-hidden="true">{country.flag}</span>
      <span className="truncate">{language === 'ar' ? country.ar : country.en}</span>
      <Globe2 className="h-4 w-4 shrink-0" />
    </button>
  );
}

export function CountryPickerModal({ open, value, onChange, onClose }: { open: boolean; value: string; onChange: (code: string) => void; onClose: () => void }) {
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const countries = useMemo(() => getCountries(), []);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(language === 'ar' ? 'ar' : 'en');
    if (!needle) return countries;
    return countries.filter((item) => `${item.ar} ${item.en} ${item.code}`.toLocaleLowerCase(language === 'ar' ? 'ar' : 'en').includes(needle));
  }, [countries, language, query]);

  if (!open) return null;
  const ar = language === 'ar';
  return (
    <div className="country-overlay" onMouseDown={onClose} role="presentation">
      <section className="country-dialog" role="dialog" aria-modal="true" aria-label={ar ? 'اختيار الدولة' : 'Choose country'} onMouseDown={(event) => event.stopPropagation()}>
        <div className="country-dialog-head">
          <div>
            <h2 className="text-xl font-black">{ar ? 'اختيار الدولة' : 'Choose country'}</h2>
            <p className="muted-text mt-1 text-xs font-bold">{ar ? 'اختر الدولة لعرض التطبيقات المناسبة' : 'Choose a country to show relevant apps'}</p>
          </div>
          <button className="icon-button h-10 w-10" onClick={onClose} aria-label={ar ? 'إغلاق' : 'Close'}><X className="h-5 w-5" /></button>
        </div>
        <div className="country-search mt-4">
          <Search className="h-4 w-4 shrink-0" />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ar ? 'ابحث عن دولة...' : 'Search countries...'} />
        </div>
        <div className="country-list mt-3">
          {filtered.map((item) => {
            const selected = item.code === value;
            return (
              <button key={item.code} type="button" className={`country-row ${selected ? 'is-selected' : ''}`} onClick={() => { onChange(item.code); onClose(); }}>
                <span className="country-row-flag" aria-hidden="true">{item.flag}</span>
                <span className="min-w-0 flex-1 truncate text-start">{ar ? item.ar : item.en}</span>
                <span className="country-row-code">{item.code === 'ALL' ? '' : item.code}</span>
                <span className="country-radio">{selected && <Check className="h-3.5 w-3.5" />}</span>
              </button>
            );
          })}
          {!filtered.length && <div className="country-empty">{ar ? 'لا توجد دولة مطابقة.' : 'No matching country.'}</div>}
        </div>
      </section>
    </div>
  );
}
