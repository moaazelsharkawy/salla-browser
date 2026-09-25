import { Compass } from 'lucide-react';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="brand-mark flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.15rem]">
        <Compass className="h-6 w-6" strokeWidth={2.5} />
      </div>
      {!compact && (
        <div className="min-w-0 leading-none">
          <div className="truncate text-lg font-black tracking-tight text-white">Salla Browser</div>
          <div className="mt-1 text-[10px] font-extrabold tracking-[0.17em] text-cyan-300/70">SALLA APPS</div>
        </div>
      )}
    </div>
  );
}
