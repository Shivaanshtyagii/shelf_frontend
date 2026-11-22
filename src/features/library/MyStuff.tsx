"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { currentMember } from "@/features/account/session";
import { api, message } from "@/lib/api";
import { price, statusLabel } from "@/lib/format";
import { scopeLabels, type Listing } from "@/features/listings/model";
import type { Appeal, Decision, Report } from "@/features/moderation/model";
import type { Commerce } from "@/features/commerce/model";
import type { Member } from "@/features/account/model";
import type { Pickup } from "@/features/pickup/model";
import { Empty, Feedback } from "@/ui/Feedback";
import { PickupPanel } from "@/features/pickup/PickupPanel";

type Activity = { reports: Report[]; appeals: Appeal[] };
type Library = { listings: Listing[]; seller: string; pickup: Pickup[]; activity: Activity; commerce: Commerce };

export function MyStuff() {
  const [user, setUser] = useState<Member>();
  const [library, setLibrary] = useState<Library>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean }>();
  const [history, setHistory] = useState<{ listingId: string; decisions: Decision[] }>();

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const options = { signal };
    const member = await currentMember(signal);
    if (signal?.aborted) return;
    setUser(member);
    if (!member) return;
    const [listings, seller, pickup, activity, commerce] = await Promise.all([
      api<Listing[]>("/listings/mine", options), api<{ status: string }>("/seller", options), api<Pickup[]>("/pickup", options),
      api<Activity>("/moderation/mine", options), api<Commerce>("/commerce", options),
    ]);
    if (!signal?.aborted) setLibrary({ listings, seller: seller.status, pickup, activity, commerce });
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    refresh(abort.signal).catch((error: unknown) => { if (!abort.signal.aborted) setNotice({ text: message(error), error: true }); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [refresh]);

  async function mutate(path: string, body: unknown, text: string) {
    setBusy(true);
    setNotice(undefined);
    try {
      await api(path, { method: "POST", body });
      await refresh();
      setNotice({ text, error: false });
    } catch (error) { setNotice({ text: message(error), error: true }); }
    finally { setBusy(false); }
  }

  async function readHistory(listingId: string) {
    try { setHistory({ listingId, decisions: await api<Decision[]>("/moderation/listings/" + listingId + "/history") }); }
    catch (error) { setNotice({ text: message(error), error: true }); }
  }

  if (loading) return <Feedback>Loading your account activity…</Feedback>;
  if (!user || !library) return notice ? <Feedback error>{notice.text}</Feedback>
    : <Empty title="Make this space yours"><Link href="/account">Sign in to view your activity</Link></Empty>;

  return <div className="stack generous">
    {notice && <Feedback error={notice.error}>{notice.text}</Feedback>}
    {!user.verified && <Empty title="Verify your account email"><Link href="/account">Manage verification</Link></Empty>}
    <section className="panel stack">
      <div className="row split"><h2>Your listings</h2><Link href="/upload" className="button">New listing</Link></div>
      <div className="row">
        <span>Seller onboarding <strong>{statusLabel(library.seller)}</strong></span>
        {user.verified && ["UNREGISTERED", "REJECTED"].includes(library.seller) &&
          <button className="secondary" disabled={busy} onClick={() => void mutate("/seller", undefined, "Seller application submitted.")}>Apply to sell</button>}
      </div>
      {library.listings.length === 0 && <p className="muted">Saved drafts and published listings will appear here.</p>}
      {library.listings.map((listing) => <article className="activity-row stack" key={listing.id}>
        <div className="row split"><h3>{listing.title}</h3><span className="tag">{statusLabel(listing.status)}</span></div>
        <p className="muted">{scopeLabels[listing.scope]} · {listing.subject}</p>
        <div className="row">
          {["DRAFT", "REJECTED"].includes(listing.status) && <Link href={"/upload?draft=" + listing.id}>Edit draft</Link>}
          {listing.status === "DRAFT" && <button disabled={busy || !listing.assetId || library.seller !== "APPROVED"}
            onClick={() => void mutate("/listings/" + listing.id + "/submit", { revision: listing.revision }, "Submitted for moderation.")}>Submit for review</button>}
          {listing.status !== "ARCHIVED" && <button className="secondary" disabled={busy}
            onClick={() => void mutate("/listings/" + listing.id + "/archive", undefined, "Listing archived.")}>Archive</button>}
          {user.verified && <button type="button" className="text-button" onClick={() => void readHistory(listing.id)}>Review history</button>}
        </div>
        {history?.listingId === listing.id && <ul className="simple-list">
          {!history.decisions.length && <li>No moderation decisions yet.</li>}
          {history.decisions.map((decision) => <li key={decision.id}><strong>{statusLabel(decision.outcome)}</strong> · {decision.reason}
            {["REJECTED", "ARCHIVED"].includes(decision.outcome) && !library.activity.appeals.some((appeal) => appeal.decisionId === decision.id) &&
              <form className="stack narrow" onSubmit={(event) => {
                event.preventDefault();
                void mutate("/moderation/decisions/" + decision.id + "/appeals", { reason: new FormData(event.currentTarget).get("reason") }, "Appeal submitted.");
              }}><label>Appeal reason<textarea name="reason" required maxLength={800} rows={2} /></label>
                <button disabled={busy}>Submit appeal</button></form>}
          </li>)}
        </ul>}
      </article>)}
    </section>
    <PickupPanel records={library.pickup} memberId={user.id} busy={busy}
      change={(pickup, status, meetingLocation, meetingTime) => void mutate("/pickup/" + pickup.id,
        { status, meetingLocation, meetingTime }, "Pickup updated.")} />
    <section className="panel stack">
      <h2>Reports and appeals</h2>
      {library.activity.reports.length + library.activity.appeals.length === 0 && <p className="muted">Your reports and appeals will appear here.</p>}
      {library.activity.reports.map((report) => <div className="activity-row" key={report.id}><strong>Report · {statusLabel(report.status)}</strong>
        <p>{report.reason}</p>{report.response && <p className="muted">{report.response}</p>}</div>)}
      {library.activity.appeals.map((appeal) => <div className="activity-row" key={appeal.id}><strong>Appeal · {statusLabel(appeal.status)}</strong>
        <p>{appeal.reason}</p>{appeal.response && <p className="muted">{appeal.response}</p>}</div>)}
    </section>
    <section className="panel stack">
      <h2>Ledger and payouts</h2>
      {!library.commerce.enabled && <p className="muted">Digital checkout and payouts are currently unavailable.</p>}
      <p>Platform commission <strong>{price(library.commerce.platformCommissionMinor)}</strong></p>
      {library.commerce.ledger.map((entry) => <p key={entry.reference}>{entry.reference} · {statusLabel(entry.status)} · {price(entry.amountMinor, entry.currency)}</p>)}
      {library.commerce.payouts.map((entry) => <p key={entry.reference}>{entry.reference} · {statusLabel(entry.status)} · {price(entry.amountMinor, entry.currency)}</p>)}
    </section>
  </div>;
}
