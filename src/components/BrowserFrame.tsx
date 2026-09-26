import { ExternalLink, Home, LoaderCircle, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { safeHostname } from '../lib/url';

export function BrowserFrame({ url, title }: { url: string; title?: string }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [frameKey, setFrameKey] = useState(0);

  return <div className="browser-frame-shell browser-frame-immersive">
    <div className="browser-toolbar">
      <button className="browser-tool" onClick={() => navigate('/')} aria-label={language === 'ar' ? 'الرئيسية' : 'Home'}><Home className="h-4 w-4" /></button>
      <button className="browser-tool" onClick={() => { setLoading(true); setFrameKey((key) => key + 1); }} aria-label={language === 'ar' ? 'تحديث' : 'Refresh'}><RefreshCw className="h-4 w-4" /></button>
      <div className="browser-address min-w-0 flex-1"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" /><div className="min-w-0"><div className="truncate text-[11px] font-black">{title || safeHostname(url)}</div><div className="muted-text truncate text-[9px] font-bold" dir="ltr">{safeHostname(url)}</div></div></div>
      <a className="browser-tool" href={url} target="_blank" rel="noreferrer" aria-label={language === 'ar' ? 'فتح خارج التطبيق' : 'Open externally'}><ExternalLink className="h-4 w-4" /></a>
      <button className="browser-tool" onClick={() => navigate('/')} aria-label={language === 'ar' ? 'إغلاق' : 'Close'}><X className="h-4 w-4" /></button>
    </div>
    <div className="browser-viewport relative flex-1 overflow-hidden bg-white">
      {loading && <div className="browser-loading absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"><LoaderCircle className="browser-loader-icon h-8 w-8 text-cyan-400" /><span className="text-xs font-black">{language === 'ar' ? 'جاري الفتح' : 'Loading'}</span></div>}
      <iframe key={frameKey} src={url} title={title || 'Salla Browser'} onLoad={() => setLoading(false)} className="browser-iframe w-full border-0 bg-white" sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads" referrerPolicy="strict-origin-when-cross-origin" />
    </div>
  </div>;
}
