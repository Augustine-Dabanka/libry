"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { persistOnboardingPrefs } from "@/app/actions/auth";
import GoogleButton from "@/components/GoogleButton";
import DiscordButton from "@/components/DiscordButton";

type Tab = "login" | "signup";

const field: React.CSSProperties = {
  width: "100%",
  padding: "0.72rem 0.95rem",
  background: "#E9E6EE",
  border: "1px solid rgba(43,38,34,0.10)",
  borderRadius: 12,
  color: "#2B2622",
  fontFamily: "var(--sans)",
  fontSize: "0.96rem",
  outline: "none",
  marginTop: "0.35rem",
};
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  color: "var(--muted)",
  fontFamily: "var(--sans)",
  marginTop: "0.85rem",
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
  const [accountType, setAccountType] = useState<"reader" | "writer">("reader");
  const [bio, setBio] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState(""); // login: email or username
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
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
      const profilePatch: Record<string, unknown> = { full_name: fullName.trim(), username: username.trim() };
      if (accountType === "writer") {
        profilePatch.is_creator = true;
        profilePatch.pen_name = fullName.trim();
        if (bio.trim()) profilePatch.bio = bio.trim();
      }
      let up = await supabase.from("profiles").update(profilePatch).eq("id", data.user!.id);
      if (up.error && /is_creator|pen_name|bio/i.test(up.error.message)) {
        up = await supabase.from("profiles").update({ full_name: fullName.trim(), username: username.trim() }).eq("id", data.user!.id);
      }
      if (referrer) {
        try {
          await supabase.rpc("record_referral", { referrer });
        } catch {
          /* referral function not migrated yet — ignore */
        }
      }
      await persistOnboardingPrefs();
      window.location.assign(accountType === "writer" ? "/creator" : dest);
      return;
    }

    // login
    if (!identifier.trim() || !password) {
      setMsg("Enter your username or email and password.");
      return;
    }
    setBusy(true);
    try {
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
        setMsg(
          /invalid login credentials/i.test(error.message)
            ? "Incorrect details — or you haven’t confirmed your email yet."
            : error.message
        );
        return;
      }
      await persistOnboardingPrefs();
      window.location.assign(dest);
    } catch (err) {
      setBusy(false);
      setMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  const pwType = showPw ? "text" : "password";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 22% 18%, rgba(196,163,90,0.22), transparent 42%)," +
          "radial-gradient(circle at 80% 84%, rgba(180,83,9,0.16), transparent 46%)," +
          "#1C1917",
      }}
    >
      {/* ambient floating motes */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {[
          { top: "18%", left: "14%", s: 26, r: -12 },
          { top: "68%", left: "22%", s: 18, r: 20 },
          { top: "30%", left: "82%", s: 22, r: 8 },
          { top: "74%", left: "76%", s: 16, r: -18 },
        ].map((m, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              top: m.top,
              left: m.left,
              width: m.s,
              height: m.s,
              borderRadius: 5,
              background: "rgba(196,163,90,0.14)",
              transform: `rotate(${m.r}deg)`,
              filter: "blur(0.5px)",
            }}
          />
        ))}
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 430,
          background: "#221C18",
          border: "1px solid rgba(250,247,242,0.08)",
          borderRadius: 22,
          padding: "2.3rem 2.1rem",
          boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.3rem" }}>
          <span className="logo" style={{ fontSize: "2rem" }}>
            Libry<span>.</span>
          </span>
          <p style={{ color: "var(--muted)", fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "0.92rem", marginTop: "0.25rem" }}>
            Stories worth lingering in
          </p>
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
              {t === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form onSubmit={submit}>
          {tab === "signup" ? (
            <>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.2rem" }}>
                {(["reader", "writer"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setAccountType(r)}
                    style={{
                      flex: 1, borderRadius: 12, padding: "0.6rem", cursor: "pointer",
                      fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.85rem",
                      border: `1px solid ${accountType === r ? "var(--gold)" : "var(--border)"}`,
                      background: accountType === r ? "rgba(197,160,89,0.12)" : "transparent",
                      color: accountType === r ? "var(--ivory)" : "var(--muted)",
                    }}
                  >
                    {r === "reader" ? "📖 I'm a reader" : "✍️ I'm a writer"}
                  </button>
                ))}
              </div>
              <label style={{ ...labelStyle, marginTop: "0.6rem" }}>Full name</label>
              <input className="auth-input" style={field} placeholder="Ada Lovelace" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <label style={labelStyle}>Username</label>
              <input className="auth-input" style={field} placeholder="ada" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <label style={labelStyle}>Email</label>
              <input className="auth-input" style={field} type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <label style={labelStyle}>Password</label>
              <input className="auth-input" style={field} type={pwType} placeholder="Create a password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <label style={labelStyle}>Confirm password</label>
              <input className="auth-input" style={field} type={pwType} placeholder="Repeat it" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              {accountType === "writer" ? (
                <>
                  <label style={labelStyle}>Short author bio <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional — readers see this)</span></label>
                  <textarea className="auth-input" style={{ ...field, minHeight: 70, resize: "vertical" }} maxLength={600} placeholder="A couple of sentences about you and your stories…" value={bio} onChange={(e) => setBio(e.target.value)} />
                </>
              ) : null}
            </>
          ) : (
            <>
              <label style={{ ...labelStyle, marginTop: 0 }}>Username or email</label>
              <input className="auth-input" style={field} placeholder="ada  ·  you@example.com" autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
              <label style={labelStyle}>Password</label>
              <input className="auth-input" style={field} type={pwType} placeholder="Your password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </>
          )}

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.9rem",
              color: "var(--muted)",
              fontFamily: "var(--sans)",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} style={{ accentColor: "var(--gold)", width: 15, height: 15 }} />
            Show password
          </label>

          <button className="btn btn-gold" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: "1.1rem" }}>
            {busy ? "…" : tab === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        {msg ? <p style={{ color: "var(--terracotta)", textAlign: "center", marginTop: "0.9rem", fontSize: "0.88rem" }}>{msg}</p> : null}
        {info ? <p style={{ color: "#7DBE86", textAlign: "center", marginTop: "0.9rem", fontSize: "0.88rem" }}>{info}</p> : null}

        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", margin: "1.2rem 0" }}>
          <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.8rem" }}>or</span>
          <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <GoogleButton
              next={next || "/home"}
              className="btn"
              style={{
                background: "#E9E6EE",
                color: "#2B2622",
                border: "1px solid rgba(43,38,34,0.10)",
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <DiscordButton next={next || "/home"} />
          </div>
        </div>

        <p style={{ color: "var(--muted)", textAlign: "center", fontFamily: "var(--sans)", fontSize: "0.76rem", marginTop: "1.3rem" }}>
          By continuing you agree to explore beautiful stories.
        </p>
      </div>
    </main>
  );
}
