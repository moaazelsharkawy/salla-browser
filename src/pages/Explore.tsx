import { Compass, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppCard } from '../components/AppCard';
import { CategoryStrip } from '../components/CategoryStrip';
import { SectionTitle } from '../components/SectionTitle';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useDirectory } from '../hooks/useDirectory';
import { useFavorites } from '../hooks/useFavorites';

export default function Explore() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { apps, categories, loading } = useDirectory();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => apps.filter((app) => (category === 'all' || app.category_id === category) && (!query.trim() || `${app.name} ${app.short_description_ar} ${app.short_description_en}`.toLowerCase().includes(query.trim().toLowerCase()))), [apps, category, query]);

  return <div className="page-container py-7 sm:py-10">
    <SectionTitle icon={Compass} title={language === 'ar' ? 'استكشف التطبيقات' : 'Explore apps'} description={language === 'ar' ? 'كل تطبيقات Salla المعتمدة في دليل واحد' : 'All approved Salla apps in one directory'} />
    <div className="search-shell mb-4"><Search className="h-5 w-5 text-cyan-300" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" placeholder={language === 'ar' ? 'ابحث في الدليل...' : 'Search the directory...'} /></div>
    <CategoryStrip categories={categories} selected={category} onSelect={setCategory} />
    {loading ? <div className="empty-panel mt-5">Loading...</div> : <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtered.map((app) => <AppCard key={app.id} app={app} favorite={favoriteIds.has(app.id)} onFavorite={user ? () => void toggleFavorite(app.id) : undefined} />)}</div>}
  </div>;
}
