import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Goal, GoalLevel } from "@/db/schema";
import { saveGoal } from "@/actions/goals";
import { LEVELS, currentPeriod, periodLabel } from "@/lib/strategy";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, LinkButton, inputClass } from "@/components/ui";

export async function GoalForm({
  level,
  goal,
  parentId,
  defaultYear,
  defaultQuarter,
  cancelHref,
}: {
  level: GoalLevel;
  goal?: Goal;
  parentId?: string;
  defaultYear?: number;
  defaultQuarter?: number;
  cancelHref: string;
}) {
  const meta = LEVELS[level];
  const [parents, users] = await Promise.all([
    meta.parent
      ? db.select().from(schema.goals).where(eq(schema.goals.level, meta.parent)).orderBy(asc(schema.goals.year), asc(schema.goals.createdAt))
      : Promise.resolve([] as Goal[]),
    db
      .select({ id: schema.users.id, name: schema.users.name })
      .from(schema.users)
      .where(eq(schema.users.active, true))
      .orderBy(asc(schema.users.name)),
  ]);
  const now = currentPeriod();
  const selectedParent = goal?.parentId ?? parentId ?? "";
  const parentYear = parents.find((p) => p.id === selectedParent)?.year;
  const years = Array.from({ length: 6 }, (_, i) => now.year - 1 + i);

  return (
    <ActionForm action={saveGoal} className="max-w-2xl space-y-5">
      {goal && <input type="hidden" name="id" value={goal.id} />}
      <input type="hidden" name="level" value={level} />

      {meta.parent && (
        <Field label={`Supports which ${LEVELS[meta.parent].label}?`}>
          <select name="parentId" defaultValue={selectedParent} required className={inputClass}>
            <option value="" disabled>
              Choose…
            </option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {periodLabel(p) ? `${periodLabel(p)} — ` : ""}
                {p.title}
              </option>
            ))}
          </select>
          {parents.length === 0 && (
            <span className="mt-1 block text-sm text-amber-700">Add a {LEVELS[meta.parent].label} first.</span>
          )}
        </Field>
      )}

      <Field label="Title">
        <input name="title" defaultValue={goal?.title} required className={inputClass} placeholder={placeholder(level)} />
      </Field>

      <Field label="Description" hint="How will you know it's achieved? Include the measure if there is one.">
        <textarea name="description" defaultValue={goal?.description} rows={4} className={inputClass} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Owner (optional)">
          <select name="ownerId" defaultValue={goal?.ownerId ?? ""} className={inputClass}>
            <option value="">No owner</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </Field>

        {(level === "bhag" || level === "target") && (
          <Field label="Achieve by (year)">
            <input
              name="targetYear"
              type="number"
              min={2000}
              max={2200}
              defaultValue={goal?.targetYear ?? (level === "bhag" ? now.year + 10 : now.year + 3)}
              className={inputClass}
            />
          </Field>
        )}

        {(level === "annual" || level === "rock") && (
          <Field label="Year">
            <select name="year" defaultValue={goal?.year ?? defaultYear ?? parentYear ?? now.year} className={inputClass}>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>
        )}

        {level === "rock" && (
          <Field label="Quarter">
            <select name="quarter" defaultValue={goal?.quarter ?? defaultQuarter ?? now.quarter} className={inputClass}>
              {[1, 2, 3, 4].map((q) => (
                <option key={q} value={q}>
                  Q{q}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      {(level === "annual" || level === "rock") && (
        <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
          <input name="isTopPriority" type="checkbox" defaultChecked={goal?.isTopPriority} className="mt-1 h-4 w-4 accent-amber-500" />
          <span>
            <span className="block text-sm font-medium text-slate-800">
              This is the #1 Priority for the {level === "rock" ? "quarter" : "year"}
            </span>
            <span className="block text-xs text-slate-600">
              Only one per {level === "rock" ? "quarter" : "year"}. Marking this one replaces any other.
            </span>
          </span>
        </label>
      )}

      <div className="flex flex-wrap gap-2">
        <SubmitButton pendingLabel="Saving…">{goal ? "Save changes" : `Add ${meta.label}`}</SubmitButton>
        {!goal && meta.parent && (
          <SubmitButton variant="secondary" name="intent" value="another">
            Save and add another
          </SubmitButton>
        )}
        <LinkButton href={cancelHref} variant="secondary">
          Cancel
        </LinkButton>
      </div>
    </ActionForm>
  );
}

function placeholder(level: GoalLevel) {
  switch (level) {
    case "bhag":
      return "e.g. Become the most trusted source for software buyers worldwide";
    case "target":
      return "e.g. Reach $50M annual revenue";
    case "annual":
      return "e.g. Grow recurring revenue to $20M";
    case "rock":
      return "e.g. Launch the self-serve listings product";
  }
}
