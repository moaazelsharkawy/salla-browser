import { Clock3, Globe2, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useDirectory } from '../hooks/useDirectory';

const HISTORY_KEY = 'salla-browser-search-history-v1';

function readHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(value) ? value.filter((item) => typeof item === 'string').slice(0, 6) : [];
  } catch { return []; }
}

function saveHistory(term: string) {
  const clean = term.trim();
  if (!clean) return;
  try {
    const next = [clean, ...readHistory().filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch { /* local history only */ }
}

export function QuickSearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { language } = useLanguage();
  const { apps, categories, loading } = useDirectory();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>(() => readHistory());
  const ar = language === 'ar';

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const needle = query.trim().toLowerCase();
  const matchingApps = useMemo(() => {
    if (!needle) return apps.slice(0, 5);
    return apps.filter((app) => [app.name, app.short_description_ar, app.short_description_en, app.developer_name || ''].join(' ').toLowerCase().includes(needle)).slice(0, 7);
  }, [apps, needle]);
  const matchingCategories = useMemo(() => {
    if (!needle) return categories.slice(0, 5);
    return categories.filter((category) => `${category.name_ar} ${category.name_en}`.toLowerCase().includes(needle)).slice(0, 5);
  }, [categories, needle]);

  if (!open || typeof document === 'undefined') return null;

  const chooseTerm = (term: string) => {
    setQuery(term);
    saveHistory(term);
    setHistory(readHistory());
  };
  const openApp = (slug: string, name: string) => {
    saveHistory(query || name);
    onClose();
    navigate(`/apps/${encodeURIComponent(slug)}`);
  };
  const openCategory = (id: string) => {
    if (query.trim()) saveHistory(query);
    onClose();
    navigate(`/explore?category=${encodeURIComponent(id)}${query.trim() ? `&q=${encodeURIComponent(query.trim())}` : ''}`);
  };
  const webSearch = () => {
    const term = query.trim();
    if (!term) return;
    saveHistory(term);
    setHistory(readHistory());
    window.open(`https://www.google.com/search?q=${encodeURIComponent(term)}`, '_blank', 'noopener,noreferrer');
  };

  return createPortal(
    <div className="quick-search-overlay" onMouseDown={onClose}>
      <section className="quick-search-dialog" role="dialog" aria-modal="true" aria-label={ar ? 'بحث سريع' : 'Quick search'} onMouseDown={(event) => event.stopPropagation()}>
        <div className="quick-search-head">
          <div className="quick-search-input-shell">
            <Search />
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ar ? 'ابحث عن تطبيق أو قسم' : 'Search apps or categories'} />
            {query && <button className="icon-button" onClick={() => setQuery('')} aria-label={ar ? 'مسح' : 'Clear'}><X /></button>}
          </div>
          <button className="icon-button quick-search-close" onClick={onClose} aria-label={ar ? 'إغلاق' : 'Close'}><X /></button>
        </div>

        {!query && history.length > 0 && <div className="quick-search-history">
          <div className="quick-search-label"><Clock3 />{ar ? 'عمليات بحث سابقة' : 'Recent searches'}</div>
          <div className="flex flex-wrap gap-2">{history.map((term) => <button key={term} className="category-chip" onClick={() => chooseTerm(term)}>{term}</button>)}</div>
        </div>}

        <div className="quick-search-results">
          <div>
            <div className="quick-search-label">{ar ? 'التطبيقات' : 'Apps'}</div>
            {loading ? <div className="quick-search-loading"><span className="soft-spinner" />{ar ? 'جاري البحث' : 'Searching'}</div> : matchingApps.length ? <div className="quick-search-apps">{matchingApps.map((app) => <button key={app.id} className="quick-search-app" onClick={() => openApp(app.slug, app.name)}>
              <span className="quick-search-app-icon">{app.icon_url ? <img src={app.icon_url} alt="" /> : <Globe2 />}</span>
              <span className="min-w-0"><strong>{app.name}</strong><small>{ar ? app.short_description_ar : app.short_description_en}</small></span>
            </button>)}</div> : <div className="quick-search-empty">{ar ? 'لا توجد تطبيقات مطابقة' : 'No matching apps'}</div>}
          </div>

          {matchingCategories.length > 0 && <div>
            <div className="quick-search-label">{ar ? 'الأقسام' : 'Categories'}</div>
            <div className="flex flex-wrap gap-2">{matchingCategories.map((category) => <button key={category.id} className="category-chip" onClick={() => openCategory(category.id)}>{ar ? category.name_ar : category.name_en}</button>)}</div>
          </div>}
        </div>

        <button className="quick-search-web" disabled={!query.trim()} onClick={webSearch}><Globe2 />{ar ? `بحث الويب عن ${query.trim() || '...'}` : `Search the web for ${query.trim() || '...'}`}</button>
      </section>
    </div>, document.body
  );
}
