# Leep update (10 Oct 2026)

What this changes:
- **Libry is now Leep** everywhere a person can see it: page titles, app name, install name, loader (L·E·E·P), emails, push titles, legal pages, book covers, coupon examples.
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
git add -A && git commit -m "Rename to Leep, remove legal placeholders, contact form, launch switches"
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
| 0040_rename_to_leep.sql | after the Leep code is live |
| 0041_contact_messages.sql | before anyone uses /contact |
| 0042_launch_switches.sql | after 0038 |
| 0043_guest_preview.sql | after this code is live **and** `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel |

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
- `RESEND_FROM` – e.g. `Leep <hello@yourdomain>` once the domain is verified in Resend
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
