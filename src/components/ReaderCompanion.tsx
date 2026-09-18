"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
  The reading companion — a small, opt-in avatar at the bottom-right of the
  reader. The reader can name it, give it an avatar and a role, ask it for a
  word's meaning or a simpler synonym, and — when they highlight a hard word in
  the book — get a transient "simpler word" chip near the selection that fades as
  they read on. It never rewrites the book text; the simpler word is only shown
  for a moment. Word help uses free, keyless public dictionaries with a graceful
  fallback, so it works with no server keys configured.
*/

const AVATARS = ["📖", "🦊", "🦉", "🐱", "🌙", "⭐", "🧚", "🐉", "☕", "🕯️", "🐢", "🦋"];
const ROLES = ["Reading buddy", "Vocabulary coach", "Study partner", "Story guide"];

type Companion = { name: string; avatar: string; role: string; setup: boolean };
type Msg = { from: "you" | "bot"; text: string };
type WordInfo = { word: string; simpler?: string; definition?: string };

const DEFAULT: Companion = { name: "", avatar: "📖", role: "Reading buddy", setup: false };

function loadCompanion(): Companion {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem("libry-companion");
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT;
}

// A "simpler" synonym: shortest single-word Datamuse synonym that isn't the word
// itself, plus the first dictionary definition. Both sources are optional.
async function lookupWord(raw: string): Promise<WordInfo> {
  const word = raw.trim().toLowerCase().replace(/[^a-z'-]/gi, "");
  const info: WordInfo = { word };
  if (!word) return info;
  try {
    const syn = await fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=12`).then((r) => r.json());
    const cands: string[] = Array.isArray(syn) ? syn.map((s: { word: string }) => s.word).filter((w) => /^[a-z'-]+$/i.test(w) && w !== word) : [];
    if (cands.length) info.simpler = cands.sort((a, b) => a.length - b.length)[0];
  } catch {}
  try {
    const def = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`).then((r) => (r.ok ? r.json() : null));
    const d = def?.[0]?.meanings?.[0]?.definitions?.[0]?.definition;
    if (d) info.definition = String(d);
  } catch {}
  return info;
}

export default function ReaderCompanion({ dark = true }: { dark?: boolean }) {
  const [comp, setComp] = useState<Companion>(DEFAULT);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [chip, setChip] = useState<{ x: number; y: number; word: string; simpler?: string } | null>(null);
  const chipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => setComp(loadCompanion()), []);

  const persist = useCallback((c: Companion) => {
    setComp(c);
    try {
      localStorage.setItem("libry-companion", JSON.stringify(c));
    } catch {}
  }, []);

  // Greet once, after setup.
  useEffect(() => {
    if (comp.setup && open && msgs.length === 0) {
      setMsgs([{ from: "bot", text: `Hi, I'm ${comp.name || "your companion"}. Highlight any tricky word in the book, or ask me “what does … mean?” or “simpler word for …”.` }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comp.setup, open]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs, busy]);

  // Selection helper: when the reader highlights a single word inside the book
  // text, offer a simpler synonym in a floating chip that fades as they move on.
  useEffect(() => {
    function clearChip() {
      if (chipTimer.current) clearTimeout(chipTimer.current);
      setChip(null);
    }
    async function onUp() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const text = sel.toString().trim();
      // A single word only.
      if (!text || /\s/.test(text) || text.length < 4 || !/^[a-zA-Z'-]+$/.test(text)) return;
      const node = sel.anchorNode;
      const el = node && (node.nodeType === 3 ? node.parentElement : (node as Element));
      if (!el || !el.closest(".rd-scope, [data-rc-book]")) return; // only inside the book body
      let rect: DOMRect | null = null;
      try {
        rect = sel.getRangeAt(0).getBoundingClientRect();
      } catch {}
      if (!rect || (rect.width === 0 && rect.height === 0)) return;
      const x = Math.min(window.innerWidth - 150, Math.max(12, rect.left + rect.width / 2));
      const y = Math.max(56, rect.top - 8);
      setChip({ x, y, word: text });
      const info = await lookupWord(text);
      setChip((c) => (c && c.word === text ? { ...c, simpler: info.simpler } : c));
      if (chipTimer.current) clearTimeout(chipTimer.current);
      chipTimer.current = setTimeout(() => setChip(null), 6000);
    }
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchend", onUp);
    window.addEventListener("scroll", clearChip, true);
    return () => {
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchend", onUp);
      window.removeEventListener("scroll", clearChip, true);
      if (chipTimer.current) clearTimeout(chipTimer.current);
    };
  }, []);

  async function ask(qRaw: string) {
    const q = qRaw.trim();
    if (!q) return;
    setMsgs((m) => [...m, { from: "you", text: q }]);
    setInput("");
    setBusy(true);
    // Pull the target word out of common phrasings, else treat the whole thing
    // as the word/phrase to look up.
    const m = q.match(/(?:mean(?:ing)?(?:\s+of)?|define|definition\s+of|simpler\s+word\s+for|synonym\s+for|what\s+is|what'?s)\s+["“']?([a-zA-Z'-]{2,})/i);
    const target = (m?.[1] || q).replace(/[^a-zA-Z'-]/g, "");
    const info = await lookupWord(target);
    let reply: string;
    if (!info.simpler && !info.definition) {
      reply = `I couldn't find “${target}” just now — try another word, or check the spelling.`;
    } else {
      const parts: string[] = [];
      if (info.definition) parts.push(`“${info.word}” — ${info.definition}`);
      if (info.simpler) parts.push(`A simpler word: ${info.simpler}.`);
      reply = parts.join("\n\n");
    }
    setBusy(false);
    setMsgs((mm) => [...mm, { from: "bot", text: reply }]);
  }

  const bg = dark ? "rgba(28,25,23,0.96)" : "#FBF7EF";
  const fg = dark ? "#FAF7F2" : "#2B2622";
  const muted = dark ? "#A8A29E" : "#6B645E";
  const border = dark ? "rgba(250,247,242,0.12)" : "rgba(43,38,34,0.14)";
  const accent = "#5FA068";

  return (
    <>
      {/* transient "simpler word" chip near a highlighted word */}
      {chip ? (
        <button
          type="button"
          onClick={() => { if (chip.simpler || chip.word) { setOpen(true); ask(`meaning of ${chip.word}`); } setChip(null); }}
          style={{
            position: "fixed", left: chip.x, top: chip.y, transform: "translate(-50%,-100%)", zIndex: 1400,
            background: accent, color: "#0f130f", border: "none", borderRadius: 999, padding: "0.32rem 0.7rem",
            fontFamily: "var(--sans)", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)", animation: "rc-pop 0.18s ease",
          }}
          aria-label={chip.simpler ? `Simpler word: ${chip.simpler}` : "Look up word"}
        >
          {chip.simpler ? `≈ ${chip.simpler}` : `… ${chip.word}?`}
        </button>
      ) : null}

      {/* the panel */}
      {open ? (
        <div role="dialog" aria-label="Reading companion" style={{ position: "fixed", right: "clamp(0.8rem,3vw,1.4rem)", bottom: "5.2rem", zIndex: 1350, width: "min(340px, calc(100vw - 1.6rem))", maxHeight: "min(70vh, 560px)", display: "flex", flexDirection: "column", background: bg, color: fg, border: `1px solid ${border}`, borderRadius: 18, boxShadow: "0 24px 70px rgba(0,0,0,0.5)", backdropFilter: "blur(14px)", overflow: "hidden", animation: "rc-rise 0.24s cubic-bezier(0.22,1,0.36,1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.85rem 1rem", borderBottom: `1px solid ${border}` }}>
            <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>{comp.avatar}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{comp.setup ? comp.name || "Companion" : "Your companion"}</div>
              <div style={{ fontFamily: "var(--sans)", fontSize: "0.74rem", color: muted }}>{comp.role}</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ background: "transparent", border: "none", color: muted, cursor: "pointer", fontSize: "1.1rem", lineHeight: 1, padding: 4 }}>✕</button>
          </div>

          {!comp.setup ? (
            <div style={{ padding: "1rem", overflowY: "auto" }}>
              <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "1rem", margin: "0 0 0.9rem", lineHeight: 1.5 }}>
                Make it yours. A little companion for the margins of your book.
              </p>
              <label style={{ display: "block", fontFamily: "var(--sans)", fontSize: "0.78rem", color: muted, marginBottom: "0.3rem" }}>Name</label>
              <input value={comp.name} onChange={(e) => setComp({ ...comp, name: e.target.value })} placeholder="e.g. Fable, Sage, Whiskers…" maxLength={24}
                style={{ width: "100%", padding: "0.6rem 0.7rem", borderRadius: 10, border: `1px solid ${border}`, background: dark ? "rgba(255,255,255,0.05)" : "#fff", color: fg, fontFamily: "var(--sans)", fontSize: "0.9rem", outline: "none" }} />
              <label style={{ display: "block", fontFamily: "var(--sans)", fontSize: "0.78rem", color: muted, margin: "0.9rem 0 0.4rem" }}>Avatar</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {AVATARS.map((a) => (
                  <button key={a} type="button" onClick={() => setComp({ ...comp, avatar: a })} style={{ fontSize: "1.25rem", width: 40, height: 40, borderRadius: 10, cursor: "pointer", background: comp.avatar === a ? "rgba(95,160,104,0.2)" : "transparent", border: `1px solid ${comp.avatar === a ? accent : border}` }}>{a}</button>
                ))}
              </div>
              <label style={{ display: "block", fontFamily: "var(--sans)", fontSize: "0.78rem", color: muted, margin: "0.9rem 0 0.4rem" }}>Role</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {ROLES.map((r) => (
                  <button key={r} type="button" onClick={() => setComp({ ...comp, role: r })} style={{ fontFamily: "var(--sans)", fontSize: "0.8rem", fontWeight: 600, padding: "0.4rem 0.6rem", borderRadius: 999, cursor: "pointer", background: comp.role === r ? "rgba(95,160,104,0.16)" : "transparent", color: comp.role === r ? fg : muted, border: `1px solid ${comp.role === r ? accent : border}` }}>{r}</button>
                ))}
              </div>
              <button type="button" onClick={() => persist({ ...comp, setup: true })} style={{ width: "100%", marginTop: "1.1rem", padding: "0.7rem", borderRadius: 12, border: "none", background: accent, color: "#0f130f", fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
                Meet {comp.name.trim() || "my companion"}
              </button>
            </div>
          ) : (
            <>
              <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", padding: "0.9rem 1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {msgs.map((m, i) => (
                  <div key={i} style={{ alignSelf: m.from === "you" ? "flex-end" : "flex-start", maxWidth: "85%", padding: "0.55rem 0.75rem", borderRadius: 14, whiteSpace: "pre-wrap", lineHeight: 1.45, fontFamily: "var(--sans)", fontSize: "0.88rem", background: m.from === "you" ? accent : dark ? "rgba(255,255,255,0.06)" : "#fff", color: m.from === "you" ? "#0f130f" : fg, border: m.from === "you" ? "none" : `1px solid ${border}` }}>
                    {m.text}
                  </div>
                ))}
                {busy ? <div style={{ alignSelf: "flex-start", color: muted, fontFamily: "var(--sans)", fontSize: "0.85rem", padding: "0.2rem 0.3rem" }}>…thinking</div> : null}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); ask(input); }} style={{ display: "flex", gap: "0.4rem", padding: "0.7rem", borderTop: `1px solid ${border}` }}>
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask for a meaning or simpler word…" style={{ flex: 1, minWidth: 0, padding: "0.55rem 0.7rem", borderRadius: 10, border: `1px solid ${border}`, background: dark ? "rgba(255,255,255,0.05)" : "#fff", color: fg, fontFamily: "var(--sans)", fontSize: "0.88rem", outline: "none" }} />
                <button type="submit" disabled={busy || !input.trim()} aria-label="Send" style={{ flexShrink: 0, width: 40, borderRadius: 10, border: "none", background: accent, color: "#0f130f", cursor: input.trim() ? "pointer" : "default", opacity: input.trim() ? 1 : 0.5, fontSize: "1rem" }}>➤</button>
              </form>
              <button type="button" onClick={() => persist({ ...comp, setup: false })} style={{ background: "transparent", border: "none", color: muted, fontFamily: "var(--sans)", fontSize: "0.72rem", cursor: "pointer", padding: "0 0 0.7rem" }}>
                Edit companion
              </button>
            </>
          )}
        </div>
      ) : null}

      {/* the launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close reading companion" : "Open reading companion"}
        aria-expanded={open}
        style={{
          position: "fixed", right: "clamp(0.8rem,3vw,1.4rem)", bottom: "clamp(0.9rem,3vw,1.4rem)", zIndex: 1350,
          width: 54, height: 54, borderRadius: "50%", cursor: "pointer",
          display: "grid", placeItems: "center", fontSize: "1.5rem",
          background: dark ? "rgba(28,25,23,0.92)" : "#FBF7EF", color: fg,
          border: `1px solid ${border}`, boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          transition: "transform 0.18s ease",
        }}
      >
        <span style={{ transform: open ? "scale(0.9)" : "none" }}>{comp.avatar}</span>
      </button>

      <style>{`
        @keyframes rc-rise { from { opacity: 0; transform: translateY(14px) scale(0.97); } to { opacity: 1; transform: none; } }
        @keyframes rc-pop { from { opacity: 0; transform: translate(-50%,-100%) scale(0.8); } to { opacity: 1; transform: translate(-50%,-100%) scale(1); } }
      `}</style>
    </>
  );
}
