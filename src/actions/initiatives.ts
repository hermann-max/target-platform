"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { canEditInitiative, requireUser, type SessionUser } from "@/lib/auth";
import { deleteFile, MAX_UPLOAD_BYTES, storeFile } from "@/lib/storage";
import { isHttpUrl, optDate, optStr, str, type ActionState } from "@/lib/forms";

async function loadEditable(user: SessionUser, initiativeId: string) {
  const [initiative] = await db.select().from(schema.initiatives).where(eq(schema.initiatives.id, initiativeId));
  if (!initiative) return { error: "This initiative no longer exists." } as const;
  if (!canEditInitiative(user, initiative)) {
    return { error: "Only the director who owns this initiative (or an admin) can change it." } as const;
  }
  return { initiative } as const;
}

async function touch(initiativeId: string) {
  await db.update(schema.initiatives).set({ updatedAt: sql`now()` }).where(eq(schema.initiatives.id, initiativeId));
  revalidatePath("/", "layout");
}

/* ---------- Initiatives ---------- */

export async function saveInitiative(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = str(fd, "id");
  const title = str(fd, "title");
  const rockId = str(fd, "rockId");
  if (!title) return { error: "Give the initiative a title." };

  const [rock] = rockId ? await db.select().from(schema.goals).where(eq(schema.goals.id, rockId)) : [];
  if (!rock || rock.level !== "rock") return { error: "Choose the Quarterly Rock this initiative delivers." };

  const values = { title, rockId, description: str(fd, "description"), dueDate: optDate(fd, "dueDate") };

  // Only admins choose the owner; anyone else always owns what they create and can't reassign it.
  const chosenOwner = user.role === "admin" ? optStr(fd, "ownerId") : null;
  async function validOwner(ownerId: string, currentOwnerId?: string) {
    if (ownerId === currentOwnerId) return true; // keeping a deactivated owner is fine
    const [u] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(and(eq(schema.users.id, ownerId), eq(schema.users.active, true)));
    return Boolean(u);
  }

  if (id) {
    const res = await loadEditable(user, id);
    if ("error" in res) return { error: res.error };
    // Only admins can hand an initiative to someone else.
    const ownerId = chosenOwner ?? res.initiative.ownerId;
    if (!(await validOwner(ownerId, res.initiative.ownerId))) return { error: "Choose an active person as the owner." };
    await db
      .update(schema.initiatives)
      .set({ ...values, ownerId, updatedAt: sql`now()` })
      .where(eq(schema.initiatives.id, id));
    revalidatePath("/", "layout");
    redirect(`/initiatives/${id}`);
  }

  const ownerId = chosenOwner ?? user.id;
  if (!(await validOwner(ownerId))) return { error: "Choose an active person as the owner." };
  const [row] = await db
    .insert(schema.initiatives)
    .values({ ...values, ownerId })
    .returning({ id: schema.initiatives.id });

  // Optional milestones typed in at creation, one per line.
  const lines = str(fd, "milestones")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length) {
    await db
      .insert(schema.milestones)
      .values(lines.map((t, i) => ({ initiativeId: row.id, title: t, sortOrder: i + 1 })));
  }

  revalidatePath("/", "layout");
  redirect(`/initiatives/${row.id}`);
}

export async function deleteInitiative(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const res = await loadEditable(user, str(fd, "id"));
  if ("error" in res) return { error: res.error };

  const files = await db
    .select({ key: schema.evidence.storageKey })
    .from(schema.evidence)
    .where(eq(schema.evidence.initiativeId, res.initiative.id));
  await db.delete(schema.initiatives).where(eq(schema.initiatives.id, res.initiative.id));
  await Promise.all(files.map((f) => deleteFile(f.key)));

  revalidatePath("/", "layout");
  redirect(`/strategy/${res.initiative.rockId}`);
}

/* ---------- Milestones ---------- */

