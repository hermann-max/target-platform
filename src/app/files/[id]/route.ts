import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { readStoredFile } from "@/lib/storage";

const INLINE_TYPES = /^(image\/(png|jpe?g|gif|webp|avif)|application\/pdf|text\/plain)$/;

/** Serves uploaded evidence to signed-in users only. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Sign in to view this file.", { status: 401 });

  const { id } = await params;
  const [ev] = await db.select().from(schema.evidence).where(eq(schema.evidence.id, id));
  if (!ev?.storageKey) return new Response("Not found", { status: 404 });

  const body = await readStoredFile(ev.storageKey);
  if (!body) return new Response("Not found", { status: 404 });

  const type = ev.contentType || "application/octet-stream";
  const inline = INLINE_TYPES.test(type) && !request.nextUrl.searchParams.has("download");
  const filename = encodeURIComponent(ev.label.replace(/[\r\n"]/g, ""));
  return new Response(body as BodyInit, {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${filename}`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
