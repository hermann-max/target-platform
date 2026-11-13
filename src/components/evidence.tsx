"use client";

import { useState } from "react";
import { addEvidence, deleteEvidence } from "@/actions/initiatives";
import type { Evidence } from "@/db/schema";
import { ActionForm, SubmitButton } from "@/components/forms";

const input =
  "block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function EvidenceList({ items, canEdit }: { items: Evidence[]; canEdit: boolean }) {
  if (items.length === 0) return null;
  const images = items.filter((e) => e.kind === "image");
  const others = items.filter((e) => e.kind !== "image");

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((e) => (
            <div key={e.id} className="group relative">
              <a href={`/files/${e.id}`} target="_blank" rel="noreferrer" title={e.label}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/files/${e.id}`}
                  alt={e.label}
                  className="h-24 w-32 rounded-md border border-slate-200 object-cover hover:opacity-90"
                />
              </a>
              {canEdit && (
                <form action={deleteEvidence} className="absolute right-1 top-1 hidden group-hover:block">
                  <input type="hidden" name="id" value={e.id} />
                  <SubmitButton variant="secondary" className="!px-1.5 !py-0.5 text-xs" confirm="Remove this image?" title="Remove">
                    ✕
                  </SubmitButton>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
      {others.length > 0 && (
        <ul className="space-y-1.5">
          {others.map((e) => (
            <li key={e.id} className="flex items-center gap-2 text-sm">
              <span aria-hidden className="text-slate-400">
                {e.kind === "url" ? "🔗" : "📄"}
              </span>
              <a
                href={e.kind === "url" ? e.url : `/files/${e.id}`}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 truncate text-brand-700 hover:underline"
                title={e.kind === "url" ? e.url : e.label}
              >
                {e.label}
              </a>
              {e.kind === "file" && <span className="shrink-0 text-xs text-slate-400">{formatSize(e.size)}</span>}
              {canEdit && (
                <form action={deleteEvidence} className="ml-auto shrink-0">
                  <input type="hidden" name="id" value={e.id} />
                  <SubmitButton variant="ghost" className="!px-1.5 !py-0.5 text-xs" confirm="Remove this evidence?" title="Remove">
                    Remove
                  </SubmitButton>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EvidenceForm({ initiativeId, milestoneId }: { initiativeId: string; milestoneId?: string }) {
  const [mode, setMode] = useState<"url" | "file">("url");
  return (
    <ActionForm action={addEvidence} resetOnSuccess className="space-y-3 rounded-lg bg-slate-50 p-3">
      <input type="hidden" name="initiativeId" value={initiativeId} />
      {milestoneId && <input type="hidden" name="milestoneId" value={milestoneId} />}
      <div className="flex gap-1 text-sm">
        {(["url", "file"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-md px-2.5 py-1 ${mode === m ? "bg-white font-medium text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"}`}
          >
            {m === "url" ? "Link" : "File or image"}
          </button>
        ))}
      </div>
      {mode === "url" ? (
        <input name="url" type="url" placeholder="https://docs.google.com/…" className={input} required />
      ) : (
        <div>
          <input
            name="file"
            type="file"
            required
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 file:ring-1 file:ring-slate-300 hover:file:bg-slate-50"
          />
          <p className="mt-1 text-xs text-slate-500">Up to 4 MB. For bigger files, share a Drive link instead.</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <input name="label" placeholder="Label (optional)" className={`${input} min-w-0 flex-1`} />
        <SubmitButton pendingLabel="Adding…">Add evidence</SubmitButton>
      </div>
    </ActionForm>
  );
}
