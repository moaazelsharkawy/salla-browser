import { CloudOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getRecentApps } from '../lib/recent';

export function OfflinePanel() {
  const { language } = useLanguage();
  const [online, setOnline] = useState(() => navigator.onLine);
  const ar = language === 'ar';

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (online) return null;
  const recent = getRecentApps().slice(0, 4);

  return <div className="offline-panel" role="status">
    <div className="offline-panel-head"><div className="offline-icon"><CloudOff /></div><div><strong>{ar ? 'أنت غير متصل بالإنترنت' : 'You are offline'}</strong><p>{ar ? 'يمكنك مشاهدة اختصارات آخر التطبيقات وسيعود التصفح عند استعادة الاتصال' : 'You can still see your recent app shortcuts. Browsing resumes when you reconnect.'}</p></div></div>
    {recent.length > 0 && <div className="offline-recent">{recent.map((app) => <Link key={app.id} to={`/apps/${app.slug}`} className="offline-recent-item">{app.icon_url ? <img src={app.icon_url} alt="" /> : <span />}{app.name}</Link>)}</div>}
    <button className="secondary-button offline-retry" onClick={() => window.location.reload()}><RefreshCw />{ar ? 'إعادة المحاولة' : 'Try again'}</button>
  </div>;
}
