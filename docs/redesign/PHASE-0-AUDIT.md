# Libry Redesign — Phase 0 Audit

Audit date: 2026-11-14  
Working branch: `redesign/foundation`  
Repository: `Augustine-Dabanka/libry`  
Production branch remains: `main`  
Status: **Audit findings recorded; no production code or database changes made.**

## 1. Repository baseline

Confirmed from the repository:

- Next.js 16.3.3, React 19.2.8, TypeScript 5.
- Supabase SSR and Supabase JS client.
- Framer Motion for animation.
- Tiptap extensions, including image support.
- Fabric.js, JSZip, Mammoth, PDF.js and web-push are already dependencies.
- Existing quality scripts: `typecheck`, `check:launch`, `check`, `lint`, and `build`.
- The public landing route is a server component that reads the signed-in user and redirects authenticated users to `/home`. For guests it queries book counts, free books and communities.
- Current landing markup uses the visible wordmark `Lybry`; the product brief calls the platform `Libry`. This is a brand consistency issue to resolve in the landing-page design pass, not a blind global rename.
- Global CSS currently imports Nunito, Literata, Space Grotesk, Patrick Hand and Righteous. The redesign should deliberately define display, reading and interface typography roles rather than keep all font imports by default.
- A tracked `.env.production` path was found in the repository tree. Its contents were not retrieved. This requires a Git-history and deployment-secret audit. The existence of the file alone does not prove that it contains valid secrets.

## 2. Supabase project and data preservation

The connected Supabase organization contains a project named `libry_db` in `eu-west-1`, reporting `ACTIVE_HEALTHY` at audit time.

Read-only inspection of the public schema returned **61 tables**. RLS was enabled on all 61 tables in the table inventory. The database contains existing content and user activity; selected approximate table row counts returned by the management API include:

| Table | Rows |
|---|---:|
| books | 135 |
| chapters | 251 |
| profiles | 18 |
| reading_progress | 71 |
| book_likes | 54 |
| community_posts | 25 |
| communities | 13 |
| community_members | 14 |
| purchases | 4 |
| subscriptions | 0 |
| payout_accounts | 1 |
| payouts | 1 |

These counts are an audit snapshot, not guaranteed live totals. They are sufficient to establish that this database is not an empty redesign database. **Do not clear or recreate it.**

The repository contains a numbered migration history extending through migration 0050, while the connected database migration listing returned 20 records in its current response. This is a migration-history reconciliation warning, not proof by itself that the schemas are different. Before any DDL change, compare the complete repository migration set with the database migration history and inspect actual schema drift. Do not run migrations until this is reconciled.

## 3. Supabase advisor findings

The Supabase Security Advisor returned the following categories:

### High-priority review
- One `SECURITY DEFINER` view: `public.my_profile`.
- 38 functions flagged as executable by the `anon` role while marked `SECURITY DEFINER`.
- 16 tables with RLS enabled but no policies.
- Six functions flagged for mutable `search_path`.

These are advisor findings requiring code and privilege review. They are not all automatically exploitable vulnerabilities: some functions may intentionally be public, and RLS-enabled tables with no policies can be inaccessible rather than exposed. Still, privileged functions callable by `anon` and a security-definer view must be reviewed before any new public product surface is added.

### Performance review
- Nine indexes reported unused by the advisor. Do not drop them without query-usage context and workload review.
- Five tables reported multiple permissive policies for the same role/action.
- Several RLS policies repeatedly evaluate auth/current-setting functions per row. The advisor recommends scalar-subquery wrapping where appropriate.

No policies, functions, views, indexes or tables were changed during this audit.

## 4. Immediate Phase 0 priorities

1. **Credential hygiene:** inspect the tracked `.env.production` path and its Git history without exposing values. If a real secret was committed, revoke/rotate it at its provider. Removing the current file does not remove it from Git history.
2. **Migration reconciliation:** compare all repository migrations with database migration history and live schema. Establish a verified baseline before writing migrations.
3. **Security-definer review:** inspect all 38 flagged functions, their callers, grants, ownership checks and intended public exposure. Revoke anonymous execution or change function security only where the actual product contract supports it.
4. **View review:** inspect `public.my_profile` and decide whether it can safely use invoker security or should be restricted/moved.
5. **RLS policy review:** classify the 16 no-policy tables by intended access. Add narrowly scoped policies only after inspecting their data sensitivity and application use.
6. **Storage review:** inventory bucket names, public/private status, MIME limits and object policies before changing book-cover, chapter-art or comic-page delivery.
7. **Baseline checks:** run typecheck, lint, launch checks and production build in a reproducible environment. Record pre-existing failures before editing.
8. **Route/component map:** map current pages and components to the agreed product sections before any visual refactor.

## 5. Landing page design gate

No landing page implementation should begin until the product owner approves a concrete design direction. The design must account for:

- Correct Libry wordmark and brand assets.
- Global, premium editorial positioning.
- Books, comics, manga and manhwa as distinct content destinations.
- Creator/video/channel discovery without pretending unfinished features are live.
- Responsive layouts and clear mobile navigation.
- Accessibility, loading/empty/error states and reduced-motion support.
- Honest, database-backed platform claims and metrics.

## 6. Change log

- Created the isolated Git branch `redesign/foundation` from `main`.
- Added `docs/redesign/FOUNDATION.md` with product principles and section-completion gates.
- Added this Phase 0 audit.
- No application source files changed.
- No Supabase schema or data changed.
- No production deployment triggered.
