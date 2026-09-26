import { BadgeCheck, ExternalLink, Flame, Heart, Megaphone, RadioTower, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { isActiveUntil } from '../lib/promotions';
import { shareApp } from '../lib/share';
import type { DirectoryApp } from '../types';
import { StatusBadge } from './StatusBadge';

export function AppCard({ app, favorite = false, onFavorite }: { app: DirectoryApp; favorite?: boolean; onFavorite?: () => void }) {
  const { language } = useLanguage();
  const homeAd = isActiveUntil(app.home_ad_until);
  const boosted = isActiveUntil(app.boost_until);
  const promoted = homeAd || boosted;

  return <article className={`app-card app-card-v16 group relative overflow-hidden rounded-[1.45rem] p-4 sm:p-5 ${promoted ? 'app-card-promoted' : ''}`}>
    <div className="relative flex gap-3.5">
      <div className="app-icon flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[1.1rem]">{app.icon_url ? <img src={app.icon_url} alt="" className="h-full w-full object-cover" /> : <RadioTower className="h-6 w-6 text-cyan-300" />}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-1.5"><h3 className="truncate text-[15px] font-black sm:text-base">{app.name}</h3>{app.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-cyan-300" strokeWidth={2.5} />}{promoted && <span className={`promoted-badge ${homeAd ? 'promoted-badge-ad' : ''}`}>{homeAd ? <Megaphone /> : <Flame />}{homeAd ? (language === 'ar' ? 'إعلان' : 'Sponsored') : (language === 'ar' ? 'مروج' : 'Promoted')}</span>}</div><p className="muted-text mt-1 line-clamp-2 text-[11px] font-bold leading-5 sm:text-xs">{language === 'ar' ? app.short_description_ar : app.short_description_en}</p></div>
          <div className="app-card-icon-actions"><button type="button" className="icon-button compact-card-icon" onClick={() => void shareApp(app, language)} aria-label={language === 'ar' ? 'مشاركة التطبيق' : 'Share app'}><Share2 /></button>{onFavorite && <button type="button" aria-label={language === 'ar' ? 'المفضلة' : 'Favorite'} onClick={onFavorite} className={`icon-button favorite-button ${favorite ? 'text-rose-300' : ''}`}><Heart className={`${favorite ? 'fill-current' : ''}`} /></button>}</div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2"><StatusBadge status={app.health_status} /></div>
      </div>
    </div>
    <div className="relative mt-4 flex gap-2"><Link to={`/apps/${app.slug}`} className="secondary-button flex-1">{language === 'ar' ? 'التفاصيل' : 'Details'}</Link><Link to={`/browse?app=${encodeURIComponent(app.slug)}`} className="primary-button flex-1"><ExternalLink />{language === 'ar' ? 'فتح' : 'Open'}</Link></div>
  </article>;
}
