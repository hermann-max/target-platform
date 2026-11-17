import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { LEVELS, currentPeriod, flatten, formatPercent, loadStrategy, periodLabel, type GoalNode } from "@/lib/strategy";
import type { Level } from "@/lib/levels";
import { SetActiveNav } from "@/components/sidebar";
import { Badge, Card, EmptyState, LinkButton, PageHeader, ProgressBar, TopPriorityBadge } from "@/components/ui";

/** Lists every item at one strategy level: North Star, 3–5 Year Goals, Annual Goals or Quarterly Rocks. */
export async function LevelPage({ level, searchParams }: { level: Level; searchParams: { year?: string; q?: string } }) {
  const user = await requireUser();
  const admin = user.role === "admin";
  const meta = LEVELS[level];
  const { roots, nodes } = await loadStrategy();
  const all = flatten(roots).filter((g) => g.level === level);
  const parentLevel = meta.parent;
  const parents = parentLevel ? flatten(roots).filter((g) => g.level === parentLevel) : [];

  const now = currentPeriod();
  let items = all;
  let tabs: { href: string; label: string; active: boolean }[] = [];
  let year: number | undefined;
  let quarter: number | undefined;

  if (level === "annual") {
    const years = [...new Set([...all.map((g) => g.year!).filter(Boolean), now.year])].sort();
    year = Number(searchParams.year) || now.year;
    tabs = years.map((y) => ({ href: `${meta.path}?year=${y}`, label: String(y), active: y === year }));
    items = all.filter((g) => g.year === year);
  }
  if (level === "rock") {
    const keys = new Set(all.filter((g) => g.year && g.quarter).map((g) => `${g.year}-${g.quarter}`));
    keys.add(`${now.year}-${now.quarter}`);
    year = Number(searchParams.year) || now.year;
    quarter = Number(searchParams.q) || (Number(searchParams.year) ? 1 : now.quarter);
    keys.add(`${year}-${quarter}`);
    tabs = [...keys]
      .map((k) => k.split("-").map(Number) as [number, number])
      .sort((a, b) => a[0] - b[0] || a[1] - b[1])
      .map(([y, q]) => ({ href: `${meta.path}?year=${y}&q=${q}`, label: `Q${q} ${y}`, active: y === year && q === quarter }));
    items = all.filter((g) => g.year === year && g.quarter === quarter);
  }

  // "Add" link: preselect the parent when there is only one candidate, and the period being viewed.
  const addParams = new URLSearchParams({ level });
  const candidateParents = level === "rock" || level === "annual" ? parents.filter((p) => !year || p.level !== "annual" || p.year === year) : parents;
  if (candidateParents.length === 1) addParams.set("parentId", candidateParents[0].id);
  if (year) addParams.set("year", String(year));
  if (quarter) addParams.set("quarter", String(quarter));
  const addHref = `/strategy/new?${addParams}`;
  const canAdd = admin && (!parentLevel || parents.length > 0);

  const avg = items.length ? items.reduce((s, g) => s + (g.progress ?? 0), 0) / items.length : null;

  return (
    <div>
      <SetActiveNav href={meta.path} />
      <PageHeader
        title={level === "rock" ? "Quarterly Rocks" : meta.plural}
        description={meta.hint}
        actions={canAdd && <LinkButton href={addHref}>+ Add {meta.label}</LinkButton>}
      />

      {tabs.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 rounded-lg bg-white p-1 ring-1 ring-slate-200">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                aria-current={t.active ? "page" : undefined}
                className={`rounded-md px-2.5 py-1 text-sm ${t.active ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {t.label}
              </Link>
            ))}
          </div>
          {items.length > 0 && (
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span>
                {items.length} {items.length === 1 ? meta.label : meta.plural} · average
              </span>
              <span className="w-40">
                <ProgressBar value={avg} size="sm" />
              </span>
            </div>
          )}
        </div>
      )}

      {level === "rock" && items.length > 0 && (items.length < 3 || items.length > 5) && (
        <p className="mb-4 text-sm text-slate-500">
          {items.length} Rocks this quarter. Scaling Up suggests 3–5, but you can have as many as you need.
        </p>
      )}

      {items.length === 0 ? (
        <EmptyState
          title={
            level === "annual"
              ? `No Annual Goals for ${year}`
              : level === "rock"
                ? `No Rocks for Q${quarter} ${year}`
                : `No ${meta.plural} yet`
          }
        >
          {parentLevel && parents.length === 0
            ? `Add a ${LEVELS[parentLevel].label} first.`
            : admin
              ? null
              : "An admin can add them."}
        </EmptyState>
      ) : (
        <div className={`grid gap-4 ${level === "bhag" ? "" : "md:grid-cols-2"}`}>
          {items.map((g) => (
            <GoalCard key={g.id} goal={g} parent={g.parentId ? nodes.get(g.parentId) : undefined} admin={admin} large={level === "bhag"} />
          ))}
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal, parent, admin, large }: { goal: GoalNode; parent?: GoalNode; admin: boolean; large?: boolean }) {
  const meta = LEVELS[goal.level];
  const childMeta = meta.child ? LEVELS[meta.child] : null;
  const count = goal.level === "rock" ? goal.initiatives.length : goal.children.length;
  const countLabel =
    goal.level === "rock"
      ? `${count} initiative${count === 1 ? "" : "s"}`
      : `${count} ${count === 1 ? childMeta!.label : childMeta!.plural}`;

  return (
    <Card className="flex flex-col">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {goal.isTopPriority && <TopPriorityBadge />}
        {periodLabel(goal) && <span>{periodLabel(goal)}</span>}
        {goal.ownerName && <span>· {goal.ownerName}</span>}
      </div>
      <Link
        href={`/strategy/${goal.id}`}
        className={`mt-1 font-semibold text-slate-900 hover:text-brand-700 hover:underline ${large ? "text-xl" : ""}`}
      >
        {goal.title}
      </Link>
      {parent && (
        <div className="mt-0.5 text-xs text-slate-500">
          Supports:{" "}
          <Link href={`/strategy/${parent.id}`} className="hover:underline">
            {parent.title}
          </Link>
        </div>
      )}
      {goal.description && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{goal.description}</p>}
      <div className="mt-4">
        <ProgressBar value={goal.progress} size={large ? "lg" : "md"} label={`${goal.title} progress`} />
      </div>

      {goal.level === "rock" ? (
        <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm">
          {goal.initiatives.length === 0 && <li className="text-slate-400">No initiatives yet</li>}
          {goal.initiatives.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3">
              <Link href={`/initiatives/${i.id}`} className="min-w-0 truncate text-slate-700 hover:text-brand-700 hover:underline">
                {i.title} <span className="text-slate-400">· {i.ownerName}</span>
              </Link>
              <span className="shrink-0 tabular-nums text-slate-500">{formatPercent(i.progress)}</span>
            </li>
          ))}
        </ul>
      ) : (
        goal.children.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-sm">
            {goal.children.slice(0, 6).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3">
                <Link href={`/strategy/${c.id}`} className="min-w-0 truncate text-slate-700 hover:text-brand-700 hover:underline">
                  {c.level === "rock" && <span className="text-slate-400">Q{c.quarter} · </span>}
                  {c.title}
                </Link>
                <span className="shrink-0 tabular-nums text-slate-500">{formatPercent(c.progress)}</span>
              </li>
            ))}
            {goal.children.length > 6 && (
              <li>
                <Link href={`/strategy/${goal.id}`} className="text-xs text-brand-700 hover:underline">
                  + {goal.children.length - 6} more
                </Link>
              </li>
            )}
          </ul>
        )
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
        <Badge>{countLabel}</Badge>
        {goal.level === "rock" ? (
          <LinkButton href={`/initiatives/new?rockId=${goal.id}`} variant="ghost" className="!px-2 !py-1">
            + Add initiative
          </LinkButton>
        ) : (
          admin &&
          childMeta && (
            <LinkButton
              href={`/strategy/new?level=${meta.child}&parentId=${goal.id}${goal.year ? `&year=${goal.year}` : ""}`}
              variant="ghost"
              className="!px-2 !py-1"
            >
              + Add {childMeta.label}
            </LinkButton>
          )
        )}
      </div>
    </Card>
  );
}
