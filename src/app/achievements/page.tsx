import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";

type ProgRow = { book_id: number; progress_percentage: number | null };

const BADGES = [
  { key: "first", name: "First Chapter", need: "Finish your first book" },
  { key: "bookworm", name: "Bookworm", need: "Finish 5 books" },
  { key: "devourer", name: "Devourer", need: "Finish 15 books" },
  { key: "collector", name: "Collector", need: "Keep 10 books in your library" },
  { key: "deep", name: "Deep Reader", need: "Complete 3 reading challenges" },
  { key: "critic", name: "The Critic", need: "Rate 5 books" },
  { key: "ears", name: "All Ears", need: "Listen to a book" },
  { key: "roll", name: "On a Roll", need: "Reach a 3-day streak" },
  { key: "week", name: "Weeklong", need: "Reach a 7-day streak" },
  { key: "devoted", name: "Devoted", need: "Like 10 books" },
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

  const stats = [
    { n: finished, label: "Books finished" },
    { n: 0, label: "Challenges done" },
    { n: 0, label: "Books rated" },
    { n: 0, label: "Listened" },
    { n: 0, label: "Day streak" },
    { n: inLibrary, label: "In library" },
  ];

  const unlocked = new Set<string>();
  if (finished >= 1) unlocked.add("first");
  if (finished >= 5) unlocked.add("bookworm");
  if (finished >= 15) unlocked.add("devourer");
  if (inLibrary >= 10) unlocked.add("collector");
  const unlockedCount = unlocked.size;

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
            <span style={{ fontFamily: "var(--serif)", fontSize: "2rem", color: "var(--gold)" }}>1</span>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: "0.76rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", fontFamily: "var(--sans)" }}>Level 1</div>
            <h3 style={{ fontSize: "1.5rem", margin: "0.1rem 0 0.8rem" }}>Curious Reader</h3>
            <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, finished * 4)}%`, background: "linear-gradient(90deg,#C4A35A,#B45309)" }} />
            </div>
            <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
              {finished * 25} XP total · {Math.max(0, 25 - finished * 25 % 25)} XP to level 2
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

        {/* Badges */}
        <h3 style={{ marginBottom: "0.3rem" }}>Badges</h3>
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", marginBottom: "1.4rem" }}>
          {unlockedCount} of {BADGES.length} unlocked.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
          {BADGES.map((b) => {
            const on = unlocked.has(b.key);
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
