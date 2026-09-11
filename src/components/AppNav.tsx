import { createClient } from "@/lib/supabase/server";
import NavClient from "@/components/NavClient";
import { GENRES } from "@/lib/content";

// The full Libry navbar (ported from the original app.js renderNavbar): category
// dropdown, Interactive badge, search, Write button, theme cycle, user menu.
export default async function AppNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let name = "";
  let avatarUrl: string | null = null;
  let wishCount = 0;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    name = profile?.full_name || profile?.username || user.email || "";
    avatarUrl = profile?.avatar_url ?? null;
    const wl = await supabase.from("wishlist").select("book_id", { count: "exact", head: true }).eq("user_id", user.id);
    wishCount = wl.count ?? 0;
  }
  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  // Genres that actually have published books — so the Browse menu never shows
  // an empty category (which reads as "no content").
  let genres: string[] = [];
  {
    const g = await supabase.from("books").select("category").eq("is_published", true).not("category", "is", null).limit(1000);
    if (!g.error) {
      const set = new Set(((g.data ?? []) as { category: string | null }[]).map((r) => r.category).filter(Boolean) as string[]);
      genres = GENRES.filter((x) => set.has(x));
    }
  }

  return <NavClient signedIn={!!user} name={name} avatarUrl={avatarUrl} initials={initials} email={user?.email ?? ""} wishCount={wishCount} genres={genres} />;
}
