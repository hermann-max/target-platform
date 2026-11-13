import { requireUser } from "@/lib/auth";
import { InitiativeForm } from "@/components/initiative-form";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "New initiative" };

export default async function NewInitiativePage({ searchParams }: { searchParams: Promise<{ rockId?: string }> }) {
  const user = await requireUser();
  const { rockId } = await searchParams;
  return (
    <div>
      <PageHeader
        title="New initiative"
        description="You'll be the owner. Only you (and admins) can edit it; everyone can see it and comment."
        breadcrumbs={[{ href: "/initiatives", label: "Initiatives" }]}
      />
      <InitiativeForm user={user} rockId={rockId} cancelHref={rockId ? `/strategy/${rockId}` : "/initiatives"} />
    </div>
  );
}
