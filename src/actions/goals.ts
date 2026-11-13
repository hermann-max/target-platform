"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { LEVELS } from "@/lib/strategy";
import { bool, optInt, optStr, str, type ActionState } from "@/lib/forms";
import type { GoalLevel } from "@/db/schema";

const LEVEL_KEYS = Object.keys(LEVELS) as GoalLevel[];

export async function saveGoal(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();

  const id = str(fd, "id");
  const level = str(fd, "level") as GoalLevel;
  if (!LEVEL_KEYS.includes(level)) return { error: "Unknown goal level." };
  const meta = LEVELS[level];

  const title = str(fd, "title");
  if (!title) return { error: "Give it a title." };

  let parentId: string | null = null;
  let parentYear: number | null = null;
  if (meta.parent) {
    parentId = optStr(fd, "parentId");
    if (!parentId) return { error: `Choose the ${LEVELS[meta.parent].label} this supports.` };
    const [parent] = await db.select().from(schema.goals).where(eq(schema.goals.id, parentId));
    if (!parent || parent.level !== meta.parent) return { error: `The parent must be a ${LEVELS[meta.parent].label}.` };
    parentYear = parent.year;
  }

  const values = {
    level,
    parentId,
    title,
    description: str(fd, "description"),
    ownerId: optStr(fd, "ownerId"),
    targetYear: level === "bhag" || level === "target" ? optInt(fd, "targetYear") : null,
    year: level === "annual" || level === "rock" ? (optInt(fd, "year") ?? parentYear) : null,
    quarter: level === "rock" ? optInt(fd, "quarter") : null,
    isTopPriority: (level === "annual" || level === "rock") && bool(fd, "isTopPriority"),
  };

  if ((level === "annual" || level === "rock") && !values.year) return { error: "Choose the year." };
  if (level === "rock" && (!values.quarter || values.quarter < 1 || values.quarter > 4)) {
    return { error: "Choose the quarter." };
  }

  const savedId = await db.transaction(async (tx) => {
    // Only one #1 Priority per year (annual goals) or per quarter (Rocks).
    if (values.isTopPriority) {
      await tx
        .update(schema.goals)
        .set({ isTopPriority: false })
        .where(
          and(
            eq(schema.goals.level, level),
            eq(schema.goals.year, values.year!),
            level === "rock" ? eq(schema.goals.quarter, values.quarter!) : sql`true`,
            id ? ne(schema.goals.id, id) : sql`true`,
          ),
        );
    }
    if (id) {
      await tx.update(schema.goals).set(values).where(eq(schema.goals.id, id));
      return id;
    }
    const [row] = await tx.insert(schema.goals).values(values).returning({ id: schema.goals.id });
    return row.id;
  });

  revalidatePath("/", "layout");
  redirect(`/strategy/${savedId}`);
}

export async function deleteGoal(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(fd, "id");
  const [goal] = await db.select().from(schema.goals).where(eq(schema.goals.id, id));
  if (!goal) redirect("/strategy");

  const [{ children }] = await db
    .select({ children: sql<number>`count(*)::int` })
    .from(schema.goals)
    .where(eq(schema.goals.parentId, id));
  const [{ inits }] = await db
    .select({ inits: sql<number>`count(*)::int` })
    .from(schema.initiatives)
    .where(eq(schema.initiatives.rockId, id));
  if (children > 0 || inits > 0) {
    const what = children > 0 ? `${children} ${children === 1 ? "item" : "items"} below it` : `${inits} initiative${inits === 1 ? "" : "s"}`;
    return { error: `This still has ${what}. Delete or move ${children + inits === 1 ? "it" : "them"} first.` };
  }

  await db.delete(schema.goals).where(eq(schema.goals.id, id));
  revalidatePath("/", "layout");
  redirect(goal.parentId ? `/strategy/${goal.parentId}` : "/strategy");
}
