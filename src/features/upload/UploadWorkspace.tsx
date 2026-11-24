"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { currentMember } from "@/features/account/session";
import { api, message } from "@/lib/api";
import type { Capabilities } from "@/lib/capabilities";
import type { Listing } from "@/features/listings/model";
import type { Member } from "@/features/account/model";
import { Feedback } from "@/ui/Feedback";
import { Scanner } from "./Scanner";
import { ListingForm } from "@/features/listings/ListingForm";

export function UploadWorkspace() {
  const draftId = useSearchParams().get("draft");
  const [file, setFile] = useState<File>();
  const [member, setMember] = useState<Member>();
  const [capabilities, setCapabilities] = useState<Capabilities>();
  const [draft, setDraft] = useState<Listing>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const abort = new AbortController();
    setError("");
    setLoading(true);
    setDraft(undefined);
    const options = { signal: abort.signal };
    Promise.all([
      api<Capabilities>("/capabilities", options),
      currentMember(abort.signal),
    ]).then(async ([features, user]) => {
      if (abort.signal.aborted) return;
      setCapabilities(features);
      setMember(user);
      if (draftId && user) setDraft(await api<Listing>("/listings/" + encodeURIComponent(draftId), options));
    }).catch((error: unknown) => { if (!abort.signal.aborted) setError(message(error)); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [draftId]);

  return <div className="stack generous">
    <Scanner onUse={setFile} />
    <section className="panel stack">
      <h2>{draftId ? "Edit listing" : "Create a listing"}</h2>
      {loading ? <Feedback>Checking account and upload availability…</Feedback> : <>
        {error && <Feedback error>{error}</Feedback>}
        {!member ? !error && <p><Link href="/account">Sign in</Link> to save a draft or upload an attachment.</p> :
          !member.verified ? <p><Link href="/account">Verify your account email</Link> to save a draft.</p> :
          (!draftId || draft?.id === draftId) &&
            <ListingForm key={draftId ?? "new"} selectedScan={file} storageEnabled={Boolean(capabilities?.assets)}
              original={draftId ? draft : undefined} />}
      </>}
    </section>
  </div>;
}
