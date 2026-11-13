"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Item = { href: string; label: string };

export function NavLinks({ items }: { items: Item[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <nav className="hidden items-center gap-1 md:flex">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              isActive(i.href) ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {i.label}
          </Link>
        ))}
      </nav>
      <div className="md:hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Menu"
          aria-expanded={open}
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden>
            <path d="M3 5h14v2H3zm0 4h14v2H3zm0 4h14v2H3z" />
          </svg>
        </button>
        {open && (
          <div className="absolute inset-x-0 top-14 z-20 border-b border-slate-200 bg-white px-4 py-2 shadow-sm">
            {items.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                onClick={() => setOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  isActive(i.href) ? "bg-brand-50 text-brand-700" : "text-slate-700"
                }`}
              >
                {i.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
