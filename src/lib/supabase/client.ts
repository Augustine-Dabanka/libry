import { createBrowserClient } from '@supabase/ssr'

// Browser-side Supabase client. Session is kept in cookies (not localStorage)
// so the server can read it too — see server.ts + middleware.ts.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
