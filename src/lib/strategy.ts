import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Goal } from "@/db/schema";

export { LEVELS, LEVEL_ORDER } from "@/lib/levels";

export function currentPeriod(now = new Date()) {
  return { year: now.getFullYear(), quarter: Math.floor(now.getMonth() / 3) + 1 };
}

export function periodLabel(goal: Pick<Goal, "level" | "year" | "quarter" | "targetYear">) {
  if (goal.level === "rock" && goal.year && goal.quarter) return `Q${goal.quarter} ${goal.year}`;
  if (goal.level === "annual" && goal.year) return `${goal.year}`;
  if (goal.targetYear) return `by ${goal.targetYear}`;
  return "";
}

export type InitiativeSummary = {
  id: string;
  title: string;
  rockId: string;
  ownerId: string;
  ownerName: string;
  dueDate: string | null;
  total: number;
  done: number;
  /** 0–1, or null when the initiative has no milestones yet. */
  progress: number | null;
  updatedAt: Date;
};

export type GoalNode = Goal & {
  ownerName: string | null;
  children: GoalNode[];
  initiatives: InitiativeSummary[];
  /** 0–1, or null when nothing below it exists yet. */
  progress: number | null;
};

export function initiativeProgress(total: number, done: number): number | null {
  return total === 0 ? null : done / total;
}

/**
 * Average of the parts below a node. A part that has nothing in it yet counts as 0%,
 * so an empty Rock pulls its Annual Goal down instead of being silently ignored.
 */
function average(values: (number | null)[]): number | null {
  if (values.length === 0) return null;
  return values.reduce<number>((sum, v) => sum + (v ?? 0), 0) / values.length;
}

export async function loadInitiativeSummaries(): Promise<InitiativeSummary[]> {
  const rows = await db
    .select({
      id: schema.initiatives.id,
      title: schema.initiatives.title,
      rockId: schema.initiatives.rockId,
      ownerId: schema.initiatives.ownerId,
      ownerName: schema.users.name,
      dueDate: schema.initiatives.dueDate,
      updatedAt: schema.initiatives.updatedAt,
      total: sql<number>`count(${schema.milestones.id})::int`,
      done: sql<number>`count(${schema.milestones.completedAt})::int`,
    })
    .from(schema.initiatives)
    .innerJoin(schema.users, eq(schema.initiatives.ownerId, schema.users.id))
    .leftJoin(schema.milestones, eq(schema.milestones.initiativeId, schema.initiatives.id))
    .groupBy(schema.initiatives.id, schema.users.name)
    .orderBy(asc(schema.initiatives.createdAt));
  return rows.map((r) => ({ ...r, progress: initiativeProgress(r.total, r.done) }));
}

/** Loads the whole strategy tree with progress rolled up from milestones to the BHAG. */
export async function loadStrategy() {
  const [goalRows, initiatives] = await Promise.all([
    db
      .select({ goal: schema.goals, ownerName: schema.users.name })
      .from(schema.goals)
      .leftJoin(schema.users, eq(schema.goals.ownerId, schema.users.id))
      .orderBy(
        asc(schema.goals.year),
        asc(schema.goals.quarter),
        asc(schema.goals.targetYear),
        asc(schema.goals.sortOrder),
        asc(schema.goals.createdAt),
      ),
    loadInitiativeSummaries(),
  ]);

  const nodes = new Map<string, GoalNode>();
  for (const { goal, ownerName } of goalRows) {
    nodes.set(goal.id, { ...goal, ownerName, children: [], initiatives: [], progress: null });
  }
  const roots: GoalNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  for (const i of initiatives) nodes.get(i.rockId)?.initiatives.push(i);

  const compute = (node: GoalNode): number | null => {
    const childValues = node.children.map(compute);
    node.progress =
      node.level === "rock" ? average(node.initiatives.map((i) => i.progress)) : average(childValues);
    return node.progress;
  };
  roots.forEach(compute);

  return { roots, nodes, initiatives };
}

export function flatten(nodes: GoalNode[]): GoalNode[] {
  return nodes.flatMap((n) => [n, ...flatten(n.children)]);
}

/** Ancestors from the top of the tree down to (but excluding) the node. */
export function ancestors(node: GoalNode, all: Map<string, GoalNode>): GoalNode[] {
  const chain: GoalNode[] = [];
  let cur = node.parentId ? all.get(node.parentId) : undefined;
  while (cur) {
    chain.unshift(cur);
    cur = cur.parentId ? all.get(cur.parentId) : undefined;
  }
  return chain;
}

export function formatPercent(value: number | null) {
  return value === null ? "—" : `${Math.round(value * 1000) / 10}%`;
}
