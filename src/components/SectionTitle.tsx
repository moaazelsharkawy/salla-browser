import type { LucideIcon } from 'lucide-react';

export function SectionTitle({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className="soft-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
          <Icon className="h-5 w-5" strokeWidth={2.4} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-black sm:text-xl">{title}</h2>
          {description && <p className="mt-1 text-xs font-semibold text-slate-400 sm:text-sm">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
