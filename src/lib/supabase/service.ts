import { createClient } from "@supabase/supabase-js";


// SERVER ONLY. Service-role client for trusted server writes (recording verified purchases,
// granting bought coins). Never import this into a client component.
export function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
