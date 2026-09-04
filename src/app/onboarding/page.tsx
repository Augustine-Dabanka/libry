"use client";

import { useMemo, useState } from "react";
import styles from "./onboarding.module.css";

type Option = { v: string; label: string; sub?: string; icon?: string };
type Question = {
  key: string;
  line: string;
  q: string;
  type?: "country";
  multi?: boolean;
  options?: Option[];
};

const QUESTIONS: Question[] = [
  {
    key: "draw",
    line: "First things first…",
    q: "What pulls you into a story?",
    options: [
      { v: "interactive", label: "Interactive adventures", sub: "Stories that let you choose" },
      { v: "literary", label: "Literary fiction", sub: "Beautiful, character-driven" },
      { v: "nonfiction", label: "Non-fiction & ideas", sub: "Learn something new" },
      { v: "variety", label: "A bit of everything", sub: "Surprise me" },
    ],
  },
  {
    key: "audience",
    line: "Good to know.",
    q: "Who are you reading for?",
    options: [
      { v: "self", label: "Myself" },
      { v: "child", label: "A child" },
      { v: "both", label: "Both of us" },
    ],
  },
  {
    key: "mood",
    line: "Setting the tone…",
    q: "Pick tonight’s mood",
    options: [
      { v: "cozy", label: "Cozy & warm" },
      { v: "thrilling", label: "Thrilling & mysterious" },
      { v: "thoughtful", label: "Thoughtful & quiet" },
      { v: "adventurous", label: "Bold & adventurous" },
    ],
  },
  {
    key: "genre",
    line: "Pick your worlds…",
    q: "What kind of stories do you want to read?",
    multi: true,
    options: [
      { v: "fantasy", label: "Fantasy", icon: "🐉" },
      { v: "scifi", label: "Sci-Fi", icon: "🚀" },
      { v: "romance", label: "Romance", icon: "💌" },
      { v: "thriller", label: "Thriller", icon: "🔪" },
    ],
  },
  {
    key: "pace",
    line: "Almost there.",
    q: "How do you like to read?",
    options: [
      { v: "short", label: "Short & sweet" },
      { v: "epic", label: "Epic & immersive" },
    ],
  },
  {
    key: "budget",
    line: "Almost done…",
    q: "And your reading budget?",
    options: [
      { v: "free", label: "Free reads", sub: "Show me what’s free first" },
      { v: "paid", label: "Happy to pay for a gem" },
      { v: "any", label: "Either’s fine" },
    ],
  },
  {
    key: "age",
    line: "A little about you…",
    q: "How old are you?",
    options: [
      { v: "Under 13", label: "Under 13" },
      { v: "13-17", label: "13–17" },
      { v: "18-24", label: "18–24" },
      { v: "25-34", label: "25–34" },
      { v: "35-49", label: "35–49" },
      { v: "50+", label: "50 or older" },
    ],
  },
  { key: "country", type: "country", line: "Last one, promise.", q: "Where are you reading from?" },
];

const COUNTRIES = [
  "Argentina","Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","China",
  "Colombia","Denmark","Egypt","Ethiopia","Finland","France","Germany","Ghana","Greece","India",
  "Indonesia","Iran","Iraq","Ireland","Israel","Italy","Japan","Kenya","Malaysia","Mexico","Morocco",
  "Nepal","Netherlands","New Zealand","Nigeria","Norway","Pakistan","Peru","Philippines","Poland",
  "Portugal","Qatar","Romania","Russia","Saudi Arabia","Singapore","South Africa","South Korea","Spain",
  "Sweden","Switzerland","Tanzania","Thailand","Turkey","Uganda","Ukraine","United Arab Emirates",
  "United Kingdom","United States","Vietnam","Zimbabwe","Other",
];

const CHEERS = ["Lovely choice.", "Ooh, good taste.", "Noted!", "That tells me a lot.", "Perfect."];

