import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { currentPeriod, flatten, formatPercent, loadStrategy, periodLabel, type GoalNode } from "@/lib/strategy";
import { GoalTree } from "@/components/goal-tree";
import {
  Avatar,
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

export const metadata = { title: "Dashboard" };

function avg(values: (number | null)[]) {
  return values.length ? values.reduce<number>((s, v) => s + (v ?? 0), 0) / values.length : null;
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ year?: string; q?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const now = currentPeriod();
  const year = Number(sp.year) || now.year;
  const quarter = Number(sp.q) || (Number(sp.year) ? 1 : now.quarter);

  const [{ roots, initiatives }, [foundation], values] = await Promise.all([
    loadStrategy(),
    db.select().from(schema.foundation),
    db.select().from(schema.coreValues).orderBy(asc(schema.coreValues.sortOrder)),
  ]);

  const all = flatten(roots);
  const bhags = roots.filter((g) => g.level === "bhag");
  const annual = all.filter((g) => g.level === "annual" && g.year === year);
  const rocks = all.filter((g) => g.level === "rock" && g.year === year && g.quarter === quarter);
  const rockIds = new Set(rocks.map((r) => r.id));
  const quarterInitiatives = initiatives.filter((i) => rockIds.has(i.rockId));
  const topAnnual = annual.find((g) => g.isTopPriority);
  const topRock = rocks.find((g) => g.isTopPriority);
  const milestonesDone = quarterInitiatives.reduce((s, i) => s + i.done, 0);
  const milestonesTotal = quarterInitiatives.reduce((s, i) => s + i.total, 0);

  // Quarters that have Rocks, for the period switcher.
  const periods = Array.from(
    new Set(all.filter((g) => g.level === "rock" && g.year && g.quarter).map((g) => `${g.year}-${g.quarter}`)),
  )
    .concat(`${now.year}-${now.quarter}`)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort()
    .map((k) => k.split("-").map(Number) as [number, number]);

  const byOwner = new Map<string, { name: string; items: typeof quarterInitiatives }>();
  for (const i of quarterInitiatives) {
    const entry = byOwner.get(i.ownerId) ?? { name: i.ownerName, items: [] };
    entry.items.push(i);
    byOwner.set(i.ownerId, entry);
  }
  const owners = [...byOwner.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name));
  const recent = [...initiatives].sort((a, b) => +b.updatedAt - +a.updatedAt).slice(0, 6);
  const parentOf = new Map(all.map((g) => [g.id, g]));

  const empty = all.length === 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="How the company is tracking, from this quarter's Rocks up to the North Star."
        actions={
          <div className="flex flex-wrap gap-1 rounded-lg bg-white p-1 ring-1 ring-slate-200">
            {periods.map(([y, q]) => {
              const active = y === year && q === quarter;
              return (
                <Link
                  key={`${y}-${q}`}
                  href={`/?year=${y}&q=${q}`}
                  className={`rounded-md px-2.5 py-1 text-sm ${active ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  Q{q} {y}
                </Link>
              );
            })}
          </div>
        }
      />

      {(foundation?.corePurpose || values.length > 0) && (
        <Card className="bg-gradient-to-br from-brand-700 to-brand-900 !border-none text-white">
          {foundation?.corePurpose && (
            <>
              <div className="text-xs font-semibold uppercase tracking-wide text-brand-200">Core Purpose</div>
              <p className="mt-1 text-lg font-medium">{foundation.corePurpose}</p>
            </>
          )}
          {values.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {values.map((v) => (
                <span key={v.id} title={v.description} className="rounded-full bg-white/15 px-3 py-1 text-sm">
                  {v.title}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      {empty ? (
        <EmptyState title="No strategy yet">
          {user.role === "admin" ? (
            <>
              Start with your North Star, then work down to 3–5 Year Goals, Annual Goals and Quarterly Rocks.
              <div className="mt-4">
                <LinkButton href="/strategy/new?level=bhag">Add your North Star</LinkButton>
              </div>
            </>
          ) : (
            "An admin needs to set up the North Star, goals and Rocks first."
          )}
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="North Star" value={avg(bhags.map((b) => b.progress))} sub={bhags[0]?.title} href={bhags[0] ? `/strategy/${bhags[0].id}` : undefined} />
            <StatCard label={`${year} annual goals`} value={avg(annual.map((a) => a.progress))} sub={`${annual.length} goal${annual.length === 1 ? "" : "s"}`} />
            <StatCard label={`Q${quarter} ${year} Rocks`} value={avg(rocks.map((r) => r.progress))} sub={`${rocks.length} Rock${rocks.length === 1 ? "" : "s"}${rocks.length > 0 && (rocks.length < 3 || rocks.length > 5) ? " · Scaling Up suggests 3–5" : ""}`} />
            <Card>
              <div className="text-sm text-slate-500">Q{quarter} milestones</div>
              <div className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
                {milestonesDone}
                <span className="text-lg text-slate-400"> / {milestonesTotal}</span>
              </div>
              <div className="mt-1 text-sm text-slate-500">
                across {quarterInitiatives.length} initiative{quarterInitiatives.length === 1 ? "" : "s"}
              </div>
            </Card>
          </div>

          {(topAnnual || topRock) && (
            <div className="grid gap-4 md:grid-cols-2">
              {[topAnnual, topRock].filter(Boolean).map((g) => (
                <PriorityCard key={g!.id} goal={g!} />
              ))}
            </div>
          )}

          <section>
            <SectionTitle actions={<LinkButton href={`/strategy/rocks?year=${year}&q=${quarter}`} variant="ghost">All Rocks →</LinkButton>}>
              Q{quarter} {year} Rocks
            </SectionTitle>
            {rocks.length === 0 ? (
              <EmptyState title={`No Rocks for Q${quarter} ${year}`}>
                {user.role === "admin" ? "Add Rocks under an annual goal on the Strategy page." : "An admin hasn't set this quarter's Rocks yet."}
              </EmptyState>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {rocks.map((r) => {
                  const parent = r.parentId ? parentOf.get(r.parentId) : undefined;
                  return (
                    <Card key={r.id} className="flex flex-col">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {r.isTopPriority && <TopPriorityBadge />}
                        {r.ownerName && <span>{r.ownerName}</span>}
                      </div>
                      <Link href={`/strategy/${r.id}`} className="mt-1 font-semibold text-slate-900 hover:text-brand-700 hover:underline">
                        {r.title}
                      </Link>
                      {parent && <div className="mt-0.5 text-xs text-slate-500">Supports: {parent.title}</div>}
                      <div className="mt-4">
                        <ProgressBar value={r.progress} />
                      </div>
                      <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm">
                        {r.initiatives.length === 0 && <li className="text-slate-400">No initiatives yet</li>}
                        {r.initiatives.map((i) => (
                          <li key={i.id} className="flex items-center justify-between gap-3">
                            <Link href={`/initiatives/${i.id}`} className="min-w-0 truncate text-slate-700 hover:text-brand-700 hover:underline">
                              {i.title}
                            </Link>
                            <span className="shrink-0 tabular-nums text-slate-500">{formatPercent(i.progress)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto pt-4">
                        <LinkButton href={`/initiatives/new?rockId=${r.id}`} variant="ghost" className="!px-0">
                          + Add initiative
                        </LinkButton>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section>
              <SectionTitle>Directors this quarter</SectionTitle>
              <Card className="overflow-x-auto !p-0">
                {owners.length === 0 ? (
                  <p className="p-5 text-sm text-slate-500">No initiatives this quarter yet.</p>
                ) : (
                  <table className="w-full min-w-[30rem] text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-5 py-2 font-medium">Director</th>
                        <th className="px-2 py-2 text-right font-medium">Initiatives</th>
                        <th className="px-2 py-2 text-right font-medium">Milestones</th>
                        <th className="w-40 px-5 py-2 font-medium">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {owners.map(([id, o]) => (
                        <tr key={id} className="border-b border-slate-50 last:border-0">
                          <td className="px-5 py-2.5">
                            <Link href={`/initiatives?owner=${id}`} className="flex items-center gap-2 hover:underline">
                              <Avatar name={o.name} size="sm" />
                              {o.name}
                            </Link>
                          </td>
                          <td className="px-2 py-2.5 text-right tabular-nums">{o.items.length}</td>
                          <td className="px-2 py-2.5 text-right tabular-nums">
                            {o.items.reduce((s, i) => s + i.done, 0)}/{o.items.reduce((s, i) => s + i.total, 0)}
                          </td>
                          <td className="px-5 py-2.5">
                            <ProgressBar value={avg(o.items.map((i) => i.progress))} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            </section>

            <section>
              <SectionTitle actions={<LinkButton href="/initiatives" variant="ghost">All initiatives →</LinkButton>}>
                Recently updated
              </SectionTitle>
              <Card className="!p-0">
                {recent.length === 0 ? (
                  <p className="p-5 text-sm text-slate-500">Nothing yet.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {recent.map((i) => (
                      <li key={i.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="min-w-0 flex-1">
                          <Link href={`/initiatives/${i.id}`} className="block truncate text-sm font-medium text-slate-800 hover:text-brand-700 hover:underline">
                            {i.title}
                          </Link>
                          <div className="text-xs text-slate-500">
                            {i.ownerName} · updated {formatDate(i.updatedAt)}
                          </div>
                        </div>
                        <StatusBadge progress={i.progress} total={i.total} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>
          </div>

          <section>
            <SectionTitle>How it rolls up</SectionTitle>
            <GoalTree nodes={roots} openDepth={3} />
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, href }: { label: string; value: number | null; sub?: string; href?: string }) {
  const body = (
    <Card className="h-full">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">{formatPercent(value)}</div>
      <div className="mt-3">
        <ProgressBar value={value} size="sm" showLabel={false} label={label} />
      </div>
      {sub && <div className="mt-2 truncate text-sm text-slate-500">{sub}</div>}
    </Card>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-90">
      {body}
    </Link>
  ) : (
    body
  );
}

function PriorityCard({ goal }: { goal: GoalNode }) {
  return (
    <Card className="!border-amber-200 bg-amber-50/60">
      <div className="flex items-center gap-2">
        <TopPriorityBadge />
        <Badge>{goal.level === "rock" ? `Rock · ${periodLabel(goal)}` : `Annual goal · ${periodLabel(goal)}`}</Badge>
      </div>
      <Link href={`/strategy/${goal.id}`} className="mt-2 block text-lg font-semibold text-slate-900 hover:underline">
        {goal.title}
      </Link>
      {goal.ownerName && <div className="text-sm text-slate-600">Owner: {goal.ownerName}</div>}
      <div className="mt-3">
        <ProgressBar value={goal.progress} />
      </div>
    </Card>
  );
}
