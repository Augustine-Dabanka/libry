"use client";

import { useState, useTransition } from "react";
import { setShowMature, type MatureResult } from "@/app/actions/settings";

// Turning mature (18+) content ON asks the reader to confirm it's them and, the
// first time, their date of birth. Turning it OFF is one tap. The real checks
// happen on the server and in the database (see actions/settings.ts, 0045).
export default function MatureToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  const [ask, setAsk] = useState<null | { password: boolean; birth: boolean; recent: boolean }>(null);
  const [password, setPassword] = useState("");
  const [birth, setBirth] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function handle(r: MatureResult) {
    if (r.ok) {
      setOn(true);
      setAsk(null);
      setPassword("");
      setBirth("");
      setMsg({ ok: true, text: "Mature content is on." });
      return;
    }
    if (r.needsPassword || r.needsBirth || r.needsRecentSignIn) {
      setAsk((a: { password: boolean; birth: boolean; recent: boolean } | null) => ({
        password: !!r.needsPassword || !!a?.password,
        birth: !!r.needsBirth || !!a?.birth,
        recent: !!r.needsRecentSignIn,
      }));
    }
    setMsg(r.error ? { ok: false, text: r.error } : null);
  }

  function toggle() {
    setMsg(null);
    if (on) {
      start(async () => {
        const r = await setShowMature(false);
        if (r.ok) setOn(false);
        else setMsg({ ok: false, text: r.error || "Couldn't save that." });
      });
      return;
    }
    start(async () => handle(await setShowMature(true)));
  }

  function confirm(e: React.FormEvent) {
    e.preventDefault();
    start(async () => handle(await setShowMature(true, { password: password || undefined, birth: birth || undefined })));
  }

  const field: React.CSSProperties = {
    width: "100%", padding: "0.65rem 0.8rem", borderRadius: 12, border: "2px solid var(--edge)",
    background: "var(--charcoal)", color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.95rem",
  };

  return (
    <div style={{ display: "grid", gap: "0.7rem", justifyItems: "end" }}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Show mature (18+) content"
        onClick={toggle}
        disabled={pending}
        style={{
          width: 52, height: 30, borderRadius: 999, border: "none", cursor: "pointer",
          background: on ? "var(--gold)" : "var(--stone-light)", position: "relative",
          transition: "background 0.2s ease", flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute", top: 3, left: on ? 25 : 3, width: 24, height: 24, borderRadius: "50%",
            background: on ? "var(--on-gold)" : "var(--ivory)",
            transition: "left 0.2s cubic-bezier(0.68,-0.55,0.265,1.55)",
          }}
        />
      </button>

      {ask && !on ? (
        <form onSubmit={confirm} style={{ width: "min(100%, 340px)", display: "grid", gap: "0.6rem", padding: "0.9rem", border: "2px solid var(--border)", borderRadius: 14, background: "var(--stone)", textAlign: "left" }}>
          {ask.recent ? (
            <p style={{ margin: 0, fontFamily: "var(--sans)", fontSize: "0.88rem", color: "var(--ivory-muted)" }}>
              For your safety, please <a href="/login?next=%2Fsettings" style={{ color: "var(--gold)", fontWeight: 700 }}>sign in again</a>, then turn this on within 15 minutes.
            </p>
          ) : null}
          {ask.password ? (
            <label style={{ display: "grid", gap: "0.3rem", fontFamily: "var(--sans)", fontSize: "0.85rem", fontWeight: 700 }}>
              Your password
              <input type="password" autoComplete="current-password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} style={field} required />
            </label>
          ) : null}
          {ask.birth ? (
            <label style={{ display: "grid", gap: "0.3rem", fontFamily: "var(--sans)", fontSize: "0.85rem", fontWeight: 700 }}>
              Date of birth
              <input type="date" value={birth} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBirth(e.target.value)} style={field} required />
              <span style={{ fontWeight: 500, color: "var(--muted)", fontSize: "0.78rem" }}>Only used to check you&apos;re 18 or over. We don&apos;t keep the date.</span>
            </label>
          ) : null}
          {ask.password || ask.birth ? (
            <button type="submit" className="btn btn-gold" disabled={pending}>{pending ? "Checking…" : "Confirm"}</button>
          ) : null}
        </form>
      ) : null}

      {msg ? (
        <p role="status" style={{ margin: 0, fontFamily: "var(--sans)", fontSize: "0.85rem", color: msg.ok ? "var(--success)" : "var(--danger)" }}>{msg.text}</p>
      ) : null}
    </div>
  );
}
