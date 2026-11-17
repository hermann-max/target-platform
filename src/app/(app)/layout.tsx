import { requireUser } from "@/lib/auth";
import { logout } from "@/actions/auth";
import { NavProvider, Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <NavProvider>
      <div className="min-h-screen">
        <Sidebar user={{ name: user.name, email: user.email, role: user.role }} logoutAction={logout} />
        <div className="lg:pl-64">
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">{children}</main>
        </div>
      </div>
    </NavProvider>
  );
}
