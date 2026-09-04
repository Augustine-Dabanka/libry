"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

// Permanently delete the signed-in reader's own account: their books, their
// profile, and the auth user itself. Deleting an auth user requires the service
// role, so this runs entirely on the server with the service key — never the
// browser. Fails gracefully (and changes nothing) if the key isn't configured.
export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return { error: "Account deletion isn't configured on this server yet." };
  }

  const admin = createAdmin(url, serviceKey, { auth: { persistSession: false } });

  // Best-effort cleanup of the reader's own rows before removing the user.
  await admin.from("books").delete().eq("user_id", user.id);
  await admin.from("wishlist").delete().eq("user_id", user.id);
  await admin.from("reading_progress").delete().eq("user_email", user.email ?? "");
  await admin.from("profiles").delete().eq("id", user.id);

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  // Invalidate the session cookie so the browser is fully signed out.
  await supabase.auth.signOut();
  return { ok: true };
}