export async function addMilestone(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const initiativeId = str(fd, "initiativeId");
  const res = await loadEditable(user, initiativeId);
  if ("error" in res) return { error: res.error };
  const title = str(fd, "title");
  if (!title) return { error: "Give the milestone a title." };

  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${schema.milestones.sortOrder}), 0)::int` })
    .from(schema.milestones)
    .where(eq(schema.milestones.initiativeId, initiativeId));
  await db.insert(schema.milestones).values({
    initiativeId,
    title,
    description: str(fd, "description"),
    dueDate: optDate(fd, "dueDate"),
    sortOrder: max + 1,
  });
  await touch(initiativeId);
  return { success: "Milestone added." };
}

export async function updateMilestone(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const [m] = await db.select().from(schema.milestones).where(eq(schema.milestones.id, str(fd, "id")));
  if (!m) return { error: "This milestone no longer exists." };
  const res = await loadEditable(user, m.initiativeId);
  if ("error" in res) return { error: res.error };
  const title = str(fd, "title");
  if (!title) return { error: "Give the milestone a title." };

  await db
    .update(schema.milestones)
    .set({ title, description: str(fd, "description"), dueDate: optDate(fd, "dueDate") })
    .where(eq(schema.milestones.id, m.id));
  await touch(m.initiativeId);
  return { success: "Saved." };
}

export async function toggleMilestone(fd: FormData) {
  const user = await requireUser();
  const [m] = await db.select().from(schema.milestones).where(eq(schema.milestones.id, str(fd, "id")));
  if (!m) return;
  const res = await loadEditable(user, m.initiativeId);
  if ("error" in res) return;

  const done = m.completedAt !== null;
  await db
    .update(schema.milestones)
    .set(done ? { completedAt: null, completedById: null } : { completedAt: sql`now()`, completedById: user.id })
    .where(eq(schema.milestones.id, m.id));
  await touch(m.initiativeId);
}

export async function deleteMilestone(fd: FormData) {
  const user = await requireUser();
  const [m] = await db.select().from(schema.milestones).where(eq(schema.milestones.id, str(fd, "id")));
  if (!m) return;
  const res = await loadEditable(user, m.initiativeId);
  if ("error" in res) return;

  const files = await db
    .select({ key: schema.evidence.storageKey })
    .from(schema.evidence)
    .where(eq(schema.evidence.milestoneId, m.id));
  await db.delete(schema.milestones).where(eq(schema.milestones.id, m.id));
  await Promise.all(files.map((f) => deleteFile(f.key)));
  await touch(m.initiativeId);
}

/* ---------- Evidence ---------- */

export async function addEvidence(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const initiativeId = str(fd, "initiativeId");
  const res = await loadEditable(user, initiativeId);
  if ("error" in res) return { error: res.error };

  const milestoneId = optStr(fd, "milestoneId");
  if (milestoneId) {
    const [m] = await db
      .select({ id: schema.milestones.id })
      .from(schema.milestones)
      .where(and(eq(schema.milestones.id, milestoneId), eq(schema.milestones.initiativeId, initiativeId)));
    if (!m) return { error: "That milestone isn't part of this initiative." };
  }

  const url = str(fd, "url");
  const file = fd.get("file");
  const hasFile = file instanceof File && file.size > 0;
  let label = str(fd, "label");

  if (url && hasFile) return { error: "Add either a link or a file, not both at once." };

  if (url) {
    if (!isHttpUrl(url)) return { error: "Links must start with http:// or https://." };
    await db.insert(schema.evidence).values({
      initiativeId,
      milestoneId,
      kind: "url",
      label: label || url,
      url,
      uploadedById: user.id,
    });
  } else if (hasFile) {
    if (file.size > MAX_UPLOAD_BYTES) {
      return { error: "Files can be up to 4 MB. For larger files, upload them to Drive and add the link instead." };
    }
    let stored;
    try {
      stored = await storeFile(file, initiativeId);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "The upload failed. Please try again." };
    }
    label ||= file.name;
    await db.insert(schema.evidence).values({
      initiativeId,
      milestoneId,
      kind: file.type.startsWith("image/") ? "image" : "file",
      label,
      url: stored.url,
      storageKey: stored.storageKey,
      contentType: file.type || null,
      size: file.size,
      uploadedById: user.id,
    });
  } else {
    return { error: "Paste a link or choose a file." };
  }

  await touch(initiativeId);
  return { success: "Evidence added." };
}

export async function deleteEvidence(fd: FormData) {
  const user = await requireUser();
  const [ev] = await db.select().from(schema.evidence).where(eq(schema.evidence.id, str(fd, "id")));
  if (!ev) return;
  const res = await loadEditable(user, ev.initiativeId);
  if ("error" in res) return;
  await db.delete(schema.evidence).where(eq(schema.evidence.id, ev.id));
  await deleteFile(ev.storageKey);
  await touch(ev.initiativeId);
}

/* ---------- Comments (anyone signed in) ---------- */

export async function addComment(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const initiativeId = str(fd, "initiativeId");
  const body = str(fd, "body");
  if (!body) return { error: "Write a comment first." };
  const [initiative] = await db
    .select({ id: schema.initiatives.id })
    .from(schema.initiatives)
    .where(eq(schema.initiatives.id, initiativeId));
  if (!initiative) return { error: "This initiative no longer exists." };

  await db.insert(schema.comments).values({ initiativeId, authorId: user.id, body });
  revalidatePath(`/initiatives/${initiativeId}`);
  return { success: "posted" };
}

export async function deleteComment(fd: FormData) {
  const user = await requireUser();
  const id = str(fd, "id");
  const [c] = await db.select().from(schema.comments).where(eq(schema.comments.id, id));
  if (!c || (c.authorId !== user.id && user.role !== "admin")) return;
  await db.delete(schema.comments).where(eq(schema.comments.id, id));
  revalidatePath(`/initiatives/${c.initiativeId}`);
}
