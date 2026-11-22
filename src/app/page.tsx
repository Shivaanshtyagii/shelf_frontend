import { Discovery } from "@/features/discovery/Discovery";
import "./explore.css";

export default function ExplorePage() {
  return (
    <>
      <section className="hero">
        <div>
          <h1>Find notes worth<br className="wide-only" /> keeping.</h1>
          <p>Explore study notes, revision guides, and course resources shared by students.</p>
        </div>
        <div className="book-stack" aria-hidden="true"><i /><i /><i /></div>
      </section>
      <Discovery scope="EXPLORE" />
    </>
  );
}
