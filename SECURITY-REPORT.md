# Libry security report

Scope: the full `libry` repo (Next.js app, server actions, API routes, 38 Supabase
migrations). Method: read every write policy, server action, API route and payment
path; replayed known attack payloads against the sanitiser; tested date/theme logic
and CSS in a headless browser; type-checked the project with stubbed libraries.

Severity: Critical = money or paid content at risk, anyone can do it. High = cheating,
account or data abuse. Medium = limited abuse or needs setup to exploit. Low = hygiene.

## Fixed in code (batches 1 to 7)

| # | Severity | Hole | How it was exploited | Fix | Batch |
|---|----------|------|----------------------|-----|-------|
| 1 | Critical | Admin used one shared 4-digit passcode, with a default written in the (public) code, no attempt limit | Open /admin, type the default or guess 10,000 codes; see payout account numbers, send payouts | Real sign-in + ADMIN_EMAILS allowlist, no default | 1 |
| 2 | Critical | Anyone signed in could insert `purchases` / `product_purchases` rows | Free paid books; creators could fake sales of their own book with any amount and get paid real money | Only the server records purchases, after Paystack verification | 6 |
| 3 | Critical | "demo-" checkout references always accepted and counted as revenue | Unlock any paid item for free forever; fake creator earnings | Demo only while payments are off, records 0 revenue; past demo sales zeroed | 6 |
| 4 | Critical | Paid book text (`books.content`, `chapters.content`) readable by anyone via the public API key | Download every paid book in full without an account | Text columns are server-only; pages fetch text after an access check | 7 |
| 5 | Critical | Readers could write their own `subscriptions` row | Free Unlimited forever | Server-only writes; readers can only read their row | 7 |
| 6 | High | One Paystack receipt could pay for many orders | Pay once, replay the reference | Each reference is claimed once (`payment_references`) | 6-7 |
| 7 | High | Payment currency not checked | Pay in a cheaper currency with the same number | Currency must match the store currency | 7 |
| 8 | High | Creators could insert "active" promotions / placements for free | Free featured placement | Server-only writes after payment; legacy free promote button disabled | 7 |
| 9 | High | Paid interactive stories played in full for everyone | Read without buying | Access check before the story loads | 7 |
| 10 | High | Stored XSS in book HTML: `jav&#x61;script:` links passed the sanitiser | A creator plants a link that runs code in readers' sessions | Entities decoded, only http/https/mailto/relative links and image data URLs allowed; 13 attack payloads tested | 7 |
| 11 | High | Open redirect after Google sign-in (`next=@evil.com`) | Phishing: log in on Libry, land on a fake site | Only same-site paths allowed; tested | 7 |
| 12 | High | Users could set their own XP / tokens / quest rewards | Top every board instantly | Writes removed; one server-side XP ledger | 1 |
| 13 | High | Collaborators could change a book's owner | Take the book and its earnings | `user_id` can't change except by the server | 7 |
| 14 | High | Free unlimited token "purchase" and refill actions | Infinite tokens | Disabled | 1 |
| 15 | Medium | Challenge XP farming | Insert challenge rows, claim XP repeatedly | Once per book, max 5 per day | 1 |
| 16 | Medium | Reading minutes writable directly, any day, any amount | Top the leaderboard without reading | 1 minute per ~50 s, today +/- 1 day only | 4 |
| 17 | Medium | Owners could mark their book Editor's pick, set its star rating, set community member counts | Fake credibility | Guard triggers (server only) | 7 |
| 18 | Medium | Anyone could edit the site-wide sale banner | Deface every page / phishing text | Server-only | 1 |
| 19 | Medium | Anyone could plant quiz answers for any book | Wrong answers for everyone | Server-only cache; questions only for books you can read | 1, 7 |
| 20 | Medium | Coupon guessing | Script thousands of codes | Max 10 tries/hour, one use per account, codes not readable | 6 |
| 21 | Medium | Rewarded-ad farming | Call "finish" without watching | Server timestamps the view (15 s minimum), 5/day cap | 6 |
| 22 | Low | Referral attribution changeable | Re-point referrals | Set once, never to yourself | 7 |
| 23 | Low | No security headers | Clickjacking, MIME sniffing | nosniff, frame-ancestors none, HSTS, referrer and permissions policy | 7 |
| 25 | Medium | Legal pages showed 25 [PLACEHOLDER] values (refund window, contact email, legal name) | Not a hack, but a launch blocker and a consumer-law risk | All moved to one config (`src/lib/legal.ts`), known facts filled, `npm run check:launch` fails until the rest are set | 8 |
| 26 | Medium | Site promised "no ads, ever" while rewarded ads were added | Misleading claim | Copy now says no ads unless you choose one for coins; refund policy now covers coins | 8 |
| 24 | Low | Build-breaking name clash (two `Icon`s in the nav) from batch 2 | Deploy would fail | Renamed; found by the type check | 7 |

## Needs your action (can't be fixed from the repo)

1. **Payout function isn't in the repo.** `request_payout` and the `payouts` table exist
   only in your live database. Send me their SQL (Supabase > Database > Functions) so it
   can be checked for: balance re-check at payout time, one pending request at a time,
   frozen/suspended creators blocked, partner approval required.
2. **Don't pay creators until you reconcile.** Fake sales inserted directly (hole 2)
   have no marker the migration can safely clean. Compare each creator's sales with
   your Paystack dashboard before any payout.
3. **`book-media` storage bucket policies aren't in the repo.** In Supabase > Storage,
   make sure uploads are limited to the uploader's own folder, images only
   (image/png, jpeg, webp, gif), and a size cap. If HTML or SVG uploads are allowed in a
   public bucket, anyone can host a phishing page on your Supabase domain.
4. **Set env vars in Vercel:** `ADMIN_EMAILS`, `SUPABASE_SERVICE_ROLE_KEY` (server only,
   never `NEXT_PUBLIC_`). Delete `ADMIN_PASSCODE`. Rotate the service role key if it
   was ever committed or shared.
5. **Run migrations 0034 to 0039 in order.** 0039 must run last (it locks book text).
6. **Fake accounts (Sybil farming).** Welcome bonus, coupons and the leaderboard can be
   farmed with many accounts. Turn on email confirmation in Supabase Auth, and add
   CAPTCHA (Supabase Auth supports hCaptcha/Turnstile) on sign-up.
7. **Rewarded ads:** a script can still earn the capped 5 coins x 5 ads a day. Real
   protection comes from the ad network's server-side verification callback; wire it
   into `finish_rewarded_ad` when you pick a network.

## Payments status

- Books, products, Unlimited, promotions and coin packs all verify with Paystack's
  secret key on the server, check amount and currency, and claim the reference once.
- Coin packs: Paystack checkout is wired on /wallet and switches on automatically when
  `PAYSTACK_SECRET_KEY` is set and `NEXT_PUBLIC_PAYSTACK_ENABLED=true`.
- Still to do when Paystack is verified: a Paystack webhook (`charge.success`) as a
  backup in case a buyer closes the tab before the site records the payment.

## What was and wasn't tested

- Tested: sanitiser against 13 XSS payloads; redirect filter against 8 inputs; season
  logic on 10 dates; theme colours in a real browser; light-mode contrast (all 4.5:1+);
  every changed file syntax-checked; whole project type-checked with stubbed libraries
  (found and fixed one real build error).
- Not tested here: a real `next build` (package installs are blocked in this sandbox)
  and the SQL (no database). The Vercel preview build and running the migrations are
  the final check. Send me any error text.
