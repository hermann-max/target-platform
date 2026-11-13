import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { flatten, loadStrategy } from "@/lib/strategy";
import { Card, EmptyState, LinkButton, PageHeader, ProgressBar, StatusBadge, formatDate, inputClass } from "@/components/ui";

export const metadata = { title: "Initiatives" };

export default async function InitiativesPage({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string; period?: string; status?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const [{ roots, initiatives }, users] = await Promise.all([
    loadStrategy(),
    db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users).where(eq(schema.users.active, true)).orderBy(asc(schema.users.name)),
  ]);

  const rocks = new Map(flatten(roots).filter((g) => g.level === "rock").map((r) => [r.id, r]));
  const periods = [...new Set([...rocks.values()].map((r) => `${r.year}-Q${r.quarter}`))].sort().reverse();

  const owner = sp.owner === "me" ? user.id : sp.owner;
  const rows = initiatives
    .filter((i) => !owner || i.ownerId === owner)
    .filter((i) => {
      if (!sp.period) return true;
      const r = rocks.get(i.rockId);
      return r && `${r.year}-Q${r.quarter}` === sp.period;
    })
    .filter((i) => {
      switch (sp.status) {
        case "complete":
          return i.progress === 1;
        case "in-progress":
          return i.progress !== null && i.progress > 0 && i.progress < 1;
        case "not-started":
          return !i.progress;
        default:
          return true;
      }
    })
    .sort((a, b) => +b.updatedAt - +a.updatedAt);

  return (
    <div>
      <PageHeader
        title="Initiatives"
        description="Everything directors are working on to deliver the Rocks."
        actions={<LinkButton href="/initiatives/new">+ New initiative</LinkButton>}
      />

      <form className="mb-6 flex flex-wrap items-end gap-3" method="get">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Owner</span>
          <select name="owner" defaultValue={sp.owner ?? ""} className={inputClass}>
            <option value="">Everyone</option>
            <option value="me">Me</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Quarter</span>
          <select name="period" defaultValue={sp.period ?? ""} className={inputClass}>
            <option value="">All quarters</option>
            {periods.map((p) => {
              const [y, q] = p.split("-");
              return (
                <option key={p} value={p}>
                  {q} {y}
                </option>
              );
            })}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Status</span>
          <select name="status" defaultValue={sp.status ?? ""} className={inputClass}>
            <option value="">Any status</option>
            <option value="not-started">Not started</option>
            <option value="in-progress">In progress</option>
            <option value="complete">Complete</option>
          </select>
        </label>
        <button className="rounded-md bg-white px-3.5 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">
          Filter
        </button>
        {(sp.owner || sp.period || sp.status) && (
          <Link href="/initiatives" className="py-2 text-sm text-slate-500 hover:underline">
            Clear
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <EmptyState title="No initiatives match">Try different filters, or create one.</EmptyState>
      ) : (
        <Card className="overflow-x-auto !p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Initiative</th>
                <th className="px-3 py-3 font-medium">Rock</th>
                <th className="px-3 py-3 font-medium">Owner</th>
                <th className="px-3 py-3 text-right font-medium">Milestones</th>
                <th className="w-48 px-5 py-3 font-medium">Progress</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => {
                const rock = rocks.get(i.rockId);
                return (
                  <tr key={i.id} className="border-b border-slate-50 align-top last:border-0">
                    <td className="px-5 py-3">
                      <Link href={`/initiatives/${i.id}`} className="font-medium text-slate-900 hover:text-brand-700 hover:underline">
                        {i.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <StatusBadge progress={i.progress} total={i.total} />
                        {i.dueDate && <span>Due {formatDate(i.dueDate)}</span>}
                        <span>Updated {formatDate(i.updatedAt)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {rock && (
                        <Link href={`/strategy/${rock.id}`} className="hover:underline">
                          <span className="text-xs text-slate-400">Q{rock.quarter} {rock.year}</span>
                          <br />
                          {rock.title}
                        </Link>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-700">{i.ownerName}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                      {i.done}/{i.total}
                    </td>
                    <td className="px-5 py-3">
                      <ProgressBar value={i.progress} size="sm" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
