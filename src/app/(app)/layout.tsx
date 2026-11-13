import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logout } from "@/actions/auth";
import { NavLinks } from "@/components/nav";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/ui";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const items = [
    { href: "/", label: "Dashboard" },
    { href: "/strategy", label: "Strategy" },
    { href: "/initiatives", label: "Initiatives" },
    { href: "/foundation", label: "Purpose & Values" },
    ...(user.role === "admin" ? [{ href: "/admin/users", label: "Users" }] : []),
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="text-slate-900">
            <Logo />
          </Link>
          <div className="flex-1">
            <NavLinks items={items} />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/account" className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-100" title="Your account">
              <Avatar name={user.name} size="sm" />
              <span className="hidden text-sm text-slate-700 sm:inline">{user.name}</span>
            </Link>
            <form action={logout}>
              <button className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
