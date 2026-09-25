import { Bookmark } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppCard } from '../components/AppCard';
import { SectionTitle } from '../components/SectionTitle';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useFavorites } from '../hooks/useFavorites';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { DirectoryApp } from '../types';

export default function Favorites() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [apps, setApps] = useState<DirectoryApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!user || !isSupabaseConfigured || favoriteIds.size === 0) { setApps([]); setLoading(false); return; }
      const { data } = await supabase.from('apps').select('*, category:categories(*)').in('id', [...favoriteIds]).eq('status', 'published');
      setApps((data ?? []) as DirectoryApp[]);
      setLoading(false);
    };
    void run();
  }, [favoriteIds, user]);

  return <div className="page-container py-7 sm:py-10">
    <SectionTitle icon={Bookmark} title={language === 'ar' ? 'التطبيقات المثبتة' : 'Pinned apps'} description={language === 'ar' ? 'اختصاراتك المحفوظة على الحساب' : 'Your saved app shortcuts'} />
    {loading ? <div className="empty-panel">Loading...</div> : apps.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{apps.map((app) => <AppCard key={app.id} app={app} favorite onFavorite={() => void toggleFavorite(app.id)} />)}</div> : <div className="empty-panel">{language === 'ar' ? 'لم تثبت أي تطبيق بعد. افتح الدليل واضغط على زر القلب.' : 'No pinned apps yet. Explore the directory and tap the heart button.'}</div>}
  </div>;
}
