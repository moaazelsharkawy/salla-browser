import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function SectionTitle({ icon: Icon, title, description, action, compact = false }: { icon: LucideIcon; title: string; description?: string; action?: ReactNode; compact?: boolean }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className="soft-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
          <Icon className="h-5 w-5" strokeWidth={2.4} />
        </div>
        <div className="min-w-0">
          <h2 className={compact ? 'text-base font-black sm:text-lg' : 'text-lg font-black sm:text-xl'}>{title}</h2>
          {description && <p className="muted-text mt-1 text-xs font-bold sm:text-sm">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
