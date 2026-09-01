import Koala, { type KoalaState } from "@/components/Koala";
import ClaimButton from "@/components/ClaimButton";
import TokenBadge from "@/components/TokenBadge";
import { TOKEN_CAP, type Stats, type Quest } from "@/lib/gamification";

function pill(bg: string, color: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    background: bg,
    color,
    borderRadius: 999,
    padding: "0.4rem 0.9rem",
    fontWeight: 800,
    fontFamily: "var(--sans)",
    fontSize: "0.95rem",
  };
}

export default function StatsHUD({ stats, quests }: { stats: Stats; quests: Quest[] }) {
  const koala: KoalaState = stats.streak_broken ? "sad" : stats.streak_count >= 3 ? "happy" : "idle";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: "1.4rem",
        alignItems: "center",
        background: "var(--stone)",
        border: "1px solid var(--border)",
        borderRadius: 18,
        padding: "1.3rem 1.5rem",
        marginBottom: "2rem",
      }}
    >
      <Koala state={koala} size={84} />

      <div>
        <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
          <span className="lb-pop" style={{ ...pill("rgba(180,83,9,0.16)", "#E08A3C"), animationDelay: "0.05s" }}>🔥 {stats.streak_count}-day streak</span>
          <TokenBadge tokens={stats.tokens} cap={TOKEN_CAP} updatedAt={stats.tokens_updated_at} />
          <span className="lb-pop" style={{ ...pill("rgba(124,124,180,0.16)", "#B7B7E6"), animationDelay: "0.19s" }}>✦ {stats.xp} XP</span>
          <span className="lb-pop" style={{ ...pill("rgba(78,122,82,0.18)", "#7DBE86"), animationDelay: "0.26s" }}>🏆 {stats.league} League</span>
        </div>

        {stats.streak_broken ? (
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.88rem", marginBottom: "0.8rem" }}>
            Your streak reset — read anything today to build it back up. You&apos;ve got this.
          </p>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {quests.map((q) => {
            const done = q.completed;
            return (
              <div
                key={q.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.7rem",
                  fontFamily: "var(--sans)",
                  fontSize: "0.9rem",
                }}
              >
                <span style={{ opacity: done ? 1 : 0.55 }}>{done ? "✅" : "⬜"}</span>
                <span style={{ flex: 1, color: done ? "var(--ivory)" : "var(--muted)" }}>
                  {q.label}
                  {q.target > 1 ? (
                    <span style={{ color: "var(--muted)" }}> · {Math.min(q.progress, q.target)}/{q.target}</span>
                  ) : null}
                </span>
                <span style={{ color: "var(--gold)", fontSize: "0.82rem", fontWeight: 700 }}>+{q.reward_tokens}⚡</span>
                {done && !q.claimed ? (
                  <ClaimButton questId={q.id} reward={q.reward_tokens} />
                ) : q.claimed ? (
                  <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Claimed</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
