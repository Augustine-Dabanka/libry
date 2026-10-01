# Libry: 7-day launch plan

Each day ends with a "done when" check. Don't move on until it's true.
Run `npm run check:launch` against your production env vars on Day 3 and Day 6.

## Day 1: get the code live on a preview
- Push `libry-updates.zip` to a new `updates` branch (GitHub "Upload files", or Claude Code).
- Vercel builds a preview automatically. If the build fails, send the error text.
- In Supabase SQL editor, run migrations 0034, 0035, 0036, 0037, 0038, then 0039 last.
- **Done when:** the preview loads, and the SQL ran without errors.

## Day 2: keys and admin
- Vercel env: `SUPABASE_SERVICE_ROLE_KEY` (server only), `ADMIN_EMAILS` (your email).
- Delete `ADMIN_PASSCODE`. Rotate the service role key if it was ever shared.
- Supabase Auth: turn on email confirmation and CAPTCHA (Turnstile or hCaptcha).
- Supabase Storage `book-media`: images only, own-folder uploads, size limit.
- **Done when:** /admin only opens for your email; another account sees "Staff only".

## Day 3: legal pages
- Decide with someone you trust (a lawyer if you can) and set the `NEXT_PUBLIC_LEGAL_*`,
  contact/support/privacy emails, refund window, minimum age and subscription terms
  (full list in `src/lib/legal.ts`). The pages fill themselves from these.
- **Done when:** `npm run check:launch` shows no placeholder or legal env errors.

## Day 4: payments
- If Paystack is verified: set `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`,
  `NEXT_PUBLIC_PAYSTACK_CURRENCY=GHS`, `NEXT_PUBLIC_PAYSTACK_USD_RATE`, then
  `NEXT_PUBLIC_PAYSTACK_ENABLED=true` **on the preview only**.
- Test with Paystack test cards: buy a book, a coin pack, Unlimited. Then try to cheat:
  reuse a receipt, pay in the wrong currency, open a paid book signed out. All must fail.
- If Paystack is NOT verified: launch with payments off. Free reading, coins from ads and
  coupons still work. Turn payments on later; nothing else changes.
- **Done when:** every test purchase works once, every cheat fails.

## Day 5: walk every page on a phone
- Sign up, onboarding, catalog, a free book, a paid book (sample), comics, wallet,
  coupon, leaderboard, settings themes, admin. Note anything broken and send it over.
- Check Sentry for new errors.
- **Done when:** no blocking bugs left on the list.

## Day 6: soft launch
- Merge `updates` into `main`. Invite 10 to 20 readers and 3 to 5 creators.
- Hand out a launch coupon (create it in /admin, limit 100 uses).
- Before any creator payout: reconcile their sales with the Paystack dashboard.
- **Done when:** real people used it for a day without a serious problem.

## Day 7: open the doors
- Post the film (TikTok/Reels version uses in-app music; see the copyright note).
- Turn yourself and early readers on for the leaderboard so it isn't empty.
- Watch Sentry and the admin overview for the first 48 hours.

## Not needed for launch (do after)
- Rewarded ad network + its server-side verification callback.
- Paystack webhook (`charge.success`) as a safety net for closed tabs.
- A strict Content-Security-Policy (needs an allowlist for Paystack and Sentry).
- Livestream (video), gifting, genre-follows-book themes.
