"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { persistOnboardingPrefs } from "@/app/actions/auth";
import KoalaBuilder from "@/components/KoalaBuilder";
import { DEFAULT_LOOK } from "@/components/KoalaAvatar";
import type { KoalaLook } from "@/components/Mascot";
import TwoStepSetup from "@/components/TwoStepSetup";
import SignupComplete from "@/components/SignupComplete";
import { FontStylePicker, LayoutPicker } from "@/components/StylePrefs";
import { play } from "@/lib/sound";

// Sign-up as a short journey: New user ✓ → Details → Security → Customise → Complete.
// (If the project makes people confirm their email, a "check your inbox"
// screen sits inside Details.) Security and Customise can both be skipped;
// everything in them is also in Settings.
// "Account" is ticked from the start (they chose to join), so the bar opens at
// 20%: real progress, shown, to pull them through the rest. Fields check
// themselves as you type (green = good, red = fix this) and shake if you press
// Next with a mistake. Date of birth is checked here AND in the database (0046).

export type SignupStep = "details" | "verify" | "security" | "customise" | "done";
const STEPS = [
  { key: "account", label: "New user" },
  { key: "details", label: "Details" },
  { key: "security", label: "Security" },
  { key: "customise", label: "Customize" },
  { key: "done", label: "Complete" },
] as const;
const ORDER: Record<string, number> = { account: 0, details: 1, verify: 1, security: 2, customise: 3, done: 4 };
const PRONOUNS = ["Prefer not to say", "She/her", "He/him", "They/them", "She/they", "He/they", "Custom"];
const MIN_AGE = 13;

type Status = "idle" | "ok" | "bad";
type Field = "fullName" | "username" | "dob" | "email" | "password" | "pronouns" | "terms";

