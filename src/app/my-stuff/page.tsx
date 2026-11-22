import { MyStuff } from "@/features/library/MyStuff";

export const metadata = { title: "My Stuff" };

export default function MyStuffPage() {
  return <><section className="page-heading"><h1>My Stuff</h1>
    <p>Track your listings, campus pickups, and marketplace activity.</p></section><MyStuff /></>;
}
