import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";

type ProgRow = { book_id: number; progress_percentage: number | null };

// Badge catalogue. `unlock` reads the live tallies and returns whether it's
// earned — so every badge lights up from real reading data, and the rest read
// honestly as still locked.
type Tally = { finished: number; inLibrary: number; inProgress: number; challenges: number; reviews: number; streak: number };
const BADGES: { key: string; name: string; need: string; unlock: (t: Tally) => boolean }[] = [
  { key: "first", name: "First Chapter", need: "Finish your first book", unlock: (t) => t.finished >= 1 },
  { key: "started", name: "Off the Shelf", need: "Start reading a book", unlock: (t) => t.inProgress + t.finished >= 1 },
  { key: "trio", name: "Three's Company", need: "Finish 3 books", unlock: (t) => t.finished >= 3 },
  { key: "bookworm", name: "Bookworm", need: "Finish 5 books", unlock: (t) => t.finished >= 5 },
  { key: "tenner", name: "Double Digits", need: "Finish 10 books", unlock: (t) => t.finished >= 10 },
  { key: "devourer", name: "Devourer", need: "Finish 15 books", unlock: (t) => t.finished >= 15 },
  { key: "marathon", name: "Marathoner", need: "Finish 25 books", unlock: (t) => t.finished >= 25 },
  { key: "shelf", name: "A Shelf Begins", need: "Keep 3 books in your library", unlock: (t) => t.inLibrary >= 3 },
  { key: "collector", name: "Collector", need: "Keep 10 books in your library", unlock: (t) => t.inLibrary >= 10 },
  { key: "curator", name: "Curator", need: "Keep 20 books in your library", unlock: (t) => t.inLibrary >= 20 },
  { key: "juggler", name: "Juggler", need: "Have 3 books on the go at once", unlock: (t) => t.inProgress >= 3 },
  { key: "reflective", name: "Reflective", need: "Complete a reading challenge", unlock: (t) => t.challenges >= 1 },
  { key: "deep", name: "Deep Reader", need: "Complete 3 reading challenges", unlock: (t) => t.challenges >= 3 },
  { key: "critic", name: "The Critic", need: "Rate 5 books", unlock: (t) => t.reviews >= 5 },
  { key: "roll", name: "On a Roll", need: "Reach a 3-day streak", unlock: (t) => t.streak >= 3 },
  { key: "week", name: "Weeklong", need: "Reach a 7-day streak", unlock: (t) => t.streak >= 7 },
  { key: "month", name: "Devoted Month", need: "Reach a 30-day streak", unlock: (t) => t.streak >= 30 },
  { key: "explorer", name: "World Explorer", need: "Finish an interactive story", unlock: (t) => t.finished >= 1 },
];

// Reader levels — a title for every rung, unlocked by finishing books.
const LEVELS = [
  { at: 0, name: "Curious Reader" },
  { at: 1, name: "Page Turner" },
  { at: 3, name: "Story Seeker" },
  { at: 5, name: "Bookworm" },
  { at: 8, name: "Bibliophile" },
  { at: 12, name: "Story Sage" },
  { at: 18, name: "Loremaster" },
  { at: 25, name: "Legend of the Library" },
];

const tile: React.CSSProperties = {
  background: "var(--stone)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: "1.4rem 1.2rem",
  textAlign: "center",
};

