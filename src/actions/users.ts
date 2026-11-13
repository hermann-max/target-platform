"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { destroyAllSessions, requireAdmin } from "@/lib/auth";
import { hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { isEmail, str, type ActionState } from "@/lib/forms";
import type { Role } from "@/db/schema";

function parseRole(v: string): Role {
  return v === "admin" ? "admin" : "director";
}

async function emailTaken(email: string, exceptId?: string) {
  const [row] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(
      exceptId
        ? and(eq(sql`lower(${schema.users.email})`, email), ne(schema.users.id, exceptId))
        : eq(sql`lower(${schema.users.email})`, email),
    );
  return Boolean(row);
}

export async function createUser(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const email = str(fd, "email").toLowerCase();
  const name = str(fd, "name");
  const password = String(fd.get("password") ?? "");
  if (!isEmail(email)) return { error: "Enter a valid email address." };
  if (!name) return { error: "Enter the person's name." };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `The temporary password needs at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (await emailTaken(email)) return { error: "An account with this email already exists." };

  await db.insert(schema.users).values({
    email,
    name,
    role: parseRole(str(fd, "role")),
    passwordHash: await hashPassword(password),
    mustChangePassword: true,
  });
  revalidatePath("/admin/users");
  return { success: `Account created for ${email}. Share the temporary password with them; they'll set their own at first sign-in.` };
}

export async function updateUser(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const id = str(fd, "id");
  const email = str(fd, "email").toLowerCase();
  const name = str(fd, "name");
  const role = parseRole(str(fd, "role"));
  const active = str(fd, "active") !== "false";

  if (!isEmail(email)) return { error: "Enter a valid email address." };
  if (!name) return { error: "Enter the person's name." };
  if (id === me.id && (role !== "admin" || !active)) {
    return { error: "You can't remove your own admin access or deactivate yourself." };
  }
  if (await emailTaken(email, id)) return { error: "Another account already uses this email." };

  await db.update(schema.users).set({ email, name, role, active }).where(eq(schema.users.id, id));
  if (!active) await destroyAllSessions(id);
  revalidatePath("/admin/users");
  return { success: "Saved." };
}

export async function resetPassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(fd, "id");
  const password = String(fd.get("password") ?? "");
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `The temporary password needs at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  await db
    .update(schema.users)
    .set({ passwordHash: await hashPassword(password), mustChangePassword: true })
    .where(eq(schema.users.id, id));
  await destroyAllSessions(id);
  return { success: "Temporary password set. They'll be asked to choose a new one at their next sign-in." };
}
