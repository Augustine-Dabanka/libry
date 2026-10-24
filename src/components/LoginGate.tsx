"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BookOpen, Check, Dices, Eye, EyeOff, Lock, Mail, QrCode, Sparkles, User } from "lucide-react";
import { armWelcomeSplash } from "@/components/AppSplash";
import { createClient } from "@/lib/supabase/client";
import { persistOnboardingPrefs } from "@/app/actions/auth";
import GoogleButton from "@/components/GoogleButton";
import DiscordButton from "@/components/DiscordButton";

import Glyph from "@/components/Glyph";
import SignupFlow, { type SignupStep } from "@/components/SignupFlow";
import LoginKoala from "@/components/LoginKoala";
import { play } from "@/lib/sound";
type Tab = "login" | "signup";
type View = "LOGIN" | "REGISTER" | "FORGOT" | "QR" | "MFA";

const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };

// Cycled while a submit is in flight — the "morph into a loading screen" state.
const LOADING_LINES = ["Opening the library…", "Syncing your shelves…", "Dusting off the spines…", "Warming the reading lamp…"];

// Pools for the "Surprise me" identity generator.
const FIRST = ["Aria", "Kai", "Luna", "Milo", "Nova", "Ezra", "Iris", "Theo", "Wren", "Sage", "Juno", "Rumi", "Cleo", "Arlo", "Faye", "Onyx", "Lyra", "Idris", "Nadia", "Colm", "Mara", "Soren", "Elowen", "Dara", "Priya", "Rory", "Yara", "Bram", "Isolde", "Kael"];
const LAST = ["Ashford", "Vale", "Marsh", "Bennett", "Cole", "Hart", "Lang", "Reyes", "Doyle", "Okoro", "Nair", "Serrano", "Blackwood", "Frost", "Rivers", "Quill", "Sterling", "Hollis", "Mercer", "Wilder", "Bright", "Cross", "Fenn", "Larkspur", "Thorn", "Ellison", "Hale", "Rooke"];
const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)]!;