export default async function Achievements() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Honest stats from real reading data.
  const { data: prog } = await supabase
    .from("reading_progress")
    .select("book_id, progress_percentage")
    .eq("user_email", user.email ?? "");
  const rows = (prog ?? []) as ProgRow[];
  const bestById = new Map<number, number>();
  for (const r of rows) {
    const pct = Math.max(0, Math.min(100, Number(r.progress_percentage ?? 0)));
    bestById.set(r.book_id, Math.max(bestById.get(r.book_id) ?? 0, pct));
  }
  const inLibrary = bestById.size;
  const finished = [...bestById.values()].filter((p) => p >= 100).length;
  const inProgress = [...bestById.values()].filter((p) => p > 0 && p < 100).length;

  // Reading challenges completed, reviews written, current streak (all guarded).
  let challenges = 0;
  {
    const c = await supabase.from("reading_challenges").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    if (!c.error) challenges = c.count ?? 0;
  }
  let reviewsCount = 0;
  {
    const r = await supabase.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    if (!r.error) reviewsCount = r.count ?? 0;
  }
  let streak = 0;
  {
    const s = await supabase.from("user_stats").select("streak_count").eq("user_id", user.id).maybeSingle();
    if (!s.error && s.data) streak = s.data.streak_count ?? 0;
  }

  const tally: Tally = { finished, inLibrary, inProgress, challenges, reviews: reviewsCount, streak };
  const completion = inLibrary ? Math.round((finished / inLibrary) * 100) : 0;

  // XP: 25 per finished book, plus a little for progress.
  const xp = finished * 25 + inProgress * 5;
  // Level from books finished.
  let li = 0;
  for (let i = 0; i < LEVELS.length; i++) if (finished >= LEVELS[i].at) li = i;
  const level = li + 1;
  const current = LEVELS[li];
  const next = LEVELS[li + 1] ?? null;
  const spanStart = current.at;
  const spanEnd = next ? next.at : current.at + 1;
  const pctToNext = next ? Math.min(100, Math.round(((finished - spanStart) / (spanEnd - spanStart)) * 100)) : 100;
  const booksToNext = next ? Math.max(0, spanEnd - finished) : 0;

  const stats = [
    { n: finished, label: "Books finished" },
    { n: inProgress, label: "In progress" },
    { n: inLibrary, label: "In library" },
    { n: `${completion}%`, label: "Completion rate" },
    { n: xp, label: "Total XP" },
    { n: level, label: "Reader level" },
    { n: challenges, label: "Challenges done" },
    { n: streak, label: "Day streak" },
  ];

  const unlockedKeys = new Set(BADGES.filter((b) => b.unlock(tally)).map((b) => b.key));
  const unlockedCount = unlockedKeys.size;
  const allUnlocked = unlockedCount >= BADGES.length;

  // Grand prize: unlock every badge → grant a one-time reward (idempotent).
  let reward: { code: string | null; detail: string | null; redeemed: boolean } | null = null;
  if (allUnlocked) {
    const code = "LIBRY-LEGEND-" + user.id.slice(0, 6).toUpperCase();
    try {
      await supabase.from("rewards").upsert(
        { user_id: user.id, kind: "all_badges", code, detail: "2 free books (one-time)" },
        { onConflict: "user_id,kind", ignoreDuplicates: true }
      );
      const got = await supabase.from("rewards").select("code, detail, redeemed").eq("user_id", user.id).eq("kind", "all_badges").maybeSingle();
      if (!got.error && got.data) reward = got.data as { code: string | null; detail: string | null; redeemed: boolean };
    } catch { /* rewards table not migrated yet */ }
  }

  return (
    <>
      <AppNav />
      <section className="section">
        <div className="section-header">
          <h2>Achievements</h2>
        </div>
        <p style={{ color: "var(--muted)", marginTop: "-1.5rem", marginBottom: "2rem" }}>
          Your reading journey on Libry — level up by finishing books and completing challenges.
        </p>

        {/* Level card */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.6rem", background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 18, padding: "1.6rem 1.8rem", marginBottom: "2.5rem", flexWrap: "wrap" }}>
          <div style={{ width: 90, height: 90, borderRadius: "50%", border: "3px solid var(--gold)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: "var(--serif)", fontSize: "2rem", color: "var(--gold)" }}>{level}</span>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: "0.76rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", fontFamily: "var(--sans)" }}>Level {level}</div>
            <h3 style={{ fontSize: "1.5rem", margin: "0.1rem 0 0.8rem" }}>{current.name}</h3>
            <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pctToNext}%`, background: "linear-gradient(90deg, var(--gold), var(--gold-hi))" }} />
            </div>
            <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
              {xp} XP total · {next ? `${booksToNext} book${booksToNext === 1 ? "" : "s"} to “${next.name}”` : "Top level reached — you legend."}
            </div>
          </div>
        </div>

        {/* Stat tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "3rem" }}>
          {stats.map((s) => (
            <div key={s.label} style={tile}>
              <div style={{ fontFamily: "var(--serif)", fontSize: "2rem", color: "var(--ivory)" }}>{s.n}</div>
              <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem", marginTop: "0.3rem" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Grand prize — every badge unlocked */}
        {allUnlocked ? (
          <div style={{ background: "linear-gradient(135deg, rgba(197,160,89,0.22), rgba(95,160,104,0.16))", border: "1px solid var(--gold)", borderRadius: 18, padding: "1.6rem 1.8rem", marginBottom: "2.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.4rem", marginBottom: "0.3rem" }}>🎁</div>
            <h3 style={{ fontFamily: "var(--serif)", fontSize: "1.5rem", marginBottom: "0.3rem" }}>Every badge unlocked — you legend.</h3>
            <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.95rem", marginBottom: "1rem" }}>
              You&apos;ve earned the grand prize: <strong style={{ color: "var(--ivory)" }}>{reward?.detail || "2 free books (one-time)"}</strong>.
            </p>
            {reward?.code ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", background: "var(--charcoal)", border: "1px dashed var(--gold)", borderRadius: 10, padding: "0.6rem 1rem", fontFamily: "var(--sans)" }}>
                <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Your code</span>
                <code style={{ color: "var(--gold)", fontWeight: 700, letterSpacing: "0.05em" }}>{reward.code}</code>
                <span style={{ color: reward.redeemed ? "var(--muted)" : "#7DBE86", fontSize: "0.78rem" }}>{reward.redeemed ? "· redeemed" : "· ready"}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Badges */}
        <h3 style={{ marginBottom: "0.3rem" }}>Badges</h3>
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", marginBottom: "1.4rem" }}>
          {unlockedCount} of {BADGES.length} unlocked.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
          {BADGES.map((b) => {
            const on = unlockedKeys.has(b.key);
            return (
              <div key={b.key} style={{ ...tile, opacity: on ? 1 : 0.55 }}>
                <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>{on ? "🏅" : "🔒"}</div>
                <div style={{ fontFamily: "var(--sans)", fontWeight: 700, color: on ? "var(--gold)" : "var(--ivory)", fontSize: "0.95rem" }}>{b.name}</div>
                <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.8rem", margin: "0.35rem 0 0.5rem" }}>{b.need}</div>
                <div style={{ fontSize: "0.72rem", letterSpacing: "0.1em", color: on ? "#7DBE86" : "var(--muted)", fontFamily: "var(--sans)" }}>
                  {on ? "UNLOCKED" : "LOCKED"}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
