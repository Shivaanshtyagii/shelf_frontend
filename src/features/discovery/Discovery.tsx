"use client";

import { useEffect, useState } from "react";
import { api, message } from "@/lib/api";
import type { ListingPage, Scope } from "@/lib/types";
import { Empty, Feedback } from "@/ui/Feedback";
import { ListingCard } from "./ListingCard";
import { previews } from "./previews";
import "./discovery.css";

type Query = { q: string; subject: string; sort: string; page: number };

export function Discovery({ scope }: { scope: Scope }) {
  const national = scope === "EXPLORE";
  const [query, setQuery] = useState<Query>({ q: "", subject: "", sort: national ? "RELEVANCE" : "NEWEST", page: 0 });
  const [page, setPage] = useState<ListingPage>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const abort = new AbortController();
    const parameters = new URLSearchParams({ q: query.q, subject: query.subject, sort: query.sort, page: String(query.page) });
    if (!national) parameters.set("scope", scope);
    api<ListingPage>((national ? "/explore?" : "/campus?") + parameters, { signal: abort.signal })
      .then(setPage)
      .catch((error: unknown) => { if (!abort.signal.aborted) setError(message(error)); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [query, national, scope]);

  function update(next: Query) {
    setLoading(true);
    setError("");
    setQuery(next);
  }

  const showPreviews = national && !loading && (!page?.items.length || Boolean(error)) && !query.q && !query.subject && query.page === 0;
  const cards = loading ? [] : showPreviews ? previews : error ? [] : page?.items ?? [];

  return (
    <section className="discovery stack">
      <h2>{national ? "Academic resources" : scope === "CAMPUS_MATERIALS" ? "Study resources at your college" : "Items for campus pickup"}</h2>
      <form className="search-bar" onSubmit={(event) => {
        event.preventDefault();
        const fields = new FormData(event.currentTarget);
        update({ q: String(fields.get("q")).trim(), subject: String(fields.get("subject")).trim(), sort: String(fields.get("sort")), page: 0 });
      }}>
        <label className="search-main">Search <input name="q" type="search" placeholder="Search by topic or title" maxLength={120} /></label>
        <label>Subject <input name="subject" placeholder="All subjects" maxLength={80} /></label>
        <label>Sort <select name="sort" defaultValue={query.sort}>
          <option value="RELEVANCE">Relevance</option><option value="NEWEST">Newest</option>
          {!national && <><option value="PRICE_LOW">Price, low to high</option><option value="PRICE_HIGH">Price, high to low</option></>}
        </select></label>
        <button type="submit">Search</button>
      </form>
      {loading && <Feedback>Loading results…</Feedback>}
      {error && <Feedback error>{error}</Feedback>}
      {showPreviews && <p className="muted">Sample resources to preview the marketplace.</p>}
      {!!cards.length && <div className="cards">{cards.map((card) => <ListingCard key={card.id} item={card} preview={showPreviews} />)}</div>}
      {!loading && !error && !cards.length && <Empty title="No matching resources.">Try another search or subject.</Empty>}
      {!loading && !error && (!!query.page || page?.hasNext) && <div className="pagination">
        <button className="secondary" type="button" disabled={query.page === 0} onClick={() => update({ ...query, page: query.page - 1 })}>Previous</button>
        <span>Page {query.page + 1}</span>
        <button className="secondary" type="button" disabled={!page?.hasNext} onClick={() => update({ ...query, page: query.page + 1 })}>Next</button>
      </div>}
    </section>
  );
}
