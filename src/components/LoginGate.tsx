"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { persistOnboardingPrefs } from "@/app/actions/auth";
import GoogleButton from "@/components/GoogleButton";

type Tab = "login" | "signup";

const field: React.CSSProperties = {
  width: "100%",
  padding: "0.8rem 1rem",
  background: "var(--charcoal)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--ivory)",
  fontFamily: "var(--sans)",
  fontSize: "0.98rem",
  outline: "none",
  marginTop: "0.7rem",
};

export default function LoginGate({
  initialTab,
  next,
  serverError,
}: {
  initialTab: Tab;
  next?: string;
  serverError?: boolean;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(serverError ? "Sign-in failed. Please try again." : null);
  const [info, setInfo] = useState<string | null>(null);

  const dest = next && /^[a-z0-9_\-./?=&%]+$/i.test(next) && !/^https?:|^\/\//i.test(next) ? next : "/home";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setInfo(null);
    if (!email || !password) {
      setMsg("Enter your email and password.");
      return;
    }
    setBusy(true);
    const supabase = createClient();

    if (tab === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setBusy(false);
        setMsg(error.message);
        return;
      }
      if (!data.session) {
        // Email confirmation is enabled on the project.
        setBusy(false);
        setInfo("Check your email to confirm your account, then log in.");
        setTab("login");
        return;
      }
      await persistOnboardingPrefs();
      window.location.assign(dest);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
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
    tab === "login"
      ? "Sign in to pick up where you left off."
      : "Create an account and start reading free.";

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--stone)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "2.4rem 2rem",
          boxShadow: "var(--shadow)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.3rem" }}>
          <span className="logo" style={{ fontSize: "2rem" }}>
            Libry<span>.</span>
          </span>
        </div>

        {/* tabs */}
        <div
          style={{
            display: "flex",
            gap: "0.3rem",
            background: "var(--charcoal)",
            border: "1px solid var(--border)",
            borderRadius: 999,
            padding: "0.25rem",
            marginBottom: "1.5rem",
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
                transition: "background 0.18s ease, color 0.18s ease",
              }}
            >
              {t === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        <h1 style={{ fontSize: "1.55rem", textAlign: "center", marginBottom: "0.35rem" }}>{head}</h1>
        <p style={{ color: "var(--muted)", textAlign: "center", fontFamily: "var(--sans)", marginBottom: "1.4rem" }}>
          {sub}
        </p>

        <form onSubmit={submit}>
          <input
            style={{ ...field, marginTop: 0 }}
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            style={field}
            type="password"
            placeholder="Password"
            autoComplete={tab === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="btn btn-gold lb-press"
            type="submit"
            disabled={busy}
            style={{ width: "100%", justifyContent: "center", marginTop: "1.1rem" }}
          >
            {busy ? "…" : tab === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        {msg ? (
          <p style={{ color: "var(--terracotta)", textAlign: "center", marginTop: "0.9rem", fontSize: "0.88rem" }}>{msg}</p>
        ) : null}
        {info ? (
          <p style={{ color: "#7DBE86", textAlign: "center", marginTop: "0.9rem", fontSize: "0.88rem" }}>{info}</p>
        ) : null}

        {/* divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", margin: "1.3rem 0" }}>
          <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.8rem" }}>or</span>
          <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <GoogleButton next={next} />
      </div>
    </main>
  );
}
