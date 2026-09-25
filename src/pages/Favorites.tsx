import { Bookmark } from 'lucide-react';
import { AppCard } from '../components/AppCard';
import { SectionTitle } from '../components/SectionTitle';
import { useLanguage } from '../contexts/LanguageContext';
import { useDirectory } from '../hooks/useDirectory';
import { useFavorites } from '../hooks/useFavorites';

export default function Favorites() {
  const { language } = useLanguage();
  const { apps, loading } = useDirectory();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const pinned = apps.filter((app) => favoriteIds.has(app.id));

  return <div className="page-container py-7 sm:py-10">
    <SectionTitle icon={Bookmark} title={language === 'ar' ? 'التطبيقات المثبتة' : 'Pinned apps'} description={language === 'ar' ? 'اختصارات محفوظة على هذا الجهاز ولا تحتاج حسابا' : 'Saved on this device — no account required'} />
    {loading ? <div className="empty-panel">Loading...</div> : pinned.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{pinned.map((app) => <AppCard key={app.id} app={app} favorite onFavorite={() => void toggleFavorite(app.id)} />)}</div> : <div className="empty-panel">{language === 'ar' ? 'لم تثبت أي تطبيق بعد افتح الدليل واضغط زر التثبيت' : 'No pinned apps yet. Explore the directory and pin an app.'}</div>}
  </div>;
}
