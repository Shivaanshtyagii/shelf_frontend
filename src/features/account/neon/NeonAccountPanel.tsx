"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { Feedback } from "@/ui/Feedback";
import { currentMember } from "../session";
import type { Member } from "../model";
import { neonClient } from "./client";

type Notice = { text: string; error?: boolean };

export function NeonAccountPanel() {
  const params = useSearchParams();
  const mode = params.get("mode") ?? "login";
  const token = params.get("token");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [member, setMember] = useState<Member>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>();

  useEffect(() => {
    const abort = new AbortController();
    currentMember(abort.signal).then(setMember).catch((error: Error) => {
      if (!abort.signal.aborted) setNotice({ text: error.message, error: true });
    }).finally(() => {
      if (!abort.signal.aborted) setLoading(false);
    });
    return () => abort.abort();
  }, []);

  async function perform(action: () => Promise<void>) {
    setBusy(true);
    setNotice(undefined);
    try { await action(); }
    catch (error) {
      setNotice({ text: error instanceof Error ? error.message : "The request could not be completed.", error: true });
    } finally { setBusy(false); }
  }

  function check(result: { error?: { message?: string } | null }) {
    if (result.error) throw new Error(result.error.message || "The request could not be completed.");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get("email") ?? verificationEmail);
    const password = String(fields.get("password") ?? "");
    const name = String(fields.get("displayName") ?? "").trim();
    await perform(async () => {
      if (mode === "forgot") {
        check(await neonClient.requestPasswordReset({ email, redirectTo: window.location.origin + "/account?mode=reset" }));
        setNotice({ text: "If the address is registered, check your inbox for a reset link." });
      } else if (mode === "reset" && token) {
        check(await neonClient.resetPassword({ token, newPassword: password }));
        window.location.replace("/account");
      } else if (verificationEmail) {
        check(await neonClient.emailOtp.verifyEmail({ email, otp: String(fields.get("code")) }));
        const session = await currentMember();
        if (session) window.location.replace("/");
        else window.location.replace("/account?verified=1");
      } else if (mode === "register") {
        const result = await neonClient.signUp.email({ email, password, name, callbackURL: window.location.origin + "/" });
        check(result);
        if (!result.data?.user.emailVerified) {
          setVerificationEmail(email);
        } else if (await currentMember()) window.location.replace("/");
        else window.location.replace("/account");
      } else if (mode === "verify") {
        check(await neonClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" }));
        setVerificationEmail(email);
      } else {
        check(await neonClient.signIn.email({ email, password }));
        if (!await currentMember()) throw new Error("Your browser could not keep the sign-in session.");
        window.location.replace("/");
      }
    });
  }

  if (loading) return <Feedback>Loading your account…</Feedback>;
  if (member && mode === "login" && !verificationEmail) return <section className="panel stack">
    <h2>{member.displayName}</h2>
    <p>{member.email} · {member.verified ? "Email verified" : "Verification pending"}</p>
    <form className="stack" onSubmit={(event) => {
      event.preventDefault();
      const displayName = new FormData(event.currentTarget).get("displayName");
      void perform(async () => {
        setMember(await api<Member>("/auth/me", { method: "PUT", body: { displayName } }));
        setNotice({ text: "Profile saved." });
      });
    }}>
      <label>Display name<input name="displayName" defaultValue={member.displayName} required maxLength={80} /></label>
      <button disabled={busy}>Save profile</button>
    </form>
    {!member.verified && <button disabled={busy} onClick={() => void perform(async () => {
      check(await neonClient.emailOtp.sendVerificationOtp({ email: member.email, type: "email-verification" }));
      setVerificationEmail(member.email);
    })}>Verify email</button>}
    {member.role === "MODERATOR" && <Link href="/moderation">Moderation</Link>}
    {notice && <Feedback error={notice.error}>{notice.text}</Feedback>}
  </section>;

  const title = verificationEmail || mode === "verify" ? "Verify email"
    : mode === "register" ? "Create an account"
    : mode === "forgot" ? "Request a reset link"
    : mode === "reset" ? "Set a new password" : "Sign in";
  return <section className="panel stack">
    <h2>{title}</h2>
    {params.get("error") === "neon-session" && <Feedback error>Google sign-in returned without a Shelf session. Try again from this tab.</Feedback>}
    {params.get("verified") === "1" && <Feedback>Email verified. You can now sign in.</Feedback>}
    {verificationEmail && <p>Enter the verification code sent to {verificationEmail}.</p>}
    <form className="stack" onSubmit={(event) => void submit(event)}>
      {verificationEmail ? <label>Verification code<input name="code" required autoComplete="one-time-code" inputMode="numeric" /></label> : <>
        {mode === "register" && <label>Display name<input name="displayName" required maxLength={80} /></label>}
        {mode !== "reset" && <label>Email address<input name="email" type="email" autoComplete="email" defaultValue={member?.email} required /></label>}
        {!["forgot", "verify"].includes(mode) && <label>Password<input type="password" name="password" required
          minLength={mode === "login" ? 1 : 12} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>}
      </>}
      <button disabled={busy || (mode === "reset" && !token)}>{title}</button>
    </form>
    {verificationEmail && <button className="secondary" disabled={busy} onClick={() => void perform(async () => {
      check(await neonClient.emailOtp.sendVerificationOtp({ email: verificationEmail, type: "email-verification" }));
      setNotice({ text: "Check your inbox for a new code." });
    })}>Resend code</button>}
    {!verificationEmail && ["login", "register"].includes(mode) && <button type="button" className="secondary"
      disabled={busy} onClick={() => void perform(async () => {
        check(await neonClient.signIn.social({
          provider: "google",
          callbackURL: window.location.origin + "/account/neon-callback",
        }));
      })}>Continue with Google</button>}
    <div className="row">
      {mode !== "login" && <Link href="/account" onClick={() => setVerificationEmail("")}>Sign in</Link>}
      {mode === "login" && <>
        <Link href="/account?mode=register">Create account</Link>
        <Link href="/account?mode=forgot">Forgot password?</Link>
        <Link href="/account?mode=verify">Verify email</Link>
      </>}
    </div>
    {notice && <Feedback error={notice.error}>{notice.text}</Feedback>}
  </section>;
}
