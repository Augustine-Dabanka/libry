"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import CommunityFeed from "@/components/CommunityFeed";
import { joinCommunity, leaveCommunity } from "@/app/actions/communities";

export type LeaderRow = { user_id: string; name: string; score: number };

const CHANNELS = [
  { id: "general", label: "General" },
  { id: "wins", label: "Wins" },
  { id: "showcase", label: "Showcase" },
  { id: "help", label: "Help" },
];

export default function CommunityRoom({
  communityId, userId, userName, avatarUrl, isMember, memberCount, leaderboard,
}: {
  communityId: number;
  userId: string;
  userName: string;
  avatarUrl: string | null;
  isMember: boolean;
  memberCount: number;
  leaderboard: LeaderRow[];
}) {
  const router = useRouter();
  const [channel, setChannel] = useState("general");
  const [member, setMember] = useState(isMember);
  const [count, setCount] = useState(memberCount);
  const [pending, start] = useTransition();

  function toggleMembership() {
    start(async () => {
      if (member) {
        const r = await leaveCommunity(communityId);
        if (!r?.error) { setMember(false); setCount((c) => Math.max(0, c - 1)); }
      } else {
        const r = await joinCommunity(communityId);
        if (!r?.error) { setMember(true); setCount((c) => c + 1); }
      }
      router.refresh();
    });
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: "1.6rem" }} className="community-room">
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 260px", gap: "1.6rem", alignItems: "start" }} className="community-room-grid">
        <div>
          {/* Channel tabs */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.2rem" }}>
            {CHANNELS.map((c) => (
              <button key={c.id} type="button" onClick={() => setChannel(c.id)}
                style={{ padding: "0.4rem 0.9rem", borderRadius: 999, cursor: "pointer", fontFamily: "var(--sans)", fontWeight: 600, fontSize: "0.85rem", border: "1px solid var(--border)", background: channel === c.id ? "var(--gold)" : "transparent", color: channel === c.id ? "#12100E" : "var(--ivory-muted)" }}>
                #{c.label}
              </button>
            ))}
          </div>
          <CommunityFeed userId={userId} userName={userName} avatarUrl={avatarUrl} communityId={communityId} channel={channel} canPost={member} />
        </div>

        {/* Sidebar: join + leaderboard */}
        <aside style={{ display: "grid", gap: "1.2rem", position: "sticky", top: "1.5rem" }}>
          <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.1rem 1.2rem" }}>
            <div style={{ fontFamily: "var(--sans)", fontWeight: 700, color: "var(--ivory)", marginBottom: "0.2rem" }}>{count} member{count === 1 ? "" : "s"}</div>
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.82rem", marginBottom: "0.9rem" }}>{member ? "You're in this community." : "Join to post and reply."}</p>
            <button type="button" onClick={toggleMembership} disabled={pending} className={member ? "btn btn-outline" : "btn btn-gold"} style={{ width: "100%", justifyContent: "center" }}>
              {pending ? "…" : member ? "Leave" : "Join community"}
            </button>
          </div>

          <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.1rem 1.2rem" }}>
            <div style={{ fontFamily: "var(--sans)", fontWeight: 700, color: "var(--ivory)", marginBottom: "0.7rem" }}>🏆 Leaderboard</div>
            {leaderboard.length === 0 ? (
              <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.82rem" }}>No activity yet — post to get on the board.</p>
            ) : (
              <div style={{ display: "grid", gap: "0.55rem" }}>
                {leaderboard.map((r, i) => (
                  <div key={r.user_id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontFamily: "var(--sans)", fontSize: "0.86rem" }}>
                    <span style={{ width: 20, color: i < 3 ? "var(--gold)" : "var(--muted)", fontWeight: 700 }}>{i + 1}</span>
                    <span style={{ flex: 1, color: "var(--ivory-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                    <span style={{ color: "var(--gold)", fontWeight: 700 }}>{r.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
