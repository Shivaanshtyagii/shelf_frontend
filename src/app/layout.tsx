import type { Metadata } from "next";
import { Navigation } from "@/ui/Navigation";
import "./styles.css";

export const metadata: Metadata = {
  title: { default: "Shelf · Student notes marketplace", template: "%s · Shelf" },
  description: "Discover study notes, share your own, and trade course essentials on campus.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#content">Skip to content</a>
        <Navigation />
        <main id="content" className="shell">{children}</main>
      </body>
    </html>
  );
}
