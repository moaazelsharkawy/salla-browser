import { ExternalLink, Home, LoaderCircle, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { safeHostname } from '../lib/url';

export function BrowserFrame({ url, title }: { url: string; title?: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [frameKey, setFrameKey] = useState(0);

  return (
    <div className="browser-frame-shell">
      <div className="browser-toolbar">
        <button className="browser-tool" onClick={() => navigate('/')} aria-label="home">
          <Home className="h-4 w-4" />
        </button>
        <button
          className="browser-tool"
          onClick={() => {
            setLoading(true);
            setFrameKey((key) => key + 1);
          }}
          aria-label="refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        <div className="browser-address min-w-0 flex-1">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" />
          <div className="min-w-0">
            <div className="truncate text-[11px] font-black">{title || safeHostname(url)}</div>
            <div className="muted-text truncate text-[9px] font-bold" dir="ltr">{safeHostname(url)}</div>
          </div>
        </div>

        <a className="browser-tool" href={url} target="_blank" rel="noreferrer" aria-label="open externally">
          <ExternalLink className="h-4 w-4" />
        </a>
        <button className="browser-tool" onClick={() => navigate('/')} aria-label="close">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative min-h-[65vh] flex-1 overflow-hidden bg-white">
        {loading && (
          <div className="browser-loading absolute inset-0 z-10 flex items-center justify-center">
            <LoaderCircle className="h-7 w-7 text-cyan-300" />
          </div>
        )}
        <iframe
          key={frameKey}
          src={url}
          title={title || 'Browser'}
          onLoad={() => setLoading(false)}
          className="h-[calc(100dvh-150px)] w-full border-0 bg-white"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}
