import { CollegePanel } from "@/features/college/CollegePanel";

export const metadata = { title: "Your College" };

export default function CollegePage() {
  return <><section className="page-heading"><h1>Your College</h1>
    <p>Find course resources and items for pickup from your own campus.</p></section><CollegePanel /></>;
}
