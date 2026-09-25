import { Download, Languages, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { AccountDialog } from './AccountDialog';
import { Brand } from './Brand';

export function Header() {
  const { user } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { canInstall, install } = usePwaInstall();
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <header className="app-header sticky top-0 z-40">
      <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="min-w-0" aria-label="Salla Browser home">
          <Brand />
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          {canInstall && (
            <button className="header-action hidden md:inline-flex" onClick={() => void install()}>
              <Download className="h-[18px] w-[18px]" />
              <span>{language === 'ar' ? 'تثبيت' : 'Install'}</span>
            </button>
          )}

          <button
            className="header-icon"
            onClick={toggleLanguage}
            title={language === 'ar' ? 'English' : 'العربية'}
            aria-label={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            <Languages className="h-5 w-5" />
          </button>

          <button className="header-action account-trigger" onClick={() => setAccountOpen(true)}>
            <UserRound className="h-5 w-5" />
            <span>{language === 'ar' ? 'حسابي' : 'Account'}</span>
            <span className={`account-status-dot ${user ? 'is-online' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      <AccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} />
    </header>
  );
}
