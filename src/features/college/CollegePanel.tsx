"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { currentMember } from "@/features/account/session";
import { api, message } from "@/lib/api";
import { statusLabel } from "@/lib/format";
import type { Course, DirectoryRequest, Institution, RequestKind } from "@/features/college/model";
import type { Member } from "@/features/account/model";
import { Discovery } from "@/features/discovery/Discovery";
import { Empty, Feedback } from "@/ui/Feedback";

export function CollegePanel() {
  const [member, setMember] = useState<Member>();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [verifiedId, setVerifiedId] = useState<string | null>(null);
  const [selected, setSelected] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [requests, setRequests] = useState<DirectoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"CAMPUS_MATERIALS" | "CAMPUS_MARKETPLACE">("CAMPUS_MATERIALS");
  const [kind, setKind] = useState<RequestKind>("AFFILIATION");
  const [notice, setNotice] = useState<{ text: string; error: boolean }>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const abort = new AbortController();
    Promise.all([
      api<Institution[]>("/institutions", { signal: abort.signal }),
      currentMember(abort.signal),
    ]).then(async ([directory, user]) => {
      setInstitutions(directory);
      setMember(user);
      if (user) {
        const [campus, submissions] = await Promise.all([
          api<{ institutionId: string | null }>("/institutions/mine", { signal: abort.signal }),
          api<DirectoryRequest[]>("/institutions/requests", { signal: abort.signal }),
        ]);
        setVerifiedId(campus.institutionId);
        setSelected(campus.institutionId ?? "");
        setRequests(submissions);
      }
    }).catch((error: unknown) => { if (!abort.signal.aborted) setNotice({ text: message(error), error: true }); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, []);

  useEffect(() => {
    if (!selected) return;
    const abort = new AbortController();
    api<Course[]>("/institutions/" + selected + "/courses", { signal: abort.signal }).then(setCourses)
      .catch((error: unknown) => { if (!abort.signal.aborted) setNotice({ text: message(error), error: true }); });
    return () => abort.abort();
  }, [selected]);

  async function searchDirectory(form: HTMLFormElement) {
    try {
      const q = String(new FormData(form).get("college"));
      const found = await api<Institution[]>("/institutions?" + new URLSearchParams({ q }));
      setInstitutions(found);
      if (selected && !found.some(({ id }) => id === selected)) {
        setSelected("");
        setCourses([]);
      }
    } catch (error) {
      setNotice({ text: message(error), error: true });
    }
  }

  async function act(path: string, body: unknown, text: string) {
    setBusy(true);
    setNotice(undefined);
    try {
      await api(path, { method: "POST", body });
      const campus = await api<{ institutionId: string | null }>("/institutions/mine");
      setVerifiedId(campus.institutionId);
      setRequests(await api<DirectoryRequest[]>("/institutions/requests"));
      setNotice({ text, error: false });
    } catch (error) {
      setNotice({ text: message(error), error: true });
    } finally { setBusy(false); }
  }

  if (loading) return <Feedback>Loading the college directory…</Feedback>;

  return <div className="stack generous">
    {!member && <Empty title="Sign in to see your campus"><Link href="/account">Sign in or create an account</Link></Empty>}
    {member && !member.verified && <Empty title="Verify your account email first"><Link href="/account">Manage email verification</Link></Empty>}
    {member?.verified && verifiedId && <>
      <nav aria-label="Campus sections" className="tabs">
        <button aria-pressed={view === "CAMPUS_MATERIALS"} onClick={() => setView("CAMPUS_MATERIALS")}>Campus Materials</button>
        <button aria-pressed={view === "CAMPUS_MARKETPLACE"} onClick={() => setView("CAMPUS_MARKETPLACE")}>Campus Marketplace</button>
      </nav>
      <Discovery key={verifiedId + view} scope={view} />
    </>}
    <section className="panel stack">
      <h2>College directory</h2>
      <form className="row controls" onSubmit={(event) => { event.preventDefault(); void searchDirectory(event.currentTarget); }}>
        <label>Find a college<input name="college" type="search" maxLength={120} placeholder="Search by college name" /></label>
        <button>Search</button>
      </form>
      <label>College<select value={selected} onChange={(event) => { setSelected(event.target.value); setCourses([]); }}>
        <option value="">Choose a college</option>
        {institutions.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
      </select></label>
      {selected && courses.length > 0 && <ul className="simple-list">{courses.map((course) => <li key={course.id}><strong>{course.code}</strong> {course.name}</li>)}</ul>}
      {member?.verified && <div className="row">
        <button type="button" disabled={!selected || selected === verifiedId || busy}
          onClick={() => void act("/institutions/" + selected + "/verify", undefined, "Your college is verified.")}>Verify with account email</button>
        {selected && selected === verifiedId && <span className="tag">Verified college</span>}
      </div>}
      {notice && <Feedback error={notice.error}>{notice.text}</Feedback>}
    </section>
    {member?.verified && <section className="panel stack">
      <h2>Directory and verification requests</h2>
      <form className="stack narrow" onSubmit={(event) => {
        event.preventDefault();
        const fields = new FormData(event.currentTarget);
        void act("/institutions/requests", { kind, institutionId: selected || null, name: fields.get("name"), detail: fields.get("detail") }, "Request submitted for review.");
      }}>
        <label>Request type<select value={kind} onChange={(event) => setKind(event.target.value as RequestKind)}>
          <option value="AFFILIATION">Manual affiliation verification</option><option value="INSTITUTION">Add a college</option><option value="COURSE">Add a course</option>
        </select></label>
        {kind !== "AFFILIATION" && <label>{kind === "COURSE" ? "Course name" : "College name"}<input name="name" maxLength={140} required /></label>}
        <label>Details<textarea name="detail" rows={3} maxLength={600} /></label>
        <button disabled={busy || (kind !== "INSTITUTION" && !selected)}>Submit request</button>
      </form>
      {requests.length > 0 && <ul className="simple-list">{requests.map((request) => <li key={request.id}>
        {request.name ?? statusLabel(request.kind)} <span className="tag">{statusLabel(request.status)}</span>
      </li>)}</ul>}
    </section>}
  </div>;
}
