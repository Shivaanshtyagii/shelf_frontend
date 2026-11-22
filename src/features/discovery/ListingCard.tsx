"use client";

import { useState } from "react";
import Link from "next/link";
import { api, message } from "@/lib/api";
import { price } from "@/lib/format";
import type { Card } from "@/features/listings/model";
import { Feedback } from "@/ui/Feedback";

export function ListingCard({ item, preview }: { item: Card; preview: boolean }) {
  const [reporting, setReporting] = useState(false);
  const [status, setStatus] = useState<{ error: boolean; text: string }>();
  const [busy, setBusy] = useState(false);
  const physical = item.scope === "CAMPUS_MARKETPLACE";
  async function act(path: string, body: unknown, success: string) {
    setBusy(true);
    setStatus(undefined);
    try {
      await api(path, { method: "POST", body });
      setStatus({ error: false, text: success });
      setReporting(false);
    } catch (error) {
      setStatus({ error: true, text: message(error) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="listing-card">
      <div className={"listing-art theme-" + (physical ? "ochre" : item.subject.length % 3)} aria-hidden="true">
        <span className={physical ? "listing-object" : "listing-sheet"}><i /><i /><i /></span>
      </div>
      <div className="listing-body">
        <div className="listing-meta"><span>{item.subject}</span>{preview && <span className="tag">Preview</span>}</div>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <div className="card-actions">
          <strong>{item.priceMinor > 0 ? price(item.priceMinor) : "Free"}</strong>
          {!preview && (physical
            ? <button type="button" disabled={busy} onClick={() => void act("/pickup", { listingId: item.id }, "Pickup requested.")}>Request pickup</button>
            : <a className="button" href={"/api/listings/" + item.id + "/attachment"} target="_blank" rel="noreferrer">Download PDF</a>)}
        </div>
        {!preview && <div className="row listing-extra">
          {physical && <a href={"/api/listings/" + item.id + "/attachment"} target="_blank" rel="noreferrer">View photo</a>}
          <button type="button" className="text-button" aria-expanded={reporting} onClick={() => setReporting(!reporting)}>Report</button>
        </div>}
        {reporting && <form className="stack" onSubmit={(event) => {
          event.preventDefault();
          const reason = new FormData(event.currentTarget).get("reason");
          void act("/moderation/listings/" + item.id + "/reports", { reason }, "Report submitted.");
        }}>
          <label>Reason <textarea name="reason" required maxLength={800} rows={2} /></label>
          <button disabled={busy}>Send report</button>
        </form>}
        {status && <Feedback error={status.error}>{status.text}{status.error && status.text === "Sign in to continue." && <> <Link href="/account">Sign in</Link></>}</Feedback>}
      </div>
    </article>
  );
}
