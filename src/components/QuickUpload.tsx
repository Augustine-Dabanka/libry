"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { splitIntoChapters, textToHtml } from "@/lib/chapters";

const escTitle = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const PDF_WORKER = "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.worker.min.mjs";

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
}

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".markdown")) {
    return (await file.text()).trim();
  }
  if (name.endsWith(".html") || name.endsWith(".htm")) {
    return stripHtml(await file.text());
  }
  if (name.endsWith(".docx")) {
    const buf = await file.arrayBuffer();
    const mod = await import("mammoth/mammoth.browser");
    const mammoth = mod.default ?? mod;
    const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
    return String(value || "").trim();
  }
  if (name.endsWith(".pdf")) {
    const buf = await file.arrayBuffer();
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER;
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    let out = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const tc = await page.getTextContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const line = (tc.items as any[]).map((it) => ("str" in it ? it.str : "")).join(" ");
      out += line + "\n\n";
    }
    return out.replace(/\n{3,}/g, "\n\n").trim();
  }
  if (name.endsWith(".doc")) {
    throw new Error("Old .doc files aren't supported — please save it as .docx or .pdf and try again.");
  }
  throw new Error("Unsupported file type. Use .txt, .md, .html, .docx, or .pdf.");
}

export default function QuickUpload({ userId, authorName }: { userId: string; authorName: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Fiction");
  const [fileName, setFileName] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(file: File) {
    setErr(null);
    setStatus("Reading manuscript…");
    setFileName(file.name);
    if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ""));
    try {
      const text = await extractText(file);
      if (!text) throw new Error("Couldn't find any text in that file.");
      setContent(text);
      const n = type !== "Interactive" ? splitIntoChapters(text).length : 1;
      setStatus(`Read ${text.length.toLocaleString()} characters${n > 1 ? ` · ${n} chapters detected` : ""}. Ready to create your draft.`);
    } catch (e) {
      setStatus(null);
      setErr(e instanceof Error ? e.message : "Couldn't read that file.");
    }
  }

  async function createDraft(body: string) {
    setErr(null);
    if (!title.trim()) { setErr("Give your story a title."); return; }
    setBusy(true);
    const supabase = createClient();
    const payload: Record<string, unknown> = {
      id: Date.now(),
      title: title.trim(),
      author: authorName,
      content: body || null,
      type,
      price: 0,
      is_free: true,
      age_rating: "Everyday",
      status: "Draft",
      is_published: false,
      user_id: userId,
      created_by: authorName,
    };
    // Auto-split a manuscript into chapters (prose types only) so it opens in the
    // editor as real chapters, and compile HTML the reader can render at once.
    const chapters = body && type !== "Interactive" ? splitIntoChapters(body) : body ? [{ title: "Chapter One", content: body }] : [];
    if (chapters.length) {
      const compiled = chapters
        .map((c, idx) => `<section class="ch"><h2 class="chapter-title">${escTitle(c.title || `Chapter ${idx + 1}`)}</h2>${textToHtml(c.content)}</section>`)
        .join("\n");
      payload.content = compiled;
      payload.pages = chapters.length;
    }

    let { error } = await supabase.from("books").insert(payload);
    if (error && /age_rating|is_published|pages/i.test(error.message)) {
      delete payload.age_rating;
      delete payload.is_published;
      delete payload.pages;
      ({ error } = await supabase.from("books").insert(payload));
    }
    if (error) { setBusy(false); setErr(error.message); return; }

    // Persist the split chapters so the editor loads them individually.
    if (chapters.length) {
      const rows = chapters.map((c, idx) => ({ book_id: payload.id, title: c.title || `Chapter ${idx + 1}`, content: c.content, chapter_number: idx + 1, is_published: true }));
      await supabase.from("chapters").insert(rows); // best-effort; editor also has book.content
    }
    setBusy(false);
    if (chapters.length > 1) setStatus(`Imported — split into ${chapters.length} chapters.`);
    router.push(`/creator/edit/${payload.id}`);
  }

  const field: React.CSSProperties = {
    width: "100%", padding: "0.72rem 0.95rem", background: "var(--charcoal)",
    border: "1px solid var(--border)", borderRadius: 10, color: "var(--ivory)",
    fontFamily: "var(--sans)", fontSize: "0.95rem", outline: "none",
  };

  return (
    <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.6rem" }}>
      <h3 style={{ marginBottom: "0.3rem" }}>Upload a manuscript</h3>
      <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", marginBottom: "1.2rem" }}>
        Drop in a <strong>.pdf</strong>, <strong>.docx</strong>, <strong>.txt</strong>, <strong>.md</strong>, or <strong>.html</strong> file — we&apos;ll pull out the text and save it as a draft you can refine before publishing.
      </p>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <div style={{ flex: "2 1 240px" }}>
          <label style={{ display: "block", fontSize: "0.82rem", color: "var(--muted)", fontFamily: "var(--sans)", marginBottom: "0.35rem" }}>Title</label>
          <input style={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your story's title" />
        </div>
        <div style={{ flex: "1 1 160px" }}>
          <label style={{ display: "block", fontSize: "0.82rem", color: "var(--muted)", fontFamily: "var(--sans)", marginBottom: "0.35rem" }}>Type</label>
          <select style={field} value={type} onChange={(e) => setType(e.target.value)}>
            <option>Fiction</option>
            <option>Non-Fiction</option>
            <option>Interactive</option>
          </select>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,.markdown,.html,.htm,.docx,.pdf,.doc"
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" className="btn btn-outline" onClick={() => inputRef.current?.click()}>
          {fileName ? `📄 ${fileName}` : "Choose a file…"}
        </button>
        <button type="button" className="btn btn-gold" disabled={busy || !content} onClick={() => createDraft(content)}>
          {busy ? "Creating…" : "Create draft from manuscript"}
        </button>
      </div>

      {status ? <p style={{ color: "#7DBE86", fontFamily: "var(--sans)", fontSize: "0.86rem", marginTop: "0.9rem" }}>{status}</p> : null}
      {err ? <p style={{ color: "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.86rem", marginTop: "0.9rem" }}>{err}</p> : null}

      <div style={{ borderTop: "1px solid var(--border)", marginTop: "1.4rem", paddingTop: "1.2rem" }}>
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.88rem", marginBottom: "0.7rem" }}>
          Prefer to write it here — chapter by chapter?
        </p>
        <button type="button" className="btn btn-outline" disabled={busy} onClick={() => createDraft("")}>
          ✎ Start a blank draft in the editor
        </button>
      </div>
    </div>
  );
}