// Fixed confetti burst for the "shelf is ready" screen — warm brand colours.
const CONFETTI_COLORS = ["#C4A35A", "#B45309", "#97692F", "#E0B84C", "#8B8680", "#D2793B"];
const CONFETTI = Array.from({ length: 46 }, (_, i) => ({
  left: (i * 37) % 100,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  dur: 2.6 + ((i * 7) % 18) / 10,
  delay: ((i * 13) % 12) / 10,
}));

function Koala() {
  return (
    <svg className={styles.owl} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="60" cy="115" rx="30" ry="5" fill="rgba(28,25,23,0.10)" />
      <circle cx="28" cy="36" r="19" fill="#8B8680" />
      <circle cx="28" cy="36" r="10" fill="#D8B4BE" />
      <circle cx="92" cy="36" r="19" fill="#8B8680" />
      <circle cx="92" cy="36" r="10" fill="#D8B4BE" />
      <ellipse cx="60" cy="58" rx="37" ry="32" fill="#948F8A" />
      <ellipse cx="60" cy="60" rx="29" ry="25" fill="#ABA6A1" />
      <circle cx="46" cy="54" r="6" fill="#1C1917" />
      <circle cx="74" cy="54" r="6" fill="#1C1917" />
      <circle cx="44" cy="52" r="2" fill="#fff" />
      <circle cx="72" cy="52" r="2" fill="#fff" />
      <circle cx="35" cy="66" r="5" fill="rgba(216,180,190,0.55)" />
      <circle cx="85" cy="66" r="5" fill="rgba(216,180,190,0.55)" />
      <ellipse cx="60" cy="70" rx="12" ry="9" fill="#3A3632" />
      <ellipse cx="56" cy="67" rx="2.2" ry="2.8" fill="rgba(255,255,255,0.28)" />
      <path d="M51 83 q9 7 18 0" stroke="#3A3632" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <g transform="rotate(-5 60 104)">
        <rect x="43" y="92" width="34" height="27" rx="3" fill="#B45309" />
        <rect x="43" y="92" width="7" height="27" rx="3" fill="#8F3F07" />
        <rect x="55" y="99" width="17" height="2.6" rx="1.3" fill="rgba(250,247,242,0.9)" />
        <rect x="55" y="104" width="13" height="2.2" rx="1.1" fill="rgba(250,247,242,0.6)" />
        <circle cx="63" cy="112" r="3.2" fill="none" stroke="#C4A35A" strokeWidth="1.6" />
      </g>
      <ellipse cx="45" cy="111" rx="7" ry="6" fill="#8B8680" />
      <ellipse cx="79" cy="111" rx="7" ry="6" fill="#8B8680" />
    </svg>
  );
}

// Endowment step: presets the reader customises (and keeps) before signing up.
const THEMES = [
  { key: "obsidian", name: "Obsidian Neon", accent: "#7C83FF" },
  { key: "emerald", name: "Emerald Royale", accent: "#34D399" },
  { key: "gold", name: "Cyber Gold", accent: "#D4AF37" },
  { key: "amethyst", name: "Amethyst Glow", accent: "#C084FC" },
];
// Sensible recommended answers for the "recommended picks" fast path.
const DEFAULT_ANSWERS: Record<string, string> = {
  draw: "interactive",
  audience: "self",
  mood: "adventurous",
  genre: "scifi,fantasy",
  pace: "epic",
  budget: "any",
  age: "18-24",
  country: "United States",
};

