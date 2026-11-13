import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { canEditInitiative, requireUser } from "@/lib/auth";
import { InitiativeForm } from "@/components/initiative-form";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Edit initiative" };

export default async function EditInitiativePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [initiative] = await db.select().from(schema.initiatives).where(eq(schema.initiatives.id, id));
  if (!initiative) notFound();
  if (!canEditInitiative(user, initiative)) redirect(`/initiatives/${id}`);

  return (
    <div>
      <PageHeader
        title="Edit initiative"
        breadcrumbs={[
          { href: "/initiatives", label: "Initiatives" },
          { href: `/initiatives/${id}`, label: initiative.title },
        ]}
      />
      <InitiativeForm user={user} initiative={initiative} cancelHref={`/initiatives/${id}`} />
    </div>
  );
}
