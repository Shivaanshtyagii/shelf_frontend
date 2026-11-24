"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api, message } from "@/lib/api";
import { currentMember } from "./session";
import type { Member } from "./model";
import { neonAuthEnabled } from "./neon/config";

export function AccountMenu() {
  const path = usePathname();
  const [member, setMember] = useState<Member>();
  const [error, setError] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    currentMember(abort.signal).then(setMember).catch(() => {});
    return () => abort.abort();
  }, [path]);

  if (!member) return <Link className="account-link" href="/account">Account</Link>;
  return <details className="profile-menu" key={path}>
    <summary aria-label={"Account menu for " + member.displayName}>
      <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
        <circle cx="20" cy="20" r="20" fill="var(--soft)" />
        <circle cx="20" cy="15" r="7" fill="currentColor" />
        <path d="M7 33c1-13 25-13 26 0a20 20 0 0 1-26 0" fill="currentColor" />
      </svg>
    </summary>
    <div className="panel stack"><strong>{member.displayName}</strong>
      <Link href="/account">Edit profile</Link>
      <button onClick={async () => {
        try {
          if (neonAuthEnabled) {
            const { neonClient } = await import("./neon/client");
            const { error } = await neonClient.signOut();
            if (error) throw new Error(error.message || "Sign-out failed.");
          } else await api("/auth/logout", { method: "POST" });
          window.location.replace("/");
        }
        catch (err) { setError(message(err)); }
      }}>Sign out</button>
      {error && <p role="alert">{error}</p>}
    </div>
  </details>;
}
