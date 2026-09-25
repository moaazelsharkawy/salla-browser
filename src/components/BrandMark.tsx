export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      role="img"
      aria-label="Salla Browser"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sallaMarkTop" x1="18" y1="18" x2="78" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22D3EE" />
          <stop offset="0.5" stopColor="#0EA5E9" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="sallaMarkBottom" x1="26" y1="46" x2="72" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0891B2" />
          <stop offset="0.52" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <path
        d="M75.5 15.5c-13.8 2.1-28.5 6.4-39.8 14.2-9.9 6.9-14.7 15.6-11.1 23.6 2.7 6 9.4 9.5 18.4 12.1 6.4 1.9 13.7 3.2 19.4 5.8 5.3 2.4 7.6 5.2 6.7 8.4 5.8-3.9 9.2-8.3 9.7-13 .7-7.2-4.2-12.3-12.8-16.2-6.9-3.1-15-4.5-21-6.9-4.7-1.9-6.6-4.1-5.6-6.5 2.4-5.5 16.3-10.9 36.1-14.6V15.5Z"
        fill="url(#sallaMarkTop)"
      />
      <path
        d="M26.5 54.1c3 6.2 9.6 10 18.6 12.6 6.7 1.9 13.3 3.3 17.4 5.7 3.2 1.9 4.4 4 3.3 6.1-2 3.8-8.5 6.8-18.1 9V76.7c5.1-1.4 8.6-2.8 9.7-4.3.9-1.2.1-2.4-2.3-3.5-3.4-1.6-9.1-2.9-14.4-4.7-6.7-2.3-11.5-5.4-14.2-10.1Z"
        fill="url(#sallaMarkBottom)"
      />
    </svg>
  );
}
