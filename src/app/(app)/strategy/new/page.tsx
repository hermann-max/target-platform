import { requireAdmin } from "@/lib/auth";
import { LEVELS } from "@/lib/strategy";
import { GoalForm } from "@/components/goal-form";
import { PageHeader } from "@/components/ui";
import type { GoalLevel } from "@/db/schema";

export const metadata = { title: "Add to strategy" };

export default async function NewGoalPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; parentId?: string }>;
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
      <GoalForm
        level={level}
        parentId={sp.parentId}
        cancelHref={sp.parentId ? `/strategy/${sp.parentId}` : "/strategy"}
      />
    </div>
  );
}
