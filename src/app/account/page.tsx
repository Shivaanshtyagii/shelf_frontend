import { Suspense } from "react";
import { AccountPanel } from "@/features/account/AccountPanel";
import { NeonAccountPanel } from "@/features/account/neon/NeonAccountPanel";
import { neonAuthEnabled } from "@/features/account/neon/config";

export const metadata = { title: "Account" };

export default function AccountPage() {
  return <div className="account-page"><section className="page-heading"><h1>Account</h1><p>Sign in, manage your profile, or verify your email.</p></section>
    <Suspense fallback={<p>Loading account…</p>}>{neonAuthEnabled ? <NeonAccountPanel /> : <AccountPanel />}</Suspense></div>;
}
