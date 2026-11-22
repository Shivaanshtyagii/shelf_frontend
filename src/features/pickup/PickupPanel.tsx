"use client";

import { useState } from "react";
import { statusLabel } from "@/lib/format";
import type { Pickup, PickupStatus } from "./model";

type Change = (pickup: Pickup, status: PickupStatus, location?: string, time?: string) => void;

export function PickupPanel({ records, memberId, busy, change }: {
  records: Pickup[]; memberId: string; busy: boolean; change: Change;
}) {
  const [scheduling, setScheduling] = useState<string>();
  return <section className="panel stack">
    <h2>Campus pickups</h2>
    {records.length === 0 && <p className="muted">Your pickup requests will appear here.</p>}
    {records.map((pickup) => {
      const seller = pickup.sellerId === memberId;
      return <article key={pickup.id} className="activity-row stack">
        <div className="row split"><h3>{pickup.listingTitle}</h3><span className="tag">{statusLabel(pickup.status)}</span></div>
        {pickup.meetingLocation && pickup.meetingTime && <p>{pickup.meetingLocation} · {new Date(pickup.meetingTime).toLocaleString()}</p>}
        {scheduling === pickup.id && pickup.status === "REQUESTED" && <form className="stack narrow" onSubmit={(event) => {
          event.preventDefault();
          const fields = new FormData(event.currentTarget);
          const date = new Date(String(fields.get("time")));
          if (!Number.isNaN(date.valueOf())) change(pickup, "ACCEPTED", String(fields.get("location")), date.toISOString());
        }}>
          <label>Public meeting location<input name="location" maxLength={160} required /></label>
          <label>Meeting time<input name="time" type="datetime-local" required /></label>
          <button disabled={busy}>Confirm pickup</button>
        </form>}
        <div className="row">
          {seller && pickup.status === "REQUESTED" && <>
            <button className="secondary" disabled={busy} onClick={() => setScheduling(pickup.id)}>Set pickup time</button>
            <button className="secondary" disabled={busy} onClick={() => change(pickup, "DECLINED")}>Decline</button>
          </>}
          {seller && pickup.status === "ACCEPTED" && <button disabled={busy} onClick={() => change(pickup, "COLLECTED")}>Mark collected</button>}
          {["REQUESTED", "ACCEPTED"].includes(pickup.status) && <button className="secondary" disabled={busy} onClick={() => change(pickup, "CANCELLED")}>Cancel pickup</button>}
        </div>
      </article>;
    })}
  </section>;
}
