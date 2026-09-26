import { Clock3 } from 'lucide-react';
import { AppCard } from '../components/AppCard';
import { SectionTitle } from '../components/SectionTitle';
import { useLanguage } from '../contexts/LanguageContext';
import { useDirectory } from '../hooks/useDirectory';
import { useFavorites } from '../hooks/useFavorites';

export default function Updates() {
  const { language } = useLanguage();
  const { apps, loading } = useDirectory();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const updated = [...apps].filter((app) => app.health_status === 'updated').sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  return <div className="page-container py-7 sm:py-10"><SectionTitle icon={Clock3} title={language==='ar'?'آخر تحديثات التطبيقات':'Latest app updates'} description={language==='ar'?'تابع التطبيقات التي نشر مطوروها تحديثات حديثة':'See apps whose developers recently shipped updates'} />
    {loading ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{Array.from({length:6}).map((_,i)=><div key={i} className="skeleton-card h-44 rounded-[1.45rem]" />)}</div> : updated.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{updated.map(app=><AppCard key={app.id} app={app} favorite={favoriteIds.has(app.id)} onFavorite={()=>void toggleFavorite(app.id)} />)}</div> : <div className="empty-panel">{language==='ar'?'لا توجد تحديثات حديثة حاليا':'No recent updates right now'}</div>}
  </div>;
}
