"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError) {
      setError("Sign-in failed. Check your staff credentials and try again.");
      setBusy(false);
      return;
    }
    // /admin independently validates the authenticated identity and role on the server.
    window.location.assign("/admin");
  }

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "1.25rem", background: "radial-gradient(ellipse at 50% 0%, rgba(255,87,34,.12), transparent 48%), var(--charcoal)" }}>
      <section style={{ width: "100%", maxWidth: 430, padding: "clamp(1.5rem,5vw,2.4rem)", borderRadius: 22, border: "1px solid var(--border)", background: "color-mix(in srgb, var(--stone) 92%, transparent)", boxShadow: "0 28px 90px rgba(0,0,0,.35)" }}>
        <a href="/" aria-label="Back to Lybry" style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: ".82rem", textDecoration: "none" }}>← Lybry</a>
        <div style={{ marginTop: "2rem", marginBottom: "1.5rem" }}>
          <div style={{ color: "var(--gold)", fontFamily: "var(--sans)", fontSize: ".7rem", letterSpacing: ".2em", fontWeight: 700, textTransform: "uppercase" }}>Private workspace</div>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "2rem", margin: ".55rem 0" }}>Staff sign in</h1>
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: ".9rem", lineHeight: 1.6, margin: 0 }}>Use your authorized staff account to access Lybry administration. Reader accounts do not receive staff access.</p>
        </div>
        <form onSubmit={submit}>
          <label htmlFor="admin-email" style={{ display: "block", fontFamily: "var(--sans)", fontSize: ".82rem", marginBottom: ".4rem" }}>Staff email</label>
          <input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ boxSizing: "border-box", width: "100%", padding: ".85rem .95rem", borderRadius: 11, border: "1px solid var(--border)", background: "var(--charcoal)", color: "var(--ivory)", font: "inherit" }} />
          <label htmlFor="admin-password" style={{ display: "block", fontFamily: "var(--sans)", fontSize: ".82rem", margin: "1rem 0 .4rem" }}>Password</label>
          <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ boxSizing: "border-box", width: "100%", padding: ".85rem .95rem", borderRadius: 11, border: "1px solid var(--border)", background: "var(--charcoal)", color: "var(--ivory)", font: "inherit" }} />
          {error ? <p role="alert" style={{ color: "var(--danger)", fontFamily: "var(--sans)", fontSize: ".85rem", margin: ".8rem 0 0" }}>{error}</p> : null}
          <button type="submit" disabled={busy} className="btn btn-gold" style={{ width: "100%", justifyContent: "center", marginTop: "1.3rem", minHeight: 46 }}>{busy ? "Signing in…" : "Enter staff workspace →"}</button>
        </form>
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: ".76rem", lineHeight: 1.55, margin: "1rem 0 0" }}>Access is checked again on the server. Knowing this URL does not grant administrative privileges.</p>
      </section>
    </main>
  );
}
