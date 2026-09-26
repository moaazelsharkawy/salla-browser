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
  const [params]=useSearchParams(); const{language}=useLanguage(); const{user}=useAuth(); const[app,setApp]=useState<DirectoryApp|null>(null); const appSlug=params.get('app'); const[loading,setLoading]=useState(Boolean(appSlug));
  useEffect(()=>{if(!appSlug){setLoading(false);return}const run=async()=>{const result=!isSupabaseConfigured?demoApps.find(i=>i.slug===appSlug)??null:((await supabase.from('apps').select('*').eq('slug',appSlug).eq('status','published').maybeSingle()).data as DirectoryApp|null);setApp(result);if(result)void markAppOpened(user?.id,result);setLoading(false)};void run()},[appSlug,user?.id]);
  const ar=language==='ar';
  if(loading)return <div className="page-container py-20 text-center muted-text"><span className="soft-spinner"/>{ar?'جاري فتح التطبيق':'Opening app'}</div>;
  if(!app)return <div className="page-container py-16"><section className="content-panel mx-auto max-w-xl p-7 text-center"><Globe2 className="mx-auto h-9 w-9 text-cyan-300"/><h1 className="mt-4 text-xl font-black">{ar?'التطبيق غير متاح داخل الدليل':'This app is not available in the directory'}</h1><Link to="/explore" className="primary-button mt-5 inline-flex">{ar?'استكشف التطبيقات':'Explore apps'}</Link></section></div>;
  if(app.embed_mode==='external')return <div className="page-container py-16"><section className="content-panel mx-auto max-w-xl p-7 text-center"><ExternalLink className="mx-auto h-9 w-9 text-cyan-300"/><h1 className="mt-4 text-xl font-black">{ar?'هذا التطبيق يفتح في نافذة مستقلة':'This app opens separately'}</h1><p className="muted-text mt-2 text-sm font-bold leading-7">{ar?'تم ضبطه للفتح الخارجي لضمان أفضل توافق':'It is configured to open externally for best compatibility.'}</p><a href={app.website_url} target="_blank" rel="noreferrer" className="primary-button mt-5 inline-flex"><Globe2/>{ar?'فتح التطبيق':'Open app'}</a></section></div>;
  return <div className="browser-page-wrap"><BrowserFrame url={app.website_url} title={app.name} appId={app.id} appName={app.name} mode={app.embed_mode}/></div>;
}
