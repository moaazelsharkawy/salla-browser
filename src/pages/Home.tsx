import { BadgeCheck, Clock3, Globe2, History, LayoutGrid, Megaphone, Rocket, SearchCheck, Send, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppCard } from '../components/AppCard';
import { HomeExperience } from '../components/HomeExperience';
import { CategoryStrip } from '../components/CategoryStrip';
import { CountryPickerButton, CountryPickerModal } from '../components/CountryPicker';
import { SearchBar } from '../components/SearchBar';
import { SectionTitle } from '../components/SectionTitle';
import { useCountry } from '../contexts/CountryContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useDirectory } from '../hooks/useDirectory';
import { useFavorites } from '../hooks/useFavorites';
import { clearRecentApps, getRecentAppIds } from '../lib/recent';

export default function Home() {
  const { language } = useLanguage();
  const { country, setCountry } = useCountry();
  const { apps, categories, featured, homeAds, loading } = useDirectory();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [params] = useSearchParams();
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState(params.get('q') || '');
  const [countryOpen, setCountryOpen] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>(() => getRecentAppIds());

  useEffect(() => { const q = params.get('q'); if (q != null) setQuery(q); }, [params]);
  useEffect(() => {
    const update = () => setRecentIds(getRecentAppIds());
    window.addEventListener('salla-recent-updated', update);
    return () => window.removeEventListener('salla-recent-updated', update);
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return apps.filter((app) => {
      const categoryOk = category === 'all' || app.category_id === category;
      const countryOk = country === 'ALL' || app.supported_countries.includes('ALL') || app.supported_countries.includes(country);
      const searchOk = !needle || [app.name, app.short_description_ar, app.short_description_en, app.developer_name || ''].join(' ').toLowerCase().includes(needle);
      return categoryOk && countryOk && searchOk;
    });
  }, [apps, category, country, query]);

  const recentApps = useMemo(() => recentIds.map((id) => apps.find((app) => app.id === id)).filter(Boolean).slice(0, 5) as typeof apps, [apps, recentIds]);
  const updatedApps = useMemo(() => [...apps].filter((app) => app.health_status === 'updated').sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0,3), [apps]);
  const quietMode = Boolean(query || category !== 'all');

  return <div className="page-container py-6 sm:py-9">
    <section className="hero-panel relative overflow-hidden rounded-[1.7rem] px-5 py-7 sm:px-8 sm:py-9">
      <div className="relative max-w-3xl">
        <div className="eyebrow-badge mb-4 inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4" />{language === 'ar' ? 'متصفح منظومة Salla' : 'Salla ecosystem browser'}</div>
        <h1 className="hero-title max-w-3xl">{language === 'ar' ? 'تطبيقات Salla في تجربة واحدة سريعة وواضحة' : 'Salla apps in one fast and focused experience'}</h1>
        <p className="muted-text mt-4 max-w-2xl text-sm font-bold leading-7 sm:text-base">{language === 'ar' ? 'اكتشف التطبيقات المعتمدة وثبت المفضلة وارجع لآخر ما استخدمته بسهولة' : 'Discover reviewed apps, pin favorites, and jump back into what you recently used.'}</p>
        <div className="mt-6"><SearchBar value={query} onChange={setQuery} /></div>
        <div className="mt-5"><Link to="/submit" className="secondary-button"><Send />{language === 'ar' ? 'للمطورين إدراج تطبيق' : 'Developers: submit an app'}</Link></div>
      </div>
    </section>

    <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{[[ShieldCheck,language==='ar'?'مراجعة قبل النشر':'Reviewed first',language==='ar'?'تطبيقات موثوقة وواضحة':'Reviewed and clear'],[SearchCheck,language==='ar'?'بحث سريع':'Fast search',language==='ar'?'من أي صفحة':'From any page'],[Globe2,language==='ar'?'حسب الدولة':'By country',language==='ar'?'ما يناسب منطقتك':'Relevant to your region'],[Rocket,language==='ar'?'خفيف وسريع':'Light and fast',language==='ar'?'بدون مؤثرات ثقيلة':'No heavy effects']].map(([Icon,title,text])=>{const I=Icon as typeof ShieldCheck;return <div key={String(title)} className="mini-feature"><div className="soft-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"><I className="h-5 w-5" /></div><div className="min-w-0"><p className="text-xs font-black sm:text-sm">{String(title)}</p><p className="muted-text mt-1 text-[10px] font-bold sm:text-xs">{String(text)}</p></div></div>;})}</section>

    <HomeExperience apps={apps} quiet={quietMode} />

    {!quietMode && recentApps.length > 0 && <section className="mt-8"><SectionTitle icon={History} title={language==='ar'?'متابعة التصفح':'Continue browsing'} description={language==='ar'?'آخر التطبيقات التي فتحتها على هذا الجهاز':'Your recently opened apps on this device'} action={<button className="secondary-button compact-action" onClick={() => { clearRecentApps(); setRecentIds([]); }}><Trash2 />{language==='ar'?'مسح':'Clear'}</button>} /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{recentApps.slice(0,3).map(app=><AppCard key={app.id} app={app} favorite={favoriteIds.has(app.id)} onFavorite={()=>void toggleFavorite(app.id)} />)}</div></section>}

    {!quietMode && homeAds.length>0 && <section className="mt-8"><SectionTitle icon={Megaphone} title={language==='ar'?'إعلانات مميزة':'Featured ads'} description={language==='ar'?'مساحات ترويجية مدفوعة ومعلنة بوضوح':'Clearly marked paid placements'} /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{homeAds.map(app=><AppCard key={app.id} app={app} favorite={favoriteIds.has(app.id)} onFavorite={()=>void toggleFavorite(app.id)} />)}</div></section>}

    {!quietMode && updatedApps.length>0 && <section className="mt-8"><SectionTitle icon={Clock3} title={language==='ar'?'آخر التحديثات':'Latest updates'} description={language==='ar'?'تطبيقات تم تحديثها مؤخرا':'Apps updated recently'} action={<Link to="/updates" className="secondary-button compact-action">{language==='ar'?'عرض الكل':'View all'}</Link>} /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{updatedApps.map(app=><AppCard key={app.id} app={app} favorite={favoriteIds.has(app.id)} onFavorite={()=>void toggleFavorite(app.id)} />)}</div></section>}

    {!quietMode && featured.length>0 && <section className="mt-8"><SectionTitle icon={Rocket} title={language==='ar'?'تطبيقات مميزة':'Featured apps'} description={language==='ar'?'اختيارات بارزة من منظومة Salla':'Highlighted apps from the Salla ecosystem'} /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{featured.slice(0,6).map(app=><AppCard key={app.id} app={app} favorite={favoriteIds.has(app.id)} onFavorite={()=>void toggleFavorite(app.id)} />)}</div></section>}

    <section className="mt-8"><SectionTitle compact icon={LayoutGrid} title={language==='ar'?'استكشف التطبيقات':'Explore apps'} description={language==='ar'?'فلتر حسب القسم والدولة':'Filter by category and country'} action={<CountryPickerButton value={country} onClick={()=>setCountryOpen(true)} compact />} /><CategoryStrip categories={categories} selected={category} onSelect={setCategory} />
      {loading ? <div className="grid gap-3 pt-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({length:6}).map((_,i)=><div key={i} className="skeleton-card h-44 rounded-[1.45rem]" />)}</div> : filtered.length ? <div className="grid gap-3 pt-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(app=><AppCard key={app.id} app={app} favorite={favoriteIds.has(app.id)} onFavorite={()=>void toggleFavorite(app.id)} />)}</div> : <div className="empty-panel mt-4">{language==='ar'?'لا توجد تطبيقات مطابقة حاليا':'No matching apps right now'}</div>}
    </section>
    <CountryPickerModal open={countryOpen} value={country} onChange={setCountry} onClose={()=>setCountryOpen(false)} />
  </div>;
}
