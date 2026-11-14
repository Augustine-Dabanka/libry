# Libry Redesign — Foundation

Status: Phase 0 in progress  
Working branch: `redesign/foundation`  
Production branch: `main` (do not modify during this phase)

## Product direction

Libry is a global literary and visual-storytelling platform. It should combine the strongest parts of reading, serialized fiction, comics, creator publishing, video, community and discovery products without becoming a cluttered copy of any one competitor.

The experience must feel editorial, intentional, premium and human-made. Avoid generic template layouts, decorative noise, arbitrary gradients, repetitive AI-looking imagery and placeholder stick-figure art.

Content families must have clear, first-class destinations:
- Books and serialized fiction
- Comics
- Manga
- Manhwa
- Video and creator channels
- Community and direct messaging

Different content formats may have distinct art direction and reading controls while sharing a coherent design system.

## Non-negotiable engineering rules

1. Work section by section. A section is not complete until its design, responsive states, accessibility, functionality, data behavior and regression checks pass.
2. Do not begin the next section until the current section has owner approval.
3. Keep completed sections in the regression suite. Later changes must not silently degrade them.
4. Never clear or reset production Supabase data to make redesign work easier.
5. Prefer additive, reversible, versioned database migrations. Back up and test before any production migration.
6. Keep `main` production-safe. Develop on this branch and use pull requests for review.
7. Do not expose secrets in source, logs, screenshots, commits or documentation.
8. Do not fabricate metrics, creator payouts, content rights, ratings or availability.
9. Respect content licensing, creator permissions, age ratings, privacy and user-selected personalization.
10. Future update delivery must distinguish optional feature updates from security, compatibility and legally required updates. Never promise that a user can permanently decline a critical security fix.

## Confirmed repository baseline (inspection only)

- Next.js 16.3.3, React 19.2.8 and TypeScript 5.
- Supabase SSR and Supabase JS client.
- Framer Motion.
- Tiptap editor extensions, including image support.
- Existing scripts: `npm run typecheck`, `npm run check:launch`, `npm run check`, `npm run lint`, `npm run build`.
- The current landing page is server-rendered and queries Supabase for published/free book counts, a free-book shelf and communities.
- The current landing page source displays the spelling `Lybry`, while the product brief calls the product `Libry`. Treat `Libry` as the intended product name, but confirm all brand assets and metadata before making a global rename.
- The current global stylesheet imports Nunito, Literata, Space Grotesk, Patrick Hand and Righteous. The redesign should rationalize typography rather than blindly preserve every font.
- The repository contains a Supabase migrations directory with numbered migrations. Preserve its history; do not squash or delete it as part of a visual redesign.
- A file named `.env.production` appears in the repository tree. Its contents have deliberately not been fetched or copied into this document. Audit its Git history and deployment usage, determine whether any real credentials were committed, and rotate affected credentials if necessary. Removing a file from the current tree does not erase historical Git exposure.

## Phase 0 audit checklist

### Repository and delivery
- [ ] Confirm default branch, branch protection and deployment branch mapping.
- [ ] Review README, route tree, shared layouts, component boundaries and CSS ownership.
- [ ] Identify dead, duplicated and conflicting components before refactoring.
- [ ] Record current build, typecheck, lint and launch-check baselines.
- [ ] Identify preview deployment and safe rollback procedure.

### Security and privacy
- [ ] Audit tracked environment/config files without printing secret values.
- [ ] Check Git history for credentials and rotate any exposed credentials.
- [ ] Verify Supabase RLS policies and Storage policies for user, creator and paid content.
- [ ] Review authorization boundaries for purchases, creator earnings, messaging and admin actions.
- [ ] Review upload validation, signed URLs, rate limits, webhook verification and logging.
- [ ] Review account deletion, export, consent and personalization controls.

### Data and architecture
- [ ] Inventory all Supabase tables, views, functions, triggers, policies, buckets and migrations.
- [ ] Map existing routes and components to product capabilities.
- [ ] Identify current cover-image, chapter-image and comic-page storage formats.
- [ ] Map content ownership, licenses, age ratings, purchase entitlements and creator revenue records.
- [ ] Propose schema changes only after the inventory and data-flow map are complete.

## Section completion contract

A section can be marked complete only when all of these are true:
- Approved visual direction and interaction specification.
- Desktop, tablet and mobile layouts reviewed.
- Loading, empty, error, disabled and success states designed.
- Keyboard navigation, focus visibility, semantic structure and contrast checked.
- Real data and authorization behavior verified; no fake production data.
- Existing relevant behavior preserved or intentionally migrated.
- Typecheck, lint, launch checks and production build pass, or documented baseline failures are isolated and approved.
- Regression checks for all previously approved sections pass.
- Owner reviews the preview and explicitly approves the section.

## First implementation target: Landing page

Do not start a full visual rewrite until Phase 0 audit is recorded and the landing-page direction is approved.

Landing page scope:
- Brand wordmark and navigation
- Hero narrative and primary calls to action
- Editorial discovery and content-category entry points
- Distinct showcases for books, comics, manga and manhwa
- Creator/video discovery preview
- Trust, creator value proposition and platform explanation
- Responsive footer and legal/help navigation

The landing page must not pretend that video, channels, monetization or catalog categories are fully available if their underlying features are not production-ready.
