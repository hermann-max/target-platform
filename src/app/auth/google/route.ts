import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { googleClient, googleEnabled } from "@/lib/google";

export async function GET(request: NextRequest) {
  if (!googleEnabled()) return NextResponse.redirect(new URL("/login", request.url));

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = googleClient(request.nextUrl.origin).createAuthorizationURL(state, codeVerifier, [
    "openid",
    "email",
    "profile",
  ]);
  if (process.env.GOOGLE_ALLOWED_DOMAIN) url.searchParams.set("hd", process.env.GOOGLE_ALLOWED_DOMAIN);
  url.searchParams.set("prompt", "select_account");

  const jar = await cookies();
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };
  jar.set("google_oauth_state", state, opts);
  jar.set("google_code_verifier", codeVerifier, opts);
  return NextResponse.redirect(url);
}
