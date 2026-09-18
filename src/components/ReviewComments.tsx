"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type RC = { id: number; user_id: string; user_name: string | null; body: string; created_at: string };

export default function ReviewComments({ reviewId, signedIn }: { reviewId: string; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [rows, setRows] = useState<RC[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const supabase = createClient();
    const [{ data: { user } }, { data }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("review_comments").select("id, user_id, user_name, body, created_at").eq("review_id", reviewId).order("created_at", { ascending: true }),
    ]);
    setMe(user?.id ?? null);
    setRows((data ?? []) as RC[]);
    setCount((data ?? []).length);
    setLoaded(true);
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) await load();
  }

  async function add() {
    if (!text.trim()) return;
    setBusy(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return; }
    const uname = (user.user_metadata?.username as string) || (user.user_metadata?.full_name as string) || (user.email?.split("@")[0]) || "Reader";
    const { data, error } = await supabase.from("review_comments").insert({ review_id: reviewId, user_id: user.id, user_name: uname, body: text.trim() }).select("id, user_id, user_name, body, created_at").maybeSingle();
    setBusy(false);
    if (!error && data) {
      setRows((r) => [...r, data as RC]);
      setCount((c) => (c ?? 0) + 1);
      setText("");
    }
  }

  async function remove(id: number) {
    const supabase = createClient();
    const { error } = await supabase.from("review_comments").delete().eq("id", id);
    if (!error) {
      setRows((r) => r.filter((x) => x.id !== id));
      setCount((c) => Math.max(0, (c ?? 1) - 1));
    }
  }

  return (
    <div style={{ marginTop: "0.7rem" }}>
      <button type="button" onClick={toggle} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.8rem", fontWeight: 600, padding: 0 }}>
        💬 {open ? "Hide" : "Reply"}{count != null && count > 0 ? ` · ${count}` : ""}
      </button>

      {open ? (
        <div style={{ marginTop: "0.6rem", borderLeft: "2px solid var(--border)", paddingLeft: "0.8rem" }}>
          {rows.map((c) => (
            <div key={c.id} style={{ marginBottom: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                <span style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.82rem", color: "var(--ivory)" }}>{c.user_name || "Reader"}</span>
                {me === c.user_id ? (
                  <button type="button" onClick={() => remove(c.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "0.72rem", padding: 0 }}>delete</button>
                ) : null}
              </div>
              <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.86rem", margin: "0.1rem 0 0", lineHeight: 1.5 }}>{c.body}</p>
            </div>
          ))}
          {rows.length === 0 && loaded ? <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.82rem", margin: "0 0 0.5rem" }}>No replies yet.</p> : null}

          {signedIn ? (
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder="Add a reply…" maxLength={2000}
                style={{ flex: 1, background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.84rem", padding: "0.4rem 0.6rem", outline: "none" }} />
              <button type="button" onClick={add} disabled={busy || !text.trim()} className="btn btn-outline" style={{ padding: "0.35rem 0.8rem", fontSize: "0.8rem" }}>{busy ? "…" : "Reply"}</button>
            </div>
          ) : (
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.8rem" }}><a href="/login" style={{ color: "var(--gold)" }}>Sign in</a> to reply.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
