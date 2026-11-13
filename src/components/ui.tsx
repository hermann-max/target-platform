import Link from "next/link";
import type { ReactNode } from "react";
import { formatPercent } from "@/lib/strategy";

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  breadcrumbs,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: { href: string; label: string }[];
}) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-sm text-slate-500">
          {breadcrumbs.map((b, i) => (
            <span key={b.href} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden>›</span>}
              <Link href={b.href} className="hover:text-slate-800 hover:underline">
                {b.label}
              </Link>
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-700">{eyebrow}</div>}
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          {description && <div className="mt-1 max-w-3xl text-slate-600">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

export function SectionTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-slate-900">{children}</h2>
      {actions}
    </div>
  );
}

function barColor(value: number) {
  if (value >= 1) return "bg-emerald-500";
  if (value >= 0.5) return "bg-brand-500";
  if (value > 0) return "bg-amber-400";
  return "bg-slate-300";
}

export function ProgressBar({
  value,
  size = "md",
  showLabel = true,
  label,
}: {
  value: number | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
}) {
  const pct = value === null ? 0 : Math.max(0, Math.min(1, value)) * 100;
  const h = size === "lg" ? "h-3" : size === "sm" ? "h-1.5" : "h-2";
  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative w-full overflow-hidden rounded-full bg-slate-100 ${h}`}
        role="progressbar"
        aria-label={label ?? "Progress"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <div className={`h-full rounded-full transition-all ${barColor(value ?? 0)}`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <span className={`w-14 shrink-0 text-right tabular-nums ${size === "lg" ? "text-base font-semibold" : "text-sm"} text-slate-700`}>
          {formatPercent(value)}
        </span>
      )}
    </div>
  );
}

const badgeTones = {
  slate: "bg-slate-100 text-slate-700",
  brand: "bg-brand-50 text-brand-700 ring-1 ring-brand-200",
  amber: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: keyof typeof badgeTones }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badgeTones[tone]}`}>
      {children}
    </span>
  );
}

export function TopPriorityBadge() {
  return <Badge tone="amber">★ #1 Priority</Badge>;
}

export function StatusBadge({ progress, total }: { progress: number | null; total: number }) {
  if (total === 0) return <Badge>No milestones</Badge>;
  if (progress === 1) return <Badge tone="green">Complete</Badge>;
  if (progress && progress > 0) return <Badge tone="brand">In progress</Badge>;
  return <Badge>Not started</Badge>;
}

const linkVariants = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  secondary: "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50",
  ghost: "text-brand-700 hover:bg-brand-50",
};

export function LinkButton({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof linkVariants;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${linkVariants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 px-6 py-10 text-center">
      <p className="font-medium text-slate-700">{title}</p>
      {children && <div className="mt-2 text-sm text-slate-500">{children}</div>}
    </div>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  const s = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800 ${s}`}>
      {initials || "?"}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(value: Date) {
  return value.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
