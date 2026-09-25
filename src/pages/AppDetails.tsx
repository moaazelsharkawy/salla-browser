import { ArrowUpRight, BadgeCheck, Bookmark, CheckCircle2, Globe2, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { demoApps } from '../lib/demo';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { safeHostname } from '../lib/url';
import type { DirectoryApp } from '../types';
import { useFavorites } from '../hooks/useFavorites';

export default function AppDetails() {
  const { slug } = useParams();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [app, setApp] = useState<DirectoryApp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!slug) return;
      if (!isSupabaseConfigured) {
        setApp(demoApps.find((item) => item.slug === slug) ?? null);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from('apps').select('*, category:categories(*)').eq('slug', slug).eq('status', 'published').maybeSingle();
      setApp((data as DirectoryApp | null) ?? null);
      setLoading(false);
    };
    void run();
  }, [slug]);

  if (loading) return <div className="page-container py-20 text-center text-slate-400">Loading...</div>;
  if (!app) return <div className="page-container py-20"><div className="empty-panel">{language === 'ar' ? 'التطبيق غير موجود.' : 'App not found.'}</div></div>;

  const isFavorite = favoriteIds.has(app.id);
  return <div className="page-container py-7 sm:py-10">
    <section className="hero-panel relative overflow-hidden rounded-[2rem] p-5 sm:p-8">
      <div className="decor-orbit hero-orbit-a" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="app-icon flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.8rem]">{app.icon_url ? <img src={app.icon_url} className="h-full w-full object-cover" alt="" /> : <Globe2 className="h-10 w-10 text-cyan-300" />}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black sm:text-3xl">{app.name}</h1>{app.verified && <BadgeCheck className="h-5 w-5 text-cyan-300" />}<StatusBadge status={app.health_status} /></div>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-7 text-slate-400">{language === 'ar' ? app.short_description_ar : app.short_description_en}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black text-slate-400"><span className="pill"><ShieldCheck className="h-3.5 w-3.5" />{language === 'ar' ? 'تمت المراجعة' : 'Reviewed'}</span><span className="pill"><Globe2 className="h-3.5 w-3.5" />{safeHostname(app.website_url)}</span></div>
        </div>
      </div>
      <div className="relative mt-6 flex flex-wrap gap-2">
        <Link to={`/browse?app=${encodeURIComponent(app.slug)}`} className="primary-button"><ArrowUpRight className="h-4 w-4" />{language === 'ar' ? 'فتح التطبيق' : 'Open app'}</Link>
        {user && <button className="secondary-button" onClick={() => void toggleFavorite(app.id)}><Bookmark className={`h-4 w-4 ${isFavorite ? 'fill-current text-cyan-300' : ''}`} />{language === 'ar' ? (isFavorite ? 'إزالة من المثبتة' : 'تثبيت في حسابي') : (isFavorite ? 'Unpin' : 'Pin app')}</button>}
      </div>
    </section>
    <section className="content-panel mt-5 p-5 sm:p-7">
      <h2 className="text-lg font-black">{language === 'ar' ? 'عن التطبيق' : 'About this app'}</h2>
      <p className="mt-3 whitespace-pre-line text-sm font-semibold leading-8 text-slate-400">{language === 'ar' ? app.description_ar : app.description_en}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="info-tile"><CheckCircle2 className="h-5 w-5 text-emerald-300" /><div><p className="text-xs font-black">{language === 'ar' ? 'الحالة' : 'Status'}</p><p className="mt-1 text-[10px] text-slate-500">{app.health_status}</p></div></div>
        <div className="info-tile"><Globe2 className="h-5 w-5 text-cyan-300" /><div><p className="text-xs font-black">{language === 'ar' ? 'الدول' : 'Countries'}</p><p className="mt-1 text-[10px] text-slate-500">{app.supported_countries.join(', ')}</p></div></div>
        <div className="info-tile"><ShieldCheck className="h-5 w-5 text-violet-300" /><div><p className="text-xs font-black">{language === 'ar' ? 'المطور' : 'Developer'}</p><p className="mt-1 text-[10px] text-slate-500">{app.developer_name || 'Salla'}</p></div></div>
      </div>
    </section>
  </div>;
}
