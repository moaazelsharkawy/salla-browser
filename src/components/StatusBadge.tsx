import type { HealthStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const styles: Record<HealthStatus, string> = {
  online: 'bg-emerald-400/10 text-emerald-300',
  maintenance: 'bg-amber-400/10 text-amber-300',
  new: 'bg-cyan-400/10 text-cyan-300',
  updated: 'bg-violet-400/10 text-violet-300',
  offline: 'bg-rose-400/10 text-rose-300'
};

export function StatusBadge({ status }: { status: HealthStatus }) {
  const { language } = useLanguage();
  const labels = {
    ar: { online: 'متاح', maintenance: 'صيانة', new: 'جديد', updated: 'محدث', offline: 'غير متاح' },
    en: { online: 'Online', maintenance: 'Maintenance', new: 'New', updated: 'Updated', offline: 'Offline' }
  } as const;
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${styles[status]}`}>{labels[language][status]}</span>;
}
