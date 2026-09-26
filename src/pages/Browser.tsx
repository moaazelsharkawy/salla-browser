import { ExternalLink, Globe2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BrowserFrame } from '../components/BrowserFrame';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { demoApps } from '../lib/demo';
import { markAppOpened } from '../lib/recent';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { DirectoryApp } from '../types';

export default function BrowserPage() {
  const [params] = useSearchParams();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [app, setApp] = useState<DirectoryApp | null>(null);
  const appSlug = params.get('app');
  const [loading, setLoading] = useState(Boolean(appSlug));

  useEffect(() => {
    if (!appSlug) {
      setLoading(false);
      return;
    }

    const run = async () => {
      const result = !isSupabaseConfigured
        ? demoApps.find((item) => item.slug === appSlug) ?? null
        : ((await supabase.from('apps').select('*').eq('slug', appSlug).eq('status', 'published').maybeSingle()).data as DirectoryApp | null);
      setApp(result);
      if (result) void markAppOpened(user?.id, result.id);
      setLoading(false);
    };

    void run();
  }, [appSlug, user?.id]);

  if (loading) return <div className="page-container py-20 text-center muted-text"><span className="soft-spinner" />{language === 'ar' ? 'جاري فتح التطبيق' : 'Loading app'}</div>;

  if (!app) {
    return (
      <div className="page-container py-16">
        <section className="content-panel mx-auto max-w-xl p-7 text-center">
          <Globe2 className="mx-auto h-9 w-9 text-cyan-300" />
          <h1 className="mt-4 text-xl font-black">{language === 'ar' ? 'التصفح المضمن مخصص لتطبيقات الدليل' : 'Embedded browsing is reserved for directory apps'}</h1>
          <p className="muted-text mt-2 text-sm font-bold leading-7">
            {language === 'ar'
              ? 'بحث الويب وروابط المواقع العامة تفتح الآن مباشرة في المتصفح الخارجي لتجنب الصفحات التي تمنع التضمين'
              : 'Web search and general links now open directly in your browser to avoid sites that block embedding.'}
          </p>
          <Link to="/explore" className="primary-button mt-5 inline-flex">
            {language === 'ar' ? 'استكشف التطبيقات' : 'Explore apps'}
          </Link>
        </section>
      </div>
    );
  }

  if (app.embed_mode === 'external') {
    return (
      <div className="page-container py-16">
        <section className="content-panel mx-auto max-w-xl p-7 text-center">
          <ExternalLink className="mx-auto h-9 w-9 text-cyan-300" />
          <h1 className="mt-4 text-xl font-black">{language === 'ar' ? 'هذا التطبيق يفتح مباشرة' : 'This app opens directly'}</h1>
          <p className="muted-text mt-2 text-sm font-bold leading-7">
            {language === 'ar' ? 'تم ضبطه للفتح خارج الإطار المضمن لضمان أفضل توافق' : 'It is configured to open outside the embedded frame for best compatibility.'}
          </p>
          <a href={app.website_url} target="_blank" rel="noreferrer" className="primary-button mt-5 inline-flex">
            <Globe2 className="h-4 w-4" />
            {language === 'ar' ? 'فتح التطبيق' : 'Open app'}
          </a>
        </section>
      </div>
    );
  }

  return (
    <div className="browser-page-wrap">
      <BrowserFrame url={app.website_url} title={app.name} />
    </div>
  );
}
