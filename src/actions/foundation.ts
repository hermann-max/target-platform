"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { optInt, str, type ActionState } from "@/lib/forms";

export async function saveCorePurpose(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const corePurpose = str(fd, "corePurpose");
  await db
    .insert(schema.foundation)
    .values({ id: 1, corePurpose })
    .onConflictDoUpdate({ target: schema.foundation.id, set: { corePurpose, updatedAt: sql`now()` } });
  revalidatePath("/", "layout");
  return { success: "Core Purpose saved." };
}

export async function saveCoreValue(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(fd, "id");
  const title = str(fd, "title");
  const description = str(fd, "description");
  const sortOrder = optInt(fd, "sortOrder") ?? 0;
  if (!title) return { error: "Give the value a name." };

  if (id) {
    await db.update(schema.coreValues).set({ title, description, sortOrder }).where(eq(schema.coreValues.id, id));
  } else {
    const [{ max }] = await db
      .select({ max: sql<number>`coalesce(max(${schema.coreValues.sortOrder}), 0)::int` })
      .from(schema.coreValues);
    await db.insert(schema.coreValues).values({ title, description, sortOrder: max + 1 });
  }
  revalidatePath("/", "layout");
  return { success: id ? "Saved." : "Value added." };
}

export async function deleteCoreValue(fd: FormData) {
  await requireAdmin();
  await db.delete(schema.coreValues).where(eq(schema.coreValues.id, str(fd, "id")));
  revalidatePath("/", "layout");
}
