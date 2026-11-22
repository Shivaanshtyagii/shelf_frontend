"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { api, message } from "@/lib/api";
import { scopeLabels } from "@/features/listings/model";
import { statusLabel } from "@/lib/format";
import type { DirectoryRequest } from "@/features/college/model";
import type { ModerationQueue } from "@/features/moderation/model";
import { Feedback } from "@/ui/Feedback";

type Submit = (fields: FormData) => void;

function ReviewForm({ children, busy, submit, reason = true }: { children: ReactNode; busy: boolean; submit: Submit; reason?: boolean }) {
  return <form className="stack narrow" onSubmit={(event) => { event.preventDefault(); submit(new FormData(event.currentTarget)); }}>
    {children}
    {reason && <label>Decision reason<textarea name="reason" required maxLength={800} rows={2} /></label>}
    <button type="submit" disabled={busy}>Save decision</button>
  </form>;
}

export function ReviewWorkspace() {
  const [queue, setQueue] = useState<ModerationQueue>();
  const [directory, setDirectory] = useState<DirectoryRequest[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean }>();

  const load = useCallback(async (signal?: AbortSignal) => {
    const [work, requests] = await Promise.all([
      api<ModerationQueue>("/moderation/queue", { signal }),
      api<DirectoryRequest[]>("/institutions/review", { signal }),
    ]);
    if (!signal?.aborted) { setQueue(work); setDirectory(requests); }
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    load(abort.signal).catch((error: unknown) => { if (!abort.signal.aborted) setNotice({ text: message(error), error: true }); });
    return () => abort.abort();
  }, [load]);

  async function act(path: string, body: unknown) {
    setBusy(true);
    setNotice(undefined);
    try {
      await api(path, { method: "POST", body });
      await load();
      setNotice({ text: "Decision saved.", error: false });
    } catch (error) {
      setNotice({ text: message(error), error: true });
    } finally { setBusy(false); }
  }

  const decision = (path: string): Submit => (fields) => void act(path,
    { accepted: fields.get("decision") === "accept", reason: fields.get("reason") });

  if (!queue) return notice ? <Feedback error>{notice.text}</Feedback> : <Feedback>Loading review queue…</Feedback>;

  return <div className="stack generous">
    {notice && <Feedback error={notice.error}>{notice.text}</Feedback>}
    <section className="panel stack">
      <h2>Listings</h2>
      {!queue.listings.length && <p className="muted">No pending listings.</p>}
      {queue.listings.map((listing) => <article className="activity-row stack" key={listing.id}>
        <div className="row split"><h3>{listing.title}</h3><span className="tag">{scopeLabels[listing.scope]}</span></div>
        <p>{listing.description}</p>
        {listing.assetId && <a href={"/api/listings/" + listing.id + "/attachment"} target="_blank" rel="noreferrer">Open attachment for review</a>}
        <ReviewForm busy={busy} submit={(fields) => void act("/moderation/listings/" + listing.id,
          { revision: listing.revision, outcome: fields.get("decision"), reason: fields.get("reason") })}>
          <label>Decision<select name="decision" required defaultValue=""><option value="" disabled>Choose a decision</option><option value="APPROVED">Approve</option><option value="REJECTED">Reject</option></select></label>
        </ReviewForm>
      </article>)}
    </section>
    <section className="panel stack">
      <h2>Seller requests</h2>
      {!queue.sellers.length && <p className="muted">No pending seller requests.</p>}
      {queue.sellers.map((seller) => <article className="activity-row stack" key={seller}>
        <p>Member ID <code>{seller}</code></p>
        <ReviewForm busy={busy} submit={decision("/moderation/sellers/" + seller)}><DecisionInput /></ReviewForm>
      </article>)}
    </section>
    <section className="panel stack">
      <h2>Directory and affiliation requests</h2>
      {!directory.length && <p className="muted">No pending directory requests.</p>}
      {directory.map((request) => <article key={request.id} className="activity-row stack">
        <h3>{request.name ?? statusLabel(request.kind)}</h3>
        {request.institutionId && <p>College ID <code>{request.institutionId}</code></p>}
        {request.detail && <p>{request.detail}</p>}
        <ReviewForm busy={busy} reason={false} submit={(fields) => void act("/institutions/review/" + request.id,
          { approved: fields.get("decision") === "accept", verifiedValue: fields.get("verifiedValue") })}>
          <DecisionInput />
          {request.kind !== "AFFILIATION" && <label>{request.kind === "INSTITUTION" ? "Official email domain" : "Official course code"}
            <input name="verifiedValue" maxLength={request.kind === "COURSE" ? 30 : 253} /></label>}
        </ReviewForm>
      </article>)}
    </section>
    <section className="panel stack">
      <h2>Reports and appeals</h2>
      {!queue.reports.length && !queue.appeals.length && <p className="muted">No pending reports or appeals.</p>}
      {queue.reports.map((report) => <article key={report.id} className="activity-row stack">
        <h3>Report</h3><p>{report.reason}</p>
        <ReviewForm busy={busy} submit={decision("/moderation/reports/" + report.id)}><DecisionInput accept="Resolve" reject="Dismiss" /></ReviewForm>
        <details><summary>Take down reported listing</summary>
          <ReviewForm busy={busy} submit={(fields) => void act("/moderation/listings/" + report.listingId + "/takedown",
            { reason: fields.get("reason") })}><p>Removes the listing from discovery and file delivery.</p></ReviewForm>
        </details>
      </article>)}
      {queue.appeals.map((appeal) => <article key={appeal.id} className="activity-row stack">
        <h3>Appeal for decision {appeal.decisionId}</h3><p>{appeal.reason}</p>
        <ReviewForm busy={busy} submit={decision("/moderation/appeals/" + appeal.id)}><DecisionInput accept="Uphold appeal" reject="Dismiss" /></ReviewForm>
      </article>)}
    </section>
  </div>;
}

function DecisionInput({ accept = "Approve", reject = "Reject" }: { accept?: string; reject?: string }) {
  return <label>Decision<select name="decision" required defaultValue=""><option value="" disabled>Choose a decision</option>
    <option value="accept">{accept}</option><option value="reject">{reject}</option></select></label>;
}
