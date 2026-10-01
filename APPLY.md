# Libry updates: batches 1 and 2

## 1. Vercel > Settings > Environment Variables
- ADMIN_EMAILS = your staff email(s), comma-separated
- optional NEXT_PUBLIC_LEGAL_ADDRESS = your registered address
- delete ADMIN_PASSCODE (no longer used)
Then Deployments > latest > Redeploy (env changes need a redeploy).

## 2. Supabase > SQL Editor: run, in order
- supabase/migrations/0034_security_and_xp.sql
- supabase/migrations/0035_public_browse.sql
- supabase/migrations/0036_leaderboard.sql
- supabase/migrations/0037_theme_schedule.sql
- supabase/migrations/0038_payments_and_coins.sql
- supabase/migrations/0039_security_lockdown.sql   (last)

## 3. Code: put these files in a new branch, let Vercel build a preview, then merge.

## Batch 1: security + XP
- /admin: shared passcode replaced by real sign-in + ADMIN_EMAILS allowlist.
- XP: challenge and onboarding XP now counted once, via a server-side ledger. Past challenges backfilled.
- Closed: self-editing XP/tokens, sale-banner editing, quiz-answer planting, free token grants.
- Login consent line links Terms and Privacy; footer placeholders removed.

## Batch 2: look before you sign up
- Guests can browse /catalog, /discover, /comics, /communities and see Unlimited plans.
  Reading, saving, joining and buying still ask for an account.
- Homepage buttons go where they say (store, comics, interactive, communities).
- New src/components/Icon.tsx: Libry's own icon set. Emoji replaced on the homepage,
  nav, Unlimited and communities. Community counts under 25 show "New community, join early".

## Batch 3: motion
- Every .btn now squeezes on press and shows a focus ring (and stops animating `all`).
- New src/components/LibryLoader.tsx: the LIBRY-collides-into-L loader, pure CSS, ~1 KB.
  Used in the first-load splash and the home/catalog loading skeletons.
- New src/components/MovingShelf.tsx: a drifting shelf of free books on the homepage,
  with a Pause button, pause on hover/focus, and a plain swipe row for reduced motion.

## Batch 4: koala, comics, leaderboard
- Onboarding koala reacts: thinks (head tilt, thought dots) while a question is open,
  hops with squash-and-stretch on every pick, breathes and blinks when idle.
- Comic reader: new Manga mode (right to left, page by page; left arrow/tap goes forward).
  Books whose category contains "Manga" open in it by default. Each reader's choice is remembered.
- New /leaderboard: weekly, by minutes read, resets Monday, opt-in only, never by spending.
  Linked from Achievements. Reading minutes can no longer be faked from the browser
  (one minute per ~50 s, today +/- 1 day only).

## Batch 5: themes
- Holiday themes switch on by date and off after (Valentine's, Independence Day,
  Halloween, Christmas), using each visitor's own date, applied before the page paints.
- Staff edit the dates and switch each holiday on/off in /admin (Seasonal themes).
- Settings > Genre looks: Horror, Noir, Sci-fi, Romance, Fantasy, Hero, plus a
  switch to turn holiday themes off. A holiday wins while it's on; your look returns after.
- Light mode uses deeper accents so every look/holiday keeps text readable (4.5:1+).

## Batch 6: payments hardening + coins
URGENT fixes:
- Any signed-in user could insert "purchases" rows directly (free paid books, and fake
  creator earnings that feed real payouts). Now only the server records purchases.
- "demo-" checkout references unlocked paid items forever and counted as revenue.
  Now demo checkout works only while payments are off and records 0 revenue.
  Past demo sales and creators "buying" their own books are zeroed.
- A Paystack receipt can only pay for one order.
- Requires SUPABASE_SERVICE_ROLE_KEY in Vercel (server only, never NEXT_PUBLIC).

Coins:
- /wallet: balance, opt-in rewarded ads (skip after 5 s, earn after 15 s, 5/day,
  timed by the server), coupon codes, coin packs (switched off until Paystack is live).
- Paid books show "Unlock for N coins" (20 coins = 1.00). Bought coins are spent first
  and only they count as creator revenue, so free coins never become payouts.
- /admin: create, pause and track coupons.

## Batch 7: security lockdown + payments
See SECURITY-REPORT.md for the full list (24 holes fixed, 7 items need your action).

## Batch 8: launch prep
- Legal placeholders moved to src/lib/legal.ts (fill via NEXT_PUBLIC_LEGAL_* env vars).
- `npm run check:launch` lists anything not ready.
- "No ads" claims corrected; coins added to the refund policy.
- See LAUNCH-PLAN.md for the 7-day plan.

## Batch 9: payments safety net + route fixes
- New /api/paystack/webhook (set it in Paystack > Settings > API Keys & Webhooks). Signed with your secret key; credits coin packs even if the buyer closes the tab; never double-credits.
- Bug fixed: signed-out visitors got login redirects instead of cover images (/api was not public), and the push-notification webhook could never arrive.
- Book detail pages are now viewable signed out (text is still protected in the reader).
