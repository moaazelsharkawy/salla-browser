import { ExternalLink, Home, LoaderCircle, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { safeHostname } from '../lib/url';

export function BrowserFrame({ url, title }: { url: string; title?: string }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [frameKey, setFrameKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const appOrigin = useMemo(() => {
    try { return new URL(url).origin; } catch { return ''; }
  }, [url]);

  useEffect(() => {
    const notifyResume = () => {
      const target = iframeRef.current?.contentWindow;
      if (!target || !appOrigin) return;
      target.postMessage({ type: 'salla-browser-resume', source: 'salla-browser' }, appOrigin);
    };

    const onFocus = () => notifyResume();
    const onVisibility = () => { if (document.visibilityState === 'visible') notifyResume(); };
    const onMessage = (event: MessageEvent) => {
      if (!appOrigin || event.origin !== appOrigin) return;
      if (event.data?.type !== 'salla-auth-complete') return;
      setLoading(true);
      window.setTimeout(() => setFrameKey((key) => key + 1), 120);
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('message', onMessage);
    };
  }, [appOrigin]);

  return <div className="browser-frame-shell browser-frame-immersive">
    <div className="browser-toolbar">
      <button className="browser-tool" onClick={() => navigate('/')} aria-label={language === 'ar' ? 'الرئيسية' : 'Home'}><Home className="h-5 w-5" /></button>
      <button className="browser-tool" onClick={() => { setLoading(true); setFrameKey((key) => key + 1); }} aria-label={language === 'ar' ? 'تحديث' : 'Refresh'}><RefreshCw className="h-5 w-5" /></button>
      <div className="browser-address min-w-0 flex-1"><ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" /><div className="min-w-0"><div className="truncate text-[11px] font-black">{title || safeHostname(url)}</div><div className="muted-text truncate text-[9px] font-bold" dir="ltr">{safeHostname(url)}</div></div></div>
      <a className="browser-tool" href={url} target="_blank" rel="noreferrer" aria-label={language === 'ar' ? 'فتح خارج التطبيق' : 'Open externally'}><ExternalLink className="h-5 w-5" /></a>
      <button className="browser-tool" onClick={() => navigate('/')} aria-label={language === 'ar' ? 'إغلاق' : 'Close'}><X className="h-5 w-5" /></button>
    </div>
    <div className="browser-viewport relative flex-1 overflow-hidden bg-white">
      {loading && <div className="browser-loading absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"><LoaderCircle className="browser-loader-icon h-8 w-8 text-cyan-400" /><span className="text-xs font-black">{language === 'ar' ? 'جاري الفتح' : 'Loading'}</span></div>}
      <iframe ref={iframeRef} key={frameKey} src={url} title={title || 'Salla Browser'} onLoad={() => setLoading(false)} className="browser-iframe w-full border-0 bg-white" sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads" referrerPolicy="strict-origin-when-cross-origin" />
    </div>
  </div>;
}
