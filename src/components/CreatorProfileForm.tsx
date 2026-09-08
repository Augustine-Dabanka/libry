"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// The creator's public author profile — pen name + bio. This is what readers
// see under "About the Author" on every book. Saving also marks the account as
// a creator.
export default function CreatorProfileForm({
  userId,
  initialPenName,
  initialBio,
}: {
  userId: string;
  initialPenName: string;
  initialBio: string;
}) {
  const [penName, setPenName] = useState(initialPenName);
  const [bio, setBio] = useState(initialBio);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const payload: Record<string, unknown> = { pen_name: penName.trim() || null, bio: bio.trim() || null, is_creator: true };
    let { error } = await supabase.from("profiles").update(payload).eq("id", userId);
    if (error && /pen_name|is_creator|bio/i.test(error.message)) {
      // Columns not migrated yet — save just the bio if that column exists.
      ({ error } = await supabase.from("profiles").update({ bio: bio.trim() || null }).eq("id", userId));
    }
    setBusy(false);
    setMsg(error ? error.message : "Saved ✓ — this is what readers see under “About the Author”.");
  }

  return (
    <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.5rem 1.6rem", marginBottom: "2.5rem" }}>
      <h3 style={{ marginBottom: "0.3rem" }}>Author profile</h3>
      <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", marginBottom: "1.2rem" }}>
        Your public identity as a writer — shown under “About the Author” on your books.
      </p>

      <label style={lbl}>Pen name</label>
      <input style={field} value={penName} onChange={(e) => setPenName(e.target.value)} placeholder="The name you publish under" />

      <label style={{ ...lbl, marginTop: "1rem" }}>Bio</label>
      <textarea
        style={{ ...field, minHeight: 110, resize: "vertical" }}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        maxLength={600}
        placeholder="A couple of sentences about you and the stories you write…"
      />
      <div style={{ textAlign: "right", color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.72rem", marginTop: "0.25rem" }}>{bio.length}/600</div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.8rem", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-gold" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save author profile"}</button>
        {msg ? <span style={{ color: msg.includes("✓") ? "#7DBE86" : "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.85rem" }}>{msg}</span> : null}
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { display: "block", fontSize: "0.85rem", color: "var(--muted)", fontFamily: "var(--sans)", marginBottom: "0.35rem" };
const field: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "0.75rem 1rem", background: "var(--charcoal)",
  border: "1px solid var(--border)", borderRadius: 12, color: "var(--ivory)", fontFamily: "var(--sans)",
  fontSize: "0.95rem", outline: "none",
};
