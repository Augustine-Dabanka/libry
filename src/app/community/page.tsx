import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import CommunityFeed from "@/components/CommunityFeed";

export const metadata = { title: "Community — Libry" };

export default async function CommunityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/community");

  const { data: profile } = await supabase.from("profiles").select("full_name, username, avatar_url").eq("id", user.id).maybeSingle();
  const name = profile?.full_name || profile?.username || user.email?.split("@")[0] || "Reader";

  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 680, marginInline: "auto" }}>
        <div className="dashboard-header" style={{ marginBottom: "1.5rem" }}>
          <h1>Community</h1>
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)" }}>
            A calm place to share what you&apos;re reading and writing — newest first, no algorithm.
          </p>
        </div>
        <CommunityFeed userId={user.id} userName={name} avatarUrl={profile?.avatar_url ?? null} />
      </section>
    </>
  );
}
