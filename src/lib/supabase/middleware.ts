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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ---- Central auth wall ----------------------------------------------------
  // Auth is enforced here, once, for the whole app — not per page (which is easy
  // to forget and leaves loopholes like /book, /reader, /discover). Only the
  // public marketing + sign-up funnel is reachable while signed out.
  const path = request.nextUrl.pathname
  const isPublic =
    path === '/' ||
    PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + '/'))

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = ''
    // Remember where they were headed so login can send them back.
    if (path && path !== '/login') loginUrl.searchParams.set('next', path)
    const redirect = NextResponse.redirect(loginUrl)
    redirect.headers.set('X-Frame-Options', 'SAMEORIGIN')
    redirect.headers.set('X-Content-Type-Options', 'nosniff')
    return redirect
  }

  // Two-step sign-in: an account with an authenticator app isn't fully signed
  // in until it has entered a code (AAL2). Until then, only the sign-in page
  // and public pages load. Read from the session token; no extra network call.
  if (user && !isPublic) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
      const u = request.nextUrl.clone()
      u.pathname = '/login'
      u.search = ''
      u.searchParams.set('mfa', '1')
      u.searchParams.set('next', path)
      return NextResponse.redirect(u)
    }
  }

  // Clickjacking protection: only allow the app to be framed by its own origin.
  supabaseResponse.headers.set('X-Frame-Options', 'SAMEORIGIN')
  // Stop browsers from MIME-sniffing responses away from their declared type.
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')

  return supabaseResponse
}

// Reachable while signed out: the landing page ('/' handled separately), the
// sign-in / sign-up funnel, static marketing pages, and the *shareable*
// storefront surfaces (an individual book page, a campaign link, an author
// profile) — walling those would break shared links and the viral funnel; they
// carry their own "sign in to read" call to action. Everything else — the app
// proper: home, catalog, discover, reader, my-library, cart, wishlist, settings,
// creator, achievements — requires a session. `/auth` covers the OAuth callback
// and the sign-out POST.
const PUBLIC_PREFIXES = [
  '/login',
  '/auth',
  '/onboarding',
  '/waitlist',
  '/links',
  '/about',
  '/docs',
  '/unlimited',
  // Look before you sign up: browsing is open; reading, saving and buying ask for an account.
  '/catalog',
  '/discover',
  '/comics',
  '/communities',
  '/leaderboard',
  // Book detail pages are a preview: the text itself is served only after an
  // access check in the reader, so it's safe to show these signed out.
  '/book',
  // API routes check access themselves (session, ownership or a shared secret).
  // Without this, signed-out visitors got login redirects instead of cover
  // images, and server-to-server webhooks (push, Paystack) could never arrive.
  '/api',
  // Static media in /public/media (the landing page's preview clip and poster).
  '/media',
  '/terms',
  '/privacy',
  '/cookies',
  '/refunds',
  '/contact',
  '/koala',
  // Preview before signing up. Each page checks access itself and shows a
  // "sign up to keep going" step instead of a hard wall:
  //   /reader  first chapter of any book (paid: the usual sample)
  //   /product digital products (buying asks for an account)
  //   /c       community rooms (read the room's intro; posting needs an account)
  //   /home, /community  send guests to /discover and /communities
  '/reader',
  '/product',
  '/c',
  '/home',
  '/community',
  '/search',
  '/royalty-calculator',
  '/creator-hub',
  '/book',
  '/b',
  '/author',
  '/u',
  '/ad',
  // Staff-only: the page itself checks for a signed-in account on ADMIN_EMAILS
  // and shows a sign-in prompt otherwise.
  '/admin',
]
