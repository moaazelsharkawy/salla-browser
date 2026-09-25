import { ArrowLeft, ArrowRight, ExternalLink, Home, LoaderCircle, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { safeHostname } from '../lib/url';

export function BrowserFrame({ url, title }: { url: string; title?: string }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const frame = useRef<HTMLIFrameElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [frameKey, setFrameKey] = useState(0);

  return (
    <div className="browser-frame-shell">
      <div className="browser-toolbar">
        <div className="flex items-center gap-1">
          <button className="browser-tool" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></button>
          <button className="browser-tool" onClick={() => window.history.forward()}><ArrowRight className="h-4 w-4" /></button>
          <button className="browser-tool" onClick={() => navigate('/')}><Home className="h-4 w-4" /></button>
          <button className="browser-tool" onClick={() => { setLoading(true); setFrameKey((key) => key + 1); }}><RefreshCw className="h-4 w-4" /></button>
        </div>
        <div className="browser-address min-w-0 flex-1">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" />
          <div className="min-w-0"><div className="truncate text-[11px] font-black">{title || safeHostname(url)}</div><div className="truncate text-[9px] font-semibold text-slate-500" dir="ltr">{safeHostname(url)}</div></div>
        </div>
        <div className="flex items-center gap-1">
          <a className="browser-tool" href={url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
          <button className="browser-tool" onClick={() => navigate('/')}><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="browser-notice">
        {language === 'ar' ? 'بعض المواقع تمنع العرض داخل المتصفح المضمن. استخدم زر الفتح الخارجي إذا لم تظهر الصفحة.' : 'Some sites block embedded viewing. Use the external-open button if the page does not load.'}
      </div>
      <div className="relative min-h-[65vh] flex-1 overflow-hidden bg-white">
        {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#08111f]"><LoaderCircle className="h-7 w-7 animate-spin text-cyan-300" /></div>}
        <iframe
          key={frameKey}
          ref={frame}
          src={url}
          title={title || 'Browser'}
          onLoad={() => setLoading(false)}
          className="h-[calc(100dvh-170px)] w-full border-0 bg-white"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}
