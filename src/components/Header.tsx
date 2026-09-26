import { Languages, Search, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { AccountDialog } from './AccountDialog';
import { Brand } from './Brand';
import { QuickSearchDialog } from './QuickSearchDialog';

export function Header() {
  const { user } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 10);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <header className={`app-header fixed inset-x-0 top-0 z-40 ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="header-inner mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-2 px-3 sm:h-[72px] sm:px-6">
        <Link to="/" className="brand-link min-w-0 shrink" aria-label="Salla Browser home"><Brand /></Link>

        <div className="header-actions flex shrink-0 items-center gap-2">
          <button className="header-icon" onClick={() => setSearchOpen(true)} aria-label={language === 'ar' ? 'بحث سريع' : 'Quick search'} title={language === 'ar' ? 'بحث سريع' : 'Quick search'}><Search className="h-5 w-5" /></button>
          <button className="header-icon" onClick={toggleLanguage} title={language === 'ar' ? 'English' : 'العربية'} aria-label={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}><Languages className="h-5 w-5" /></button>
          <button className="header-action account-trigger" onClick={() => setAccountOpen(true)}>
            <UserRound className="h-5 w-5" />
            <span>{language === 'ar' ? 'حسابي' : 'Account'}</span>
            <span className={`account-status-dot ${user ? 'is-online' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      <QuickSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} />
    </header>
  );
}
