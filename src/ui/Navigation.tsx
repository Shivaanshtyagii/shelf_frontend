"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { href: "/", label: "Explore" },
  { href: "/college", label: "Your College" },
  { href: "/upload", label: "Upload / Scan" },
  { href: "/my-stuff", label: "My Stuff" },
];

export function Navigation({ account }: { account: React.ReactNode }) {
  const path = usePathname();
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="wordmark" aria-label="Shelf home"><i aria-hidden="true" className="wordmark-icon" />shelf</Link>
        <nav aria-label="Main navigation">
          {sections.map(({ href, label }) => (
            <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>{label}</Link>
          ))}
        </nav>
        {account}
      </div>
    </header>
  );
}
