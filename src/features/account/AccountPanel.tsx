"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { currentMember } from "@/features/account/session";
import { api, message } from "@/lib/api";
import type { Member } from "@/features/account/model";
import { Feedback } from "@/ui/Feedback";

export function AccountPanel() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const mode = params.get("mode") ?? "login";
  const [member, setMember] = useState<Member>();
  const [notice, setNotice] = useState<{ text: string; error: boolean }>();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [google, setGoogle] = useState(false);

  useEffect(() => {
    const abort = new AbortController();
    api<{ google: boolean }>("/auth/providers", { signal: abort.signal })
      .then((providers) => setGoogle(providers.google)).catch(() => {});
    currentMember(abort.signal).then(setMember)
      .catch((error: unknown) => {
        if (!abort.signal.aborted) {
          setNotice({ text: message(error), error: true });
        }
      }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, []);

  async function send(path: string, body: unknown, success: string, method: "POST" | "PUT" = "POST") {
    setBusy(true);
    setNotice(undefined);
    try {
      const result = await api<Member | void>("/auth/" + path, { method, body });
      if (path === "login") {
        const session = await currentMember();
        if (!session || session.id !== result?.id) {
          setNotice({ text: "Your browser could not keep the session. Allow cookies and use the same Shelf address on every page.", error: true });
          return;
        }
        window.location.replace("/");
        return;
      }
      if (path === "logout" || path === "reset") { window.location.replace("/account"); return; }
      if (path === "me") { window.location.replace("/account"); return; }
      if (result) setMember(result);
      if (path === "verify" && member) setMember(await currentMember());
      setNotice({ text: success, error: false });
    } catch (error) {
      setNotice({ text: message(error), error: true });
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    switch (mode) {
      case "register": void send("register", fields, "Check your inbox for your verification link."); break;
      case "forgot": void send("reset-request", fields, "If the address is registered, we’ll send a reset link."); break;
      case "reset": void send("reset", { token, password: fields.password }, "Password changed. Sign in with your new password."); break;
      default: void send("login", fields, "Signed in.");
    }
  }

  if (loading) return <Feedback>Loading your account…</Feedback>;

  return <section className="panel stack narrow">
    {mode === "verify" && token ? <>
      <h2>Verify your email</h2>
      <button type="button" disabled={busy} onClick={() => void send("verify", { token }, "Email verified. You can now access protected actions.")}>Verify email</button>
      <Link href="/account">Return to account</Link>
    </> : member && mode !== "reset" ? <>
      <h2>{member.displayName}</h2>
      <p className="muted">{member.email} · {member.verified ? "Email verified" : "Verification pending"}</p>
      <form key={member.displayName} className="stack" onSubmit={(event) => {
        event.preventDefault();
        void send("me", { displayName: new FormData(event.currentTarget).get("displayName") }, "Profile saved.", "PUT");
      }}>
        <label>Display name<input name="displayName" required maxLength={80} defaultValue={member.displayName} /></label>
        <button type="submit" disabled={busy}>Save profile</button>
      </form>
      <div className="row">
        {!member.verified && <button className="secondary" disabled={busy} onClick={() => void send("resend", { email: member.email }, "Check your inbox for the verification link.")}>Resend link</button>}
        <button className="secondary" disabled={busy} onClick={() => void send("logout", undefined, "Signed out.")}>Sign out</button>
        {member.role === "MODERATOR" && <Link href="/moderation">Moderation</Link>}
      </div>
    </> : <>
      <h2>{{ register: "Create an account", forgot: "Request a reset link", reset: "Set a new password" }[mode] ?? "Sign in"}</h2>
      {params.get("error") === "google" && <Feedback error>Google sign-in could not finish. If you already have a Shelf account with this email, use your password.</Feedback>}
      {google && ["login", "register"].includes(mode) && <a className="button secondary" href="/api/oauth2/authorization/google">Continue with Google</a>}
      <form className="stack" onSubmit={submit}>
        {mode === "register" && <label>Display name<input name="displayName" required autoComplete="nickname" maxLength={80} /></label>}
        {mode !== "reset" && <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>}
        {mode !== "forgot" && <label>Password<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "login" ? 1 : 12} maxLength={72} required /></label>}
        <button type="submit" disabled={busy || (mode === "reset" && !token)}>
          {{ register: "Create account", forgot: "Send reset link", reset: "Set password" }[mode] ?? "Sign in"}
        </button>
      </form>
      <div className="row">
        {mode !== "login" && <Link href="/account">Sign in</Link>}
        {mode !== "register" && <Link href="/account?mode=register">Create account</Link>}
        {mode === "login" && <Link href="/account?mode=forgot">Forgot password?</Link>}
      </div>
    </>}
    {notice && <Feedback error={notice.error}>{notice.text}</Feedback>}
  </section>;
}
