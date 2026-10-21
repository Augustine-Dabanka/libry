"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { play } from "@/lib/sound";

// Two-step sign-in with an authenticator app (TOTP, via Supabase Auth MFA).
// Used in the sign-up "Security" step and in Settings → Security.
//
//   1. enroll → Supabase returns a QR code + a setup key
//   2. the reader scans it in Google Authenticator / Authy / 1Password / etc.
//   3. they type the 6-digit code → challengeAndVerify → the factor is on
//
// Email codes as a *second* factor aren't offered: Supabase's MFA supports
// authenticator apps (and paid SMS), and an email code to the same inbox that
// can reset the password adds little real protection.

type Factor = { id: string; friendly_name?: string | null; status: string; created_at?: string };

export default function TwoStepSetup({ compact = false, onDone }: { compact?: boolean; onDone?: (on: boolean) => void }) {
  const [factors, setFactors] = useState<Factor[] | null>(null);
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showKey, setShowKey] = useState(false);

  async function refresh() {
    const { data, error } = await createClient().auth.mfa.listFactors();
    if (error) { setFactors([]); return; }
    setFactors((data?.totp ?? []) as Factor[]);
  }
  useEffect(() => { refresh(); }, []);

  const on = (factors ?? []).some((f) => f.status === "verified");

  async function begin() {
    setBusy(true); setMsg(null);
    const sb = createClient();
    // Clear any half-finished setup first, or Supabase refuses a second one.
    for (const f of factors ?? []) if (f.status !== "verified") await sb.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: `Lybry ${new Date().toISOString().slice(0, 10)}` });
    setBusy(false);
    if (error || !data) { setMsg({ ok: false, text: error?.message || "Couldn't start two-step setup. Try again." }); return; }
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    setCode("");
  }
  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!enroll) return;
    const c = code.replace(/\D/g, "");
    if (c.length !== 6) { setMsg({ ok: false, text: "Enter the 6-digit code your app shows for Lybry." }); return; }
    setBusy(true); setMsg(null);
    const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId: enroll.id, code: c });
    setBusy(false);
    if (error) { play("error"); setMsg({ ok: false, text: "That code didn't match. Codes change every 30 seconds; use the newest one." }); return; }
    play("success");
    setEnroll(null);
    setMsg({ ok: true, text: "Two-step sign-in is on. You'll be asked for a code when you sign in." });
    await refresh();
    onDone?.(true);
  }
  async function turnOff() {
    setBusy(true); setMsg(null);
    const sb = createClient();
    let failed = false;
    for (const f of factors ?? []) {
      const { error } = await sb.auth.mfa.unenroll({ factorId: f.id });
      if (error) failed = true;
    }
    setBusy(false);
    setMsg(failed
      ? { ok: false, text: "For safety, turning this off needs a fresh code. Sign out, sign back in with your code, then try again." }
      : { ok: true, text: "Two-step sign-in is off." });
    await refresh();
    if (!failed) onDone?.(false);
  }

  const p: React.CSSProperties = { margin: 0, color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.88rem", lineHeight: 1.55 };

  if (factors === null) return <p style={p}>Checking…</p>;

  return (
    <div style={{ display: "grid", gap: "0.8rem" }}>
      {!enroll ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", flexWrap: "wrap" }}>
          <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 14, display: "grid", placeItems: "center", background: on ? "color-mix(in srgb, var(--success) 18%, transparent)" : "var(--gold-tint)", color: on ? "var(--success)" : "var(--gold)", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="3" /><path d="M9 12l2 2 4-4" /></svg>
          </span>
          <div style={{ flex: 1, minWidth: 180 }}>
            <strong style={{ display: "block", fontFamily: "var(--sans)", fontWeight: 900 }}>{on ? "On: authenticator app" : "Authenticator app"}</strong>
            <span style={p}>{on ? "Each sign-in asks for a 6-digit code from your app." : compact ? "Optional. Adds a 6-digit code at sign-in." : "Use Google Authenticator, Authy, 1Password or any authenticator app. Optional, and you can turn it off later."}</span>
          </div>
          {on ? (
            <button type="button" className="btn btn-outline" onClick={turnOff} disabled={busy}>{busy ? "…" : "Turn off"}</button>
          ) : (
            <button type="button" className="btn btn-gold" onClick={begin} disabled={busy}>{busy ? "Starting…" : "Set up"}</button>
          )}
        </div>
      ) : (
        <form onSubmit={confirm} style={{ display: "grid", gap: "0.8rem", justifyItems: "center", textAlign: "center" }}>
          <ol style={{ ...p, textAlign: "left", paddingLeft: "1.2rem", margin: 0, display: "grid", gap: 4 }}>
            <li>Open your authenticator app and tap <strong>+</strong> (add account).</li>
            <li>Scan this code. On this phone? Use the setup key instead.</li>
            <li>Type the 6-digit code it shows for Lybry.</li>
          </ol>
          <span style={{ background: "#fff", padding: 10, borderRadius: 16, border: "2px solid var(--edge)", lineHeight: 0 }}>
            {/* Supabase returns the QR as an SVG data URL. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={enroll.qr} alt="QR code to add Lybry to your authenticator app" width={176} height={176} />
          </span>
          <button type="button" onClick={() => setShowKey((v) => !v)} style={{ background: "transparent", border: "none", color: "var(--gold)", fontFamily: "var(--sans)", fontWeight: 800, cursor: "pointer" }}>
            {showKey ? "Hide setup key" : "Can't scan? Show the setup key"}
          </button>
          {showKey ? (
            <code style={{ fontSize: "0.95rem", letterSpacing: "0.12em", padding: "0.5rem 0.7rem", borderRadius: 10, background: "var(--charcoal)", border: "1px solid var(--border)", wordBreak: "break-all", userSelect: "all" }}>{enroll.secret}</code>
          ) : null}
          <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} aria-label="6-digit code" placeholder="123456" value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            style={{ width: 180, textAlign: "center", letterSpacing: "0.4em", fontSize: "1.3rem", fontWeight: 900, padding: "0.6rem", borderRadius: 14, border: "2px solid var(--edge)", background: "var(--charcoal)", color: "var(--ivory)", fontFamily: "var(--sans)" }} />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-gold" type="submit" disabled={busy}>{busy ? "Checking…" : "Turn on"}</button>
            <button className="btn btn-outline" type="button" onClick={async () => { await createClient().auth.mfa.unenroll({ factorId: enroll.id }); setEnroll(null); refresh(); }}>Cancel</button>
          </div>
        </form>
      )}
      {msg ? <p role={msg.ok ? "status" : "alert"} style={{ ...p, fontWeight: 800, color: msg.ok ? "var(--success)" : "var(--danger)" }}>{msg.text}</p> : null}
    </div>
  );
}
