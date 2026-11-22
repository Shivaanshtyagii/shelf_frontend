"use client";

import { useEffect, useRef, useState } from "react";
import { Feedback } from "@/ui/Feedback";
import { makePdf } from "./pdf";
import { maxScanPages, type ScanPage } from "./scanner-types";
import "./scanner.css";

export function Scanner({ onUse }: { onUse: (file: File) => void }) {
  const [pages, setPages] = useState<ScanPage[]>([]);
  const [quality, setQuality] = useState(false);
  const [result, setResult] = useState<{ file: File; url: string }>();
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(0);
  const [error, setError] = useState("");
  const urls = useRef(new Set<string>());

  useEffect(() => {
    const currentUrls = urls.current;
    return () => currentUrls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function keepUrl(file: File) {
    const url = URL.createObjectURL(file);
    urls.current.add(url);
    return url;
  }
  function dropUrl(url: string) {
    URL.revokeObjectURL(url);
    urls.current.delete(url);
  }
  function invalidateResult() {
    if (result) dropUrl(result.url);
    setResult(undefined);
  }
  function add(files: FileList | null) {
    if (!files?.length) return;
    const available = maxScanPages - pages.length;
    const images = Array.from(files).filter((file) => file.type.startsWith("image/") && file.size <= 25_000_000);
    setError(images.length < files.length ? "Some files were skipped. Select images under 25 MB."
      : images.length > available ? "A scan can have up to 100 pages." : "");
    invalidateResult();
    setPages([...pages, ...images.slice(0, available).map((file) => ({ id: crypto.randomUUID(), file, src: keepUrl(file), turns: 0 }))]);
  }
  function move(index: number, offset: number) {
    const target = index + offset;
    if (target < 0 || target >= pages.length) return;
    const next = [...pages];
    [next[index], next[target]] = [next[target], next[index]];
    invalidateResult();
    setPages(next);
  }

  async function exportPdf() {
    setBusy(true);
    setComplete(0);
    setError("");
    invalidateResult();
    try {
      const file = await makePdf(pages, quality, setComplete);
      setResult({ file, url: keepUrl(file) });
    } catch {
      setError("A page couldn’t be read. Use JPEG or PNG images, then try again.");
    } finally { setBusy(false); }
  }

  return <section className="panel stack">
    <h2>Scan pages</h2>
    <p className="muted">Your scans stay on your device until you submit them.</p>
    <div className="row">
      <label className="button secondary file-button">Add photos<input type="file" accept="image/*" multiple disabled={busy}
        onChange={(event) => { add(event.target.files); event.target.value = ""; }} /></label>
      <label className="button secondary file-button">Use camera<input type="file" accept="image/*" capture="environment" disabled={busy}
        onChange={(event) => { add(event.target.files); event.target.value = ""; }} /></label>
    </div>
    {pages.length > 0 && <>
      <div className="scan-grid">{pages.map((page, index) => <article className="scan-card stack" key={page.id}>
        <div className="scan-thumbnail">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={page.src} alt={"Scanned page " + (index + 1)} style={{ rotate: page.turns * 90 + "deg" }} />
        </div>
        <strong>Page {index + 1}</strong>
        <div className="scan-controls">
          <button className="secondary" disabled={busy || index === 0} onClick={() => move(index, -1)}>Earlier</button>
          <button className="secondary" disabled={busy || index === pages.length - 1} onClick={() => move(index, 1)}>Later</button>
          <button className="secondary" disabled={busy} onClick={() => {
            invalidateResult();
            setPages(pages.map((entry) => entry.id === page.id ? { ...entry, turns: (entry.turns + 1) % 4 } : entry));
          }}>Rotate</button>
          <button className="text-button" disabled={busy} onClick={() => {
            invalidateResult();
            dropUrl(page.src);
            setPages(pages.filter((entry) => entry.id !== page.id));
          }}>Remove</button>
        </div>
      </article>)}</div>
      <label className="checkbox"><input type="checkbox" checked={quality} disabled={busy}
        onChange={(event) => { invalidateResult(); setQuality(event.target.checked); }} /> Higher quality for small text and diagrams</label>
      <div className="row">
        <button disabled={busy} onClick={() => void exportPdf()}>Prepare PDF</button>
        {result && <><a className="button secondary" href={result.url} download={result.file.name}>Download PDF</a>
          <button className="secondary" onClick={() => onUse(result.file)}>Use in listing</button></>}
      </div>
    </>}
    {busy && <Feedback>Preparing PDF · {complete} of {pages.length} pages</Feedback>}
    {result && <Feedback>PDF ready · {(result.file.size / 1_000_000).toFixed(2)} MB</Feedback>}
    {error && <Feedback error>{error}</Feedback>}
  </section>;
}
