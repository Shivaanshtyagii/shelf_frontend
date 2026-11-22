import { ReviewWorkspace } from "@/features/moderation/ReviewWorkspace";

export const metadata = { title: "Moderation" };

export default function ModerationPage() {
  return <><section className="page-heading"><h1>Moderation</h1>
    <p>Review listings, seller requests, directory submissions, and reports.</p></section><ReviewWorkspace /></>;
}
