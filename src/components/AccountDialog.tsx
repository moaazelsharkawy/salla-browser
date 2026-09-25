import { Bookmark, Languages, LayoutDashboard, LogIn, LogOut, Moon, Send, ShieldCheck, Sun, UserRound, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export function AccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  if (!open) return null;

  const items = user ? [
    { to: '/profile', labelAr: 'حسابي', labelEn: 'My account', icon: UserRound },
    { to: '/favorites', labelAr: 'التطبيقات المثبتة', labelEn: 'Pinned apps', icon: Bookmark },
    { to: '/submit', labelAr: 'طلب إدراج تطبيق', labelEn: 'Submit an app', icon: Send }
  ] : [];

  return (
    <div className="account-overlay" role="presentation" onMouseDown={onClose}>
      <div className="account-dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.055] pb-4">
          <div className="min-w-0">
            <p className="text-lg font-black">{language === 'ar' ? 'حسابي' : 'My account'}</p>
            <p className="mt-1 truncate text-xs font-semibold text-slate-400">{user?.email ?? (language === 'ar' ? 'سجل الدخول لحفظ تجربتك' : 'Sign in to save your experience')}</p>
          </div>
          <button className="icon-button h-10 w-10" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>

        {user ? (
          <div className="mt-3 space-y-1">
            {items.map((item) => <Link key={item.to} to={item.to} onClick={onClose} className="menu-row"><item.icon className="h-5 w-5 text-cyan-300" />{language === 'ar' ? item.labelAr : item.labelEn}</Link>)}
            {isAdmin && <Link to="/admin" onClick={onClose} className="menu-row"><LayoutDashboard className="h-5 w-5 text-violet-300" />{language === 'ar' ? 'لوحة الإدارة' : 'Admin dashboard'}</Link>}
          </div>
        ) : (
          <Link to="/login" onClick={onClose} className="primary-button mt-4 w-full"><LogIn className="h-4 w-4" />{language === 'ar' ? 'تسجيل الدخول' : 'Sign in'}</Link>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.055] pt-4">
          <button onClick={toggleLanguage} className="secondary-button"><Languages className="h-4 w-4" />{language === 'ar' ? 'English' : 'العربية'}</button>
          <button onClick={toggleTheme} className="secondary-button">{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{language === 'ar' ? (theme === 'dark' ? 'فاتح' : 'داكن') : (theme === 'dark' ? 'Light' : 'Dark')}</button>
        </div>

        {user && (
          <button className="danger-button mt-3 w-full" onClick={async () => { await signOut(); onClose(); }}><LogOut className="h-4 w-4" />{language === 'ar' ? 'تسجيل الخروج' : 'Sign out'}</button>
        )}

        {profile?.role === 'developer' && <div className="mt-3 flex items-center gap-2 rounded-xl bg-cyan-400/[0.06] px-3 py-2 text-[10px] font-black text-cyan-200"><ShieldCheck className="h-4 w-4" />{language === 'ar' ? 'حساب مطور' : 'Developer account'}</div>}
      </div>
    </div>
  );
}
