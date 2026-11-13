import Link from "next/link";
import { LEVELS, periodLabel, type GoalNode } from "@/lib/strategy";
import { Badge, ProgressBar, TopPriorityBadge } from "@/components/ui";

const levelTone: Record<GoalNode["level"], string> = {
  bhag: "border-l-brand-700",
  target: "border-l-brand-500",
  annual: "border-l-brand-300",
  rock: "border-l-amber-400",
};

/** Collapsible strategy tree from the BHAG down to Rocks (and optionally their initiatives). */
export function GoalTree({
  nodes,
  showInitiatives = false,
  openDepth = 2,
  depth = 0,
}: {
  nodes: GoalNode[];
  showInitiatives?: boolean;
  openDepth?: number;
  depth?: number;
}) {
  return (
    <ul className={depth === 0 ? "space-y-2" : "mt-2 space-y-2 border-l border-slate-200 pl-4 sm:pl-6"}>
      {nodes.map((n) => {
        const hasBody = n.children.length > 0 || (showInitiatives && n.initiatives.length > 0);
        const row = (
          <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-l-4 border-slate-200 bg-white px-4 py-3 ${levelTone[n.level]}`}>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wide">{LEVELS[n.level].short}</span>
                {periodLabel(n) && <span>· {periodLabel(n)}</span>}
                {n.ownerName && <span>· {n.ownerName}</span>}
                {n.isTopPriority && <TopPriorityBadge />}
                {n.level === "rock" && <Badge>{n.initiatives.length} initiative{n.initiatives.length === 1 ? "" : "s"}</Badge>}
              </div>
              <Link href={`/strategy/${n.id}`} className="mt-0.5 block font-medium text-slate-900 hover:text-brand-700 hover:underline">
                {n.title}
              </Link>
            </div>
            <div className="w-full sm:w-56">
              <ProgressBar value={n.progress} size="sm" label={`${n.title} progress`} />
            </div>
          </div>
        );
        return (
          <li key={n.id}>
            {hasBody ? (
              <details open={depth < openDepth} className="group">
                <summary className="flex cursor-pointer list-none items-start gap-2 [&::-webkit-details-marker]:hidden">
                  <span className="mt-4 text-slate-400 transition-transform group-open:rotate-90" aria-hidden>
                    ▸
                  </span>
                  <div className="flex-1">{row}</div>
                </summary>
                <div className="ml-4">
                  {n.children.length > 0 && (
                    <GoalTree nodes={n.children} showInitiatives={showInitiatives} openDepth={openDepth} depth={depth + 1} />
                  )}
                  {showInitiatives && n.initiatives.length > 0 && (
                    <ul className="mt-2 space-y-1 border-l border-slate-200 pl-4 sm:pl-6">
                      {n.initiatives.map((i) => (
                        <li key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-slate-50 px-3 py-2">
                          <Link href={`/initiatives/${i.id}`} className="min-w-0 flex-1 text-sm text-slate-800 hover:text-brand-700 hover:underline">
                            {i.title} <span className="text-slate-500">· {i.ownerName}</span>
                          </Link>
                          <div className="w-full sm:w-48">
                            <ProgressBar value={i.progress} size="sm" />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            ) : (
              <div className="flex items-start gap-2">
                <span className="mt-4 w-[0.6rem]" aria-hidden />
                <div className="flex-1">{row}</div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
