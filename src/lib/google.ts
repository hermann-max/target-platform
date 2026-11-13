import "server-only";
import { Google } from "arctic";

export function googleEnabled() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleClient(origin: string) {
  const base = (process.env.APP_URL || origin).replace(/\/$/, "");
  return new Google(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${base}/auth/google/callback`,
  );
}
