"use client";

import { useEffect, useRef, useState } from "react";
import Mascot from "@/components/Mascot";
import styles from "./onboarding.module.css";
import Glyph from "@/components/Glyph";
import { saveGuestPrefs } from "@/lib/guest";

// Three questions, then straight to books. Everything else we used to ask
// (age, country, budget, how you heard about us…) is either not used or can be
// asked later inside the app, one question at a time. Answers are kept on this
// device and copied to the account if the reader signs up later.

type Option = { v: string; label: string; sub?: string; icon?: string };
type Question = { key: "genre" | "format" | "goal"; line: string; q: string; multi?: boolean; options: Option[] };

// Genre values match books.category exactly, so they can drive /catalog?genre=…
const QUESTIONS: Question[] = [
  {
    key: "genre",
    line: "First things first…",
    q: "What do you love to read?",
    multi: true,
    options: [
      { v: "Romance", label: "Romance", icon: "💌" },
      { v: "Fantasy", label: "Fantasy", icon: "🐉" },
      { v: "Thriller", label: "Thriller", icon: "🔪" },
      { v: "Mystery", label: "Mystery", icon: "🔍" },
      { v: "Sci-Fi", label: "Sci-Fi", icon: "🚀" },
      { v: "Contemporary", label: "Real life", icon: "☕" },
      { v: "Horror", label: "Horror", icon: "👻" },
      { v: "Adventure", label: "Adventure", icon: "🎒" },
    ],
  },
  {
    key: "format",
    line: "Good taste.",
    q: "How do you like your stories?",
    options: [
      { v: "novels", label: "Chapter by chapter", sub: "Novels and serials" },
      { v: "interactive", label: "I choose what happens", sub: "Interactive stories" },
      { v: "comics", label: "With pictures", sub: "Comics" },
      { v: "variety", label: "A bit of everything" },
    ],
  },
  {
    key: "goal",
    line: "Last one.",
    q: "How long do you want to read each day?",
    options: [
      { v: "casual", label: "5 minutes", sub: "A page on the bus" },
      { v: "regular", label: "15 minutes", sub: "A chapter a day" },
      { v: "bookworm", label: "30 minutes", sub: "Lost in a book" },
    ],
  },
];

const CHEERS = ["Nice.", "Noted.", "Good one.", "Got it."];

type KoalaMood = "idle" | "think" | "cheer";
function Koala({ mood = "idle" }: { mood?: KoalaMood }) {
  return (
    <div style={{ width: 120, margin: "0 auto 1.2rem" }}>
      <Mascot mood={mood} size={120} follow interactive prop={mood === "idle" ? "book" : undefined} />
    </div>
  );
}

function firstShelf(answers: Record<string, string>): string {
  const format = answers.format;
  if (format === "interactive") return "/catalog?type=Interactive";
  if (format === "comics") return "/comics";
  const g = (answers.genre || "").split(",").filter(Boolean)[0];
  return g ? `/catalog?genre=${encodeURIComponent(g)}` : "/discover";
}

