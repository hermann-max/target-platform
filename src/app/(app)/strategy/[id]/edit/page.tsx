import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { LEVELS } from "@/lib/strategy";
import { GoalForm } from "@/components/goal-form";
import { PageHeader } from "@/components/ui";
import { SetActiveNav } from "@/components/sidebar";

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
        breadcrumbs={[{ href: `/strategy/${goal.id}`, label: `← ${goal.title}` }]}
      />
      <SetActiveNav href={LEVELS[goal.level].path} />
      <GoalForm level={goal.level} goal={goal} cancelHref={`/strategy/${goal.id}`} />
    </div>
  );
}
