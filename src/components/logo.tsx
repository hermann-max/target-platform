export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-brand-600" />
        <circle cx="16" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="3" className="text-brand-400" />
        <circle cx="16" cy="16" r="3" className="fill-brand-600" />
      </svg>
      <span>Target</span>
    </span>
  );
}
