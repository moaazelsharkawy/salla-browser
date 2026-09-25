import { Download, Languages, Menu, UserRound } from 'lucide-react';
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
    <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-[#08111f]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="min-w-0"><Brand /></Link>
        <div className="flex shrink-0 items-center gap-2">
          {canInstall && <button className="header-action hidden sm:inline-flex" onClick={() => void install()}><Download className="h-4.5 w-4.5" />{language === 'ar' ? 'تثبيت' : 'Install'}</button>}
          <button className="header-icon" onClick={toggleLanguage} title={language === 'ar' ? 'English' : 'العربية'}><Languages className="h-5 w-5" /></button>
          <button className="header-action" onClick={() => setAccountOpen(true)}><UserRound className="h-5 w-5" /><span>{language === 'ar' ? 'حسابي' : 'Account'}</span><span className={`h-2 w-2 rounded-full ${user ? 'bg-emerald-400' : 'bg-slate-600'}`} /></button>
          <button className="header-icon sm:hidden" aria-label="menu" onClick={() => setAccountOpen(true)}><Menu className="h-5 w-5" /></button>
        </div>
      </div>
      <AccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} />
    </header>
  );
}
