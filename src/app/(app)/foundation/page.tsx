import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { deleteCoreValue, saveCorePurpose, saveCoreValue } from "@/actions/foundation";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, EmptyState, Field, PageHeader, SectionTitle, inputClass } from "@/components/ui";

export const metadata = { title: "Purpose & Values" };

export default async function FoundationPage() {
  const user = await requireUser();
  const admin = user.role === "admin";
  const [[foundation], values] = await Promise.all([
    db.select().from(schema.foundation),
    db.select().from(schema.coreValues).orderBy(asc(schema.coreValues.sortOrder)),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Purpose & Values"
        description="The foundation everything else is built on. These rarely change."
      />

      <section>
        <SectionTitle>Core Purpose</SectionTitle>
        <Card>
          <p className="mb-4 text-sm text-slate-500">
            The 100-year “why”: the reason the company exists beyond making money.
          </p>
          {admin ? (
            <ActionForm action={saveCorePurpose} className="space-y-3">
              <textarea
                name="corePurpose"
                defaultValue={foundation?.corePurpose}
                rows={3}
                className={`${inputClass} text-lg`}
                placeholder="e.g. Help every business choose the right software"
              />
              <SubmitButton pendingLabel="Saving…">Save Core Purpose</SubmitButton>
            </ActionForm>
          ) : foundation?.corePurpose ? (
            <p className="prose-text text-xl font-medium text-slate-900">{foundation.corePurpose}</p>
          ) : (
            <p className="text-slate-400">Not set yet.</p>
          )}
        </Card>
      </section>

      <section>
        <SectionTitle>Core Values</SectionTitle>
        <p className="-mt-1 mb-4 text-sm text-slate-500">
          The 4–5 non-negotiable principles that guide behavior, hiring and culture.
        </p>
        {values.length === 0 && !admin && <EmptyState title="No Core Values yet" />}
        <div className="grid gap-4 md:grid-cols-2">
          {values.map((v, idx) =>
            admin ? (
              <Card key={v.id}>
                <ActionForm action={saveCoreValue} className="space-y-3">
                  <input type="hidden" name="id" value={v.id} />
                  <div className="flex gap-2">
                    <input name="sortOrder" type="number" defaultValue={v.sortOrder} className={`${inputClass} !w-16`} aria-label="Order" title="Order" />
                    <input name="title" defaultValue={v.title} required className={`${inputClass} font-semibold`} />
                  </div>
                  <textarea name="description" defaultValue={v.description} rows={3} className={inputClass} placeholder="What it means in practice" />
                  <div className="flex gap-2">
                    <SubmitButton variant="secondary" pendingLabel="Saving…">
                      Save
                    </SubmitButton>
                  </div>
                </ActionForm>
                <form action={deleteCoreValue} className="mt-2">
                  <input type="hidden" name="id" value={v.id} />
                  <SubmitButton variant="ghost" className="!px-0 text-xs" confirm={`Delete the value “${v.title}”?`}>
                    Delete
                  </SubmitButton>
                </form>
              </Card>
            ) : (
              <Card key={v.id}>
                <div className="flex items-baseline gap-3">
                  <span className="text-sm font-semibold text-brand-600">{idx + 1}</span>
                  <div>
                    <h3 className="font-semibold text-slate-900">{v.title}</h3>
                    {v.description && <p className="prose-text mt-1 text-sm text-slate-600">{v.description}</p>}
                  </div>
                </div>
              </Card>
            ),
          )}
          {admin && (
            <Card className="border-dashed">
              <ActionForm action={saveCoreValue} resetOnSuccess className="space-y-3">
                <Field label="Add a Core Value">
                  <input name="title" required className={inputClass} placeholder="e.g. Customers first" />
                </Field>
                <textarea name="description" rows={3} className={inputClass} placeholder="What it means in practice" />
                <SubmitButton pendingLabel="Adding…">Add value</SubmitButton>
              </ActionForm>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
