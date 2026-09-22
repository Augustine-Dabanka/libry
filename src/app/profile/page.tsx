import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// The signed-in user's own profile shortcut (Profile tab). Sends them to their
// public /u/[username], or to settings to pick a username if they have none.
export default async function MyProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");
  const { data } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
  if (data?.username) redirect(`/u/${encodeURIComponent(data.username)}`);
  redirect("/settings");
}
