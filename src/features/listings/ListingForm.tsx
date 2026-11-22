"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { api, message } from "@/lib/api";
import { scopeLabels, type Listing, type Scope } from "./model";
import { Feedback } from "@/ui/Feedback";

type Attachment = { source: File; kind: "PDF" | "PHOTO"; id: string };

export function ListingForm({ selectedScan, storageEnabled, original }: {
  selectedScan?: File; storageEnabled: boolean; original?: Listing;
}) {
  const [scope, setScope] = useState<Scope>(original?.scope ?? "EXPLORE");
  const [listing, setListing] = useState(original);
  const [replacement, setReplacement] = useState<File>();
  const [discard, setDiscard] = useState(false);
  const [ignoredScan, setIgnoredScan] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean }>();
  const uploaded = useRef<Attachment | null>(null);
  const physical = scope === "CAMPUS_MARKETPLACE";
  const scan = !physical && selectedScan !== ignoredScan ? selectedScan : undefined;
  const selectedFile = replacement ?? scan;
  const editable = !listing || listing.status === "DRAFT" || listing.status === "REJECTED";

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setNotice(undefined);

    try {
      const kind = physical ? "PHOTO" : "PDF";
      let assetId = discard || (listing && (listing.scope === "CAMPUS_MARKETPLACE") !== physical) ? null : listing?.assetId ?? null;
      if (selectedFile && storageEnabled) {
        const cached = uploaded.current;
        if (cached?.source === selectedFile && cached.kind === kind) assetId = cached.id;
        else {
          const data = new FormData();
          data.append("file", selectedFile);
          const result = await api<{ id: string }>("/assets?kind=" + kind, { method: "POST", body: data });
          uploaded.current = { source: selectedFile, kind, id: result.id };
          assetId = result.id;
        }
      }

      const next = await api<Listing>(listing ? "/listings/" + listing.id : "/listings", {
        method: listing ? "PUT" : "POST",
        body: {
          scope, assetId, revision: listing?.revision ?? 0,
          title: values.get("title"), subject: values.get("subject"), description: values.get("description"),
          priceMinor: physical ? Math.round(Number(values.get("price")) * 100) : 0,
        },
      });
      setListing(next);
      setReplacement(undefined);
      setDiscard(false);
      setIgnoredScan(selectedScan);
      uploaded.current = null;
      setNotice({ text: "Draft saved. Submit it for review from My Stuff.", error: false });
    } catch (error) {
      setNotice({ text: message(error), error: true });
    } finally { setBusy(false); }
  }

  if (!editable) return <p>This listing cannot be edited in its current state. <Link href="/my-stuff">Go to My Stuff</Link></p>;

  return <form className="stack narrow" onSubmit={(event) => void save(event)}>
    <label>Where to list<select disabled={busy} value={scope} onChange={(event) => {
      setScope(event.target.value as Scope);
      setReplacement(undefined);
    }}>
      {Object.entries(scopeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select></label>
    <label>Title<input name="title" disabled={busy} required maxLength={120} defaultValue={original?.title} placeholder="e.g. Linear algebra revision notes" /></label>
    <label>{physical ? "Category" : "Subject"}<input name="subject" disabled={busy} required maxLength={80} defaultValue={original?.subject} /></label>
    <label>Description<textarea name="description" disabled={busy} required rows={4} maxLength={2000} defaultValue={original?.description} /></label>
    {physical && <label>Price in ₹<input name="price" type="number" min="0" max="100000" step="0.01" required disabled={busy}
      defaultValue={original ? original.priceMinor / 100 : 0} /></label>}
    <label key={physical ? "photo" : "pdf"}>{physical ? "Item photo" : "PDF attachment"}
      <input type="file" accept={physical ? "image/jpeg,image/png" : "application/pdf,.pdf"} disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          const limit = physical ? 8_000_000 : 25_000_000;
          if (file && file.size > limit) {
            setNotice({ text: physical ? "Choose a photo under 8 MB." : "Choose a PDF under 25 MB.", error: true });
            event.target.value = "";
            setReplacement(undefined);
            return;
          }
          setReplacement(file);
          setNotice(undefined);
        }} />
    </label>
    {selectedFile && <p className="muted">Selected file · {selectedFile.name}</p>}
    {!selectedFile && listing?.assetId && !discard && <div className="row">
      <a href={"/api/listings/" + listing.id + "/attachment"} target="_blank" rel="noreferrer">Current attachment</a>
      <button type="button" className="text-button" disabled={busy} onClick={() => setDiscard(true)}>Remove attachment</button>
    </div>}
    {!storageEnabled && <p className="muted">Cloud attachments are unavailable. You can save the listing details as a draft.</p>}
    <div className="row"><button type="submit" disabled={busy}>{busy ? "Saving…" : "Save draft"}</button>
      {listing && <Link href="/my-stuff">Go to My Stuff</Link>}</div>
    {notice && <Feedback error={notice.error}>{notice.text}</Feedback>}
  </form>;
}
