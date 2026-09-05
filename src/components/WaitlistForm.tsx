"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Joined = { ref_code: string; position: number; total: number; referrals: number };
const STORE = "libry_waitlist";

export default function WaitlistForm({ initialRef, role = "reader", cta = "Join the waitlist" }: { initialRef?: string; role?: string; cta?: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [joined, setJoined] = useState<Joined | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  // Remember the referral link + refresh position when a past signer returns.
  useEffect(() => {
    setOrigin(window.location.origin);
    let saved: { email?: string } = {};
    try { saved = JSON.parse(localStorage.getItem(STORE) || "{}"); } catch {}
    if (!saved.email) return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("join_waitlist", { p_email: saved.email });
      if (data && !data.error) setJoined(data as Joined);
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("join_waitlist", {
      p_email: email,
      p_role: role,
      p_ref: initialRef ?? null,
    });
    setBusy(false);

    if (error) {
      // RPC not created yet, or a transport error.
      if (/function|does not exist|schema cache/i.test(error.message)) {
        setErr("The waitlist isn't switched on yet — check back shortly.");
      } else {
        setErr(error.message);
      }
      return;
    }
    if (data?.error) { setErr(data.error); return; }

    const j = data as Joined;
    setJoined(j);
    try { localStorage.setItem(STORE, JSON.stringify({ email: email.trim().toLowerCase(), ref_code: j.ref_code })); } catch {}
  }

  const shareUrl = joined ? `${origin}/waitlist?ref=${joined.ref_code}` : "";

  function copy() {
    if (!shareUrl) return;
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  if (joined) {
    return (
      <div style={card}>
        <div style={{ fontFamily: "var(--sans)", fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>
          You&apos;re on the list
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", margin: "0.5rem 0 0.2rem" }}>
          <span style={{ fontFamily: "var(--serif)", fontSize: "3rem", color: "var(--gold)", lineHeight: 1 }}>#{joined.position}</span>
          <span style={{ color: "var(--muted)", fontFamily: "var(--sans)" }}>of {joined.total}</span>
        </div>
        <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.95rem", margin: "0.6rem 0 1.3rem" }}>
          Want in sooner? <strong style={{ color: "var(--ivory)" }}>Every friend who joins with your link moves you up.</strong>{" "}
          {joined.referrals > 0 ? `You've brought ${joined.referrals} so far — keep going.` : "You haven't referred anyone yet."}
        </p>

        <label style={{ display: "block", fontSize: "0.8rem", color: "var(--muted)", fontFamily: "var(--sans)", marginBottom: "0.35rem" }}>
          Your referral link
        </label>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} style={{ ...input, flex: 1, minWidth: 200 }} />
          <button type="button" className="btn btn-gold" onClick={copy} style={{ borderRadius: 12, padding: "0.7rem 1.2rem" }}>
            {copied ? "Copied ✓" : "Copy link"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={card}>
      <label style={{ display: "block", fontSize: "0.9rem", color: "var(--ivory)", fontFamily: "var(--sans)", fontWeight: 600, marginBottom: "0.5rem" }}>
        Get early access
      </label>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{ ...input, flex: 1, minWidth: 220 }}
        />
        <button type="submit" className="btn btn-gold" disabled={busy} style={{ borderRadius: 12, padding: "0.75rem 1.4rem" }}>
          {busy ? "Joining…" : cta}
        </button>
      </div>
      {initialRef ? (
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.8rem", marginTop: "0.7rem" }}>
          🎉 A friend invited you — joining bumps them up the list.
        </p>
      ) : null}
      {err ? <p style={{ color: "var(--terracotta, #b5533f)", fontFamily: "var(--sans)", fontSize: "0.85rem", marginTop: "0.7rem" }}>{err}</p> : null}
      <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.78rem", marginTop: "0.9rem" }}>
        No spam, no charge. We&apos;ll email you the moment your spot opens.
      </p>
    </form>
  );
}

const card: React.CSSProperties = {
  background: "var(--stone)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: "1.5rem 1.6rem",
  maxWidth: 520,
};

const input: React.CSSProperties = {
  padding: "0.75rem 0.95rem",
  background: "var(--charcoal)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--ivory)",
  fontFamily: "var(--sans)",
  fontSize: "0.95rem",
  outline: "none",
};
