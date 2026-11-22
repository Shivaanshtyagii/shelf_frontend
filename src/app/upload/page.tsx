import { Suspense } from "react";
import { UploadWorkspace } from "@/features/upload/UploadWorkspace";

export const metadata = { title: "Upload / Scan" };

export default function UploadPage() {
  return <><section className="page-heading"><h1>Upload / Scan</h1>
    <p>Turn photos into a readable PDF or select an existing file for a listing.</p></section>
    <Suspense fallback={<p>Loading your workspace…</p>}><UploadWorkspace /></Suspense></>;
}
