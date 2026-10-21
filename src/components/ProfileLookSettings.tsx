"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import KoalaBuilder from "@/components/KoalaBuilder";
import { normalizeLook } from "@/components/KoalaAvatar";

const PRONOUNS = ["Prefer not to say", "She/her", "He/him", "They/them", "She/they", "He/they"];

// Settings card: your koala avatar + pronouns (both public on your profile).
export default function ProfileLookSettings({ userId, initialLook, initialPronouns }: { userId: string; initialLook: unknown; initialPronouns: string | null }) {
  const [look, setLook] = useState(normalizeLook(initialLook));
  const preset = initialPronouns && PRONOUNS.includes(initialPronouns) ? initialPronouns : initialPronouns ? "Custom" : "Prefer not to say";
  const [choice, setChoice] = useState(preset);
  const [custom, setCustom] = useState(preset === "Custom" ? initialPronouns || "" : "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    const pronouns = choice === "Custom" ? custom.trim().slice(0, 24) || null : choice === "Prefer not to say" ? null : choice;
    const { error } = await createClient().from("profiles").update({ avatar: look, pronouns }).eq("id", userId);
    setBusy(false);
    setMsg(error ? { ok: false, text: "Couldn't save. Try again in a moment." } : { ok: true, text: "Saved." });
  }

  const field: React.CSSProperties = { width: "100%", padding: "0.65rem 0.8rem", borderRadius: 12, border: "2px solid var(--edge)", background: "var(--charcoal)", color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.95rem" };
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <KoalaBuilder value={look} onChange={setLook} />
      <div style={{ display: "grid", gap: "0.4rem", maxWidth: 360 }}>
        <label htmlFor="pl-pronouns" style={{ fontFamily: "var(--sans)", fontWeight: 800, fontSize: "0.88rem" }}>Pronouns</label>
        <select id="pl-pronouns" value={choice} onChange={(e) => setChoice(e.target.value)} style={field}>
          {[...PRONOUNS, "Custom"].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {choice === "Custom" ? <input aria-label="Your pronouns" maxLength={24} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. xe/xem" style={field} /> : null}
      </div>
      <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
        <button type="button" className="btn btn-gold" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        {msg ? <span role="status" style={{ fontFamily: "var(--sans)", fontWeight: 800, color: msg.ok ? "var(--success)" : "var(--danger)" }}>{msg.text}</span> : null}
      </div>
    </div>
  );
}
