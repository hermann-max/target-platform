import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { canEditInitiative, requireUser } from "@/lib/auth";
import { ancestors, initiativeProgress, LEVELS, loadStrategy, periodLabel } from "@/lib/strategy";
import {
  addComment,
  addMilestone,
  deleteComment,
  deleteInitiative,
  deleteMilestone,
  toggleMilestone,
  updateMilestone,
} from "@/actions/initiatives";
import { ActionForm, SubmitButton } from "@/components/forms";
import { EvidenceForm, EvidenceList } from "@/components/evidence";
import {
  Avatar,
  Card,
  Field,
  LinkButton,
  PageHeader,
  ProgressBar,
  SectionTitle,
  StatusBadge,
  formatDate,
  formatDateTime,
  inputClass,
} from "@/components/ui";

export default async function InitiativePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const [row] = await db
    .select({ initiative: schema.initiatives, ownerName: schema.users.name })
    .from(schema.initiatives)
    .innerJoin(schema.users, eq(schema.initiatives.ownerId, schema.users.id))
    .where(eq(schema.initiatives.id, id));
  if (!row) notFound();
  const { initiative, ownerName } = row;

  const [milestones, evidence, comments, { nodes }] = await Promise.all([
    db
      .select({ m: schema.milestones, completedByName: schema.users.name })
      .from(schema.milestones)
      .leftJoin(schema.users, eq(schema.milestones.completedById, schema.users.id))
      .where(eq(schema.milestones.initiativeId, id))
      .orderBy(asc(schema.milestones.sortOrder), asc(schema.milestones.createdAt)),
    db.select().from(schema.evidence).where(eq(schema.evidence.initiativeId, id)).orderBy(asc(schema.evidence.createdAt)),
    db
      .select({ c: schema.comments, authorName: schema.users.name })
      .from(schema.comments)
      .leftJoin(schema.users, eq(schema.comments.authorId, schema.users.id))
      .where(eq(schema.comments.initiativeId, id))
      .orderBy(asc(schema.comments.createdAt)),
    loadStrategy(),
  ]);

  const canEdit = canEditInitiative(user, initiative);
  const done = milestones.filter((m) => m.m.completedAt).length;
  const progress = initiativeProgress(milestones.length, done);
  const share = milestones.length ? Math.round((1000 / milestones.length)) / 10 : 0;
  const rock = nodes.get(initiative.rockId);
  const chain = rock ? [...ancestors(rock, nodes), rock] : [];
  const initiativeEvidence = evidence.filter((e) => !e.milestoneId);

  return (
    <div>
      <PageHeader
        eyebrow="Initiative"
        title={initiative.title}
        breadcrumbs={[
          { href: "/initiatives", label: "Initiatives" },
          ...(rock ? [{ href: `/strategy/${rock.id}`, label: `${periodLabel(rock)} Rock: ${rock.title}` }] : []),
        ]}
        actions={
          canEdit && (
            <>
              <LinkButton href={`/initiatives/${id}/edit`} variant="secondary">
                Edit
              </LinkButton>
              <ActionForm action={deleteInitiative} showSuccess={false}>
                <input type="hidden" name="id" value={id} />
                <SubmitButton
                  variant="danger"
                  confirm="Delete this initiative with all its milestones, evidence and comments? This can't be undone."
                >
                  Delete
                </SubmitButton>
              </ActionForm>
            </>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card>
            <ProgressBar value={progress} size="lg" label="Initiative progress" />
            <p className="mt-2 text-sm text-slate-500">
              {milestones.length === 0
                ? "Add milestones to start tracking progress."
                : `${done} of ${milestones.length} milestones complete · each one is worth ${share}%`}
            </p>
            {initiative.description && <p className="prose-text mt-5 text-slate-700">{initiative.description}</p>}
          </Card>

          <section>
            <SectionTitle>Milestones</SectionTitle>
            <Card className="!p-0">
              {milestones.length === 0 && <p className="px-5 py-4 text-sm text-slate-500">No milestones yet.</p>}
              <ol className="divide-y divide-slate-100">
                {milestones.map(({ m, completedByName }) => {
                  const mEvidence = evidence.filter((e) => e.milestoneId === m.id);
                  const isDone = Boolean(m.completedAt);
                  return (
                    <li key={m.id} className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        {canEdit ? (
                          <form action={toggleMilestone}>
                            <input type="hidden" name="id" value={m.id} />
                            <button
                              className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border text-xs ${
                                isDone ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white hover:border-brand-500"
                              }`}
                              title={isDone ? "Mark as not done" : "Mark as done"}
                              aria-label={isDone ? `Mark “${m.title}” as not done` : `Mark “${m.title}” as done`}
                            >
                              {isDone && "✓"}
                            </button>
                          </form>
                        ) : (
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                              isDone ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-slate-50"
                            }`}
                            aria-label={isDone ? "Done" : "Not done"}
                          >
                            {isDone && "✓"}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className={`font-medium ${isDone ? "text-slate-500 line-through" : "text-slate-900"}`}>{m.title}</div>
                          {m.description && <p className="prose-text mt-0.5 text-sm text-slate-600">{m.description}</p>}
                          <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-500">
                            {m.dueDate && <span>Due {formatDate(m.dueDate)}</span>}
                            {m.completedAt && (
                              <span>
                                Completed {formatDate(m.completedAt)}
                                {completedByName ? ` by ${completedByName}` : ""}
                              </span>
                            )}
                          </div>
                          {mEvidence.length > 0 && (
                            <div className="mt-3">
                              <EvidenceList items={mEvidence} canEdit={canEdit} />
                            </div>
                          )}
                          {canEdit && (
                            <div className="mt-2 flex flex-wrap gap-x-4 text-sm">
                              <details className="w-full [&[open]>summary]:text-slate-800">
                                <summary className="inline cursor-pointer text-brand-700 hover:underline">Add evidence</summary>
                                <div className="mt-2">
                                  <EvidenceForm initiativeId={id} milestoneId={m.id} />
                                </div>
                              </details>
                              <details className="w-full">
                                <summary className="inline cursor-pointer text-slate-500 hover:underline">Edit milestone</summary>
                                <ActionForm action={updateMilestone} className="mt-2 space-y-3 rounded-lg bg-slate-50 p-3">
                                  <input type="hidden" name="id" value={m.id} />
                                  <input name="title" defaultValue={m.title} required className={inputClass} />
                                  <textarea name="description" defaultValue={m.description} rows={2} placeholder="Details (optional)" className={inputClass} />
                                  <div className="flex flex-wrap items-center gap-2">
                                    <input name="dueDate" type="date" defaultValue={m.dueDate ?? ""} className={`${inputClass} !w-auto`} />
                                    <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
                                  </div>
                                </ActionForm>
                                <form action={deleteMilestone} className="mt-2">
                                  <input type="hidden" name="id" value={m.id} />
                                  <SubmitButton variant="danger" className="!py-1 text-xs" confirm={`Delete milestone “${m.title}” and its evidence?`}>
                                    Delete milestone
                                  </SubmitButton>
                                </form>
                              </details>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {canEdit && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                  <ActionForm action={addMilestone} resetOnSuccess showSuccess={false} className="flex flex-wrap gap-2">
                    <input type="hidden" name="initiativeId" value={id} />
                    <input name="title" required placeholder="New milestone…" className={`${inputClass} min-w-0 flex-1`} />
                    <input name="dueDate" type="date" className={`${inputClass} !w-auto`} aria-label="Due date" />
                    <SubmitButton pendingLabel="Adding…">Add</SubmitButton>
                  </ActionForm>
                </div>
              )}
            </Card>
          </section>

          <section>
            <SectionTitle>Evidence</SectionTitle>
            <Card className="space-y-4">
              {initiativeEvidence.length === 0 && !canEdit && <p className="text-sm text-slate-500">No evidence attached to the initiative yet.</p>}
              <EvidenceList items={initiativeEvidence} canEdit={canEdit} />
              {canEdit && <EvidenceForm initiativeId={id} />}
              {evidence.length > initiativeEvidence.length && (
                <p className="text-xs text-slate-500">Evidence attached to individual milestones is shown with each milestone above.</p>
              )}
            </Card>
          </section>

          <section>
            <SectionTitle>Comments ({comments.length})</SectionTitle>
            <Card className="space-y-5">
              {comments.length === 0 && <p className="text-sm text-slate-500">No comments yet. Start the conversation.</p>}
              {comments.map(({ c, authorName }) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar name={authorName ?? "Former user"} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <span className="font-medium text-slate-900">{authorName ?? "Former user"}</span>
                      <span className="text-xs text-slate-500">{formatDateTime(c.createdAt)}</span>
                      {(c.authorId === user.id || user.role === "admin") && (
                        <form action={deleteComment} className="ml-auto">
                          <input type="hidden" name="id" value={c.id} />
                          <SubmitButton variant="ghost" className="!px-1.5 !py-0 text-xs" confirm="Delete this comment?">
                            Delete
                          </SubmitButton>
                        </form>
                      )}
                    </div>
                    <p className="prose-text mt-0.5 text-sm text-slate-700">{c.body}</p>
                  </div>
                </div>
              ))}
              <ActionForm action={addComment} resetOnSuccess showSuccess={false} className="space-y-2 border-t border-slate-100 pt-4">
                <input type="hidden" name="initiativeId" value={id} />
                <Field label="Add a comment">
                  <textarea name="body" rows={3} required placeholder="Ask a question, share an update or offer help…" className={inputClass} />
                </Field>
                <SubmitButton pendingLabel="Posting…">Post comment</SubmitButton>
              </ActionForm>
            </Card>
          </section>
        </div>

        <aside className="space-y-6">
          <Card>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-slate-500">Owner</dt>
                <dd className="mt-1 flex items-center gap-2 font-medium text-slate-900">
                  <Avatar name={ownerName} size="sm" />
                  {ownerName}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-1">
                  <StatusBadge progress={progress} total={milestones.length} />
                </dd>
              </div>
              {initiative.dueDate && (
                <div>
                  <dt className="text-slate-500">Target date</dt>
                  <dd className="mt-1 font-medium text-slate-900">{formatDate(initiative.dueDate)}</dd>
                </div>
              )}
              <div>
                <dt className="text-slate-500">Last updated</dt>
                <dd className="mt-1 text-slate-700">{formatDateTime(initiative.updatedAt)}</dd>
              </div>
            </dl>
            {!canEdit && (
              <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Only {ownerName} and admins can edit this initiative. You can comment below.
              </p>
            )}
          </Card>

          {chain.length > 0 && (
            <Card>
              <div className="mb-3 text-sm font-semibold text-slate-900">Rolls up to</div>
              <ol className="space-y-3">
                {[...chain].reverse().map((g) => (
                  <li key={g.id}>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {LEVELS[g.level].label} {periodLabel(g) && `· ${periodLabel(g)}`}
                    </div>
                    <Link href={`/strategy/${g.id}`} className="text-sm font-medium text-slate-800 hover:text-brand-700 hover:underline">
                      {g.title}
                    </Link>
                    <div className="mt-1">
                      <ProgressBar value={g.progress} size="sm" />
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
