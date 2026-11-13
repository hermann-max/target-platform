import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { resetPassword, updateUser } from "@/actions/users";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Field, PageHeader, SectionTitle, inputClass } from "@/components/ui";

export const metadata = { title: "Manage user" };

export default async function ManageUserPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin();
  const { id } = await params;
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
  if (!user) notFound();
  const self = user.id === me.id;

  return (
    <div>
      <PageHeader title={user.name} description={user.email} breadcrumbs={[{ href: "/admin/users", label: "Users" }]} />

      <div className="grid max-w-4xl gap-6 md:grid-cols-2">
        <section>
          <SectionTitle>Details</SectionTitle>
          <Card>
            <ActionForm action={updateUser} className="space-y-4">
              <input type="hidden" name="id" value={user.id} />
              <Field label="Full name">
                <input name="name" defaultValue={user.name} required className={inputClass} />
              </Field>
              <Field label="Email">
                <input name="email" type="email" defaultValue={user.email} required className={inputClass} />
              </Field>
              <Field label="Role" hint={self ? "You can't remove your own admin access." : undefined}>
                <select name="role" defaultValue={user.role} disabled={self} className={inputClass}>
                  <option value="director">Director</option>
                  <option value="admin">Admin</option>
                </select>
                {self && <input type="hidden" name="role" value={user.role} />}
              </Field>
              <Field
                label="Access"
                hint={self ? "You can't deactivate yourself." : "Deactivated users can't sign in. Their initiatives and comments stay."}
              >
                <select name="active" defaultValue={String(user.active)} disabled={self} className={inputClass}>
                  <option value="true">Active</option>
                  <option value="false">Deactivated</option>
                </select>
                {self && <input type="hidden" name="active" value="true" />}
              </Field>
              <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
            </ActionForm>
          </Card>
        </section>

        <section>
          <SectionTitle>Reset password</SectionTitle>
          <Card>
            <p className="mb-4 text-sm text-slate-600">
              Sets a temporary password and signs them out everywhere. They'll choose a new one at their next sign-in.
            </p>
            <ActionForm action={resetPassword} resetOnSuccess className="space-y-4">
              <input type="hidden" name="id" value={user.id} />
              <Field label="Temporary password" hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
                <input name="password" type="text" required minLength={MIN_PASSWORD_LENGTH} autoComplete="off" className={`${inputClass} font-mono`} />
              </Field>
              <SubmitButton variant="secondary" pendingLabel="Saving…">
                Set temporary password
              </SubmitButton>
            </ActionForm>
          </Card>
        </section>
      </div>
    </div>
  );
}