function isoDaysAgo(years: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}
function ageOn(dob: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return null;
  const b = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(b.getTime())) return null;
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a;
}
function pwScore(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

export default function SignupFlow({
  dest,
  referrer,
  initialName,
  initialUsername,
  onStep,
  onFinish,
  onUseLogin,
  initialStep = "details",
}: {
  initialStep?: SignupStep;
  dest: string;
  referrer?: string;
  initialName?: string;
  initialUsername?: string;
  onStep?: (s: SignupStep) => void;
  onFinish: (to: string) => void;
  onUseLogin: (email: string, info: string) => void;
}) {
  const [step, setStep] = useState<SignupStep>(initialStep);
  const [accountType, setAccountType] = useState<"reader" | "writer">("reader");
  const [fullName, setFullName] = useState(initialName || "");
  const [username, setUsername] = useState(initialUsername || "");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pronounChoice, setPronounChoice] = useState("Prefer not to say");
  const [pronounCustom, setPronounCustom] = useState("");
  const [bio, setBio] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [shakeOn, setShakeOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [userTaken, setUserTaken] = useState<null | boolean>(null);
  const [userEdited, setUserEdited] = useState(false);
  const [look, setLook] = useState<Required<KoalaLook>>(DEFAULT_LOOK);
  const [stamped, setStamped] = useState<string | null>(null);
  const firstBad = useRef<HTMLElement | null>(null);

  useEffect(() => { if (initialName && !fullName) setFullName(initialName); }, [initialName]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (initialUsername && !username) setUsername(initialUsername); }, [initialUsername]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { onStep?.(step); setStamped(step); const t = setTimeout(() => setStamped(null), 700); return () => clearTimeout(t); }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live username availability (debounced).
  useEffect(() => {
    const u = username.trim();
    setUserTaken(null);
    if (!/^[a-z0-9_]{3,20}$/i.test(u)) return;
    const t = setTimeout(async () => {
      const { data, error } = await createClient().from("profiles").select("id").ilike("username", u).maybeSingle();
      if (!error) setUserTaken(!!data);
    }, 450);
    return () => clearTimeout(t);
  }, [username]);

  const pronouns = pronounChoice === "Custom" ? pronounCustom.trim() : pronounChoice;
  const age = ageOn(dob);

  const checks = useMemo(() => {
    const r: Record<Field, { s: Status; note?: string }> = {
      fullName: fullName.trim().length >= 2 ? { s: "ok" } : { s: "bad", note: "Enter your name." },
      username: !/^[a-z0-9_]{3,20}$/i.test(username.trim())
        ? { s: "bad", note: "3–20 letters, numbers or _." }
        : userTaken === true ? { s: "bad", note: "That username is taken." }
        : userTaken === false ? { s: "ok", note: "Available" } : { s: "idle" },
      dob: age === null ? { s: "bad", note: "Enter your date of birth." }
        : age > 120 || age < 0 ? { s: "bad", note: "That date doesn't look right." }
        : age < MIN_AGE ? { s: "bad", note: `You need to be at least ${MIN_AGE} to join Lybry.` } : { s: "ok" },
      email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) ? { s: "ok" } : { s: "bad", note: "Enter a valid email, like you@example.com." },
      password: password.length < 8 ? { s: "bad", note: "At least 8 characters." } : pwScore(password) < 2 ? { s: "bad", note: "Add numbers, symbols or capitals." } : { s: "ok" },
      pronouns: pronounChoice === "Custom" && (!pronounCustom.trim() || pronounCustom.trim().length > 24) ? { s: "bad", note: "Up to 24 characters." } : { s: "ok" },
      terms: agreed ? { s: "ok" } : { s: "bad", note: "Tick this to create your account." },
    };
    return r;
  }, [fullName, username, userTaken, age, email, password, pronounChoice, pronounCustom, agreed]);

  const show = (f: Field): Status => (touched[f] ? checks[f].s : checks[f].s === "ok" && f !== "terms" && f !== "pronouns" ? "ok" : "idle");
  const touch = (f: Field) => setTouched((t) => ({ ...t, [f]: true }));
  const filledCount = (["fullName", "username", "dob", "email", "password", "terms"] as Field[]).filter((f) => checks[f].s === "ok").length;

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const all: Field[] = ["fullName", "username", "dob", "email", "password", "pronouns", "terms"];
    setTouched(Object.fromEntries(all.map((f) => [f, true])));
    const bad = all.filter((f) => checks[f].s === "bad");
    const supabase = createClient();
    const uname = username.trim().toLowerCase();
    let taken = userTaken;
    if (!bad.includes("username") && taken === null) {
      const { data, error } = await supabase.from("profiles").select("id").ilike("username", uname).maybeSingle();
      taken = !error && !!data;
      setUserTaken(taken);
      if (taken) bad.unshift("username");
    }
    if (bad.length) {
      play("error");
      setShakeOn(false);
      requestAnimationFrame(() => setShakeOn(true));
      setTimeout(() => setShakeOn(false), 420);
      setTimeout(() => (document.getElementById(`su-${bad[0]}`) as HTMLElement | null)?.focus(), 380);
      return;
    }
    setBusy(true);
    const meta: Record<string, string> = { full_name: fullName.trim(), username: uname, date_of_birth: dob };
    if (pronouns && pronouns !== "Prefer not to say") meta.pronouns = pronouns;
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: meta } });

    const exists = (!error && Array.isArray(data.user?.identities) && data.user!.identities!.length === 0) || (!!error && /already|exists|registered/i.test(error.message));
    if (exists) {
      setBusy(false);
      onUseLogin(email.trim(), "That email already has an account. Enter its password to sign in.");
      return;
    }
    if (error) {
      setBusy(false);
      setMsg(/database error/i.test(error.message) ? "We couldn't create the account. Check your date of birth and try again." : error.message);
      return;
    }
    let userId = data.user?.id ?? null;
    if (!data.session) {
      const si = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (si.error || !si.data.session) {
        setBusy(false);
        setStep("verify");
        return;
      }
      userId = si.data.user.id;
    }
    await afterSignedIn(userId);
  }

  async function afterSignedIn(userId: string | null) {
    const supabase = createClient();
    if (userId) {
      const patch: Record<string, unknown> = { full_name: fullName.trim(), username: username.trim().toLowerCase() };
      if (pronouns && pronouns !== "Prefer not to say") patch.pronouns = pronouns;
      if (accountType === "writer") { patch.is_creator = true; patch.pen_name = fullName.trim(); if (bio.trim()) patch.bio = bio.trim(); }
      if (marketing) patch.marketing_opt_in = true;
      const up = await supabase.from("profiles").update(patch).eq("id", userId);
      if (up.error) await supabase.from("profiles").update({ full_name: fullName.trim(), username: username.trim().toLowerCase() }).eq("id", userId);
      if (referrer) { try { await supabase.rpc("record_referral", { referrer }); } catch { /* not migrated */ } }
      await persistOnboardingPrefs();
    }
    setBusy(false);
    play("success");
    setStep("security");
  }

  async function confirmedContinue() {
    setBusy(true);
    setMsg(null);
    const si = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (si.error || !si.data.session) {
      setBusy(false);
      setMsg("Not confirmed yet. Tap the link in the email first, then try again.");
      return;
    }
    await afterSignedIn(si.data.user.id);
  }
  async function resend() {
    setMsg(null);
    const { error } = await createClient().auth.resend({ type: "signup", email: email.trim() });
    setMsg(error ? error.message : "Sent again. Check your inbox and spam folder.");
  }

  async function saveKoala(skip: boolean) {
    if (!skip) {
      setBusy(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from("profiles").update({ avatar: look }).eq("id", user.id);
      setBusy(false);
    }
    setStep("done");
  }

  const cur = ORDER[step];
  const pct = Math.round(((cur + (step === "done" ? 1 : 0)) / STEPS.length) * 100) || 20;

  const fieldStyle = (s: Status): React.CSSProperties => ({
    width: "100%", padding: "0.72rem 0.95rem", background: "var(--charcoal)", color: "var(--ivory)",
    border: `2px solid ${s === "ok" ? "var(--success)" : s === "bad" ? "var(--danger)" : "var(--edge)"}`,
    borderRadius: 14, fontFamily: "var(--sans)", fontSize: "0.96rem", outline: "none",
    boxShadow: s === "ok" ? "0 0 0 3px color-mix(in srgb, var(--success) 14%, transparent)" : s === "bad" ? "0 0 0 3px color-mix(in srgb, var(--danger) 14%, transparent)" : "none",
    transition: "border-color .15s, box-shadow .15s",
  });
  const label: React.CSSProperties = { display: "block", fontFamily: "var(--sans)", fontWeight: 800, fontSize: "0.85rem", color: "var(--ivory)", margin: "0.85rem 0 0.35rem" };
  const note = (f: Field) => {
    const s = show(f);
    const n = checks[f].note;
    if (s === "idle" || !n) return null;
    return <span id={`su-${f}-note`} role={s === "bad" ? "alert" : undefined} style={{ display: "block", marginTop: "0.3rem", fontFamily: "var(--sans)", fontSize: "0.78rem", fontWeight: 700, color: s === "ok" ? "var(--success)" : "var(--danger)" }}>{s === "ok" ? "✓ " : ""}{n}</span>;
  };
  const wrap = (f: Field, child: React.ReactNode) => (
    <div className={show(f) === "bad" && shakeOn ? "su-shake" : undefined}>{child}{note(f)}</div>
  );

  return (
    <div>


      {/* Stepper */}
      <ol aria-label={`Sign-up progress, ${pct}% done`} style={{ listStyle: "none", margin: "0 0 0.4rem", padding: 0, display: "grid", gridTemplateColumns: `repeat(${STEPS.length}, minmax(0, 1fr))`, position: "relative" }}>
        <span aria-hidden="true" style={{ position: "absolute", left: "10%", right: "10%", top: 15, height: 4, borderRadius: 4, background: "var(--border)" }} />
        <span aria-hidden="true" style={{ position: "absolute", left: "10%", top: 15, height: 4, borderRadius: 4, background: "var(--gold)", width: `${Math.min(80, (cur / (STEPS.length - 1)) * 80)}%`, transition: "width .5s cubic-bezier(.22,1,.36,1)" }} />
        {STEPS.map((s, i) => {
          const doneStep = i < cur || step === "done";
          const here = i === cur && step !== "done";
          const isFlag = s.key === "done";
          return (
            <li key={s.key} aria-current={here ? "step" : undefined} style={{ display: "grid", justifyItems: "center", gap: 4, position: "relative", zIndex: 1 }}>
              <span className={(i === cur - 1 && stamped === step) || (isFlag && stamped === "done") ? "su-stamp" : undefined}
                style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", fontWeight: 900, fontSize: "0.85rem",
                  background: doneStep ? "var(--gold)" : "var(--stone)", color: doneStep ? "var(--on-gold)" : here ? "var(--gold)" : "var(--muted)",
                  border: `3px solid ${doneStep || here ? "var(--gold)" : "var(--edge)"}`, boxShadow: doneStep ? "0 3px 0 var(--gold-shade)" : "none" }}>
                {isFlag ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></svg>
                ) : doneStep ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                ) : i + 1}
              </span>
              <span style={{ fontFamily: "var(--sans)", fontSize: "0.68rem", fontWeight: 800, color: here ? "var(--gold)" : "var(--muted)", textAlign: "center" }}>{s.label}</span>
            </li>
          );
        })}
      </ol>
      <p style={{ textAlign: "center", fontFamily: "var(--sans)", fontWeight: 800, fontSize: "0.8rem", color: "var(--muted)", margin: "0 0 0.6rem" }}>
        {step === "details" ? (filledCount >= 4 ? "Nearly there. Just a couple more." : "You're already 20% done.") : step === "verify" ? "One tap in your inbox to go." : step === "security" ? "Optional, but smart." : step === "customise" ? "Last step. Make it yours." : "All done."}
      </p>

      {step === "details" ? (
        <form onSubmit={submitDetails} noValidate>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["reader", "writer"] as const).map((r) => (
              <button key={r} type="button" aria-pressed={accountType === r} onClick={() => setAccountType(r)}
                style={{ flex: 1, borderRadius: 12, padding: "0.6rem", cursor: "pointer", fontFamily: "var(--sans)", fontWeight: 800, fontSize: "0.88rem", border: `2px solid ${accountType === r ? "var(--gold)" : "var(--edge)"}`, background: accountType === r ? "var(--gold-tint)" : "transparent", color: accountType === r ? "var(--gold)" : "var(--muted)" }}>
                {r === "reader" ? "I'm a reader" : "I'm a writer"}
              </button>
            ))}
          </div>

          <label htmlFor="su-fullName" style={label}>Full name</label>
          {wrap("fullName", <input id="su-fullName" autoComplete="name" placeholder="Ama Mensah" value={fullName} onChange={(e) => {
            const v = e.target.value;
            setFullName(v);
            // Suggest a username from the name until they type their own.
            if (!userEdited) setUsername(v.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "").slice(0, 20));
          }} onBlur={() => touch("fullName")} aria-invalid={show("fullName") === "bad"} aria-describedby="su-fullName-note" style={fieldStyle(show("fullName"))} />)}

          <label htmlFor="su-username" style={label}>Username</label>
          {wrap("username", <input id="su-username" autoComplete="username" value={username} onChange={(e) => { setUsername(e.target.value); setUserEdited(true); touch("username"); }} aria-invalid={show("username") === "bad"} aria-describedby="su-username-note" style={fieldStyle(show("username"))} />)}

          <label htmlFor="su-dob" style={label}>Date of birth</label>
          {wrap("dob", <input id="su-dob" type="date" max={isoDaysAgo(MIN_AGE)} min="1900-01-01" value={dob} onChange={(e) => { setDob(e.target.value); touch("dob"); }} aria-invalid={show("dob") === "bad"} aria-describedby="su-dob-note" style={fieldStyle(show("dob"))} />)}
          <span style={{ display: "block", marginTop: "0.25rem", fontFamily: "var(--sans)", fontSize: "0.74rem", color: "var(--muted)" }}>Kept private. Used for age-rated books.</span>

          <label htmlFor="su-email" style={label}>Email</label>
          {wrap("email", <input id="su-email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => touch("email")} aria-invalid={show("email") === "bad"} aria-describedby="su-email-note" style={fieldStyle(show("email"))} />)}

          <label htmlFor="su-password" style={label}>Password</label>
          {wrap("password", (
            <div style={{ position: "relative" }}>
              <input id="su-password" type={showPw ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => touch("password")} aria-invalid={show("password") === "bad"} aria-describedby="su-password-note" style={{ ...fieldStyle(show("password")), paddingRight: 48 }} />
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 38, height: 38, border: "none", background: "transparent", color: "var(--muted)", cursor: "pointer", fontFamily: "var(--sans)", fontWeight: 800, fontSize: "0.75rem" }}>{showPw ? "Hide" : "Show"}</button>
            </div>
          ))}
          {password ? (
            <div aria-hidden="true" style={{ display: "flex", gap: 4, marginTop: 6 }}>
              {[1, 2, 3, 4].map((i) => <span key={i} style={{ flex: 1, height: 5, borderRadius: 9, background: i <= pwScore(password) ? (pwScore(password) >= 3 ? "var(--success)" : pwScore(password) === 2 ? "var(--gold-hi)" : "var(--danger)") : "var(--border)", transition: "background .2s" }} />)}
            </div>
          ) : null}

          <label htmlFor="su-pronouns" style={label}>Pronouns <span style={{ color: "var(--muted)", fontWeight: 600 }}>(optional, shown on your profile)</span></label>
          <select id="su-pronouns" value={pronounChoice} onChange={(e) => setPronounChoice(e.target.value)} style={fieldStyle("idle")}>
            {PRONOUNS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {pronounChoice === "Custom" ? (
            <div style={{ marginTop: "0.5rem" }}>{wrap("pronouns", <input id="su-pronounsCustom" aria-label="Your pronouns" maxLength={24} placeholder="e.g. xe/xem" value={pronounCustom} onChange={(e) => { setPronounCustom(e.target.value); touch("pronouns"); }} style={fieldStyle(show("pronouns"))} />)}</div>
          ) : null}

          {accountType === "writer" ? (
            <>
              <label htmlFor="su-bio" style={label}>Short author bio <span style={{ color: "var(--muted)", fontWeight: 600 }}>(optional)</span></label>
              <textarea id="su-bio" maxLength={600} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A couple of sentences about you and your stories." style={{ ...fieldStyle("idle"), minHeight: 70, resize: "vertical" }} />
            </>
          ) : null}

          {wrap("terms", (
            <label style={{ display: "flex", gap: "0.55rem", alignItems: "flex-start", marginTop: "1rem", fontFamily: "var(--sans)", fontSize: "0.86rem", color: "var(--ivory-muted)", cursor: "pointer", lineHeight: 1.5 }}>
              <input id="su-terms" type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); touch("terms"); }} style={{ accentColor: "var(--gold)", width: 18, height: 18, marginTop: 2, flexShrink: 0 }} />
              <span>I agree to the <a href="/terms" target="_blank" rel="noreferrer" style={{ color: "var(--gold)", fontWeight: 700 }}>Terms</a> and <a href="/privacy" target="_blank" rel="noreferrer" style={{ color: "var(--gold)", fontWeight: 700 }}>Privacy Policy</a>.</span>
            </label>
          ))}
          <label style={{ display: "flex", gap: "0.55rem", alignItems: "flex-start", marginTop: "0.6rem", fontFamily: "var(--sans)", fontSize: "0.86rem", color: "var(--muted)", cursor: "pointer", lineHeight: 1.5 }}>
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} style={{ accentColor: "var(--gold)", width: 18, height: 18, marginTop: 2, flexShrink: 0 }} />
            <span>Email me new books and offers now and then.</span>
          </label>

          {msg ? <p role="alert" style={{ color: "var(--danger)", fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.88rem", margin: "0.9rem 0 0" }}>{msg}</p> : null}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginTop: "1.2rem" }}>
            <button className="btn btn-gold" type="submit" disabled={busy}>{busy ? "Creating…" : "Next step"}</button>
            <a className="btn btn-outline" href="/discover">Continue as guest</a>
          </div>
        </form>
      ) : step === "verify" ? (
        <div style={{ textAlign: "center", display: "grid", gap: "0.8rem", padding: "0.6rem 0" }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ margin: "0 auto" }}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
          <h2 style={{ margin: 0, fontSize: "1.4rem" }}>Check your inbox</h2>
          <p style={{ margin: 0, color: "var(--ivory-muted)", fontFamily: "var(--sans)", lineHeight: 1.55 }}>We sent a link to <strong>{email}</strong>. Tap it, then come back here.</p>
          {msg ? <p role="status" style={{ margin: 0, color: "var(--muted)", fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.86rem" }}>{msg}</p> : null}
          <button className="btn btn-gold" type="button" onClick={confirmedContinue} disabled={busy}>{busy ? "Checking…" : "I've confirmed, continue"}</button>
          <button type="button" onClick={resend} style={{ background: "transparent", border: "none", color: "var(--gold)", fontFamily: "var(--sans)", fontWeight: 800, cursor: "pointer" }}>Send the email again</button>
        </div>
      ) : step === "security" ? (
        <div style={{ display: "grid", gap: "0.9rem" }}>
          <h2 style={{ margin: 0, textAlign: "center", fontSize: "1.4rem" }}>Protect your account</h2>
          <p style={{ margin: 0, textAlign: "center", color: "var(--muted)", fontFamily: "var(--sans)", fontWeight: 600, lineHeight: 1.5 }}>
            Two-step sign-in asks for a code from an app on your phone, so a stolen password alone can&apos;t get in.
          </p>
          <div style={{ padding: "1rem", borderRadius: 18, border: "2px solid var(--border)", background: "var(--charcoal)" }}>
            <TwoStepSetup compact onDone={(on) => { if (on) setTimeout(() => setStep("customise"), 900); }} />
          </div>
          <p style={{ margin: 0, textAlign: "center", color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.82rem", fontWeight: 700 }}>
            Don&apos;t worry about skipping. You can turn this on any time in Settings → Security.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.6rem" }}>
            <button className="btn btn-outline" type="button" onClick={() => setStep("customise")}>Skip</button>
            <button className="btn btn-gold" type="button" onClick={() => setStep("customise")}>Next step</button>
          </div>
        </div>
      ) : step === "customise" ? (
        <div style={{ display: "grid", gap: "1rem" }}>
          <h2 style={{ margin: 0, textAlign: "center", fontSize: "1.4rem" }}>Make it yours</h2>
          <p style={{ margin: 0, textAlign: "center", color: "var(--muted)", fontFamily: "var(--sans)", fontWeight: 600 }}>Your bushbaby is your face on Lybry: profile, comments, shelf.</p>
          <KoalaBuilder value={look} onChange={setLook} />
          <div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Font style</h3>
            <FontStylePicker />
          </div>
          <div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>UI layout</h3>
            <LayoutPicker />
          </div>
          <p style={{ margin: 0, textAlign: "center", color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.82rem", fontWeight: 700 }}>
            Anything you skip can be changed in Settings.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.6rem" }}>
            <button className="btn btn-outline" type="button" onClick={() => saveKoala(true)}>Skip</button>
            <button className="btn btn-gold" type="button" onClick={() => saveKoala(false)} disabled={busy}>{busy ? "Saving…" : "Next step"}</button>
          </div>
        </div>
      ) : (
        <SignupComplete
          name={fullName}
          look={look}
          cta={accountType === "writer" ? "Let's go to my studio" : "Let's go"}
          onBack={() => setStep("customise")}
          onGo={() => onFinish(accountType === "writer" ? "/creator" : dest)}
        />
      )}

      {step === "details" ? (
        <p style={{ textAlign: "center", fontFamily: "var(--sans)", fontSize: "0.88rem", color: "var(--muted)", margin: "1rem 0 0" }}>
          Already have an account?{" "}
          <button type="button" onClick={() => onUseLogin("", "")} style={{ background: "transparent", border: "none", color: "var(--gold)", fontWeight: 800, cursor: "pointer", fontFamily: "var(--sans)", fontSize: "0.88rem", padding: 0 }}>Sign in</button>
        </p>
      ) : null}
    </div>
  );
}
