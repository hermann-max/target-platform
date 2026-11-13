import Link from "next/link";
import { asc, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { createUser } from "@/actions/users";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Avatar, Badge, Card, Field, PageHeader, SectionTitle, inputClass } from "@/components/ui";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  await requireAdmin();
  const users = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      active: schema.users.active,
      mustChangePassword: schema.users.mustChangePassword,
      initiatives: sql<number>`(select count(*)::int from ${schema.initiatives} where ${schema.initiatives.ownerId} = ${schema.users.id})`,
    })
    .from(schema.users)
    .orderBy(sql`${schema.users.active} desc`, asc(schema.users.name));

  return (
    <div className="space-y-8">
      <PageHeader title="Users" description="Create accounts for directors and admins, change roles, and reset passwords." />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="overflow-x-auto !p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Person</th>
                <th className="px-3 py-3 font-medium">Role</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 text-right font-medium">Initiatives</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={`border-b border-slate-50 last:border-0 ${u.active ? "" : "opacity-60"}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} />
                      <div>
                        <div className="font-medium text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">{u.role === "admin" ? <Badge tone="brand">Admin</Badge> : <Badge>Director</Badge>}</td>
                  <td className="px-3 py-3">
                    {!u.active ? (
                      <Badge tone="red">Deactivated</Badge>
                    ) : u.mustChangePassword ? (
                      <Badge tone="amber">Temporary password</Badge>
                    ) : (
                      <Badge tone="green">Active</Badge>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{u.initiatives}</td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/users/${u.id}`} className="text-brand-700 hover:underline">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div>
          <SectionTitle>Add a user</SectionTitle>
          <Card>
            <ActionForm action={createUser} resetOnSuccess className="space-y-4">
              <Field label="Full name">
                <input name="name" required className={inputClass} />
              </Field>
              <Field label="Email" hint="Any email works. If Google sign-in is on, a matching Google account signs into this user.">
                <input name="email" type="email" required className={inputClass} />
              </Field>
              <Field label="Role">
                <select name="role" defaultValue="director" className={inputClass}>
                  <option value="director">Director: creates and edits their own initiatives</option>
                  <option value="admin">Admin: can edit everything and manage users</option>
                </select>
              </Field>
              <Field label="Temporary password" hint={`At least ${MIN_PASSWORD_LENGTH} characters. They'll choose their own at first sign-in.`}>
                <input name="password" type="text" required minLength={MIN_PASSWORD_LENGTH} autoComplete="off" className={`${inputClass} font-mono`} />
              </Field>
              <SubmitButton pendingLabel="Creating…">Create account</SubmitButton>
            </ActionForm>
          </Card>
        </div>
      </div>
    </div>
  );
}
