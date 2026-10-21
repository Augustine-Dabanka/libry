"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { generationOf } from "@/lib/greeting";

const GEN: Record<string, string> = { alpha: "Gen Alpha", genz: "Gen Z", millennial: "Millennial", genx: "Gen X", boomer: "Boomer" };

// Date of birth: set once (at sign-up, or here for Google/Discord accounts),
// then locked. It decides age-rated books, creator limits and your greeting.
// A wrong date can only be fixed by support, so a teen can't edit their way to 18+.
export default function BirthdateSetting({ initial }: { initial: string | null }) {
  const [dob, setDob] = useState(initial);
  const [val, setVal] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (dob) {
    const g = generationOf(dob);
    return (
      <div style={{ display: "grid", gap: "0.35rem" }}>
        <strong style={{ fontWeight: 900 }}>{new Date(dob + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}{g ? ` · ${GEN[g]}` : ""}</strong>
        <span style={{ color: "var(--muted)", fontSize: "0.86rem", fontWeight: 600 }}>Locked once set. If it&apos;s wrong, contact support and we&apos;ll check and fix it.</span>
      </div>
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!val) return;
    setBusy(true); setMsg(null);
    const { data, error } = await createClient().rpc("set_birthdate", { p_birth: val });
    setBusy(false);
    const row = Array.isArray(data) ? (data[0] as { ok: boolean; message: string } | undefined) : undefined;
    if (error || !row?.ok) { setMsg({ ok: false, t: row?.message || error?.message || "Couldn't save that date." }); return; }
    setDob(val);
  }
  const max = new Date(); max.setFullYear(max.getFullYear() - 13);
  return (
    <form onSubmit={save} style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
      <input type="date" aria-label="Date of birth" required min="1900-01-01" max={max.toISOString().slice(0, 10)} value={val} onChange={(e) => setVal(e.target.value)}
        style={{ padding: "0.6rem 0.8rem", borderRadius: 12, border: "2px solid var(--edge)", background: "var(--charcoal)", color: "var(--ivory)", fontFamily: "var(--sans)" }} />
      <button className="btn btn-gold" type="submit" disabled={busy || !val}>{busy ? "Saving…" : "Save"}</button>
      <span style={{ flexBasis: "100%", color: "var(--muted)", fontSize: "0.82rem", fontWeight: 700 }}>You can set this once. Check it carefully.</span>
      {msg ? <span role="alert" style={{ flexBasis: "100%", color: msg.ok ? "var(--success)" : "var(--danger)", fontWeight: 800, fontSize: "0.86rem" }}>{msg.t}</span> : null}
    </form>
  );
}
