"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const field: React.CSSProperties = {
  width: "100%",
  padding: "0.72rem 0.95rem",
  background: "var(--charcoal)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--ivory)",
  fontFamily: "var(--sans)",
  fontSize: "0.95rem",
  outline: "none",
  marginTop: "0.35rem",
};
const label: React.CSSProperties = {
  display: "block",
  fontSize: "0.82rem",
  color: "var(--muted)",
  fontFamily: "var(--sans)",
  marginTop: "0.9rem",
};

export default function AccountSettings({ userId, initialName }: { userId: string; initialName: string }) {
  const [name, setName] = useState(initialName);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [nameMsg, setNameMsg] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveName() {
    setNameMsg(null);
    if (!name.trim()) { setNameMsg("Enter a display name."); return; }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ full_name: name.trim() }).eq("id", userId);
    setBusy(false);
    setNameMsg(error ? error.message : "Saved ✓");
  }

  async function savePassword() {
    setPwMsg(null);
    if (pw.length < 6) { setPwMsg("Password must be at least 6 characters."); return; }
    if (pw !== pw2) { setPwMsg("Passwords don't match."); return; }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setPwMsg(error.message); return; }
    setPw(""); setPw2("");
    setPwMsg("Password updated ✓");
  }

  return (
    <div>
      <label style={{ ...label, marginTop: 0 }}>Display name</label>
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-end", flexWrap: "wrap" }}>
        <input style={{ ...field, flex: 1, minWidth: 200 }} value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-gold" type="button" onClick={saveName} disabled={busy} style={{ padding: "0.6rem 1.3rem" }}>Save</button>
      </div>
      {nameMsg ? <p style={{ color: nameMsg.includes("✓") ? "#7DBE86" : "var(--terracotta)", fontSize: "0.82rem", marginTop: "0.5rem", fontFamily: "var(--sans)" }}>{nameMsg}</p> : null}

      <label style={label}>Change password</label>
      <input style={field} type="password" placeholder="New password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
      <input style={field} type="password" placeholder="Confirm new password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
      <div style={{ marginTop: "0.7rem" }}>
        <button className="btn btn-outline" type="button" onClick={savePassword} disabled={busy} style={{ padding: "0.55rem 1.3rem" }}>Update password</button>
      </div>
      {pwMsg ? <p style={{ color: pwMsg.includes("✓") ? "#7DBE86" : "var(--terracotta)", fontSize: "0.82rem", marginTop: "0.5rem", fontFamily: "var(--sans)" }}>{pwMsg}</p> : null}
    </div>
  );
}