export default function OnboardingPage() {
  const [idx, setIdx] = useState(-1); // -1 intro · 0..n-1 questions · n customise
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [cheer, setCheer] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [genreSel, setGenreSel] = useState<string[]>([]);
  const [theme, setTheme] = useState("obsidian"); // default effect: Obsidian Neon
  const [frame, setFrame] = useState("gold");

  function applyTheme(k: string) {
    setTheme(k);
    try {
      document.documentElement.setAttribute("data-brand", k);
    } catch {}
  }

  const total = QUESTIONS.length;
  const answered = Object.keys(answers).length;
  const pct = idx < 0 ? 0 : Math.round((answered / total) * 100);

  const filteredCountries = useMemo(() => {
    const s = search.trim().toLowerCase();
    return s ? COUNTRIES.filter((c) => c.toLowerCase().includes(s)) : COUNTRIES;
  }, [search]);

  function finish(next: Record<string, string>) {
    // Endowment: the reader keeps the theme + frame they customised. Apply the
    // theme now (so it's theirs immediately) and carry both into the profile.
    const prefs = { ...next, theme, avatar_frame: frame };
    try {
      localStorage.setItem("libry-brand", theme);
      document.documentElement.setAttribute("data-brand", theme);
      document.cookie = `libry_prefs=${encodeURIComponent(JSON.stringify(prefs))}; path=/; max-age=1800; samesite=lax`;
      document.cookie = `libry_seen_onboarding=1; path=/; max-age=31536000; samesite=lax`;
    } catch {
      /* cookies disabled — proceed anyway */
    }
    // Onboarding runs BEFORE signup: hand off to the gate's Sign up tab, then home.
    window.location.assign("/login?auth=signup&next=%2F");
  }

  // Default effect: fill sensible recommended answers and jump to the last step.
  function useRecommended() {
    setAnswers(DEFAULT_ANSWERS);
    setIdx(total);
  }

  function pick(key: string, value: string) {
    setPicked(value);
    setCheer(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
    const next = { ...answers, [key]: value };
    setAnswers(next);
    window.setTimeout(() => {
      setPicked(null);
      setSearch("");
      setCheer("");
      if (idx + 1 >= total) {
        setIdx(total); // done screen
      } else {
        setIdx(idx + 1);
      }
    }, 520);
  }

  function skip() {
    try {
      document.cookie = `libry_seen_onboarding=1; path=/; max-age=31536000; samesite=lax`;
    } catch {}
    window.location.assign("/login");
  }

  const q = idx >= 0 && idx < total ? QUESTIONS[idx] : null;

  function toggleGenre(v: string) {
    setGenreSel((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
  }
  function continueMulti() {
    if (!q || genreSel.length === 0) return;
    const next = { ...answers, [q.key]: genreSel.join(",") };
    setGenreSel([]);
    setPicked(null);
    setCheer("");
    setAnswers(next);
    if (idx + 1 >= total) setIdx(total);
    else setIdx(idx + 1);
  }

  return (
    <div className={styles.root}>
      <div className={styles.bg} />
      <div className={styles.header}>
        <div className={styles.progress}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <span className={styles.pctLabel}>{pct}% complete</span>
      </div>

      <div className={styles.stage}>
        {/* Intro */}
        {idx === -1 && (
          <div className={styles.screen} key="intro">
            <Koala />
            <h1 className={styles.introTitle}>
              Before you begin,
              <br />
              let’s make Libry
              <br />
              <span>yours</span>.
            </h1>
            <p className={styles.tag}>
              A few quick questions and we’ll set up a shelf that feels handpicked for you.
            </p>
            <button className={styles.btn} onClick={() => setIdx(0)}>
              Let’s go
            </button>
            <br />
            <button className={styles.skip} onClick={useRecommended} style={{ color: "var(--gold-dark)" }}>
              ★ Use recommended picks
            </button>
            <br />
            <button className={styles.skip} onClick={skip}>
              Skip for now
            </button>
          </div>
        )}

        {/* Genre multi-select (the tactile grid) */}
        {q && q.multi && (
          <div className={styles.screen} key={q.key}>
            <Koala />
            <div className={styles.mascotLine}>{q.line}</div>
            <div className={styles.count}>
              Question {idx + 1} of {total}
            </div>
            <h1 className={styles.q}>{q.q}</h1>
            <div className={styles.genreGrid}>
              {q.options!.map((o) => (
                <button
                  key={o.v}
                  type="button"
                  className={`${styles.genreCard} ${genreSel.includes(o.v) ? styles.selected : ""}`}
                  onClick={() => toggleGenre(o.v)}
                >
                  <span className={styles.genreIcon}>{o.icon}</span>
                  <span>{o.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Single-select questions */}
        {q && q.type !== "country" && !q.multi && (
          <div className={styles.screen} key={q.key}>
            <Koala />
            <div className={styles.mascotLine}>{cheer || q.line}</div>
            <div className={styles.count}>
              Question {idx + 1} of {total}
            </div>
            <h1 className={styles.q}>{q.q}</h1>
            <div className={styles.options}>
              {q.options!.map((o) => (
                <button
                  key={o.v}
                  className={`${styles.opt} ${picked === o.v ? styles.picked : ""}`}
                  onClick={() => pick(q.key, o.v)}
                >
                  <span>{o.label}</span>
                  {o.sub ? <span className={styles.sub}>{o.sub}</span> : null}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Country step */}
        {q && q.type === "country" && (
          <div className={styles.screen} key="country">
            <Koala />
            <div className={styles.mascotLine}>{cheer || q.line}</div>
            <div className={styles.count}>
              Question {idx + 1} of {total}
            </div>
            <h1 className={styles.q}>{q.q}</h1>
            <input
              className={styles.search}
              placeholder="Search countries…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              aria-label="Search countries"
            />
            <div className={styles.countryList}>
              {filteredCountries.map((c) => (
                <button
                  key={c}
                  className={styles.countryOpt}
                  onClick={() => pick("country", c)}
                >
                  <span aria-hidden="true">🌍</span> {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Customise & sign up (endowment) */}
        {idx >= total && (
          <div className={styles.screen} key="done">
            <div className={styles.confetti} aria-hidden="true">
              {CONFETTI.map((c, i) => (
                <span
                  key={i}
                  className={styles.confettiPiece}
                  style={{ left: `${c.left}%`, background: c.color, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }}
                />
              ))}
            </div>
            <h1 className={styles.doneTitle}>
              Your shelf is <span>ready</span>.
            </h1>
            <p className={styles.tag}>Make it yours — pick a look you love. It&apos;s already set up for you.</p>

            {/* Avatar frame preview */}
            <div style={{ display: "grid", placeItems: "center", marginBottom: "1.4rem" }}>
              <div style={{ width: 108, height: 108, borderRadius: "50%", display: "grid", placeItems: "center", padding: 5, background: `conic-gradient(var(--gold), ${THEMES.find((t) => t.key === frame)?.accent ?? "#C4A35A"}, var(--gold))` }}>
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "var(--bg-2, #EFE7D6)", display: "grid", placeItems: "center", overflow: "hidden" }}>
                  <div style={{ transform: "scale(0.82)" }}><Koala /></div>
                </div>
              </div>
            </div>

            {/* Frame swatches */}
            <div style={{ fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.5rem" }}>Avatar frame</div>
            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", marginBottom: "1.4rem", flexWrap: "wrap" }}>
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  aria-label={`${t.name} frame`}
                  onClick={() => setFrame(t.key)}
                  style={{ width: 34, height: 34, borderRadius: "50%", cursor: "pointer", background: t.accent, border: frame === t.key ? "3px solid var(--text)" : "3px solid transparent", outline: frame === t.key ? "1px solid var(--text)" : "none" }}
                />
              ))}
            </div>

            {/* Theme presets (default: Obsidian Neon) — applied live */}
            <div style={{ fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.5rem" }}>Theme</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", maxWidth: 380, margin: "0 auto 1.6rem" }}>
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => applyTheme(t.key)}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.7rem 0.9rem", borderRadius: 12, cursor: "pointer", fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.85rem", background: "var(--surface, #fff)", color: "var(--text)", border: theme === t.key ? `2px solid ${t.accent}` : "1.5px solid rgba(43,38,34,0.12)" }}
                >
                  <span style={{ width: 20, height: 20, borderRadius: 6, background: t.accent, flexShrink: 0 }} />
                  {t.name}
                </button>
              ))}
            </div>

            <button className={styles.btn} onClick={() => finish(answers)}>
              Save My Customized Profile &amp; Sign Up
            </button>
          </div>
        )}
      </div>

      {q && q.multi && (
        <div className={styles.continueBar}>
          <button
            className={styles.continueBtn}
            type="button"
            disabled={genreSel.length === 0}
            onClick={continueMulti}
          >
            {genreSel.length === 0 ? "Select at least one" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}
