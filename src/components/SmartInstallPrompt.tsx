import { Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { getBrowseOpenCount } from '../lib/recent';

const DISMISSED_KEY = 'salla-browser-install-dismissed-at-v1';
const COOLDOWN = 14 * 24 * 60 * 60 * 1000;

function canShowByCooldown() {
  try {
    const value = Number(localStorage.getItem(DISMISSED_KEY) || 0);
    return !value || Date.now() - value > COOLDOWN;
  } catch { return true; }
}

export function SmartInstallPrompt() {
  const { language } = useLanguage();
  const { canInstall, install } = usePwaInstall();
  const [eligible, setEligible] = useState(() => getBrowseOpenCount() >= 3 && canShowByCooldown());
  const [hidden, setHidden] = useState(false);
  const ar = language === 'ar';

  useEffect(() => {
    const update = () => setEligible(getBrowseOpenCount() >= 3 && canShowByCooldown());
    window.addEventListener('salla-recent-updated', update);
    return () => window.removeEventListener('salla-recent-updated', update);
  }, []);

  if (!canInstall || !eligible || hidden) return null;
  const dismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now())); } catch { /* preference only */ }
    setHidden(true);
  };

  return <div className="smart-install-card">
    <div className="smart-install-icon"><Download /></div>
    <div className="min-w-0 flex-1"><strong>{ar ? 'ثبت Salla Browser على جهازك' : 'Install Salla Browser'}</strong><p>{ar ? 'بعد استخدامك للمتصفح يمكنك تثبيته للوصول الأسرع من الشاشة الرئيسية' : 'Install it now for faster access from your home screen.'}</p></div>
    <button className="primary-button" onClick={async () => { if (await install()) setHidden(true); }}><Download />{ar ? 'تثبيت' : 'Install'}</button>
    <button className="icon-button" onClick={dismiss} aria-label={ar ? 'لاحقا' : 'Later'}><X /></button>
  </div>;
}
