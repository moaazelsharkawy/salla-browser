import { ExternalLink, Globe2, Search, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { looksLikeUrl, normalizeUrl } from '../lib/url';

function openExternal(url: string) {
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) window.location.href = url;
}

export function SearchBar({ value, onChange, compact = false }: { value?: string; onChange?: (value: string) => void; compact?: boolean }) {
  const { language } = useLanguage();
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

    if (looksLikeUrl(trimmed)) {
      const normalized = normalizeUrl(trimmed);
      if (normalized) openExternal(normalized);
      return;
    }

    openExternal(`https://www.google.com/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form onSubmit={submit} className={`search-shell ${compact ? 'search-shell-compact' : ''}`}>
      <Search className="h-5 w-5 shrink-0 text-cyan-300" strokeWidth={2.5} />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="search-input min-w-0 flex-1 bg-transparent text-sm font-extrabold sm:text-base"
        placeholder={language === 'ar' ? 'ابحث في التطبيقات أو على الويب...' : 'Search apps or the web...'}
        aria-label={language === 'ar' ? 'بحث' : 'Search'}
      />
      {query && (
        <button type="button" className="icon-button h-8 w-8" onClick={() => setQuery('')} aria-label={language === 'ar' ? 'مسح البحث' : 'Clear search'}>
          <X className="h-4 w-4" />
        </button>
      )}
      <button type="submit" className="search-go" title={language === 'ar' ? 'بحث على Google' : 'Search Google'}>
        <Globe2 className="h-4 w-4" />
        <span className="hidden sm:inline">{language === 'ar' ? 'بحث ويب' : 'Web search'}</span>
        <ExternalLink className="hidden h-3.5 w-3.5 sm:block" />
      </button>
    </form>
  );
}
