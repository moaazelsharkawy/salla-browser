import { BadgeCheck, ExternalLink, Heart, Pin, RadioTower } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import type { DirectoryApp } from '../types';
import { StatusBadge } from './StatusBadge';

export function AppCard({ app, favorite = false, onFavorite }: { app: DirectoryApp; favorite?: boolean; onFavorite?: () => void }) {
  const { language } = useLanguage();

  return (
    <article className="app-card group relative overflow-hidden rounded-[1.65rem] p-4 sm:p-5">
      <div className="decor-orbit decor-orbit-a" aria-hidden="true" />
      <div className="relative flex gap-3.5">
        <div className="app-icon flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[1.2rem]">
          {app.icon_url ? <img src={app.icon_url} alt="" className="h-full w-full object-cover" /> : <RadioTower className="h-6 w-6 text-cyan-300" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="truncate text-[15px] font-black sm:text-base">{app.name}</h3>
                {app.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-cyan-300" strokeWidth={2.5} />}
              </div>
              <p className="muted-text mt-1 line-clamp-2 text-[11px] font-bold leading-5 sm:text-xs">
                {language === 'ar' ? app.short_description_ar : app.short_description_en}
              </p>
            </div>

            {onFavorite && (
              <button type="button" aria-label="favorite" onClick={onFavorite} className={`icon-button favorite-button h-9 w-9 ${favorite ? 'text-rose-300' : ''}`}>
                <Heart className={`h-[18px] w-[18px] ${favorite ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={app.health_status} />
            {app.installable && (
              <span className="pill">
                <Pin className="h-3 w-3" />
                {language === 'ar' ? 'قابل للتثبيت' : 'Installable'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative mt-4 flex gap-2">
        <Link to={`/apps/${app.slug}`} className="secondary-button flex-1">
          {language === 'ar' ? 'التفاصيل' : 'Details'}
        </Link>
        <Link to={`/browse?app=${encodeURIComponent(app.slug)}`} className="primary-button flex-1">
          <ExternalLink className="h-4 w-4" />
          {language === 'ar' ? 'فتح التطبيق' : 'Open app'}
        </Link>
      </div>
    </article>
  );
}