export default function OnboardingPage() {
  const [idx, setIdx] = useState(-1); // -1 intro · 0..n-1 questions · n done
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [cheer, setCheer] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [genreSel, setGenreSel] = useState<string[]>([]);
  const [cheering, setCheering] = useState(false);
  const cheerTimer = useRef<number | null>(null);

  function celebrate() {
    setCheering(true);
    if (cheerTimer.current) window.clearTimeout(cheerTimer.current);
    cheerTimer.current = window.setTimeout(() => setCheering(false), 900);
  }
  useEffect(() => () => { if (cheerTimer.current) window.clearTimeout(cheerTimer.current); }, []);

  const total = QUESTIONS.length;
  const answered = Object.keys(answers).length;
  // Starts at 20%: opening Lybry and saying yes already counts as the first step.
  const pct = 20 + Math.round((answered / total) * 80);
  const q = idx >= 0 && idx < total ? QUESTIONS[idx] : null;
  const koalaMood: KoalaMood = cheering ? "cheer" : q && !picked && genreSel.length === 0 ? "think" : "idle";

  function advance(next: Record<string, string>) {
    setAnswers(next);
    if (idx + 1 >= total) {
      saveGuestPrefs(next);
      setIdx(total);
    } else {
      setIdx(idx + 1);
    }
  }

  function pick(key: string, value: string) {
    setPicked(value);
    celebrate();
    setCheer(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
    const next = { ...answers, [key]: value };
    window.setTimeout(() => {
      setPicked(null);
      setCheer("");
      advance(next);
    }, 480);
  }

  function toggleGenre(v: string) {
    if (!genreSel.includes(v)) celebrate();
    setGenreSel((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
  }
  function continueMulti() {
    if (!q || genreSel.length === 0) return;
    const next = { ...answers, [q.key]: genreSel.join(",") };
    setGenreSel([]);
    advance(next);
  }

  function skip() {
    saveGuestPrefs({});
    window.location.assign("/discover");
  }

  return (
    <div className={styles.root}>
      <div className={styles.bg} />
      <div className={styles.header}>
        <div className={styles.progress} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Setup progress" style={{ position: "relative" }}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          {[20, 47, 73, 100].map((at, i) => (
            <span key={at} aria-hidden="true" className={pct >= at ? "su-stamp" : undefined}
              style={{ position: "absolute", top: "50%", left: `${at}%`, transform: "translate(-50%, -50%)", width: 18, height: 18, borderRadius: "50%", display: "grid", placeItems: "center",
                background: pct >= at ? "var(--gold)" : "var(--surface)", border: `3px solid ${pct >= at ? "var(--gold)" : "var(--line)"}`, color: "#fff" }}>
              {i === 3 ? (
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></svg>
              ) : pct >= at ? (
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              ) : null}
            </span>
          ))}
        </div>
        <span className={styles.pctLabel}>{idx >= 0 && idx < total ? `${idx + 1} of ${total}` : idx >= total ? "Done" : ""}</span>
      </div>

      <div className={styles.stage}>
        {idx === -1 && (
          <div className={styles.screen} key="intro">
            <Koala mood={koalaMood} />
            <h1 className={styles.introTitle}>
              Three quick questions,
              <br />
              then <span>your shelf</span>.
            </h1>
            <p className={styles.tag}>No account needed. You can start reading straight after.</p>
            <button className={styles.btn} onClick={() => setIdx(0)}>
              Let’s go
            </button>
            <br />
            <button className={styles.skip} onClick={skip}>
              Skip, just let me browse
            </button>
          </div>
        )}

        {q && q.multi && (
          <div className={styles.screen} key={q.key}>
            <Koala mood={koalaMood} />
            <div className={styles.mascotLine}>{q.line}</div>
            <h1 className={styles.q}>{q.q}</h1>
            <p className={styles.tag} style={{ marginTop: "-0.4rem" }}>Pick as many as you like.</p>
            <div className={styles.genreGrid}>
              {q.options.map((o) => (
                <button
                  key={o.v}
                  type="button"
                  aria-pressed={genreSel.includes(o.v)}
                  className={`${styles.genreCard} ${genreSel.includes(o.v) ? styles.selected : ""}`}
                  onClick={() => toggleGenre(o.v)}
                >
                  <span className={styles.genreIcon}><Glyph e={o.icon} /></span>
                  <span>{o.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {q && !q.multi && (
          <div className={styles.screen} key={q.key}>
            <Koala mood={koalaMood} />
            <div className={styles.mascotLine}>{cheer || q.line}</div>
            <h1 className={styles.q}>{q.q}</h1>
            <div className={styles.options}>
              {q.options.map((o) => (
                <button
                  key={o.v}
                  type="button"
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

        {idx >= total && (
          <div className={styles.screen} key="done">
            <Koala mood="cheer" />
            <h1 className={styles.doneTitle}>
              Your shelf is <span>ready</span>.
            </h1>
            <p className={styles.tag}>
              Start reading now. Make a free account any time to keep your place, your streak and these picks on every device.
            </p>
            <a className={styles.btn} href={firstShelf(answers)} style={{ textDecoration: "none" }}>
              Start reading
            </a>
            <br />
            <a className={styles.skip} href="/login?auth=signup&next=%2Fhome" style={{ textDecoration: "none", display: "inline-block" }}>
              Save my picks with a free account
            </a>
          </div>
        )}
      </div>

      {q && q.multi && (
        <div className={styles.continueBar}>
          <button className={styles.continueBtn} type="button" disabled={genreSel.length === 0} onClick={continueMulti}>
            {genreSel.length === 0 ? "Pick at least one" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}
