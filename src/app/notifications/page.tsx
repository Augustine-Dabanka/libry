import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import MarkNotificationsRead from "@/components/MarkNotificationsRead";
import PushToggle from "@/components/PushToggle";

export const metadata = { title: "Notifications — Libry" };

type Notif = { id: number; actor_name: string | null; kind: string; summary: string; link: string | null; read: boolean; created_at: string };

const ICON: Record<string, string> = { post_reply: "💬", post_like: "♥", follow: "🔔", comment_reply: "💬" };

function timeAgo(iso: string): string {
  const d = (Date.now() - +new Date(iso)) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  if (d < 604800) return `${Math.floor(d / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/notifications");

  let notifs: Notif[] = [];
  let pending = false;
  const res = await supabase.from("notifications").select("id, actor_name, kind, summary, link, read, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(60);
  if (res.error) pending = true;
  else notifs = (res.data ?? []) as Notif[];

  return (
    <>
      <AppNav />
      {!pending ? <MarkNotificationsRead userId={user.id} /> : null}
      <section className="section" style={{ maxWidth: 620, marginInline: "auto" }}>
        <div className="dashboard-header" style={{ marginBottom: "1.5rem" }}>
          <h1>Notifications</h1>
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)" }}>Replies, likes, and new followers — the quiet kind.</p>
        </div>

        <PushToggle userId={user.id} />

        {pending ? (
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", textAlign: "center", padding: "2rem 1rem" }}>
            Notifications go live once their migration is applied. Check back soon.
          </p>
        ) : notifs.length === 0 ? (
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", textAlign: "center", padding: "2rem 1rem" }}>
            You&apos;re all caught up. Replies, likes and follows will show up here.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {notifs.map((n) => {
              const inner = (
                <>
                  <span style={{ fontSize: "1.15rem", width: 30, textAlign: "center", flexShrink: 0, color: n.kind === "post_like" ? "var(--gold)" : undefined }}>{ICON[n.kind] || "🔔"}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontFamily: "var(--sans)", fontSize: "0.95rem", color: "var(--ivory)" }}>{n.summary}</span>
                    <span style={{ display: "block", fontFamily: "var(--sans)", fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.15rem" }}>{timeAgo(n.created_at)}</span>
                  </span>
                  {!n.read ? <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold)", flexShrink: 0, alignSelf: "center" }} /> : null}
                </>
              );
              const style: React.CSSProperties = {
                display: "flex", alignItems: "flex-start", gap: "0.7rem", padding: "0.85rem 1rem", borderRadius: 12,
                border: "1px solid var(--border)", background: n.read ? "var(--stone)" : "rgba(95,160,104,0.08)", textDecoration: "none", color: "inherit",
              };
              return n.link ? (
                <a key={n.id} href={n.link} style={style}>{inner}</a>
              ) : (
                <div key={n.id} style={style}>{inner}</div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
