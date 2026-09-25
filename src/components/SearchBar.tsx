import { Globe2, Search, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { looksLikeUrl } from '../lib/url';

export function SearchBar({ value, onChange, compact = false }: { value?: string; onChange?: (value: string) => void; compact?: boolean }) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [internal, setInternal] = useState('');
  const query = value ?? internal;
  const setQuery = (next: string) => {
    if (onChange) onChange(next);
    else setInternal(next);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    if (looksLikeUrl(trimmed)) navigate(`/browse?url=${encodeURIComponent(trimmed)}`);
    else navigate(`/browse?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form onSubmit={submit} className={`search-shell ${compact ? 'search-shell-compact' : ''}`}>
      <Search className="h-5 w-5 shrink-0 text-cyan-300" strokeWidth={2.5} />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-slate-500 sm:text-base"
        placeholder={language === 'ar' ? 'ابحث عن تطبيق أو ابحث على الويب...' : 'Search apps or the web...'}
        aria-label="search"
      />
      {query && (
        <button type="button" className="icon-button h-8 w-8 text-slate-400" onClick={() => setQuery('')} aria-label="clear">
          <X className="h-4 w-4" />
        </button>
      )}
      <button type="submit" className="search-go">
        <Globe2 className="h-4 w-4" />
        <span className="hidden sm:inline">{language === 'ar' ? 'بحث' : 'Search'}</span>
      </button>
    </form>
  );
}
