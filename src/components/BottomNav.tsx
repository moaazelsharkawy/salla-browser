import { Bookmark, Compass, Home, Send, UserRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export function BottomNav() {
  const { language } = useLanguage();
  const items = [
    { to: '/', icon: Home, ar: 'الرئيسية', en: 'Home' },
    { to: '/explore', icon: Compass, ar: 'استكشف', en: 'Explore' },
    { to: '/favorites', icon: Bookmark, ar: 'المثبتة', en: 'Pinned' },
    { to: '/submit', icon: Send, ar: 'إدراج', en: 'Submit' },
    { to: '/profile', icon: UserRound, ar: 'حسابي', en: 'Account' },
  ];

  return (
    <nav className="bottom-nav md:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'bottom-nav-active' : ''}`}
        >
          <item.icon className="h-5 w-5" />
          <span>{language === 'ar' ? item.ar : item.en}</span>
        </NavLink>
      ))}
    </nav>
  );
}
