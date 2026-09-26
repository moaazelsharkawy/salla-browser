import { ArrowLeft, ArrowRight, ExternalLink, Home, LoaderCircle, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { safeHostname } from '../lib/url';

export function BrowserFrame({ url, title }: { url: string; title?: string }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [frameKey, setFrameKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setSlow(false);
    const timer = window.setTimeout(() => setSlow(true), 9000);
    return () => window.clearTimeout(timer);
  }, [frameKey, url]);

  const retry = () => { setSlow(false); setLoading(true); setFrameKey((key) => key + 1); };

  return <div className="browser-frame-shell browser-frame-immersive">
    <div className="browser-toolbar browser-toolbar-v16">
      <button className="browser-tool" onClick={() => navigate(-1)} aria-label={language === 'ar' ? 'رجوع' : 'Back'}><ArrowLeft /></button>
      <button className="browser-tool" onClick={() => navigate(1)} aria-label={language === 'ar' ? 'تقدم' : 'Forward'}><ArrowRight /></button>
      <button className="browser-tool" onClick={retry} aria-label={language === 'ar' ? 'تحديث' : 'Refresh'}><RefreshCw /></button>
      <div className="browser-address min-w-0 flex-1"><ShieldCheck className="shrink-0 text-emerald-400" /><div className="min-w-0"><div className="truncate text-[11px] font-black">{title || safeHostname(url)}</div><div className="muted-text truncate text-[9px] font-bold" dir="ltr">{safeHostname(url)}</div></div></div>
      <a className="browser-tool" href={url} target="_blank" rel="noreferrer" aria-label={language === 'ar' ? 'فتح خارجيا' : 'Open externally'}><ExternalLink /></a>
      <button className="browser-tool" onClick={() => navigate('/')} aria-label={language === 'ar' ? 'الرئيسية' : 'Home'}><Home /></button>
      <button className="browser-tool" onClick={() => navigate('/')} aria-label={language === 'ar' ? 'إغلاق' : 'Close'}><X /></button>
    </div>
    <div className="browser-viewport relative flex-1 overflow-hidden bg-white">
      {loading && <div className="browser-loading absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-5 text-center"><LoaderCircle className="browser-loader-icon h-8 w-8 text-cyan-400" /><span className="text-xs font-black">{language === 'ar' ? 'جاري فتح التطبيق' : 'Opening app'}</span>{slow && <div className="browser-slow-card"><strong>{language === 'ar' ? 'يستغرق التطبيق وقتا أطول من المعتاد' : 'This app is taking longer than usual'}</strong><p>{language === 'ar' ? 'يمكنك إعادة المحاولة أو فتح التطبيق خارج المتصفح' : 'Retry or open the app in a separate browser window.'}</p><div><button className="secondary-button" onClick={retry}><RefreshCw />{language === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button><a className="primary-button" href={url} target="_blank" rel="noreferrer"><ExternalLink />{language === 'ar' ? 'فتح خارجيا' : 'Open externally'}</a></div></div>}</div>}
      <iframe key={frameKey} src={url} title={title || 'Salla Browser'} onLoad={() => { setLoading(false); setSlow(false); }} className="browser-iframe w-full border-0 bg-white" sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads allow-top-navigation-by-user-activation allow-top-navigation-to-custom-protocols" referrerPolicy="strict-origin-when-cross-origin" />
    </div>
  </div>;
}
