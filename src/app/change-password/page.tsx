import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { changePassword, logout } from "@/actions/auth";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, inputClass } from "@/components/ui";
import { Logo } from "@/components/logo";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";

export const metadata = { title: "Choose a password" };

export default async function ChangePasswordPage() {
  const user = await requireUser({ allowPendingPasswordChange: true });
  if (!user.mustChangePassword) redirect("/account");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo className="text-2xl text-slate-900" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="mb-1 text-lg font-semibold">Welcome, {user.name.split(" ")[0]}</h1>
          <p className="mb-5 text-sm text-slate-500">
            You signed in with a temporary password. Choose your own to continue.
          </p>
          <ActionForm action={changePassword} className="space-y-4">
            <Field label="New password" hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
              <input name="password" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD_LENGTH} className={inputClass} />
            </Field>
            <Field label="Confirm new password">
              <input name="confirm" type="password" autoComplete="new-password" required className={inputClass} />
            </Field>
            <SubmitButton className="w-full" pendingLabel="Saving…">
              Save and continue
            </SubmitButton>
          </ActionForm>
        </div>
        <form action={logout} className="mt-4 text-center">
          <button className="text-xs text-slate-500 hover:underline">Sign out</button>
        </form>
      </div>
    </main>
  );
}
