import { createClient } from "@/lib/supabase/server";
import NavClient from "@/components/NavClient";

// The full Libry navbar (ported from the original app.js renderNavbar): category
// dropdown, Interactive badge, search, Write button, theme cycle, user menu.
export default async function AppNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let name = "";
  let avatarUrl: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    name = profile?.full_name || profile?.username || user.email || "";
    avatarUrl = profile?.avatar_url ?? null;
  }
  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return <NavClient signedIn={!!user} name={name} avatarUrl={avatarUrl} initials={initials} />;
}
