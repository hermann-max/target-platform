"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { LEVELS } from "@/lib/levels";
import { Logo } from "@/components/logo";

type Item = { href: string; label: string; icon: ReactNode; exact?: boolean };

/* ---------- Which item is active ---------- */

// Pages whose URL doesn't say which section they belong to (e.g. /strategy/<id>) set it here.
const ActiveContext = createContext<{ override: string | null; setOverride: (v: string | null) => void }>({
  override: null,
  setOverride: () => {},
});

export function NavProvider({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<string | null>(null);
  return <ActiveContext.Provider value={{ override, setOverride }}>{children}</ActiveContext.Provider>;
}

/** Render on a page to highlight a sidebar item, e.g. <SetActiveNav href="/strategy/annual" />. */
export function SetActiveNav({ href }: { href: string }) {
  const { setOverride } = useContext(ActiveContext);
  useEffect(() => {
    setOverride(href);
    return () => setOverride(null);
  }, [href, setOverride]);
  return null;
}

/* ---------- Icons ---------- */

const icon = (d: string) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-[18px] w-[18px] shrink-0" aria-hidden>
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const icons = {
  dashboard: icon("M3 3h6v8H3zM11 3h6v5h-6zM11 10h6v7h-6zM3 13h6v4H3z"),
  map: icon("M10 3v4M10 7H5v4M10 7h5v4M5 11v2M15 11v2M3 13h4v4H3zM13 13h4v4h-4z"),
  star: icon("M10 2.5l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 7.8l5-.7z"),
  mountain: icon("M2 16l5-8 3 4 2-3 6 7z"),
  calendar: icon("M3 5h14v12H3zM3 9h14M7 3v4M13 3v4"),
  rock: icon("M4 14l2-6 4-3 5 3 1 6-5 2z"),
  list: icon("M7 5h10M7 10h10M7 15h10M3 5h.01M3 10h.01M3 15h.01"),
  heart: icon("M10 16s-6-3.6-6-8a3.5 3.5 0 0 1 6-2.4A3.5 3.5 0 0 1 16 8c0 4.4-6 8-6 8z"),
  users: icon("M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 17c0-3 2.2-5 5-5s5 2 5 5M13 4a3 3 0 0 1 0 5M15 12c1.8.5 3 2.3 3 5"),
};

/* ---------- Sidebar ---------- */

export function Sidebar({
  user,
  logoutAction,
}: {
  user: { name: string; email: string; role: "admin" | "director" };
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const { override } = useContext(ActiveContext);
  const [open, setOpen] = useState(false);

  // Close the phone menu after navigating.
  useEffect(() => setOpen(false), [pathname]);

  const groups: { title?: string; items: Item[] }[] = [
    { items: [{ href: "/", label: "Dashboard", icon: icons.dashboard, exact: true }] },
    {
      title: "Strategy",
      items: [
        { href: LEVELS.bhag.path, label: "North Star", icon: icons.star },
        { href: LEVELS.target.path, label: "3–5 Year Goal", icon: icons.mountain },
        { href: LEVELS.annual.path, label: "Annual Goal", icon: icons.calendar },
        { href: LEVELS.rock.path, label: "Quarterly Rocks", icon: icons.rock },
        { href: "/initiatives", label: "Initiatives", icon: icons.list },
        { href: "/strategy", label: "Strategy map", icon: icons.map, exact: true },
      ],
    },
    {
      title: "Company",
      items: [
        { href: "/foundation", label: "Purpose & Values", icon: icons.heart },
        ...(user.role === "admin" ? [{ href: "/admin/users", label: "Users", icon: icons.users }] : []),
      ],
    },
  ];

  const isActive = (item: Item) => {
    if (override) return override === item.href;
    return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
  };

  const nav = (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex h-14 shrink-0 items-center px-5 text-slate-900">
        <Logo />
      </Link>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Main">
        {groups.map((g, gi) => (
          <div key={gi}>
            {g.title && (
              <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{g.title}</div>
            )}
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const active = isActive(item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span className={active ? "text-brand-600" : "text-slate-400"}>{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-slate-200 p-3">
        <Link
          href="/account"
          className={`flex items-center gap-3 rounded-md px-3 py-2 hover:bg-slate-100 ${pathname === "/account" ? "bg-slate-100" : ""}`}
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
            {user.name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0]!.toUpperCase())
              .join("")}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-slate-800">{user.name}</span>
            <span className="block truncate text-xs text-slate-500">{user.role === "admin" ? "Admin" : "Director"}</span>
          </span>
        </Link>
        <form action={logoutAction}>
          <button className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-white lg:block">{nav}</aside>

      {/* Phone and tablet: top bar with a slide-in menu */}
      <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
        <Link href="/" className="text-slate-900">
          <Logo />
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
          aria-expanded={open}
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden>
            <path d="M3 5h14v2H3zm0 4h14v2H3zm0 4h14v2H3z" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-30 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-slate-900/30" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl">{nav}</aside>
        </div>
      )}
    </>
  );
}
