import { decodeIdToken } from "arctic";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { createSession } from "@/lib/auth";
import { googleClient, googleEnabled } from "@/lib/google";

type GoogleClaims = { email?: string; email_verified?: boolean; name?: string; hd?: string };

function fail(request: NextRequest, reason: string) {
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(reason)}`, request.url));
}

export async function GET(request: NextRequest) {
  if (!googleEnabled()) return fail(request, "Google sign-in is not configured.");

  const jar = await cookies();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = jar.get("google_oauth_state")?.value;
  const verifier = jar.get("google_code_verifier")?.value;
  jar.delete("google_oauth_state");
  jar.delete("google_code_verifier");

  if (!code || !state || !storedState || !verifier || state !== storedState) {
    return fail(request, "Google sign-in expired. Please try again.");
  }

  let claims: GoogleClaims;
  try {
    const tokens = await googleClient(request.nextUrl.origin).validateAuthorizationCode(code, verifier);
    claims = decodeIdToken(tokens.idToken()) as GoogleClaims;
  } catch {
    return fail(request, "Google sign-in failed. Please try again.");
  }

  const email = claims.email?.toLowerCase();
  if (!email || !claims.email_verified) return fail(request, "Your Google account has no verified email.");

  let [user] = await db
    .select()
    .from(schema.users)
    .where(eq(sql`lower(${schema.users.email})`, email));

  if (!user) {
    const domain = process.env.GOOGLE_ALLOWED_DOMAIN?.toLowerCase();
    if (!domain || email.split("@")[1] !== domain) {
      return fail(request, "There is no Target account for this email. Ask an admin to create one.");
    }
    [user] = await db
      .insert(schema.users)
      .values({ email, name: claims.name || email.split("@")[0], role: "director" })
      .returning();
  }

  if (!user.active) return fail(request, "This account has been deactivated.");

  // Google vouches for the identity. Retire an unused temporary password (the admin who set it knows it);
  // the user can set their own password later from the Account page.
  if (user.mustChangePassword) {
    await db
      .update(schema.users)
      .set({ mustChangePassword: false, passwordHash: null })
      .where(eq(schema.users.id, user.id));
  }

  await createSession(user.id);
  return NextResponse.redirect(new URL("/", request.url));
}
