import { Activity, Bookmark, Clock3, ClipboardList, Download, Flag, History, Languages, LayoutDashboard, LogIn, LogOut, MapPin, Moon, Send, ShieldCheck, Sun, UserPlus, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCountry } from '../contexts/CountryContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { getCountry } from '../lib/countries';
import { CountryPickerModal } from './CountryPicker';

export function AccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, profile, isAdmin, isDeveloper, signOut } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { country, setCountry } = useCountry();
  const { canInstall, install } = usePwaInstall();
  const [countryOpen, setCountryOpen] = useState(false);
  const ar = language === 'ar';
  const selectedCountry = getCountry(country);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => { if (!open) setCountryOpen(false); }, [open]);
  if (!open || typeof document === 'undefined') return null;

  const modal = <>
    <div className="account-overlay" role="presentation" onMouseDown={onClose}>
      <section className="account-dialog" role="dialog" aria-modal="true" aria-label={ar ? 'حسابي' : 'My account'} onMouseDown={(event) => event.stopPropagation()}>
        <div className="account-dialog-head">
          <div className="min-w-0"><p className="text-xl font-black">{ar ? 'حسابي' : 'My account'}</p><p className="muted-text mt-1 text-xs font-bold">{ar ? 'إعدادات المتصفح وخيارات المطورين' : 'Browser settings and developer options'}</p></div>
          <button className="icon-button h-10 w-10 shrink-0" onClick={onClose} aria-label={ar ? 'إغلاق' : 'Close'}><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-4 space-y-1.5">
          <Link to="/favorites" onClick={onClose} className="menu-row"><Bookmark className="h-5 w-5 text-cyan-300" /><span>{ar ? 'التطبيقات المثبتة' : 'Pinned apps'}</span></Link>
          <Link to="/updates" onClick={onClose} className="menu-row"><Clock3 className="h-5 w-5 text-cyan-300" /><span>{ar ? 'آخر تحديثات التطبيقات' : 'App updates'}</span></Link>
          <Link to="/history" onClick={onClose} className="menu-row"><History className="h-5 w-5 text-cyan-300" /><span>{ar ? 'سجل التصفح' : 'Browsing history'}</span></Link>
          <Link to="/status" onClick={onClose} className="menu-row"><Activity className="h-5 w-5 text-cyan-300" /><span>{ar ? 'حالة التطبيقات' : 'App status'}</span></Link>
          <button className="menu-row w-full" onClick={() => setCountryOpen(true)}><MapPin className="h-5 w-5 text-cyan-300" /><span className="flex-1 text-start">{ar ? 'الدولة' : 'Country'}</span><span className="menu-value">{selectedCountry.flag} {ar ? selectedCountry.ar : selectedCountry.en}</span></button>
          <button className="menu-row w-full" onClick={toggleLanguage}><Languages className="h-5 w-5 text-cyan-300" /><span className="flex-1 text-start">{ar ? 'اللغة' : 'Language'}</span><span className="menu-value">{ar ? 'English' : 'العربية'}</span></button>
          <button className="menu-row w-full" onClick={toggleTheme}>{theme === 'dark' ? <Sun className="h-5 w-5 text-violet-300" /> : <Moon className="h-5 w-5 text-violet-300" />}<span className="flex-1 text-start">{ar ? 'المظهر' : 'Appearance'}</span><span className="menu-value">{ar ? (theme === 'dark' ? 'فاتح' : 'داكن') : theme === 'dark' ? 'Light' : 'Dark'}</span></button>
          {canInstall && <button className="menu-row w-full" onClick={async () => { await install(); onClose(); }}><Download className="h-5 w-5 text-emerald-300" /><span>{ar ? 'تثبيت Salla Browser' : 'Install Salla Browser'}</span></button>}
        </div>

        <div className="account-divider" />
        <div className="developer-panel">
          <div className="developer-panel-title"><ShieldCheck className="h-5 w-5" /><div><strong>{ar ? 'للمطورين فقط' : 'Developers only'}</strong><p>{ar ? 'الحساب غير مطلوب للتصفح أو تثبيت التطبيقات تحتاجه فقط لإدراج تطبيق ومتابعة مراجعته' : 'No account is needed to browse or pin apps. Sign in only to submit and track an app listing.'}</p></div></div>
          {isDeveloper ? <div className="mt-3 space-y-1.5">
            <Link to="/profile" onClick={onClose} className="menu-row"><UserRound className="h-5 w-5 text-violet-300" /><span>{ar ? 'حساب المطور' : 'Developer profile'}</span></Link>
            <Link to="/my-submissions" onClick={onClose} className="menu-row"><ClipboardList className="h-5 w-5 text-violet-300" /><span>{ar ? 'تطبيقاتي وطلبات المراجعة' : 'My apps and reviews'}</span></Link>
            <Link to="/submit" onClick={onClose} className="menu-row"><Send className="h-5 w-5 text-violet-300" /><span>{ar ? 'إدراج تطبيق جديد' : 'Submit an app'}</span></Link>
            {isAdmin && <Link to="/admin" onClick={onClose} className="menu-row"><LayoutDashboard className="h-5 w-5 text-violet-300" /><span>{ar ? 'لوحة الإدارة' : 'Admin dashboard'}</span></Link>}
            {isAdmin && <Link to="/admin/reports" onClick={onClose} className="menu-row"><Flag className="h-5 w-5 text-violet-300" /><span>{ar ? 'بلاغات التطبيقات' : 'App reports'}</span></Link>}
          </div> : <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Link to="/login" onClick={onClose} className="primary-button"><LogIn className="h-4 w-4" />{ar ? 'دخول المطورين' : 'Developer sign in'}</Link>
            <Link to="/register" onClick={onClose} className="secondary-button"><UserPlus className="h-4 w-4" />{ar ? 'إنشاء حساب مطور' : 'Create developer account'}</Link>
          </div>}
          {user && !isDeveloper && <p className="form-message mt-3">{ar ? 'هذا الحساب قديم وغير مفعل كمطور استخدم دخول المطورين لتفعيل صلاحيات الإدراج' : 'This legacy account is not enabled as a developer. Use developer sign in to enable listing access.'}</p>}
        </div>

        {profile?.role === 'developer' && <div className="developer-badge mt-3"><ShieldCheck className="h-4 w-4" />{ar ? 'حساب مطور' : 'Developer account'}</div>}
        {user && <button className="danger-button mt-3 w-full" onClick={async () => { await signOut(); onClose(); }}><LogOut className="h-4 w-4" />{ar ? 'تسجيل الخروج' : 'Sign out'}</button>}
      </section>
    </div>
    <CountryPickerModal open={countryOpen} value={country} onChange={setCountry} onClose={() => setCountryOpen(false)} />
  </>;

  return createPortal(modal, document.body);
}
