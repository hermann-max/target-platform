import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { changePassword, updateProfile } from "@/actions/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Badge, Card, Field, PageHeader, SectionTitle, inputClass } from "@/components/ui";

export const metadata = { title: "Your account" };

export default async function AccountPage() {
  const me = await requireUser();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, me.id));
  const hasPassword = Boolean(user.passwordHash);

  return (
    <div>
      <PageHeader
        title="Your account"
        description={
          <span className="flex items-center gap-2">
            {user.email} {user.role === "admin" ? <Badge tone="brand">Admin</Badge> : <Badge>Director</Badge>}
          </span>
        }
      />
      <div className="grid max-w-4xl gap-6 md:grid-cols-2">
        <section>
          <SectionTitle>Profile</SectionTitle>
          <Card>
            <ActionForm action={updateProfile} className="space-y-4">
              <Field label="Name">
                <input name="name" defaultValue={user.name} required className={inputClass} />
              </Field>
              <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
            </ActionForm>
          </Card>
        </section>
        <section>
          <SectionTitle>{hasPassword ? "Change password" : "Set a password"}</SectionTitle>
          <Card>
            {!hasPassword && (
              <p className="mb-4 text-sm text-slate-600">You sign in with Google. Set a password if you also want to sign in with email.</p>
            )}
            <ActionForm action={changePassword} resetOnSuccess className="space-y-4">
              {hasPassword && (
                <Field label="Current password">
                  <input name="current" type="password" autoComplete="current-password" required className={inputClass} />
                </Field>
              )}
              <Field label="New password" hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
                <input name="password" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD_LENGTH} className={inputClass} />
              </Field>
              <Field label="Confirm new password">
                <input name="confirm" type="password" autoComplete="new-password" required className={inputClass} />
              </Field>
              <SubmitButton pendingLabel="Saving…">{hasPassword ? "Change password" : "Set password"}</SubmitButton>
            </ActionForm>
          </Card>
        </section>
      </div>
    </div>
  );
}
