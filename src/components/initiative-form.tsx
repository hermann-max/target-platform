import { asc, eq, or } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Initiative } from "@/db/schema";
import { saveInitiative } from "@/actions/initiatives";
import type { SessionUser } from "@/lib/auth";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, LinkButton, inputClass } from "@/components/ui";

export async function InitiativeForm({
  user,
  initiative,
  rockId,
  cancelHref,
}: {
  user: SessionUser;
  initiative?: Initiative;
  rockId?: string;
  cancelHref: string;
}) {
  const [rocks, users] = await Promise.all([
    db
      .select()
      .from(schema.goals)
      .where(eq(schema.goals.level, "rock"))
      .orderBy(asc(schema.goals.year), asc(schema.goals.quarter), asc(schema.goals.sortOrder), asc(schema.goals.createdAt)),
    user.role === "admin"
      ? db
          .select({ id: schema.users.id, name: schema.users.name, active: schema.users.active })
          .from(schema.users)
          // Active people, plus the current owner even if their account was deactivated,
          // so saving an edit never quietly hands the initiative to someone else.
          .where(initiative ? or(eq(schema.users.active, true), eq(schema.users.id, initiative.ownerId)) : eq(schema.users.active, true))
          .orderBy(asc(schema.users.name))
      : Promise.resolve([]),
  ]);

  const groups = new Map<string, typeof rocks>();
  for (const r of rocks) {
    const key = `Q${r.quarter} ${r.year}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }

  return (
    <ActionForm action={saveInitiative} className="max-w-2xl space-y-5">
      {initiative && <input type="hidden" name="id" value={initiative.id} />}

      <Field label="Quarterly Rock it delivers">
        <select name="rockId" defaultValue={initiative?.rockId ?? rockId ?? ""} required className={inputClass}>
          <option value="" disabled>
            Choose a Rock…
          </option>
          {[...groups.entries()].map(([period, list]) => (
            <optgroup key={period} label={period}>
              {list.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {rocks.length === 0 && (
          <span className="mt-1 block text-sm text-amber-700">There are no Rocks yet. An admin needs to add them first.</span>
        )}
      </Field>

      <Field label="Initiative title">
        <input name="title" defaultValue={initiative?.title} required className={inputClass} placeholder="e.g. Redesign the onboarding flow" />
      </Field>

      <Field label="Description" hint="What is it, why does it matter, and what does done look like?">
        <textarea name="description" defaultValue={initiative?.description} rows={5} className={inputClass} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Target date (optional)">
          <input name="dueDate" type="date" defaultValue={initiative?.dueDate ?? ""} className={inputClass} />
        </Field>
        {users.length > 0 && (
          <Field
            label="Owner"
            hint={initiative ? "Admins can hand an initiative to another director." : "The director accountable for it. They'll be able to edit it."}
          >
            <select name="ownerId" defaultValue={initiative?.ownerId ?? user.id} className={inputClass}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                  {u.id === user.id ? " (you)" : ""}
                  {u.active ? "" : " (deactivated)"}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      {!initiative && (
        <Field
          label="Milestones (optional)"
          hint="One per line. Each completed milestone moves the progress meter by an equal share. You can add, edit and attach evidence later."
        >
          <textarea name="milestones" rows={4} className={inputClass} placeholder={"Research and scope\nBuild first version\nLaunch to all customers"} />
        </Field>
      )}

      <div className="flex gap-2">
        <SubmitButton pendingLabel="Saving…">{initiative ? "Save changes" : "Create initiative"}</SubmitButton>
        <LinkButton href={cancelHref} variant="secondary">
          Cancel
        </LinkButton>
      </div>
    </ActionForm>
  );
}
