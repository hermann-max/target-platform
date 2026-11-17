import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { LEVELS, ancestors, loadStrategy, periodLabel, type GoalNode } from "@/lib/strategy";
import { deleteGoal } from "@/actions/goals";
import { ActionForm, SubmitButton } from "@/components/forms";
import { GoalTree } from "@/components/goal-tree";
import { SetActiveNav } from "@/components/sidebar";
import {
  Badge,
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  ProgressBar,
  SectionTitle,
  StatusBadge,
  TopPriorityBadge,
  formatDate,
} from "@/components/ui";

export default async function GoalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ added?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { added } = await searchParams;
  const { nodes } = await loadStrategy();
  const goal = nodes.get(id);
  if (!goal) notFound();

  const admin = user.role === "admin";
  const meta = LEVELS[goal.level];
  const chain = ancestors(goal, nodes);
  const rocks = goal.level === "rock";
  const count = rocks ? goal.initiatives.length : goal.children.length;
  // Same parent, year and quarter: used by "Add another Rock" on a Rock's page.
  const siblingHref =
    rocks && goal.parentId
      ? `/strategy/new?level=rock&parentId=${goal.parentId}&year=${goal.year ?? ""}&quarter=${goal.quarter ?? ""}`
      : null;

  return (
    <div className="space-y-8">
      <SetActiveNav href={meta.path} />
      <PageHeader
        eyebrow={
          <span className="flex flex-wrap items-center gap-2">
            {meta.label}
            {periodLabel(goal) && <span className="font-normal text-slate-500">· {periodLabel(goal)}</span>}
            {goal.isTopPriority && <TopPriorityBadge />}
          </span>
        }
        title={goal.title}
        breadcrumbs={[{ href: meta.path, label: `← ${meta.plural}` }]}
        actions={
          admin && (
            <>
              {siblingHref && (
                <LinkButton href={siblingHref} variant="secondary">
                  + Add another Rock
                </LinkButton>
              )}
              <LinkButton href={`/strategy/${goal.id}/edit`} variant="secondary">
                Edit
              </LinkButton>
              <ActionForm action={deleteGoal} showSuccess={false}>
                <input type="hidden" name="id" value={goal.id} />
                <SubmitButton variant="danger" confirm={`Delete “${goal.title}”? This can't be undone.`}>
                  Delete
                </SubmitButton>
              </ActionForm>
            </>
          )
        }
      />

      {added && (
        <p role="status" className="-mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Added “{added}”.
        </p>
      )}

      <Card>
        <div className="grid gap-6 md:grid-cols-[1fr_18rem]">
          <div>
            {goal.description ? (
              <p className="prose-text text-slate-700">{goal.description}</p>
            ) : (
              <p className="text-slate-400">No description.</p>
            )}
            <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Owner</dt>
                <dd className="font-medium text-slate-800">{goal.ownerName ?? "—"}</dd>
              </div>
              {chain.length > 0 && (
                <div>
                  <dt className="text-slate-500">Supports</dt>
                  <dd>
                    <Link href={`/strategy/${chain[chain.length - 1].id}`} className="font-medium text-brand-700 hover:underline">
                      {chain[chain.length - 1].title}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>
          <div>
            <div className="text-sm text-slate-500">Progress</div>
            <div className="mt-2">
              <ProgressBar value={goal.progress} size="lg" />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {rocks
                ? "Average of its initiatives. Each initiative is its completed milestones ÷ total milestones."
                : `Average of its ${meta.child ? LEVELS[meta.child].plural : "items"}.`}
            </p>
          </div>
        </div>
      </Card>

      {rocks ? (
        <section>
          <SectionTitle actions={<LinkButton href={`/initiatives/new?rockId=${goal.id}`}>+ New initiative</LinkButton>}>
            Initiatives ({count})
          </SectionTitle>
          {goal.initiatives.length === 0 ? (
            <EmptyState title="No initiatives yet">Directors add initiatives that deliver this Rock.</EmptyState>
          ) : (
            <Card className="!p-0">
              <ul className="divide-y divide-slate-100">
                {goal.initiatives.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <Link href={`/initiatives/${i.id}`} className="font-medium text-slate-900 hover:text-brand-700 hover:underline">
                        {i.title}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{i.ownerName}</span>
                        <span>· {i.done}/{i.total} milestones</span>
                        {i.dueDate && <span>· due {formatDate(i.dueDate)}</span>}
                        <StatusBadge progress={i.progress} total={i.total} />
                      </div>
                    </div>
                    <div className="w-full sm:w-56">
                      <ProgressBar value={i.progress} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      ) : goal.level === "annual" ? (
        <RocksByQuarter goal={goal} admin={admin} />
      ) : (
        <section>
          <SectionTitle
            actions={
              admin &&
              meta.child && (
                <LinkButton href={`/strategy/new?level=${meta.child}&parentId=${goal.id}`}>
                  + Add {LEVELS[meta.child].label}
                </LinkButton>
              )
            }
          >
            {meta.child ? LEVELS[meta.child].plural : ""} ({count})
          </SectionTitle>
          {goal.children.length === 0 ? (
            <EmptyState title={`No ${meta.child ? LEVELS[meta.child].plural : "items"} yet`}>
              {admin ? null : <Badge>An admin can add them</Badge>}
            </EmptyState>
          ) : (
            <GoalTree nodes={goal.children} showInitiatives openDepth={1} />
          )}
        </section>
      )}
    </div>
  );
}

/** An annual goal's Rocks, one block per quarter, each with its own "Add Rock" button. */
function RocksByQuarter({ goal, admin }: { goal: GoalNode; admin: boolean }) {
  const year = goal.year;
  return (
    <section>
      <SectionTitle
        actions={
          admin && (
            <LinkButton href={`/strategy/new?level=rock&parentId=${goal.id}`}>+ Add Quarterly Rock</LinkButton>
          )
        }
      >
        Quarterly Rocks ({goal.children.length})
      </SectionTitle>
      <p className="-mt-1 mb-4 text-sm text-slate-500">
        Scaling Up suggests 3–5 Rocks per quarter. A quarter can have as many as you need.
      </p>
      <div className="space-y-6">
        {[1, 2, 3, 4].map((q) => {
          const list = goal.children.filter((r) => r.quarter === q && (r.year ?? year) === year);
          return (
            <div key={q}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  Q{q} {year}
                  <Badge tone={list.length > 5 ? "amber" : "slate"}>
                    {list.length} Rock{list.length === 1 ? "" : "s"}
                  </Badge>
                </h3>
                {admin && (
                  <LinkButton
                    href={`/strategy/new?level=rock&parentId=${goal.id}&year=${year ?? ""}&quarter=${q}`}
                    variant="ghost"
                    className="!py-1"
                  >
                    + Add Rock to Q{q}
                  </LinkButton>
                )}
              </div>
              {list.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-400">
                  No Rocks for Q{q} yet.
                </p>
              ) : (
                <GoalTree nodes={list} showInitiatives openDepth={0} />
              )}
            </div>
          );
        })}
        {/* Rocks filed under a different year than their annual goal, so they never disappear. */}
        {goal.children.some((r) => r.year !== year || !r.quarter) && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Other periods</h3>
            <GoalTree nodes={goal.children.filter((r) => r.year !== year || !r.quarter)} showInitiatives openDepth={0} />
          </div>
        )}
      </div>
    </section>
  );
}
