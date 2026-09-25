import { AlertTriangle, ExternalLink, Globe2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BrowserFrame } from '../components/BrowserFrame';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { demoApps } from '../lib/demo';
import { markAppOpened } from '../lib/recent';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { buildSearchUrl, normalizeUrl } from '../lib/url';
import type { DirectoryApp } from '../types';

export default function BrowserPage() {
  const [params] = useSearchParams();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [app, setApp] = useState<DirectoryApp | null>(null);
  const [loading, setLoading] = useState(Boolean(params.get('app')));
  const appSlug = params.get('app');

  useEffect(() => {
    if (!appSlug) return;
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

  const directUrl = params.get('url');
  const query = params.get('q');
  const targetUrl = useMemo(() => app?.website_url || (directUrl ? normalizeUrl(directUrl) : null) || (query ? buildSearchUrl(query) : null), [app, directUrl, query]);

  if (loading) return <div className="page-container py-20 text-center text-slate-400">Loading...</div>;
  if (!targetUrl) return <div className="page-container py-16"><div className="empty-panel">{language === 'ar' ? 'الرابط غير صالح.' : 'Invalid URL.'}</div></div>;

  if (app?.embed_mode === 'external') {
    return <div className="page-container py-16"><div className="content-panel mx-auto max-w-xl p-7 text-center"><ExternalLink className="mx-auto h-9 w-9 text-cyan-300" /><h1 className="mt-4 text-xl font-black">{language === 'ar' ? 'يفتح هذا التطبيق خارج الإطار المضمن' : 'This app opens outside the embedded frame'}</h1><p className="mt-2 text-sm font-semibold leading-7 text-slate-400">{language === 'ar' ? 'تم ضبط التطبيق بهذه الطريقة لضمان التوافق والأمان.' : 'This app is configured this way for compatibility and security.'}</p><a href={targetUrl} target="_blank" rel="noreferrer" className="primary-button mt-5 inline-flex"><Globe2 className="h-4 w-4" />{language === 'ar' ? 'فتح الآن' : 'Open now'}</a></div></div>;
  }

  return <div className="mx-auto max-w-[1600px] px-0 sm:px-3 sm:py-3">
    {query && <div className="mx-3 mb-2 flex items-start gap-2 rounded-2xl bg-amber-400/[0.07] p-3 text-[11px] font-bold leading-5 text-amber-100 sm:mx-0"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{language === 'ar' ? 'نتائج Google قد تمنع التضمين داخل PWA. استخدم زر الفتح الخارجي إذا ظهرت صفحة فارغة.' : 'Google results may block PWA embedding. Use external open if the page is blank.'}</div>}
    <BrowserFrame url={targetUrl} title={app?.name || query || undefined} />
  </div>;
}
