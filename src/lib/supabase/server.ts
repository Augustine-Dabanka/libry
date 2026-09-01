import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server-side Supabase client (Server Components, Route Handlers, Server Actions).
// Reads/writes the session from httpOnly cookies — the token never touches
// client-side JavaScript, so there is no localStorage anywhere.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // In a pure Server Component this throws (cookies are read-only there);
          // middleware refreshes the session, so it's safe to swallow.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            /* called from a Server Component — ignore */
          }
        },
      },
    }
  )
}
