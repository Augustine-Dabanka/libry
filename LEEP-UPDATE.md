# Lybry update (10 Oct 2026)

What this changes:
- **Libry is now Lybry** everywhere a person can see it: page titles, app name, install name, loader (L·E·E·P), emails, push titles, legal pages, book covers, coupon examples.
- **No legal placeholders.** Every value has a real default (see `src/lib/legal.ts`). Contact goes to a new **/contact** form until you set a public inbox.
- **Socials hidden until you set your new handle**, so the site doesn't link to `@officially_libry` any more.
- **Launch switches (SQL 0042):** rewarded ads and "earned coins unlock paid books" start **off**.
- **`npm run typecheck`** – the right way to type-check in Codespaces.

Deliberately unchanged (renaming these would log people out of settings or break links): localStorage keys, cookie names, CSS class names, component file names like `LibryLoader.tsx`, the GitHub repo, the Vercel project and the `libry-sigma.vercel.app` address.

## 1. Apply in Codespaces

```bash
cd /workspaces/libry
git checkout updates && git pull
unzip -o leep-update.zip -d .
npm install
npm run typecheck
git add -A && git commit -m "Rename to Lybry, remove legal placeholders, contact form, launch switches"
git push
```

## 2. If `typecheck` (or `npx tsc --noEmit`) still fails

Vercel's build of `updates` already passes TypeScript, so a Codespace-only failure is almost always stale generated files:

```bash
rm -rf .next tsconfig.tsbuildinfo
npm install
npm run typecheck
```

Still failing? Copy the first 20 lines of output and send them.

## 3. SQL (Supabase → SQL Editor), in this order

| File | When |
|---|---|
| 0034–0037 | any time (if not run yet) |
| 0038, 0039 | right after the new code is live on production |
| 0040_rename_to_leep.sql | after the Lybry code is live |
| 0041_contact_messages.sql | before anyone uses /contact |
| 0042_launch_switches.sql | after 0038 |
| 0043_guest_preview.sql | after this code is live **and** `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel |
| 0044_trial_and_box.sql | after the trial code is live. Works with or without 0042. Safe to re-run. |
| 0045_focus_and_age_gate.sql | after this code is live **and** `SUPABASE_SERVICE_ROLE_KEY` is set. Hides products, adds the 18+ check. |
| 0046_signup_profile.sql | after 0045. Date of birth at sign-up (private), pronouns, koala avatar. |

**Easiest:** paste `leep-all-sql-0040-to-0046.sql` (all of the above in order, with a safety check at the top) into the SQL Editor and run it once.

Read contact messages: Table editor → `contact_messages`.
Turn a switch on later:
```sql
update public.site_settings set value = value || '{"rewarded_ads": true}' where key = 'features';
```

## 4. Vercel env vars (Settings → Environment Variables)

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`.

Set when you have them (each one is optional):
- `NEXT_PUBLIC_SITE_URL` – your new domain, e.g. `https://leep.example`
- `NEXT_PUBLIC_CONTACT_EMAIL` – public inbox shown on legal pages
- `NEXT_PUBLIC_SOCIAL_HANDLE` – new handle without @ (`NEXT_PUBLIC_SOCIAL_NETWORKS=instagram,tiktok` to limit networks)
- `CONTACT_INBOX` – where contact messages are emailed (defaults to the first `ADMIN_EMAILS`)
- `RESEND_FROM` – e.g. `Lybry <hello@yourdomain>` once the domain is verified in Resend
- `NEXT_PUBLIC_LEGAL_ENTITY`, `NEXT_PUBLIC_LEGAL_ADDRESS` – once the business is registered

Then `npm run check:launch` lists anything missing.

## 5. Legal defaults now live (change via env vars)

Operator: Craft & Anchor (Ghana). Law: Ghana. Minimum age 13, under-18s with a parent's permission. Refund requests within 14 days, reply within 5 business days, appeals within 30 days, liability capped at 12 months of payments. Creator payouts: manual during early access, terms confirmed before the first payout.
These are policy commitments. Read the four pages once before launch.

## 6. Added in the second round (10 Oct)

- **Icons:** 113 Lucide icons (ISC licence) built into `Icon.tsx`; every emoji in the UI now renders as an icon through `<Glyph>`. Old emoji saved in the database (community icons) still work. Settings → Interface style → Icon weight: Thin / Regular / Bold.
- **Interface styles:** Settings → Interface style: Classic, Glass, Soft, Outline, Pop. Saved per device, applied before the page paints.
- **Loader:** spells L-E-E-P, holds the word, then crashes into the "L." mark.
- **Welcome splash:** only right after sign-up / log-in (never on the landing page). Stays exactly as long as the page takes to load (min 0.9 s, max 7 s).
- **Holiday loaders:** Christmas (sleigh drops presents), Halloween, Easter (dates computed every year), New Year, Valentine's, Ghana Independence Day, and a Collab slot you name in /admin. Shown on the welcome splash and full-page loaders only while the event is on. Preview them all at `/koala`.
- **Guests can look around:** first chapter of any book, product pages, community room intros, search, the royalty calculator and creator docs. /home and /community send guests to Discover and the communities directory.
- **Security:** a paid product's video/course link is no longer readable by everyone (0043).


## 7. Free trial + Unlimited that actually works (11 Oct)

