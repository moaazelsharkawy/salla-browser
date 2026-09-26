import { AlertTriangle, ArrowUpRight, BadgeCheck, Bookmark, CheckCircle2, Globe2, Megaphone, Package2, Rocket, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useFavorites } from '../hooks/useFavorites';
import { demoApps } from '../lib/demo';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { isActiveUntil } from '../lib/promotions';
import { safeHostname } from '../lib/url';
import { usePageSeo } from '../lib/usePageSeo';
import type { DirectoryApp } from '../types';

export default function AppDetails() {
  const { slug } = useParams();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [app, setApp] = useState<DirectoryApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<number[]>([]);
  const [myRating, setMyRating] = useState<number>(0);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [ratingMessage, setRatingMessage] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadRatings = useCallback(async (appId: string) => {
    if (!isSupabaseConfigured) return;
    const [{ data: allRatings }, { data: authData }] = await Promise.all([
      supabase.from('app_ratings').select('rating').eq('app_id', appId), supabase.auth.getUser()
    ]);
    const userId = authData.user?.id ?? null;
    setCurrentUserId(userId);
    setRatings((allRatings ?? []).map((item: { rating: number }) => Number(item.rating)));
    if (userId) {
      const { data: own } = await supabase.from('app_ratings').select('rating').eq('app_id', appId).eq('user_id', userId).maybeSingle();
      setMyRating(own?.rating ? Number(own.rating) : 0);
    } else setMyRating(0);
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!slug) return;
      if (!isSupabaseConfigured) {
        setApp(demoApps.find((item) => item.slug === slug) ?? null); setLoading(false); return;
      }
      const { data } = await supabase.from('apps').select('*, category:categories(*)').eq('slug', slug).in('status', ['published', 'suspended']).maybeSingle();
      const found = (data as DirectoryApp | null) ?? null;
      setApp(found);
      if (found) await loadRatings(found.id);
      setLoading(false);
    };
    void run();
  }, [slug, loadRatings]);

  const ratingAverage = useMemo(() => ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : 0, [ratings]);

  const rateApp = async (rating: number) => {
    if (!app || !isSupabaseConfigured) return;
    if (!currentUserId) { setRatingMessage(language === 'ar' ? 'سجل الدخول اولا لتقييم التطبيق' : 'Sign in first to rate this app'); return; }
    if (app.created_by && app.created_by === currentUserId) { setRatingMessage(language === 'ar' ? 'لا يمكن للمطور تقييم تطبيقه' : 'Developers cannot rate their own app'); return; }
    setRatingBusy(true); setRatingMessage(null);
    const { error } = await supabase.from('app_ratings').upsert({ app_id: app.id, user_id: currentUserId, rating }, { onConflict: 'user_id,app_id' });
    if (error) setRatingMessage(language === 'ar' ? 'تعذر حفظ التقييم حاول مرة أخرى' : 'Could not save your rating Please try again');
    else { setMyRating(rating); setRatingMessage(language === 'ar' ? 'تم حفظ تقييمك' : 'Your rating was saved'); await loadRatings(app.id); }
    setRatingBusy(false);
  };

  usePageSeo(app ? {
    title: `${app.name} | Salla Browser`, description: language === 'ar' ? app.short_description_ar : app.short_description_en, path: `/apps/${app.slug}`, image: app.icon_url || undefined,
    jsonLd: { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: app.name, softwareVersion: app.version || '1.0.0', applicationCategory: 'WebApplication', operatingSystem: 'Any', url: `https://browser.salla-shop.com/apps/${app.slug}`, description: language === 'ar' ? app.short_description_ar : app.short_description_en, image: app.icon_url || undefined, author: { '@type': 'Organization', name: app.developer_name || 'Salla' }, ...(ratings.length ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: ratingAverage.toFixed(1), ratingCount: ratings.length, bestRating: '5', worstRating: '1' } } : {}) }
  } : null);

  if (loading) return <div className="page-container py-20 text-center muted-text"><span className="soft-spinner" />{language === 'ar' ? 'جاري تحميل تفاصيل التطبيق' : 'Fetching app details'}</div>;
  if (!app) return <div className="page-container py-20"><div className="empty-panel">{language === 'ar' ? 'التطبيق غير موجود' : 'App not found'}</div></div>;

  const isFavorite = favoriteIds.has(app.id);
  const countryLabel = app.supported_countries.map((code) => code === 'ALL' ? (language === 'ar' ? 'الكل' : 'All') : code).join(' ');
  const suspended = app.status === 'suspended';

  return <div className="page-container py-7 sm:py-10">
    {suspended && <section className="mb-5 flex items-start gap-3 rounded-[1.5rem] border border-amber-400/30 bg-amber-400/10 p-4 sm:p-5"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20"><AlertTriangle className="h-6 w-6 text-amber-500" /></div><div><h2 className="font-black text-amber-700 dark:text-amber-300">{language === 'ar' ? 'هذا التطبيق معلق مؤقتا' : 'This app is temporarily suspended'}</h2><p className="mt-1 text-xs font-semibold leading-6 text-amber-800/80 dark:text-amber-100/80">{app.suspension_reason || (language === 'ar' ? 'تم تعليق فتح التطبيق من الادارة مؤقتا' : 'Opening this app has been temporarily disabled by the administration')}</p></div></section>}

    <section className="hero-panel relative overflow-hidden rounded-[2rem] p-5 sm:p-8">
      <div className="decor-orbit hero-orbit-a" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center"><div className="app-icon flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.8rem]">{app.icon_url ? <img src={app.icon_url} className="h-full w-full object-cover" alt={`${app.name} icon`} /> : <Globe2 className="h-10 w-10 text-cyan-500" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black sm:text-3xl">{app.name}</h1>{app.verified && <BadgeCheck className="h-5 w-5 text-cyan-500" />}{isActiveUntil(app.home_ad_until) && <span className="promoted-badge promoted-badge-ad"><Megaphone />{language === 'ar' ? 'إعلان مميز' : 'Featured ad'}</span>}{!isActiveUntil(app.home_ad_until) && isActiveUntil(app.boost_until) && <span className="promoted-badge"><Sparkles />{language === 'ar' ? 'مروج' : 'Promoted'}</span>}<StatusBadge status={app.health_status} /></div><p className="muted-text mt-2 max-w-2xl text-sm font-semibold leading-7">{language === 'ar' ? app.short_description_ar : app.short_description_en}</p><div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black"><span className="pill"><ShieldCheck className="h-3.5 w-3.5" />{language === 'ar' ? 'تمت المراجعة' : 'Reviewed'}</span><span className="pill"><Package2 className="h-3.5 w-3.5" />v{app.version || '1.0.0'}</span><span className="pill"><Globe2 className="h-3.5 w-3.5" />{safeHostname(app.website_url)}</span>{ratings.length > 0 && <span className="pill"><Star className="h-3.5 w-3.5 fill-current text-amber-400" />{ratingAverage.toFixed(1)} · {ratings.length}</span>}</div></div></div>
      <div className="relative mt-6 flex flex-wrap gap-2">{suspended ? <button className="primary-button opacity-50" disabled><AlertTriangle className="h-4 w-4" />{language === 'ar' ? 'فتح التطبيق متوقف' : 'App opening disabled'}</button> : <Link to={`/browse?app=${encodeURIComponent(app.slug)}`} className="primary-button"><ArrowUpRight className="h-4 w-4" />{language === 'ar' ? 'فتح التطبيق' : 'Open app'}</Link>}<button className="secondary-button" onClick={() => void toggleFavorite(app.id)}><Bookmark className={`h-4 w-4 ${isFavorite ? 'fill-current text-cyan-500' : ''}`} />{language === 'ar' ? (isFavorite ? 'ازالة من المثبتة' : 'تثبيت على الجهاز') : (isFavorite ? 'Unpin' : 'Pin on device')}</button>{user?.id === app.created_by && !suspended && <Link to={`/promote?app=${encodeURIComponent(app.id)}`} className="secondary-button"><Rocket className="h-5 w-5" />{language === 'ar' ? 'تعزيز الظهور' : 'Promote app'}</Link>}</div>
    </section>

    <section className="content-panel mt-5 p-5 sm:p-7"><h2 className="text-lg font-black">{language === 'ar' ? 'عن التطبيق' : 'About this app'}</h2><p className="muted-text mt-3 whitespace-pre-line text-sm font-semibold leading-8">{language === 'ar' ? app.description_ar : app.description_en}</p><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="info-tile"><CheckCircle2 className="h-5 w-5 text-emerald-500" /><div><p className="text-xs font-black">{language === 'ar' ? 'الحالة' : 'Status'}</p><p className="muted-text mt-1 text-[10px]">{suspended ? (language === 'ar' ? 'معلق' : 'Suspended') : ({ online: language === 'ar' ? 'متاح' : 'Online', maintenance: language === 'ar' ? 'صيانة' : 'Maintenance', new: language === 'ar' ? 'جديد' : 'New', updated: language === 'ar' ? 'محدث' : 'Updated', offline: language === 'ar' ? 'غير متاح' : 'Offline' } as const)[app.health_status]}</p></div></div><div className="info-tile"><Package2 className="h-5 w-5 text-cyan-500" /><div><p className="text-xs font-black">{language === 'ar' ? 'الاصدار' : 'Version'}</p><p className="muted-text mt-1 text-[10px]" dir="ltr">{app.version || '1.0.0'}</p></div></div><div className="info-tile"><Globe2 className="h-5 w-5 text-cyan-500" /><div><p className="text-xs font-black">{language === 'ar' ? 'الدول' : 'Countries'}</p><p className="muted-text mt-1 text-[10px]">{countryLabel}</p></div></div><div className="info-tile"><ShieldCheck className="h-5 w-5 text-violet-500" /><div><p className="text-xs font-black">{language === 'ar' ? 'المطور' : 'Developer'}</p><p className="muted-text mt-1 text-[10px]">{app.developer_name || 'Salla'}</p></div></div></div></section>

    <section className="content-panel mt-5 p-5 sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-black">{language === 'ar' ? 'تقييم التطبيق' : 'App rating'}</h2><div className="mt-2 flex items-center gap-2"><div className="flex items-center gap-1" dir="ltr">{[1,2,3,4,5].map((value) => <Star key={value} className={`h-5 w-5 ${value <= Math.round(ratingAverage) ? 'fill-current text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />)}</div><span className="text-sm font-black">{ratings.length ? ratingAverage.toFixed(1) : '0.0'}</span><span className="muted-text text-xs">{ratings.length} {language === 'ar' ? 'تقييم' : ratings.length === 1 ? 'rating' : 'ratings'}</span></div></div><div><p className="mb-2 text-xs font-black">{language === 'ar' ? 'تقييمك' : 'Your rating'}</p><div className="flex items-center gap-1" dir="ltr">{[1,2,3,4,5].map((value) => <button key={value} disabled={ratingBusy} onClick={() => void rateApp(value)} className="rounded-lg p-1 transition hover:scale-110 disabled:opacity-50" aria-label={`${value}`}><Star className={`h-7 w-7 ${value <= myRating ? 'fill-current text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} /></button>)}</div></div></div>{ratingMessage && <div className="form-message mt-4">{ratingMessage}</div>}<p className="muted-text mt-3 text-[11px]">{language === 'ar' ? 'يمكن لكل مستخدم تقييم التطبيق مرة واحدة ويمكنه تعديل تقييمه لاحقا' : 'Each user has one rating per app and can update it later'}</p></section>
  </div>;
}
