"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { persistOnboardingPrefs } from "@/app/actions/auth";
import GoogleButton from "@/components/GoogleButton";
import DiscordButton from "@/components/DiscordButton";

type Tab = "login" | "signup";

// Pools for the "Surprise me" identity generator.
const FIRST = ["Aria", "Kai", "Luna", "Milo", "Nova", "Ezra", "Iris", "Theo", "Wren", "Sage", "Juno", "Rumi", "Cleo", "Arlo", "Faye", "Onyx", "Lyra", "Idris", "Nadia", "Colm", "Mara", "Soren", "Elowen", "Dara", "Priya", "Rory", "Yara", "Bram", "Isolde", "Kael"];
const LAST = ["Ashford", "Vale", "Marsh", "Bennett", "Cole", "Hart", "Lang", "Reyes", "Doyle", "Okoro", "Nair", "Serrano", "Blackwood", "Frost", "Rivers", "Quill", "Sterling", "Hollis", "Mercer", "Wilder", "Bright", "Cross", "Fenn", "Larkspur", "Thorn", "Ellison", "Hale", "Rooke"];
const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)]!;

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

// Eye / eye-off toggle shown inside the password field.
function Eye({ off }: { off: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      {off ? <line x1="3" y1="3" x2="21" y2="21" /> : null}
    </svg>
  );
}

// Password strength → a 4-segment red/amber/green meter. Weak..Strong.
function strengthOf(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "transparent" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const score = Math.max(1, Math.min(4, s));
  if (score <= 1) return { score: 1, label: "Weak", color: "#C4553F" };
  if (score === 2) return { score: 2, label: "Fair", color: "#D9A441" };
  if (score === 3) return { score: 3, label: "Good", color: "#B7A93C" };
  return { score: 4, label: "Strong", color: "#5FA068" };
}

