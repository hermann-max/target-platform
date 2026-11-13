import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { LEVELS, ancestors, loadStrategy, periodLabel } from "@/lib/strategy";
import { deleteGoal } from "@/actions/goals";
import { ActionForm, SubmitButton } from "@/components/forms";
import { GoalTree } from "@/components/goal-tree";
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

export default async function GoalPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const { nodes } = await loadStrategy();
  const goal = nodes.get(id);
  if (!goal) notFound();

  const admin = user.role === "admin";
  const meta = LEVELS[goal.level];
  const chain = ancestors(goal, nodes);
  const rocks = goal.level === "rock";
  const count = rocks
    ? goal.initiatives.length
    : goal.children.length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <span className="flex flex-wrap items-center gap-2">
            {meta.label}
            {periodLabel(goal) && <span className="font-normal text-slate-500">· {periodLabel(goal)}</span>}
            {goal.isTopPriority && <TopPriorityBadge />}
          </span>
        }
        title={goal.title}
        breadcrumbs={[{ href: "/strategy", label: "Strategy" }, ...chain.map((a) => ({ href: `/strategy/${a.id}`, label: a.title }))]}
        actions={
          admin && (
            <>
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
