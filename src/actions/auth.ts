"use server";

import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { createSession, destroyAllSessions, destroySession, requireUser } from "@/lib/auth";
import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from "@/lib/password";
import { str, type ActionState } from "@/lib/forms";

export async function login(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email").toLowerCase();
  const password = fd.get("password");
  if (!email || typeof password !== "string" || !password) return { error: "Enter your email and password." };

  const [user] = await db.select().from(schema.users).where(eq(sql`lower(${schema.users.email})`, email));
  const ok = user?.active && (await verifyPassword(password, user.passwordHash));
  if (!user || !ok) {
    await new Promise((r) => setTimeout(r, 400));
    return { error: "That email and password don't match an active account." };
  }

  await createSession(user.id);
  redirect(user.mustChangePassword ? "/change-password" : "/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function changePassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireUser({ allowPendingPasswordChange: true });
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, me.id));

  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");

  // A forced change follows a sign-in with the temporary password, and a Google-only account has no password yet.
  const needsCurrent = Boolean(user.passwordHash) && !user.mustChangePassword;
  if (needsCurrent && !(await verifyPassword(current, user.passwordHash))) {
    return { error: "Your current password is incorrect." };
  }
  if (next.length < MIN_PASSWORD_LENGTH) return { error: `Use at least ${MIN_PASSWORD_LENGTH} characters.` };
  if (next !== confirm) return { error: "The two new passwords don't match." };
  if (user.passwordHash && (await verifyPassword(next, user.passwordHash))) {
    return { error: "Choose a password different from the current one." };
  }

  await db
    .update(schema.users)
    .set({ passwordHash: await hashPassword(next), mustChangePassword: false })
    .where(eq(schema.users.id, user.id));
  // Sign out other devices, keep this one.
  await destroyAllSessions(user.id);
  await createSession(user.id);

  if (user.mustChangePassword) redirect("/");
  return { success: "Password updated." };
}

export async function updateProfile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireUser();
  const name = str(fd, "name");
  if (!name) return { error: "Enter your name." };
  await db.update(schema.users).set({ name }).where(eq(schema.users.id, me.id));
  return { success: "Saved." };
}
