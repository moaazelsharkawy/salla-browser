import {
  Bookmark,
  ClipboardList,
  Download,
  Languages,
  LayoutDashboard,
  LogIn,
  LogOut,
  Moon,
  Send,
  ShieldCheck,
  Sun,
  UserRound,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePwaInstall } from '../hooks/usePwaInstall';

export function AccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { canInstall, install } = usePwaInstall();

  if (!open) return null;

  const items = user
    ? [
        { to: '/profile', labelAr: 'الحساب والإعدادات', labelEn: 'Account & settings', icon: UserRound },
        { to: '/favorites', labelAr: 'التطبيقات المثبتة', labelEn: 'Pinned apps', icon: Bookmark },
        { to: '/my-submissions', labelAr: 'طلبات الإدراج', labelEn: 'My submissions', icon: ClipboardList },
        { to: '/submit', labelAr: 'إدراج تطبيق جديد', labelEn: 'Submit an app', icon: Send },
      ]
    : [];

  return (
    <div className="account-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="account-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={language === 'ar' ? 'حسابي' : 'My account'}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="account-dialog-handle" aria-hidden="true" />
        <div className="account-dialog-head">
          <div className="min-w-0">
            <p className="text-xl font-black">{language === 'ar' ? 'حسابي' : 'My account'}</p>
            <p className="muted-text mt-1 truncate text-xs font-bold">
              {user?.email ?? (language === 'ar' ? 'سجل الدخول لحفظ تطبيقاتك وإعداداتك' : 'Sign in to save your apps and settings')}
            </p>
          </div>
          <button className="icon-button h-10 w-10 shrink-0" onClick={onClose} aria-label={language === 'ar' ? 'إغلاق' : 'Close'}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {user ? (
          <div className="mt-4 space-y-1.5">
            {items.map((item) => (
              <Link key={item.to} to={item.to} onClick={onClose} className="menu-row">
                <item.icon className="h-5 w-5 text-cyan-300" />
                <span>{language === 'ar' ? item.labelAr : item.labelEn}</span>
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" onClick={onClose} className="menu-row">
                <LayoutDashboard className="h-5 w-5 text-violet-300" />
                <span>{language === 'ar' ? 'لوحة الإدارة' : 'Admin dashboard'}</span>
              </Link>
            )}
          </div>
        ) : (
          <Link to="/login" onClick={onClose} className="primary-button mt-5 w-full">
            <LogIn className="h-4 w-4" />
            {language === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
          </Link>
        )}

        {canInstall && (
          <button
            className="install-account-row mt-3 w-full"
            onClick={async () => {
              await install();
              onClose();
            }}
          >
            <Download className="h-5 w-5" />
            <span>{language === 'ar' ? 'تثبيت Salla Browser' : 'Install Salla Browser'}</span>
          </button>
        )}

        <div className="account-divider" />

        <div className="grid grid-cols-2 gap-2">
          <button onClick={toggleLanguage} className="secondary-button min-w-0">
            <Languages className="h-4 w-4" />
            <span className="truncate">{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>
          <button onClick={toggleTheme} className="secondary-button min-w-0">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="truncate">
              {language === 'ar' ? (theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن') : theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </span>
          </button>
        </div>

        {profile?.role === 'developer' && (
          <div className="developer-badge mt-3">
            <ShieldCheck className="h-4 w-4" />
            {language === 'ar' ? 'حساب مطور' : 'Developer account'}
          </div>
        )}

        {user && (
          <button
            className="danger-button mt-3 w-full"
            onClick={async () => {
              await signOut();
              onClose();
            }}
          >
            <LogOut className="h-4 w-4" />
            {language === 'ar' ? 'تسجيل الخروج' : 'Sign out'}
          </button>
        )}
      </section>
    </div>
  );
}
