import { Activity, Bookmark, Clock3, Compass, Home, RefreshCw } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export function DesktopRail(){const{language}=useLanguage();const ar=language==='ar';const items=[['/',Home,ar?'الرئيسية':'Home'],['/explore',Compass,ar?'استكشف':'Explore'],['/favorites',Bookmark,ar?'المثبتة':'Pinned'],['/history',Clock3,ar?'السجل':'History'],['/updates',RefreshCw,ar?'التحديثات':'Updates'],['/status',Activity,ar?'الحالة':'Status']] as const;return <aside className="desktop-rail" aria-label={ar?'تنقل سريع':'Quick navigation'}>{items.map(([to,Icon,label])=><NavLink key={to} to={to} end={to==='/' } className={({isActive})=>`desktop-rail-item ${isActive?'is-active':''}`} title={label}><Icon/><span>{label}</span></NavLink>)}</aside>}
