export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-root flex min-w-0 items-center gap-2.5">
      <span className="brand-logo-shell shrink-0" aria-hidden="true">
        <img src="/icons/salla-browser-96.png" alt="" className="brand-logo brand-logo-dark h-11 w-11" />
        <img src="/icons/salla-browser-96-light.png" alt="" className="brand-logo brand-logo-light h-11 w-11" />
      </span>
      {!compact && <div className="brand-copy min-w-0 leading-none"><div className="brand-title whitespace-nowrap text-[16px] font-black sm:text-[17px]">Salla Browser</div><div className="brand-subtitle mt-1 whitespace-nowrap text-[9px] font-extrabold">Salla Apps</div></div>}
    </div>
  );
}