- **Before:** Unlimited took money and gave nothing. There was no way to "keep" a book.
- **Now:** a reader can start **one free trial per account** on `/unlimited`: 7 days, keep 2 books, no card, nothing to cancel. Subscribers keep their `picks_per_cycle` books per period.
- Kept books land in `purchases` (amount 0, `source` = `trial` or `box`), so they are owned for good.
- Only books whose creator switched on **"Include in Unlimited"** (creator edit page) can be kept. House "Lybry Originals" books are switched on by 0044.
- `/catalog?unlimited=1` lists what can be kept. The book page shows **"Keep with your trial"**. The end of a paid sample now offers the trial too.
- Prices now show in the currency you actually charge (`NEXT_PUBLIC_PAYSTACK_CURRENCY` × `NEXT_PUBLIC_PAYSTACK_USD_RATE`).
- Guests now get the mobile bottom tabs (Discover, Browse, Rooms, Try free, Sign up). Tiny 0.5–0.66rem text raised to 0.7rem.

Change the trial (Supabase SQL editor):
```sql
-- 14 days, 3 books
update public.site_settings set value = value || '{"trial_days":14,"trial_picks":3}' where key = 'features';
-- pause new trials
update public.site_settings set value = value || '{"trial":false}' where key = 'features';
-- see trials
select * from public.trials order by started_at desc;
```

**Before you sell Unlimited widely:** writers get nothing for books kept with a trial or box pick. That is honest only because it is opt-in. Decide a payout pool (e.g. a share of subscription revenue split by keeps) first.


## 8. Laterite redesign + guest fixes (11 Oct, second round)

- **New look:** Laterite palette, light by default (dark still in Settings). Nunito for the interface, Literata for reading. Chunky press-down buttons. Old "Obsidian Neon / Cyber Gold" themes removed.
- **Accent colour** (Settings): Laterite, Adire, Palm, Sobolo, Marigold. Recolours highlights only; the Lybry orange stays on buttons and the logo.
- **Loader fixed:** L·E·E·P letters are a real row now and can't merge into one.
- **Onboarding:** 3 questions (genres, format, daily time), then straight to books. No forced sign-up.
- **Free sample:** at least 2,500 words or 10% of the book (max half), whole chapters.
- **Guest progress:** welcome answers and books opened as a guest carry over at sign-up. Existing profile settings are merged, never wiped.
- **Phones:** one navigation (bottom tabs). The hamburger menu is gone; top bar = search, cart, account.
- **Digital products hidden** (switch `products` in site_settings). Buyers keep access.
- **18+ setting:** turning it on needs your password (or a sign-in in the last 15 min for Google/Discord) and a one-time date of birth showing 18+. The date is not stored. Enforced by the database.
- **Language setting removed** (it did nothing).
- **Policies updated:** Terms (§2, §3, §4, new §4a, §5), Privacy, Cookies, Refunds. Effective date 11 October 2026. Tell existing users about the change (email or an in-app notice), as Terms §10 promises.


## 9. Sign-up journey, koala avatar, Stripe (20 Oct)

- **Sign-up is a stepper:** Account ✓ → Details → Verify → Customise → Done. Starts at 20%. Fields go green/red as you type and shake if you press Next with a mistake. Sign-in errors go red and shake too.
- **New fields:** date of birth (required, private, 13+ enforced by the database) and pronouns (optional, public). No confirm-password: there's a Show button instead. The terms box starts unticked (it must, legally).
- **Make your koala:** fur, scarf, hat, glasses, book, background. Saved to `profiles.avatar`, shown on your profile. Editable in Settings ("Your koala").
- **18+ switch** now uses the stored birthday. A teen can't change it; it unlocks by itself at 18.
- **Onboarding** progress starts at 20% with checkpoint stamps.
- **Unlimited:** honest price contrast (cost per month, "Save 29% vs monthly", cost per book). Books per period are now fixed per plan (weekly 1, monthly 4, yearly 48): before, anyone could choose up to 50 for the same price.
- **Guests** who have started a book see "Don't lose N books you started. Save it free."
- **Landing:** a 15-second preview clip of the real app (190 KB, loads only when scrolled to). The old unused 15 MB of videos in `/public/video` are deleted.
- **Seasons:** Fourth of July and Thanksgiving added; Ghana Independence Day kept.
- **Legal:** country left out for now. Operator = the parent/guardian: set `NEXT_PUBLIC_LEGAL_ENTITY` to their full legal name in Vercel. Privacy now explains the stored date of birth and the under-13 rule (US COPPA).

### Payments: Paystack now, Stripe when you have it

Nothing changes until you add Stripe. When you do, in Vercel:

| Variable | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_…` (Stripe Dashboard → Developers → API keys) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` (Developers → Webhooks → add endpoint `https://YOUR-SITE/api/stripe/webhook`, event `checkout.session.completed`) |
| `NEXT_PUBLIC_PAYMENT_PROVIDER` | `stripe` |
| `NEXT_PUBLIC_SITE_URL` | `https://YOUR-SITE` |

Then redeploy. Book checkout and Unlimited go through Stripe in USD; Paystack switches off by itself. Coin packs (Paystack-only) pause until they're moved to Stripe. To remove Paystack completely later, delete the `PAYSTACK_*` variables. The Stripe account holder must be an adult (your parent/guardian).
