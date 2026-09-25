import { BadgeCheck, Download, Globe2, LayoutGrid, Rocket, SearchCheck, Send, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppCard } from '../components/AppCard';
import { CategoryStrip } from '../components/CategoryStrip';
import { SearchBar } from '../components/SearchBar';
import { SectionTitle } from '../components/SectionTitle';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useDirectory } from '../hooks/useDirectory';
import { useFavorites } from '../hooks/useFavorites';
import { usePwaInstall } from '../hooks/usePwaInstall';

const countries = [
  { code: 'ALL', ar: 'كل الدول', en: 'All countries' },
  { code: 'EG', ar: 'مصر', en: 'Egypt' },
  { code: 'SA', ar: 'السعودية', en: 'Saudi Arabia' },
  { code: 'AE', ar: 'الإمارات', en: 'UAE' },
  { code: 'US', ar: 'عالمي', en: 'Global' },
];

export default function Home() {
  const { language } = useLanguage();
  const { profile, user } = useAuth();
  const { apps, categories, featured, loading } = useDirectory();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { canInstall, install } = usePwaInstall();
  const [category, setCategory] = useState('all');
  const [country, setCountry] = useState(profile?.country_code || 'ALL');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return apps.filter((app) => {
      const categoryOk = category === 'all' || app.category_id === category;
      const countryOk = country === 'ALL' || app.supported_countries.includes('ALL') || app.supported_countries.includes(country);
      const searchOk = !needle || [app.name, app.short_description_ar, app.short_description_en, app.developer_name || ''].join(' ').toLowerCase().includes(needle);
      return categoryOk && countryOk && searchOk;
    });
  }, [apps, category, country, query]);

  return (
    <div className="page-container py-6 sm:py-9">
      <section className="hero-panel relative overflow-hidden rounded-[2rem] px-5 py-7 sm:px-8 sm:py-10">
        <div className="decor-orbit hero-orbit-a" aria-hidden="true" />
        <div className="decor-orbit hero-orbit-b" aria-hidden="true" />
        <div className="relative max-w-3xl">
          <div className="eyebrow-badge mb-4 inline-flex items-center gap-2">
            <BadgeCheck className="h-4 w-4" />
            {language === 'ar' ? 'متصفح منظومة Salla' : 'Salla ecosystem browser'}
          </div>

          <h1 className="hero-title max-w-3xl">
            {language === 'ar' ? 'كل تطبيقات Salla والويب في تجربة واحدة أسرع' : 'Salla apps and the web in one faster experience'}
          </h1>

          <p className="muted-text mt-4 max-w-2xl text-sm font-bold leading-7 sm:text-base">
            {language === 'ar'
              ? 'ابحث في دليل التطبيقات المعتمدة أثناء الكتابة، وثبت المفضلة، واستخدم بحث Google مباشرة عند الحاجة.'
              : 'Search approved apps as you type, pin your favorites, and open Google search directly when you need the wider web.'}
          </p>

          <div className="mt-6">
            <SearchBar value={query} onChange={setQuery} />
            <p className="muted-text mt-2 text-[10px] font-bold sm:text-[11px]">
              {language === 'ar'
                ? 'نتائج تطبيقات Salla تظهر مباشرة هنا. زر بحث الويب يفتح Google خارج الإطار المضمن.'
                : 'Salla app results appear here instantly. Web search opens Google outside the embedded frame.'}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {canInstall && (
              <button className="primary-button" onClick={() => void install()}>
                <Download className="h-4 w-4" />
                {language === 'ar' ? 'تثبيت المتصفح' : 'Install browser'}
              </button>
            )}
            <Link to="/submit" className="secondary-button">
              <Send className="h-4 w-4" />
              {language === 'ar' ? 'طلب إدراج تطبيق' : 'Submit an app'}
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [ShieldCheck, language === 'ar' ? 'مراجعة قبل النشر' : 'Reviewed first', language === 'ar' ? 'كل تطبيق يمر بالمراجعة' : 'Every app is reviewed'],
          [SearchCheck, language === 'ar' ? 'بحث أسرع' : 'Faster search', language === 'ar' ? 'الدليل أولا ثم الويب' : 'Directory first, then web'],
          [Globe2, language === 'ar' ? 'حسب الدولة' : 'By country', language === 'ar' ? 'تطبيقات مناسبة لموقعك' : 'Relevant apps for you'],
          [Rocket, language === 'ar' ? 'خفيف وقابل للتثبيت' : 'Light & installable', language === 'ar' ? 'PWA سريع بدون مؤثرات ثقيلة' : 'Fast PWA without heavy effects'],
        ].map(([Icon, title, text]) => {
          const I = Icon as typeof ShieldCheck;
          return (
            <div key={String(title)} className="mini-feature">
              <div className="soft-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"><I className="h-5 w-5" /></div>
              <div className="min-w-0">
                <p className="text-xs font-black sm:text-sm">{String(title)}</p>
                <p className="muted-text mt-1 text-[10px] font-bold sm:text-xs">{String(text)}</p>
              </div>
            </div>
          );
        })}
      </section>

      {featured.length > 0 && !query && category === 'all' && (
        <section className="mt-9">
          <SectionTitle
            icon={Rocket}
            title={language === 'ar' ? 'تطبيقات مميزة' : 'Featured apps'}
            description={language === 'ar' ? 'اختيارات بارزة من منظومة Salla' : 'Highlighted apps from the Salla ecosystem'}
          />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {featured.slice(0, 6).map((app) => (
              <AppCard key={app.id} app={app} favorite={favoriteIds.has(app.id)} onFavorite={user ? () => void toggleFavorite(app.id) : undefined} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-9">
        <SectionTitle
          icon={LayoutGrid}
          title={language === 'ar' ? 'استكشف التطبيقات' : 'Explore apps'}
          description={language === 'ar' ? 'فلتر التطبيقات حسب القسم والدولة' : 'Filter by category and country'}
          action={
            <select value={country} onChange={(event) => setCountry(event.target.value)} className="select-compact">
              {countries.map((item) => <option key={item.code} value={item.code}>{language === 'ar' ? item.ar : item.en}</option>)}
            </select>
          }
        />
        <CategoryStrip categories={categories} selected={category} onSelect={setCategory} />

        {loading ? (
          <div className="grid gap-3 pt-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton-card h-48 rounded-[1.65rem]" />)}
          </div>
        ) : filtered.length ? (
          <div className="grid gap-3 pt-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((app) => (
              <AppCard key={app.id} app={app} favorite={favoriteIds.has(app.id)} onFavorite={user ? () => void toggleFavorite(app.id) : undefined} />
            ))}
          </div>
        ) : (
          <div className="empty-panel mt-4">{language === 'ar' ? 'لا توجد تطبيقات مطابقة حاليا.' : 'No matching apps right now.'}</div>
        )}
      </section>
    </div>
  );
}
