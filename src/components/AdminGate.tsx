"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/app/actions/admin";

// The passcode wall. Renders in place of the admin content until the correct
// code is entered; verification and the session cookie are handled server-side.
export default function AdminGate() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await adminLogin(code);
    setBusy(false);
    if (res?.error) { setErr(res.error); setCode(""); return; }
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "1.5rem", background: "var(--charcoal)" }}>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 360, background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 18, padding: "2rem 1.8rem", textAlign: "center" }}>
        <div style={{ fontSize: "1.8rem", marginBottom: "0.4rem" }}>🔒</div>
        <h1 style={{ fontSize: "1.3rem", marginBottom: "0.3rem" }}>Staff access</h1>
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.86rem", marginBottom: "1.3rem" }}>
          Enter the company passcode to continue.
        </p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Passcode"
          aria-label="Passcode"
          style={{ width: "100%", boxSizing: "border-box", textAlign: "center", letterSpacing: "0.3em", fontSize: "1.1rem", background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--ivory)", fontFamily: "var(--sans)", padding: "0.7rem 0.9rem", outline: "none" }}
        />
        {err ? <p style={{ color: "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.84rem", marginTop: "0.8rem" }}>{err}</p> : null}
        <button type="submit" className="btn btn-gold" disabled={busy || !code} style={{ width: "100%", marginTop: "1.1rem", justifyContent: "center" }}>
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}
