"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { persistOnboardingPrefs } from "@/app/actions/auth";
import GoogleButton from "@/components/GoogleButton";

type Tab = "login" | "signup";

const field: React.CSSProperties = {
  width: "100%",
  padding: "0.78rem 1rem",
  background: "var(--charcoal)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--ivory)",
  fontFamily: "var(--sans)",
  fontSize: "0.98rem",
  outline: "none",
  marginTop: "0.6rem",
};

export default function LoginGate({
  initialTab,
  next,
  serverError,
  referrer,
}: {
  initialTab: Tab;
  next?: string;
  serverError?: boolean;
  referrer?: string;
}) {
  // Remember the referral so it survives the Google OAuth round-trip too.
  useEffect(() => {
    if (referrer) {
      try {
        document.cookie = `libry_ref=${encodeURIComponent(referrer)}; path=/; max-age=1800; samesite=lax`;
      } catch {}
    }
  }, [referrer]);

  const [tab, setTab] = useState<Tab>(initialTab);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState(""); // login: email or username
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(serverError ? "Sign-in failed. Please try again." : null);
  const [info, setInfo] = useState<string | null>(null);

  const dest = next && /^[a-z0-9_\-./?=&%]+$/i.test(next) && !/^https?:|^\/\//i.test(next) ? next : "/home";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setInfo(null);
    const supabase = createClient();

    if (tab === "signup") {
      if (!fullName.trim() || !username.trim() || !email.trim() || !password) {
        setMsg("Please fill in every field.");
        return;
      }
      if (!/^[a-z0-9_]{3,20}$/i.test(username.trim())) {
        setMsg("Username must be 3–20 letters, numbers, or underscores.");
        return;
      }
      if (password !== confirm) {
        setMsg("Passwords don't match.");
        return;
      }
      setBusy(true);
      // Username taken?
      const taken = await supabase.from("profiles").select("id").eq("username", username.trim()).maybeSingle();
      if (taken.data) {
        setBusy(false);
        setMsg("That username is taken — try another.");
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim(), username: username.trim() } },
      });
      if (error) {
        setBusy(false);
        setMsg(error.message);
        return;
      }
      if (!data.session) {
        setBusy(false);
        setInfo("Check your email to confirm your account, then log in.");
        setTab("login");
        return;
      }
      // Ensure the profile carries the chosen name/username (trigger also does this).
      await supabase.from("profiles").update({ full_name: fullName.trim(), username: username.trim() }).eq("id", data.user!.id);
      if (referrer) {
        try {
          await supabase.rpc("record_referral", { referrer });
        } catch {
          /* referral function not migrated yet — ignore */
        }
      }
      await persistOnboardingPrefs();
      window.location.assign(dest);
      return;
    }

    // login
    if (!identifier.trim() || !password) {
      setMsg("Enter your username or email and password.");
      return;
    }
    setBusy(true);
    const lookup = await supabase.rpc("login_email", { identifier: identifier.trim() });
    const loginEmail = (lookup.data as string | null) || (identifier.includes("@") ? identifier.trim() : null);
    if (!loginEmail) {
      setBusy(false);
      setMsg("No account found for that username.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
    if (error) {
      setBusy(false);
      setMsg(error.message);
      return;
    }
    await persistOnboardingPrefs();
    window.location.assign(dest);
  }

  const head = tab === "login" ? "Welcome back." : "Join Libry.";
  const sub =
    tab === "login" ? "Sign in to pick up where you left off." : "Create an account and start reading free.";

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          background: "var(--stone)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "2.2rem 2rem",
          boxShadow: "var(--shadow)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.2rem" }}>
          <span className="logo" style={{ fontSize: "2rem" }}>
            Libry<span>.</span>
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.3rem",
            background: "var(--charcoal)",
            border: "1px solid var(--border)",
            borderRadius: 999,
            padding: "0.25rem",
            marginBottom: "1.4rem",
          }}
        >
          {(["login", "signup"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setMsg(null);
                setInfo(null);
              }}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 999,
                padding: "0.55rem",
                cursor: "pointer",
                fontFamily: "var(--sans)",
                fontWeight: 700,
                fontSize: "0.9rem",
                background: tab === t ? "var(--gold)" : "transparent",
                color: tab === t ? "#20180a" : "var(--muted)",
              }}
            >
              {t === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        <h1 style={{ fontSize: "1.5rem", textAlign: "center", marginBottom: "0.3rem" }}>{head}</h1>
        <p style={{ color: "var(--muted)", textAlign: "center", fontFamily: "var(--sans)", marginBottom: "1.2rem" }}>{sub}</p>

        <form onSubmit={submit}>
          {tab === "signup" ? (
            <>
              <input style={{ ...field, marginTop: 0 }} placeholder="Full name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <input style={field} placeholder="Username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <input style={field} type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input style={field} type="password" placeholder="Password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <input style={field} type="password" placeholder="Confirm password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </>
          ) : (
            <>
              <input style={{ ...field, marginTop: 0 }} placeholder="Username or email" autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
              <input style={field} type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </>
          )}

          <button className="btn btn-gold lb-press" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: "1.1rem" }}>
            {busy ? "…" : tab === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        {msg ? <p style={{ color: "var(--terracotta)", textAlign: "center", marginTop: "0.9rem", fontSize: "0.88rem" }}>{msg}</p> : null}
        {info ? <p style={{ color: "#7DBE86", textAlign: "center", marginTop: "0.9rem", fontSize: "0.88rem" }}>{info}</p> : null}

        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", margin: "1.2rem 0" }}>
          <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.8rem" }}>or</span>
          <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <GoogleButton next={next} />
      </div>
    </main>
  );
}
