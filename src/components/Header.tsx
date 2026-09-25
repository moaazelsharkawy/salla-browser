import { Languages, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { AccountDialog } from './AccountDialog';
import { Brand } from './Brand';

export function Header() {
  const { user } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <header className="app-header sticky top-0 z-40">
      <div className="header-inner mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
        <Link to="/" className="brand-link min-w-0 shrink" aria-label="Salla Browser home">
          <Brand />
        </Link>

        <div className="header-actions flex shrink-0 items-center gap-2">
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