const field: React.CSSProperties = {
  width: "100%",
  padding: "0.72rem 0.95rem 0.72rem 2.55rem",
  background: "var(--charcoal)",
  border: "2px solid var(--edge)",
  borderRadius: 14,
  color: "var(--ivory)",
  fontFamily: "var(--sans)",
  fontSize: "0.96rem",
  outline: "none",
};
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  color: "var(--muted)",
  fontFamily: "var(--sans)",
  marginTop: "0.85rem",
  marginBottom: "0.35rem",
};
const badField: React.CSSProperties = { borderColor: "var(--danger)", boxShadow: "0 0 0 3px color-mix(in srgb, var(--danger) 14%, transparent)" };
const iconWrap: React.CSSProperties = { position: "absolute", zIndex: 1, left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "grid", placeItems: "center", pointerEvents: "none" };
const eyeBtn: React.CSSProperties = { position: "absolute", zIndex: 1, right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)", padding: 6, display: "grid", placeItems: "center", lineHeight: 0 };

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
  return { score: 4, label: "Strong", color: "var(--gold)" };
}

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

  const [view, setView] = useState<View>(initialTab === "signup" ? "REGISTER" : "LOGIN");
  const [accountType, setAccountType] = useState<"reader" | "writer">("reader");
  const [bio, setBio] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState(""); // login: email or username
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [fpEmail, setFpEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [msg, setMsg] = useState<string | null>(serverError ? "Sign-in failed. Please try again." : null);
  const [info, setInfo] = useState<string | null>(null);
  const [genBusy, setGenBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [signupStep, setSignupStep] = useState<SignupStep>("details");
  const [loginBad, setLoginBad] = useState(0);
  const [focusField, setFocusField] = useState<"id" | "pw" | null>(null);
  const [mfaFactor, setMfaFactor] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  const dest = next && /^[a-z0-9_\-./?=&%]+$/i.test(next) && !/^https?:|^\/\//i.test(next) ? next : "/home";

  useEffect(() => {
    try {
      setRemember(localStorage.getItem("libry-remember") !== "0");
    } catch {}
  }, []);

  // Sent here by the app because this session still needs its 6-digit code
  // (e.g. after signing in with Google on an account with two-step on).
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mfa") === "1") needsSecondStep();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cycle the loading copy while a submit is in flight.
  useEffect(() => {
    if (!busy) return;
    setStatusIdx(0);
    const t = setInterval(() => setStatusIdx((i) => (i + 1) % LOADING_LINES.length), 1500);
    return () => clearInterval(t);
  }, [busy]);

  // Flash a success checkmark, then navigate.
  // Bring up the glass welcome right here, then move to the app underneath it.
  async function finish(to: string) {
    setDone(true);
    play("success");
    let who: { name?: string | null; dob?: string | null; look?: unknown } | undefined;
    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const [p, pv] = await Promise.all([
          sb.from("profiles").select("full_name, username, avatar").eq("id", user.id).maybeSingle(),
          sb.from("profile_private").select("date_of_birth").eq("user_id", user.id).maybeSingle(),
        ]);
        const pd = p.data as { full_name?: string; username?: string; avatar?: unknown } | null;
        who = { name: pd?.full_name || pd?.username || null, dob: (pv.data as { date_of_birth?: string } | null)?.date_of_birth ?? null, look: pd?.avatar ?? null };
      }
    } catch { /* the welcome still works without a name */ }
    armWelcomeSplash(who);
    setTimeout(() => window.location.assign(to), 380);
  }

  // Two-step sign-in: if this account has an authenticator app, ask for its code.
  async function needsSecondStep(): Promise<boolean> {
    const supabase = createClient();
    try {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!data || data.nextLevel !== "aal2" || data.currentLevel === "aal2") return false;
      const f = await supabase.auth.mfa.listFactors();
      const totp = f.data?.totp?.find((x) => x.status === "verified");
      if (!totp) return false;
      setMfaFactor(totp.id);
      setMfaCode("");
      setBusy(false);
      setView("MFA");
      return true;
    } catch {
      return false;
    }
  }
  async function submitMfa(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const code = mfaCode.replace(/\D/g, "");
    if (code.length !== 6 || !mfaFactor) { setMsg("Enter the 6-digit code from your authenticator app."); setLoginBad((n) => n + 1); return; }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: mfaFactor, code });
    if (error) {
      setBusy(false);
      setLoginBad((n) => n + 1);
      play("error");
      setMsg("That code didn't work. Codes change every 30 seconds, so try the newest one.");
      return;
    }
    await persistOnboardingPrefs();
    finish(dest);
  }

  // Find a username that isn't taken (case-insensitive).
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

  async function generateIdentity() {
    setGenBusy(true);
    setMsg(null);
    const first = pick(FIRST);
    const last = pick(LAST);
    setFullName(`${first} ${last}`);
    setUsername(await ensureFreeUsername(first + last));
    setGenBusy(false);
  }

  async function regenerateUsername() {
    setGenBusy(true);
    setMsg(null);
    const supabase = createClient();
    let uname = "";
    for (let i = 0; i < 8; i++) {
      const base = `${pick(FIRST)}${pick(LAST)}`.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 18) || "reader";
      const cand = (i < 3 ? base : `${base.slice(0, 15)}${Math.floor(10 + Math.random() * 990)}`).slice(0, 20);
      const { data, error } = await supabase.from("profiles").select("id").ilike("username", cand).maybeSingle();
      if (error || !data) { uname = cand; break; }
    }
    if (!uname) uname = `${pick(FIRST)}${Date.now().toString().slice(-4)}`.toLowerCase();
    setUsername(uname);
    setGenBusy(false);
  }

  // On opening REGISTER with empty fields, pre-fill a valid identity.
  // (Sign-up no longer pre-fills a random name: SignupFlow suggests a
  // username from the name the reader types.)

  function switchView(v: View) {
    setView(v);
    setMsg(null);
    setInfo(null);
    setLoginBad(0);
    setSignupStep("details");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setInfo(null);
    try {
      localStorage.setItem("libry-remember", remember ? "1" : "0");
    } catch {}
    const supabase = createClient();

    if (view === "REGISTER") {
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

      const alreadyExists =
        (!error && Array.isArray(data.user?.identities) && data.user!.identities!.length === 0) ||
        (!!error && /already|exists|registered/i.test(error.message));

      if (error && !alreadyExists) {
        setBusy(false);
        setMsg(error.message);
        return;
      }

      if (alreadyExists) {
        const si = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (!si.error && si.data.session) {
          await persistOnboardingPrefs();
          finish(dest);
          return;
        }
        setBusy(false);
        setIdentifier(email.trim());
        setView("LOGIN");
        setInfo("That email already has an account — enter its password to sign in, or use a different email.");
        return;
      }

      let userId = data.user?.id ?? null;
      if (!data.session) {
        const si = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (si.error || !si.data.session) {
          setBusy(false);
          setIdentifier(email.trim());
          setView("LOGIN");
          setInfo("Almost there — check your email to confirm your account, then sign in.");
          return;
        }
        userId = si.data.user.id;
      }
      if (!userId) {
        setBusy(false);
        setView("LOGIN");
        setInfo("Account created — please sign in.");
        return;
      }

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
      finish(accountType === "writer" ? "/creator" : dest);
      return;
    }

    // LOGIN
    if (!identifier.trim() || !password) {
      setMsg("Enter your email and password.");
      setLoginBad((n) => n + 1);
      return;
    }
    setBusy(true);
    try {
      // Email only: looking a username up in the browser would hand out
      // other people's emails (fixed in 0048).
      const loginEmail = identifier.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(loginEmail)) {
        setBusy(false);
        setMsg("Sign in with the email address on your account.");
        setLoginBad((n) => n + 1);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (error) {
        setBusy(false);
        setLoginBad((n) => n + 1);
        play("error");
        setMsg(
          /invalid login credentials/i.test(error.message)
            ? "Incorrect details — or you haven’t confirmed your email yet."
            : error.message
        );
        return;
      }
      if (await needsSecondStep()) return;
      await persistOnboardingPrefs();
      finish(dest);
    } catch (err) {
      setBusy(false);
      setMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setInfo(null);
    if (!fpEmail.trim() || !/.+@.+\..+/.test(fpEmail.trim())) {
      setMsg("Enter the email on your account.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(fpEmail.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
      });
      setBusy(false);
      if (error) setMsg(error.message);
      else setInfo("If that email has an account, a reset link is on its way. Check your inbox.");
    } catch {
      setBusy(false);
      setMsg("Couldn't send the reset link. Please try again.");
    }
  }

  const pwStrength = strengthOf(password);
  // A deterministic decorative QR pattern for the (rolling-out) device sign-in.
  const qrCells = useMemo(() => Array.from({ length: 121 }, (_, i) => ((i * 1103515245 + 12345) >> 4) % 3 === 0), []);

  const segShown = view === "LOGIN" || view === "REGISTER";
  const providersShown = (view === "LOGIN" || (view === "REGISTER" && signupStep === "details")) && !busy;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
        background: "radial-gradient(900px 620px at 12% 8%, color-mix(in srgb, var(--gold) 18%, transparent), transparent 62%), radial-gradient(760px 560px at 92% 88%, rgba(91, 67, 126, 0.18), transparent 62%), var(--charcoal)",
      }}
    >
      {/* cinematic ambient lighting and floating motes */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {[
          { top: "18%", left: "14%", s: 26, r: -12 },
          { top: "68%", left: "22%", s: 18, r: 20 },
          { top: "30%", left: "82%", s: 22, r: 8 },
          { top: "74%", left: "76%", s: 16, r: -18 },
        ].map((m, i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -14, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: "absolute", top: m.top, left: m.left, width: m.s, height: m.s, borderRadius: 5, background: "color-mix(in srgb, var(--gold) 16%, transparent)", transform: `rotate(${m.r}deg)`, filter: "blur(0.5px)" }}
          />
        ))}
      </div>

      <motion.div
        layout
        transition={SPRING}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 440,
          background: "color-mix(in srgb, var(--stone) 76%, transparent)",
          border: "1px solid color-mix(in srgb, var(--ivory) 18%, transparent)",
          borderRadius: 28,
          padding: "2.3rem 2.1rem",
          boxShadow: "0 28px 90px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.10)",
          backdropFilter: "blur(26px) saturate(145%)",
          WebkitBackdropFilter: "blur(26px) saturate(145%)",
          overflow: "hidden",
        }}
      >
        {/* Back (to landing, or to login from a sub-view) */}
        {!busy ? (
          <button
            type="button"
            onClick={() => (view === "FORGOT" || view === "QR" ? switchView("LOGIN") : window.location.assign("/"))}
            style={{ position: "absolute", top: "1.1rem", left: "1.1rem", display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.82rem", background: "transparent", border: "none", cursor: "pointer" }}
            aria-label={view === "FORGOT" || view === "QR" ? "Back to sign in" : "Back to the Lybry home page"}
          >
            <ArrowLeft size={15} /> {view === "FORGOT" || view === "QR" ? "Back" : "Home"}
          </button>
        ) : null}

        {view === "LOGIN" || view === "MFA" || view === "FORGOT" ? (
          <div style={{ display: "grid", placeItems: "center", marginTop: "0.2rem" }}>
            <LoginKoala
              look={focusField === "id" ? Math.min(1, identifier.length / 18) * 2 - 1 : 0}
              cover={focusField === "pw" && !showPw}
              peek={focusField === "pw" && showPw}
              happy={done}
            />
          </div>
        ) : null}
        <motion.div layout="position" style={{ textAlign: "center", marginBottom: "1.2rem", marginTop: "0.4rem" }}>
          <span className="logo" style={{ fontSize: "2rem" }}>
            Lybry<span>.</span>
          </span>
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontWeight: 600, fontSize: "0.92rem", marginTop: "0.25rem" }}>
            {view === "LOGIN" ? "Welcome back. Your shelf is waiting." : view === "MFA" ? "One more step to keep your account safe." : "Stories worth lingering in"}
          </p>
        </motion.div>

        {/* Segmented control (login / signup) */}
        {segShown && !busy && (view === "LOGIN" || signupStep === "details") ? (
          <motion.div
            layout
            style={{ display: "flex", gap: "0.3rem", background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 999, padding: "0.25rem", marginBottom: "1.3rem" }}
          >
            {(["LOGIN", "REGISTER"] as View[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchView(t)}
                style={{ position: "relative", flex: 1, border: "none", borderRadius: 999, padding: "0.55rem", cursor: "pointer", fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.9rem", background: "transparent", color: view === t ? "#0f130f" : "var(--muted)", zIndex: 1 }}
              >
                {view === t ? (
                  <motion.span layoutId="seg-pill" transition={SPRING} style={{ position: "absolute", inset: 0, background: "var(--gold)", borderRadius: 999, zIndex: -1 }} />
                ) : null}
                {t === "LOGIN" ? "Sign in" : "Create account"}
              </button>
            ))}
          </motion.div>
        ) : null}

        {/* ── The morphing content region ── */}
        <AnimatePresence mode="wait" initial={false}>
          {(
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {view === "MFA" ? (
                <form onSubmit={submitMfa} style={{ textAlign: "center" }}>
                  <h2 style={{ margin: "0 0 0.3rem", fontSize: "1.3rem" }}>Two-step sign-in</h2>
                  <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", margin: "0 auto 1rem", maxWidth: 320, lineHeight: 1.5 }}>
                    Open your authenticator app (Google Authenticator, Authy, 1Password…) and enter the 6-digit code for Lybry.
                  </p>
                  <CodeBoxes value={mfaCode} onChange={(v) => { setMfaCode(v); if (loginBad) setLoginBad(0); }} bad={loginBad > 0} />
                  <button className="btn btn-gold" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: "1.1rem" }}>
                    {busy ? "Checking…" : "Verify and sign in"}
                  </button>
                  <button type="button" onClick={async () => { await createClient().auth.signOut(); switchView("LOGIN"); }} style={{ display: "block", margin: "1rem auto 0", background: "transparent", border: "none", color: "var(--gold)", fontFamily: "var(--sans)", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>
                    Use a different account
                  </button>
                  <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.78rem", margin: "0.8rem auto 0", maxWidth: 320, lineHeight: 1.5 }}>
                    Lost your phone? Email support from the address on your account and we&apos;ll help you back in after checking it&apos;s you.
                  </p>
                </form>
              ) : view === "FORGOT" ? (
                <form onSubmit={sendReset}>
                  <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", marginBottom: "0.4rem", textAlign: "center" }}>
                    Enter your account email and we&apos;ll send a link to reset your password.
                  </p>
                  <label style={labelStyle}>Email</label>
                  <div style={{ position: "relative" }}>
                    <span style={iconWrap}><Mail size={17} /></span>
                    <input className="auth-input" style={field} type="email" placeholder="you@example.com" autoComplete="email" value={fpEmail} onChange={(e) => setFpEmail(e.target.value)} />
                  </div>
                  <button className="btn btn-gold" type="submit" style={{ width: "100%", justifyContent: "center", marginTop: "1.1rem" }}>
                    Send reset link
                  </button>
                  <button type="button" onClick={() => switchView("LOGIN")} style={{ display: "block", margin: "1rem auto 0", background: "transparent", border: "none", color: "var(--gold)", fontFamily: "var(--sans)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                    ← Back to sign in
                  </button>
                </form>
              ) : view === "QR" ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(11, 1fr)", gap: 2, width: 170, height: 170, margin: "0.3rem auto 1rem", padding: 12, background: "#E9E6EE", borderRadius: 16 }} aria-hidden="true">
                    {qrCells.map((on, i) => (
                      <span key={i} style={{ background: on ? "#221C18" : "transparent", borderRadius: 1 }} />
                    ))}
                  </div>
                  <p style={{ color: "var(--ivory)", fontFamily: "var(--sans)", fontWeight: 600, fontSize: "0.95rem", margin: "0 0 0.3rem" }}>Sign in from your phone</p>
                  <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem", margin: "0 auto", maxWidth: 300, lineHeight: 1.55 }}>
                    Point-and-scan device sign-in is rolling out with the Lybry mobile app. For now, continue with email or a provider below.
                  </p>
                  <button type="button" onClick={() => switchView("LOGIN")} style={{ display: "block", margin: "1.1rem auto 0", background: "transparent", border: "none", color: "var(--gold)", fontFamily: "var(--sans)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                    ← Back to sign in
                  </button>
                </div>
              ) : (
                view === "REGISTER" ? (
                  <SignupFlow
                    dest={dest}
                    referrer={referrer}
                    onStep={setSignupStep}
                    onFinish={(to) => finish(to)}
                    onUseLogin={(em, note) => { switchView("LOGIN"); if (em) setIdentifier(em); if (note) setInfo(note); }}
                  />
                ) : (
                <form onSubmit={submit}>
                  {(
                    <>
                      <label style={{ ...labelStyle, marginTop: 0 }}>Email</label>
                      <div style={{ position: "relative" }}>
                        <span style={iconWrap}><Mail size={17} /></span>
                        <input key={`id-${loginBad}`} className={`auth-input${loginBad ? " su-shake" : ""}`} style={{ ...field, ...(loginBad ? badField : null) }} placeholder="you@example.com" type="email" inputMode="email" autoComplete="username email" aria-invalid={loginBad > 0} onFocus={() => setFocusField("id")} onBlur={() => setFocusField(null)} value={identifier} onChange={(e) => { setIdentifier(e.target.value); if (loginBad) setLoginBad(0); }} />
                      </div>
                      <label style={labelStyle}>Password</label>
                      <div style={{ position: "relative" }}>
                        <span style={iconWrap}><Lock size={17} /></span>
                        <input key={`pw-${loginBad}`} className={`auth-input${loginBad ? " su-shake" : ""}`} style={{ ...field, paddingRight: 44, ...(loginBad ? badField : null) }} type={showPw ? "text" : "password"} placeholder="Your password" autoComplete="current-password" aria-invalid={loginBad > 0} onFocus={() => setFocusField("pw")} onBlur={() => setFocusField(null)} value={password} onChange={(e) => { setPassword(e.target.value); if (loginBad) setLoginBad(0); }} />
                        <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"} style={eyeBtn}>{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.75rem" }}>
                        <label style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem", cursor: "pointer" }}>
                          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ accentColor: "var(--gold)", width: 15, height: 15 }} />
                          Remember me
                        </label>
                        <button type="button" onClick={() => switchView("FORGOT")} style={{ background: "transparent", border: "none", color: "var(--gold)", fontFamily: "var(--sans)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", padding: 0 }}>
                          Forgot password?
                        </button>
                      </div>
                    </>
                  )}

                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.1rem" }}>
                    <button className="btn btn-gold" type="submit" disabled={busy} style={{ flex: 1, justifyContent: "center", gap: "0.5rem" }}>
                      {busy ? <><span className="btn-spin" aria-hidden="true" />{done ? "Welcome!" : "Signing in…"}</> : "Sign in"}
                    </button>

                  </div>
                </form>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {msg ? <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ color: "var(--terracotta)", textAlign: "center", marginTop: "0.9rem", fontSize: "0.88rem" }}>{msg}</motion.p> : null}
          {info ? <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ color: "var(--success)", textAlign: "center", marginTop: "0.9rem", fontSize: "0.88rem" }}>{info}</motion.p> : null}
        </AnimatePresence>

        {/* Providers — Google · Discord · QR */}
        {providersShown ? (
          <motion.div layout>
            <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", margin: "1.2rem 0" }}>
              <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.8rem" }}>or continue with</span>
              <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <GoogleButton next={next || "/home"} role={view === "REGISTER" ? accountType : undefined} className="btn btn-outline" style={{ width: "100%" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <DiscordButton next={next || "/home"} role={view === "REGISTER" ? accountType : undefined} />
              </div>
            </div>
          </motion.div>
        ) : null}

        {!busy ? (
          <p style={{ color: "var(--muted)", textAlign: "center", fontFamily: "var(--sans)", fontSize: "0.76rem", marginTop: "1.3rem" }}>
            By continuing you agree to our <a href="/terms" style={{ color: "inherit", textDecoration: "underline" }}>Terms of Service</a> and <a href="/privacy" style={{ color: "inherit", textDecoration: "underline" }}>Privacy Policy</a>.
          </p>
        ) : null}
      </motion.div>
    </main>
  );
}

// Six boxes for a one-time code. One real input underneath (so paste,
// autofill from SMS/OTP apps and screen readers all work), boxes drawn on top.
function CodeBoxes({ value, onChange, bad }: { value: string; onChange: (v: string) => void; bad?: boolean }) {
  const digits = value.replace(/\D/g, "").slice(0, 6);
  return (
    <label className={bad ? "su-shake" : undefined} style={{ position: "relative", display: "flex", gap: 8, justifyContent: "center", cursor: "text" }}>
      <input
        autoFocus
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="6-digit code"
        maxLength={6}
        value={digits}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", fontSize: 16 }}
      />
      {Array.from({ length: 6 }, (_, i) => {
        const here = i === Math.min(digits.length, 5);
        return (
          <span key={i} aria-hidden="true" style={{ width: 44, height: 54, borderRadius: 12, display: "grid", placeItems: "center", fontFamily: "var(--sans)", fontWeight: 900, fontSize: "1.4rem", color: "var(--ivory)", background: "var(--charcoal)",
            border: `2px solid ${bad ? "var(--danger)" : here ? "var(--gold)" : digits[i] ? "var(--success)" : "var(--edge)"}`, boxShadow: digits[i] ? "0 3px 0 var(--edge)" : "none", transition: "border-color .15s" }}>
            {digits[i] ?? ""}
          </span>
        );
      })}
    </label>
  );
}
