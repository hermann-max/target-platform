import "server-only";
import { put, del, get } from "@vercel/blob";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Evidence files are stored in Vercel Blob when BLOB_READ_WRITE_TOKEN is set, and in ./.uploads otherwise
 * (local development only: Vercel's filesystem is read-only). The app never shows storage URLs; files are
 * always served through /files/<evidenceId>, which requires a signed-in user.
 */
const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const blobAccess = () => (process.env.BLOB_ACCESS === "private" ? "private" : "public") as "public" | "private";
const LOCAL_DIR = path.join(process.cwd(), ".uploads");

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export type StoredFile = { url: string; storageKey: string };

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80) || "file";
}

export async function storeFile(file: File, folder: string): Promise<StoredFile> {
  const key = `${folder}/${randomUUID()}-${safeName(file.name)}`;
  if (useBlob()) {
    const blob = await put(`evidence/${key}`, file, {
      access: blobAccess(),
      contentType: file.type || undefined,
    });
    return { url: blob.url, storageKey: blob.url };
  }
  if (process.env.VERCEL) {
    throw new Error("File storage is not configured. Create a Blob store in the Vercel project's Storage tab.");
  }
  const target = path.join(LOCAL_DIR, key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await file.arrayBuffer()));
  return { url: `local:${key}`, storageKey: `local:${key}` };
}

export async function deleteFile(storageKey: string | null) {
  if (!storageKey) return;
  try {
    if (storageKey.startsWith("local:")) await unlink(path.join(LOCAL_DIR, storageKey.slice(6)));
    else await del(storageKey);
  } catch {
    // The record is removed regardless; a leftover file is harmless.
  }
}

export async function readStoredFile(storageKey: string): Promise<ReadableStream | Buffer | null> {
  if (storageKey.startsWith("local:")) {
    const rel = path.normalize(storageKey.slice(6));
    if (rel.startsWith("..")) return null;
    try {
      return await readFile(path.join(LOCAL_DIR, rel));
    } catch {
      return null;
    }
  }
  const result = await get(storageKey, { access: blobAccess() });
  return result?.stream ?? null;
}
