import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Runs on every request: refreshes the Supabase auth session and keeps the
// httpOnly cookies in sync between the browser and the server.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() refreshes the token if needed. Do not remove.
  await supabase.auth.getUser()

  // Clickjacking protection: only allow the app to be framed by its own origin.
  supabaseResponse.headers.set('X-Frame-Options', 'SAMEORIGIN')
  // Stop browsers from MIME-sniffing responses away from their declared type.
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')

  return supabaseResponse
}