const eyeBtn: React.CSSProperties = {
  position: "absolute",
  right: 8,
  top: "50%",
  transform: "translateY(-50%)",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "#8a8178",
  padding: 6,
  display: "grid",
  placeItems: "center",
  lineHeight: 0,
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
  const [genBusy, setGenBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const dest = next && /^[a-z0-9_\-./?=&%]+$/i.test(next) && !/^https?:|^\/\//i.test(next) ? next : "/home";

  // Find a username that isn't taken (case-insensitive). Tweaks with digits if
  // the base is taken; if the lookup can't run (e.g. RLS), returns a candidate
  // and lets the sign-up proceed.
  async function ensureFreeUsername(base: string): Promise<string> {
    const supabase = createClient();
    const clean = base.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20) || "reader";
    const candidates = [clean, ...Array.from({ length: 6 }, () => `${clean.slice(0, 15)}${Math.floor(100 + Math.random() * 9900)}`)];
    for (const c of candidates) {
      const { data, error } = await supabase.from("profiles").select("id").ilike("username", c).maybeSingle();
      if (error) return c;
      if (!data) return c;
    }
    return `${clean.slice(0, 14)}${Date.now().toString().slice(-5)}`;
  }

  // Fill the form with a random name + a guaranteed-free username (on open).
  async function generateIdentity() {
    setGenBusy(true);
    setMsg(null);
    const first = pick(FIRST);
    const last = pick(LAST);
    setFullName(`${first} ${last}`);
    setUsername(await ensureFreeUsername(first + last));
    setGenBusy(false);
  }

  // "New username" reroll — changes ONLY the username (leaves the name alone),
  // picking a fresh random handle each tap (a whole new name, not just digits).
  async function regenerateUsername() {
    setGenBusy(true);
    setMsg(null);
    const supabase = createClient();
    let uname = "";
    for (let i = 0; i < 8; i++) {
      const base = `${pick(FIRST)}${pick(LAST)}`.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 18) || "reader";
      // First few tries use the bare name; fall back to a numbered variant only if taken.
      const cand = (i < 3 ? base : `${base.slice(0, 15)}${Math.floor(10 + Math.random() * 990)}`).slice(0, 20);
      const { data, error } = await supabase.from("profiles").select("id").ilike("username", cand).maybeSingle();
      if (error || !data) { uname = cand; break; }
    }
    if (!uname) uname = `${pick(FIRST)}${Date.now().toString().slice(-4)}`.toLowerCase();
    setUsername(uname);
    setGenBusy(false);
  }

  // On opening the sign-up tab with empty fields, pre-fill a valid identity so
  // the "username taken" wall never blocks the first attempt.
  useEffect(() => {
    if (tab === "signup" && !fullName && !username) generateIdentity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

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
      if (!agreed) {
        setMsg("Please agree to the Terms and Privacy Policy to create your account.");
        return;
      }
      setBusy(true);
      // Guarantee a free, case-insensitive username — auto-tweak if the chosen
      // one is taken instead of dead-ending.
      const uname = await ensureFreeUsername(username.trim());
      if (uname !== username.trim().toLowerCase()) {
        setUsername(uname);
        setInfo(`“${username.trim()}” was taken, so we set your username to “${uname}”.`);
      }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim(), username: uname } },
      });

      // Supabase hides existing emails: no error, but a fake user with an empty
      // identities array and no session. Treat that (and any explicit "already
      // exists" error) as "this email already has an account".
      const alreadyExists =
        (!error && Array.isArray(data.user?.identities) && data.user!.identities!.length === 0) ||
        (!!error && /already|exists|registered/i.test(error.message));

      if (error && !alreadyExists) {
        setBusy(false);
        setMsg(error.message);
        return;
      }

      if (alreadyExists) {
        // Maybe it's their account and this password matches → sign them in.
        const si = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (!si.error && si.data.session) {
          await persistOnboardingPrefs();
          window.location.assign(dest);
          return;
        }
        setBusy(false);
        setIdentifier(email.trim());
        setTab("login");
        setInfo("That email already has an account — enter its password to sign in, or use a different email.");
        return;
      }

      // New account. Establish a session: signUp returns one when email
      // confirmation is off; if not, sign in now (also works when it's off).
      let userId = data.user?.id ?? null;
      if (!data.session) {
        const si = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (si.error || !si.data.session) {
          setBusy(false);
          setIdentifier(email.trim());
          setTab("login");
          setInfo("Almost there — check your email to confirm your account, then sign in.");
          return;
        }
        userId = si.data.user.id;
      }
      if (!userId) {
        setBusy(false);
        setTab("login");
        setInfo("Account created — please sign in.");
        return;
      }

      // Ensure the profile carries the chosen name/username (trigger also does this).
      const profilePatch: Record<string, unknown> = { full_name: fullName.trim(), username: uname };
      if (accountType === "writer") {
        profilePatch.is_creator = true;
        profilePatch.pen_name = fullName.trim();
        if (bio.trim()) profilePatch.bio = bio.trim();
      }
      if (marketing) profilePatch.marketing_opt_in = true;
      let up = await supabase.from("profiles").update(profilePatch).eq("id", userId);
      if (up.error && /is_creator|pen_name|bio|marketing_opt_in/i.test(up.error.message)) {
        up = await supabase.from("profiles").update({ full_name: fullName.trim(), username: uname }).eq("id", userId);
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

  const pwStrength = strengthOf(password);

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
        <a
          href="/"
          style={{
            position: "absolute",
            top: "1.1rem",
            left: "1.2rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            color: "var(--muted)",
            fontFamily: "var(--sans)",
            fontSize: "0.82rem",
            textDecoration: "none",
          }}
          aria-label="Back to the Libry home page"
        >
          ← Back
        </a>

        <div style={{ textAlign: "center", marginBottom: "1.3rem", marginTop: "0.4rem" }}>
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.85rem" }}>
                <label style={{ ...labelStyle, marginTop: 0 }}>Username</label>
                <button
                  type="button"
                  onClick={regenerateUsername}
                  disabled={genBusy}
                  title="Generate a new username"
                  style={{ background: "transparent", border: "none", color: "var(--gold)", fontFamily: "var(--sans)", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", padding: 0 }}
                >
                  {genBusy ? "…" : "🎲 New username"}
                </button>
              </div>
              <input className="auth-input" style={field} placeholder="ada" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <label style={labelStyle}>Email</label>
              <input className="auth-input" style={field} type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative", marginTop: "0.35rem" }}>
                <input className="auth-input" style={{ ...field, marginTop: 0, paddingRight: 44 }} type={showPw ? "text" : "password"} placeholder="Create a password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"} style={eyeBtn}><Eye off={showPw} /></button>
              </div>
              {password ? (
                <div style={{ marginTop: "0.5rem" }}>
                  <div style={{ display: "flex", gap: 4 }} aria-hidden="true">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} style={{ flex: 1, height: 5, borderRadius: 999, background: i <= pwStrength.score ? pwStrength.color : "rgba(250,247,242,0.14)", transition: "background 0.2s ease" }} />
                    ))}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: pwStrength.color, fontFamily: "var(--sans)", marginTop: "0.32rem", textAlign: "right" }}>
                    {pwStrength.label} password
                  </div>
                </div>
              ) : null}
              <label style={labelStyle}>Confirm password</label>
              <input className="auth-input" style={field} type="password" placeholder="Repeat it" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
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
              <div style={{ position: "relative", marginTop: "0.35rem" }}>
                <input className="auth-input" style={{ ...field, marginTop: 0, paddingRight: 44 }} type={showPw ? "text" : "password"} placeholder="Your password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"} style={eyeBtn}><Eye off={showPw} /></button>
              </div>
            </>
          )}

          {tab === "signup" ? (
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginTop: "0.8rem", color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem", cursor: "pointer", lineHeight: 1.5 }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ accentColor: "var(--gold)", width: 15, height: 15, marginTop: 2, flexShrink: 0 }} />
              <span>
                I agree to the{" "}
                <a href="/docs?tab=terms" target="_blank" rel="noreferrer" style={{ color: "var(--gold)" }}>Terms of Service</a>{" "}
                and{" "}
                <a href="/docs?tab=privacy" target="_blank" rel="noreferrer" style={{ color: "var(--gold)" }}>Privacy Policy</a>.
              </span>
            </label>
          ) : null}

          {tab === "signup" ? (
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginTop: "0.6rem", color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem", cursor: "pointer", lineHeight: 1.5 }}>
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} style={{ accentColor: "var(--gold)", width: 15, height: 15, marginTop: 2, flexShrink: 0 }} />
              <span>
                Email me occasional Libry updates and offers <span style={{ color: "var(--faint, var(--muted))" }}>(optional)</span> — opt in and get a{" "}
                <strong style={{ color: "var(--ivory)" }}>free month of Libry Unlimited</strong> when it launches.
              </span>
            </label>
          ) : null}

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
              role={tab === "signup" ? accountType : undefined}
              className="btn"
              style={{
                background: "#E9E6EE",
                color: "#2B2622",
                border: "1px solid rgba(43,38,34,0.10)",
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <DiscordButton next={next || "/home"} role={tab === "signup" ? accountType : undefined} />
          </div>
        </div>

        <p style={{ color: "var(--muted)", textAlign: "center", fontFamily: "var(--sans)", fontSize: "0.76rem", marginTop: "1.3rem" }}>
          By continuing you agree to explore beautiful stories.
        </p>
      </div>
    </main>
  );
}
