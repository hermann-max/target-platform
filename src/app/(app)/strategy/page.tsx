import { requireUser } from "@/lib/auth";
import { LEVELS, loadStrategy } from "@/lib/strategy";
import { GoalTree } from "@/components/goal-tree";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui";

export const metadata = { title: "Strategy" };

export default async function StrategyPage() {
  const user = await requireUser();
  const { roots } = await loadStrategy();
  const admin = user.role === "admin";

  return (
    <div>
      <PageHeader
        title="Strategy"
        description="BHAG → 3–5 Year Targets → Annual Goals → Quarterly Rocks → Initiatives. Progress rolls up from completed milestones."
        actions={admin && <LinkButton href="/strategy/new?level=bhag">+ Add BHAG</LinkButton>}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(LEVELS) as (keyof typeof LEVELS)[]).map((k) => (
          <div key={k} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="text-sm font-semibold text-slate-800">{LEVELS[k].label}</div>
            <div className="mt-0.5 text-xs text-slate-500">{LEVELS[k].hint}</div>
          </div>
        ))}
      </div>

      {roots.length === 0 ? (
        <EmptyState title="Nothing here yet">
          {admin ? "Start with the BHAG, then add the levels below it." : "An admin needs to set up the strategy first."}
        </EmptyState>
      ) : (
        <GoalTree nodes={roots} showInitiatives openDepth={4} canAdd={admin} />
      )}
    </div>
  );
}
