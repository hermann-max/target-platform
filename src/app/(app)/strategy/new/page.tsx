import { requireAdmin } from "@/lib/auth";
import { LEVELS } from "@/lib/strategy";
import { GoalForm } from "@/components/goal-form";
import { PageHeader } from "@/components/ui";
import type { GoalLevel } from "@/db/schema";

export const metadata = { title: "Add to strategy" };

export default async function NewGoalPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; parentId?: string; year?: string; quarter?: string; added?: string; n?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const level = (sp.level && sp.level in LEVELS ? sp.level : "bhag") as GoalLevel;

  return (
    <div>
      <PageHeader
        title={`Add ${LEVELS[level].label}`}
        description={LEVELS[level].hint}
        breadcrumbs={[{ href: "/strategy", label: "Strategy" }]}
      />
      {sp.added && (
        <p role="status" className="mb-5 max-w-2xl rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Added “{sp.added}”. Add the next one below.
        </p>
      )}
      <GoalForm
        // A fresh form after each "Save and add another" (the URL changes, the route doesn't).
        key={sp.n ?? "first"}
        level={level}
        parentId={sp.parentId}
        defaultYear={Number(sp.year) || undefined}
        defaultQuarter={Number(sp.quarter) || undefined}
        cancelHref={sp.parentId ? `/strategy/${sp.parentId}` : "/strategy"}
      />
    </div>
  );
}
