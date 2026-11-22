import { Suspense } from "react";
import { AccountPanel } from "@/features/account/AccountPanel";

export const metadata = { title: "Account" };

export default function AccountPage() {
  return <><section className="page-heading"><h1>Account</h1><p>Sign in, manage your profile, or verify your email.</p></section>
    <Suspense fallback={<p>Loading account…</p>}><AccountPanel /></Suspense></>;
}
