import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { LEVELS } from "@/lib/strategy";
import { GoalForm } from "@/components/goal-form";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Edit" };

export default async function EditGoalPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [goal] = await db.select().from(schema.goals).where(eq(schema.goals.id, id));
  if (!goal) notFound();

  return (
    <div>
      <PageHeader
        title={`Edit ${LEVELS[goal.level].label}`}
        breadcrumbs={[
          { href: "/strategy", label: "Strategy" },
          { href: `/strategy/${goal.id}`, label: goal.title },
        ]}
      />
      <GoalForm level={goal.level} goal={goal} cancelHref={`/strategy/${goal.id}`} />
    </div>
  );
}
