"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Shared access: grant other Libry readers access to your library by username.
// The list is stored on your profile (prefs.shared_with); enforcement of shared
// reading is layered on later, but the sharing relationship is real and saved.
export default function SharedAccess({
  userId,
  myUsername,
  initial,
}: {
  userId: string;
  myUsername: string;
  initial: string[];
}) {
  const [list, setList] = useState<string[]>(initial);
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function persist(next: string[]) {
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("prefs").eq("id", userId).maybeSingle();
    const prefs = data?.prefs && typeof data.prefs === "object" ? (data.prefs as Record<string, unknown>) : {};
    await supabase.from("profiles").update({ prefs: { ...prefs, shared_with: next } }).eq("id", userId);
  }

  async function add() {
    setMsg(null);
    const u = input.trim().toLowerCase();
    if (!u) return;
    if (u === myUsername.toLowerCase()) { setMsg("You can't share with yourself."); return; }
    if (list.includes(u)) { setMsg("Already shared with them."); return; }
    setBusy(true);
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("username").eq("username", u).maybeSingle();
    if (!data) { setBusy(false); setMsg("No Libry reader with that username."); return; }
    const next = [...list, u];
    setList(next);
    setInput("");
    await persist(next);
    setBusy(false);
    setMsg("Shared ✓");
  }

  async function remove(u: string) {
    const next = list.filter((x) => x !== u);
    setList(next);
    await persist(next);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Their username"
          style={{
            flex: 1,
            minWidth: 200,
            padding: "0.7rem 0.95rem",
            background: "var(--charcoal)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            color: "var(--ivory)",
            fontFamily: "var(--sans)",
            fontSize: "0.95rem",
            outline: "none",
          }}
        />
        <button className="btn btn-gold" type="button" onClick={add} disabled={busy} style={{ padding: "0.6rem 1.3rem" }}>
          {busy ? "…" : "Invite"}
        </button>
      </div>
      {msg ? <p style={{ color: msg.includes("✓") ? "#7DBE86" : "var(--terracotta)", fontSize: "0.82rem", marginTop: "0.6rem", fontFamily: "var(--sans)" }}>{msg}</p> : null}

      {list.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
          {list.map((u) => (
            <div key={u} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.8rem", padding: "0.6rem 0.9rem", background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 10 }}>
              <span style={{ fontFamily: "var(--sans)", color: "var(--ivory)" }}>@{u}</span>
              <button
                type="button"
                onClick={() => remove(u)}
                aria-label={`Remove ${u}`}
                style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "0.85rem", fontFamily: "var(--sans)" }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem", marginTop: "0.8rem" }}>
          You haven&apos;t shared your library with anyone yet.
        </p>
      )}
    </div>
  );
}
