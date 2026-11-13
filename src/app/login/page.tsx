import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { googleEnabled } from "@/lib/google";
import { login } from "@/actions/auth";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, inputClass } from "@/components/ui";
import { Logo } from "@/components/logo";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getCurrentUser()) redirect("/");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo className="text-2xl text-slate-900" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="mb-1 text-lg font-semibold">Sign in</h1>
          <p className="mb-5 text-sm text-slate-500">Company goals, Rocks and initiatives in one place.</p>

          {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          {googleEnabled() && (
            <>
              <a
                href="/auth/google"
                className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-3.5 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z" />
                  <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z" />
                  <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.7-2.8Z" />
                  <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.6l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4Z" />
                </svg>
                Continue with Google
              </a>
              <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
                <div className="h-px flex-1 bg-slate-200" />
                or with email
                <div className="h-px flex-1 bg-slate-200" />
              </div>
            </>
          )}

          <ActionForm action={login} className="space-y-4">
            <Field label="Email">
              <input name="email" type="email" autoComplete="email" required className={inputClass} />
            </Field>
            <Field label="Password">
              <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
            </Field>
            <SubmitButton className="w-full" pendingLabel="Signing in…">
              Sign in
            </SubmitButton>
          </ActionForm>
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">Need an account? Ask a Target admin.</p>
      </div>
    </main>
  );
}
