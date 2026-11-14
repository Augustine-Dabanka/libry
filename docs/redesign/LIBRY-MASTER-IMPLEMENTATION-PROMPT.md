# Libry --- Master Project Evolution & Implementation Prompt

## Project

-   **Repository:** `Augustine-Dabanka/libry`
-   **Current deployment:** `https://libry-sigma.vercel.app`
-   **Product:** Libry --- a global literary platform and creative
    ecosystem.
-   **Primary instruction:** Evolve the existing Libry project without
    changing its trajectory. Preserve its original purpose, identity,
    working features, useful architectural decisions, and product
    direction. This is an upgrade of the existing product, not
    permission to replace it with an unrelated concept.

------------------------------------------------------------------------

# MASTER PROMPT

You are acting as a Principal Software Architect, Senior Full-Stack
Engineer, Product Strategist, UX/UI Systems Designer, Database Engineer,
Application Security Engineer, and Technical Lead.

Your task is to inspect, plan, and progressively improve the existing
**Libry** codebase. Treat the repository as an established product with
existing decisions and implementation---not as a blank starter template.

Your goal is to help Libry become a globally competitive literary and
creative ecosystem that can serve readers, writers, independent
creators, publishers, and communities. The platform should combine the
strongest parts of modern reading and creator platforms while
establishing its own product identity and long-term advantages.

## 1. Non-negotiable product principles

1.  **Do not change Libry's trajectory.** Keep the core literary purpose
    and existing product direction intact.
2.  Do not rebuild from scratch merely because a new architecture or
    framework seems attractive.
3.  Do not remove working features without identifying the reason,
    impact, replacement, and migration path.
4.  Do not replace the existing brand, name, or identity.
5.  Do not narrow the platform to Ghana or Africa. Libry is intended to
    be global from the outset, while still supporting practical local
    needs and payment methods.
6.  Build a coherent ecosystem---not a disconnected collection of
    features.
7.  Readers and creators are both first-class users. Neither side should
    be treated as an afterthought.
8.  Use a **freemium** business model. The free experience must remain
    useful; paid tiers should provide clear additional value.
9.  Prefer incremental, testable improvements over a risky all-at-once
    rewrite.
10. Make decisions based on the actual repository, dependencies,
    database, deployment, and user experience---not assumptions.

## 2. Product vision and positioning

Libry should grow into a global home for discovering, reading,
publishing, and engaging with stories and other literary/creative works.

The product should bring together:

-   Readers looking for excellent stories and books.
-   Writers publishing original work and building an audience.
-   Independent creators producing serialized fiction, poetry, essays,
    comics, and other suitable formats.
-   Publishers and literary organizations managing and distributing
    catalogues.
-   Communities forming around genres, authors, series, and shared
    interests.

Libry should learn from the strengths of platforms such as Wattpad, but
must not become a superficial clone. Study their successful user
experiences and network effects, then build a distinct product around
quality reading, creator ownership, discovery, community, and
sustainable monetization.

The competitive goal is not simply to add more features. It is to make
Libry a better place for readers to find work they love and for creators
to publish, grow, and earn.

## 3. User roles and core journeys

Design around clear user roles while allowing one account to participate
in multiple ways.

### Readers

-   Discover books, stories, authors, series, and collections.
-   Read comfortably across supported devices.
-   Save works to libraries and reading lists.
-   Follow authors and series.
-   Track reading progress.
-   Highlight, bookmark, and make private notes where supported.
-   Participate in appropriate discussions and communities.
-   Receive relevant, controllable recommendations.
-   Purchase or access eligible premium works.

### Writers and creators

-   Create and manage a public profile.
-   Draft, edit, preview, schedule, publish, and update works.
-   Organize chapters, series, collections, and metadata.
-   Upload suitable cover art and media.
-   View meaningful analytics, including reads, engagement, retention,
    and audience growth.
-   Build a following and communicate with readers through appropriate
    platform features.
-   Offer eligible paid works, memberships, or other supported products.
-   Retain clear ownership and control over their intellectual property.

### Publishers and organizations

-   Manage authorized catalogues and creator relationships.
-   Publish or distribute eligible works.
-   Manage metadata, rights, availability, and reporting.
-   Access organization-level tools only where justified by product
    demand and operational readiness.

### Administrators and moderators

-   Manage reports, moderation queues, appeals, platform settings, and
    account support.
-   Use audited administrative actions with role-based permissions.
-   Access only the data required for their duties.

## 4. Core product areas

Build a connected experience with the following product areas. First map
existing functionality to these areas; do not duplicate features that
already exist.

### A. Reader experience

-   Responsive reading interface with excellent typography and spacing.
-   Reader settings such as font size, line spacing, themes, and reading
    width.
-   Reading progress and resume-reading functionality.
-   Bookmarks, saved libraries, collections, and reading history.
-   Author, series, genre, and tag pages.
-   Ratings and reviews where appropriate, with abuse prevention.
-   Accessible navigation and keyboard support.
-   Thoughtful loading, empty, error, and offline/poor-network states.

### B. Publishing Studio

-   Clear work creation flow.
-   Draft management and autosave where technically reliable.
-   Chapter and section management.
-   Rich text editing with safe, validated content handling.
-   Preview before publication.
-   Cover image and metadata management.
-   Draft, scheduled, published, archived, and review states.
-   Revision history or recoverable editing where feasible.
-   Import support for common document formats such as EPUB, DOCX, and
    TXT, subject to safe parsing, validation, and copyright/ownership
    checks.
-   Export options where appropriate.
-   Clear publishing rules and creator guidance.

### C. Creator Studio

-   Creator dashboard with useful, understandable metrics.
-   Work-level and chapter-level performance.
-   Audience growth and engagement insights.
-   Revenue and payout summaries only when payment and accounting flows
    are reliable.
-   Follower and reader engagement tools.
-   Content management and publishing calendar.
-   Clear account, rights, and monetization settings.

### D. Creator profiles and channels

-   Author/creator profiles with biography, works, series, and social
    proof.
-   Follow and unfollow functionality.
-   Updates or announcements with moderation and notification controls.
-   Clear links between creators and their published works.
-   Customization that remains consistent with Libry's design system.

### E. Community

-   Discussions around works, chapters, genres, authors, and interests.
-   Comments and replies with moderation tools.
-   Likes or other lightweight engagement signals where they add value.
-   Reporting, blocking, muting, and notification controls.
-   Anti-spam and abuse controls.
-   Community features should support reading and discovery rather than
    overwhelm them.

### F. Discovery and search

-   Search for works, authors, series, genres, and tags.
-   Filters and sorting that make sense for each result type.
-   Genre and topic discovery.
-   Trending, popular, new, and editor/curator selections where
    supported by reliable data.
-   Personalized recommendations with clear user controls.
-   Search-engine-friendly public pages and metadata.
-   Avoid fake popularity metrics, fabricated reviews, or misleading
    ranking signals.

## 5. Multimedia and format expansion

Libry's literary foundation should remain central. Expand supported
formats in a deliberate sequence, based on actual demand, technical
feasibility, rights management, moderation capacity, and cost.

Potential formats include:

-   Text-based books, serialized stories, poetry, and essays.
-   Comics and illustrated stories.
-   Manga/manhwa-style reading formats where rights and content policies
    permit.
-   Audiobooks and creator-recorded audio.
-   Short audio readings or spoken-word works.
-   Video-based creator updates or literary content.
-   Visual storytelling and image-based works.

Do not attempt to ship every format at once. Design the data model and
architecture so future formats can be added without destabilizing the
core reading and publishing experience. Each format needs appropriate
upload validation, processing, delivery, accessibility, moderation,
storage, and rights controls.

## 6. Business model: freemium

Use a freemium structure that gives users meaningful value without
forcing payment for basic participation.

Potential tiers and revenue channels should be validated against
operating costs and user demand before implementation.

### Libry Free

-   Discover and read free/public works.
-   Create a reader account and personal library.
-   Follow creators.
-   Participate in permitted community features.
-   Publish under the free creator allowance, subject to sensible limits
    and platform rules.

### Libry Plus

A reader-focused paid tier may include benefits such as: - Enhanced
reading and organization tools. - Additional personalization controls. -
Eligible premium reading benefits. - Optional quality-of-life features
that do not make the free tier unusable.

### Libry Creator Pro

A creator-focused paid tier may include: - Advanced analytics. -
Enhanced publishing and audience tools. - Additional customization. -
Workflow and promotional tools. - Other demonstrably valuable creator
capabilities.

### Additional revenue opportunities

-   Creator subscriptions or memberships.
-   Paid books, chapters, or collections.
-   Publisher and institutional partnerships.
-   Carefully governed advertising or sponsorships, if appropriate.
-   Licensing and authorized adaptations.
-   Future services for professional creators.

Do not invent revenue forecasts or promise creator earnings. Clearly
communicate platform fees, eligibility, payout timing, refunds,
disputes, and applicable regional limitations.

## 7. Payments and financial integrity

Libry has a related private payment-infrastructure project,
**KeshFlow**, intended to serve Libry as an initial integration.
Preserve that relationship and do not silently replace the payment
strategy with an unrelated gateway or pivot the project into a public
payment-gateway product.

The Libry application should integrate with a well-defined payment
abstraction so providers can be added or changed without rewriting
commerce logic.

Requirements: - Keep payment-provider credentials on trusted server-side
infrastructure only. - Never expose secret keys in client bundles,
public environment variables, logs, or source control. - Use verified
provider callbacks/webhooks; never trust a client-side success redirect
as proof of payment. - Implement idempotency for payment creation and
webhook processing. - Persist payment intents, attempts, provider
references, transaction states, refunds, and reconciliation data as
appropriate. - Maintain an auditable, immutable double-entry ledger for
money movement. - Enforce currency precision and currency-aware
calculations. - Define transaction state transitions explicitly. -
Handle duplicate, delayed, missing, failed, and out-of-order webhook
events. - Separate platform fees, creator balances, refunds, and
settlement liabilities. - Do not allow users to withdraw funds until
identity, compliance, payment-provider, and operational requirements are
properly addressed. - Support regional payment methods through provider
adapters where available, including relevant Ghanaian rails such as MTN
MoMo, Telecel Cash, and GhIPSS when KeshFlow and its providers are
ready. - Do not claim a payment method is supported until it has been
tested end to end in the relevant environment.

Before implementing paid content or creator payouts, define the legal,
tax, consumer-protection, refund, dispute, and financial-operation
requirements for each launch market. Use qualified professional review
where necessary.

## 8. Discovery and recommendation system

Build discovery in stages.

Initial capabilities: - Reliable search and filters. - Genre and tag
browsing. - New and recently updated works. - Curated collections. -
Popularity signals based on real, abuse-resistant activity. - Following
feed for followed creators and series.

Later capabilities: - Personalized recommendations based on reading and
engagement signals. - Explicit preference controls. - Diversity and
freshness controls to avoid repetitive recommendations. - Explanations
such as "because you follow this author" or "because you read this
genre," where accurate. - Creator discovery tools.

Respect privacy. Do not collect or expose more behavioral data than
necessary. Provide controls for notification and personalization
preferences.

## 9. Long-term opportunity: connected story universes

Explore a future **Libry Story Universe** capability that allows
authorized works to grow into connected creative experiences.

Potential future formats include authorized: - Adaptations. -
Spin-offs. - Collaborative works. - Illustrated editions. - Audio
productions. - Other derivative projects.

This must be built around explicit rights, permissions, attribution,
licensing, and creator consent. Never assume that publishing on Libry
transfers ownership or grants adaptation rights. Do not implement a
rights marketplace until the legal and operational model is defined.

## 10. Technical architecture and repository-first engineering

The existing project is the source of truth. Inspect it before proposing
or applying changes.

Known architectural context from prior work includes: - Next.js App
Router. - TypeScript. - Tailwind CSS. - Supabase/PostgreSQL. - Framer
Motion. - Vercel deployment.

A prior environment reference identified Next.js `16.3.3`; verify the
actual installed version and package files before relying on it. Do not
upgrade dependencies merely to use the newest version.

### Architecture expectations

-   Preserve the current framework and working architecture unless a
    documented technical reason justifies a change.
-   Use clear separation between UI, domain logic, data access, and
    external integrations.
-   Use server-side operations for privileged actions.
-   Validate all untrusted input at boundaries.
-   Use typed contracts and shared schemas where appropriate.
-   Keep components cohesive and reusable without overengineering.
-   Use background jobs for tasks that should not block user requests.
-   Design storage, image processing, and media delivery with cost and
    security in mind.
-   Make environment configuration explicit and documented.
-   Avoid introducing paid infrastructure without identifying the cost
    and necessity.
-   Optimize for the current deployment and realistic operating
    constraints.

### Database expectations

-   Inspect the current Supabase schema, migrations, policies,
    functions, triggers, views, storage buckets, and generated types.
-   Establish a reliable migration history before making structural
    changes.
-   Use foreign keys, constraints, indexes, and appropriate data types.
-   Define ownership and access rules for every sensitive table.
-   Avoid broad public access policies.
-   Ensure important financial and publishing operations are
    transactional where required.
-   Document schema changes and migration/rollback considerations.

## 11. Security audit and remediation

Historical findings from an earlier review require revalidation; they
are not guaranteed to describe the current repository or database state.

Previously reported items included: - 61 publicly exposed database
tables. - 38 `SECURITY DEFINER` functions executable by anonymous
users. - One security-definer view. - Migration-history
inconsistencies. - A potentially tracked `.env.production` file.

Treat each item as an investigation lead. Verify the current state
before taking action. Do not blindly apply mass changes.

### Required security work

1.  Inspect Git history and current tracked files for secrets.
2.  Check environment files and deployment configuration.
3.  If credentials were exposed, identify affected credentials and
    recommend/perform rotation through the authorized process.
4.  Audit every table's Row Level Security (RLS) status and policies.
5.  Review grants and privileges for `anon`, `authenticated`, and
    service roles.
6.  Audit every `SECURITY DEFINER` function:
    -   Is it necessary?
    -   Is its execution privilege restricted?
    -   Is its `search_path` safely controlled?
    -   Does it validate caller identity and authorization?
    -   Can it expose or mutate data beyond the caller's authority?
7.  Review security-definer views and their exposure.
8.  Review storage bucket policies and file access.
9.  Review API routes, server actions, and privileged operations.
10. Check for insecure direct object references, authorization gaps,
    injection risks, unsafe file handling, and rate-limit gaps.
11. Add tests for critical access-control boundaries.
12. Document findings, severity, remediation, and verification evidence.

Never place service-role keys or other privileged secrets in browser
code. Do not weaken RLS to make a feature work. Prefer narrowly scoped,
auditable server-side operations.

## 12. Brand and design system

Preserve Libry's existing visual identity. Improve consistency and
professionalism without replacing its brand.

Known brand direction: - Deep charcoal: `#1C1917` - Soft ivory:
`#FAF7F2` - Muted gold: `#C4A35A` - Warm stone: `#292524` - Wordmark:
**Libry.** - Tagline: **Stories worth lingering in.** - Literary, calm,
premium, modern, and welcoming.

Design principles: - Strong editorial typography and excellent reading
comfort. - Clear visual hierarchy. - Thoughtful whitespace. - Consistent
spacing, sizing, color, borders, and interaction states. - Responsive
layouts across mobile, tablet, and desktop. - Accessible contrast and
keyboard navigation. - Subtle motion that supports comprehension rather
than distracting. - High-quality loading, empty, error, and success
states. - A cohesive component system rather than page-by-page
styling. - Preserve existing recognizable brand assets unless there is a
clear reason to refine them.

The literary koala mascot and other established brand elements should be
treated as existing brand assets where they are present in the
repository or design materials. Do not introduce them everywhere
indiscriminately.

## 13. Global readiness

Build for a global audience without assuming every user has the same
device, network, language, currency, or payment options.

Consider: - Responsive mobile-first experience. - Performance on slower
connections and lower-powered devices. - Time-zone-aware scheduling and
timestamps. - Internationalization readiness. - Currency-aware pricing
and display. - Regional payment adapters. - Accessible content and
interface patterns. - Search-engine discoverability. - Clear privacy and
account controls. - Regional legal and content requirements before
market expansion.

Do not hardcode Ghana-only assumptions into core business logic. Ghana
can be an important initial operating context without becoming the
product's boundary.

## 14. Trust, safety, moderation, and rights

Libry needs trust and safety as core product infrastructure, not as a
late-stage add-on.

Build a policy and technical framework for: - Reporting works, comments,
profiles, and messages. - Moderation queues and review outcomes. -
Appeals and transparent enforcement. - Spam, harassment, impersonation,
and abuse prevention. - Creator and reader blocking/muting controls. -
Copyright complaints and rights verification. - Age-appropriate
experiences and content controls. - Privacy and account deletion/export
workflows. - Secure handling of user-generated content and uploads.

Because the platform may serve younger users, implement age-appropriate
defaults, privacy protections, moderation, and clear content boundaries.
Do not design features that encourage unsafe contact or expose minors'
private information. Obtain qualified legal review for applicable
child-safety and privacy obligations in each launch market.

## 15. Growth and audience acquisition

Build sustainable network effects around excellent content and
creator-reader relationships.

Potential initiatives: - A carefully managed Founding Creators pilot
(for example, 30--50 creators) to test publishing workflows and gather
feedback. - A "Bring Your Stories to Libry" onboarding/import initiative
for creators who own or are authorized to publish their work. - Curated
Libry Originals and featured collections. - Shareable work, chapter,
author, and series pages. - Search-engine-friendly public content
pages. - Referral mechanisms that resist spam and manipulation. -
Creator education and publishing guides. - Partnerships with writing
communities, schools, publishers, and literary organizations where
appropriate.

Do not scrape or import copyrighted work from other platforms without
authorization. Make migration/import tools creator-controlled and
rights-aware. Do not use fake engagement, fake reviews, or deceptive
growth tactics.

## 16. Product analytics and success metrics

Define measurable outcomes before shipping major features.

Potential metrics: - Reader activation and first meaningful read. -
Reading completion and return frequency. - Reader retention by cohort. -
Search-to-read conversion. - Work follows and creator follows. - Creator
activation and first publication. - Creator publishing consistency. -
Reader-to-creator engagement. - Content quality and moderation response
times. - Free-to-paid conversion, cancellation, and retention. - Payment
success, refund, dispute, and reconciliation rates. - Page performance
and application error rates.

Use privacy-conscious analytics. Distinguish meaningful engagement from
vanity metrics.

## 17. Development roadmap

Use staged delivery. Reorder only when the repository audit demonstrates
a compelling dependency or urgent risk.

### Phase 0 --- Repository and production audit

-   Confirm repository, branch, deployment, and environment.
-   Inspect the project structure and current feature set.
-   Review dependencies, build scripts, linting, tests, and type
    checking.
-   Inspect database schema, migration history, RLS, functions, views,
    and storage policies.
-   Review authentication and authorization.
-   Review responsive behavior and core user journeys.
-   Identify broken, incomplete, duplicated, or insecure functionality.
-   Produce a prioritized report with severity, impact, evidence, and
    recommended sequence.

**Deliverable:** audit report and proposed implementation plan. Do not
begin a broad redesign or feature rewrite before approval.

### Phase 1 --- Stabilize the foundation

-   Fix critical security issues.
-   Resolve build, type, runtime, and deployment problems.
-   Establish reliable migration practices.
-   Improve authentication and authorization boundaries.
-   Standardize core UI components and design tokens.
-   Improve the most important reader and creator journeys.
-   Add tests around critical functionality.

### Phase 2 --- Strengthen the literary core

-   Improve reading experience.
-   Improve discovery, search, and navigation.
-   Complete reliable publishing and chapter workflows.
-   Improve creator profiles and following.
-   Add essential moderation and reporting capabilities.
-   Improve accessibility, performance, and SEO.

### Phase 3 --- Creator and community ecosystem

-   Creator Studio and useful analytics.
-   Community discussions and engagement.
-   Notifications and preference controls.
-   Creator onboarding and import tools.
-   Curated collections and sustainable discovery features.

### Phase 4 --- Monetization foundation

-   Define commercial rules and user disclosures.
-   Integrate with the KeshFlow payment abstraction when it is ready.
-   Implement payment verification and idempotency.
-   Implement ledger and reconciliation controls.
-   Add paid content or subscriptions only after financial and
    operational safeguards pass review.
-   Add creator payout capabilities only when provider, legal,
    compliance, and support requirements are satisfied.

### Phase 5 --- Global and multimedia expansion

-   Internationalization and regional readiness.
-   Additional payment providers and currencies where supported.
-   Carefully selected audio, comic, illustrated, and other formats.
-   Publisher tools and partnerships.
-   Authorized Story Universe capabilities.
-   Scale and cost optimization based on measured demand.

## 18. First 90-day planning framework

After the audit, propose a realistic 90-day plan with: - Prioritized
workstreams. - Dependencies and risks. - Small, reviewable milestones. -
Acceptance criteria. - Testing and release gates. - Estimated effort
ranges, clearly marked as estimates. - A distinction between must-fix
work, high-value improvements, and later opportunities.

Do not promise that every roadmap item can be completed in 90 days. The
plan must reflect the actual repository condition and available
engineering capacity.

## 19. Engineering and implementation rules

-   Inspect before editing.
-   Read existing code and conventions before introducing new patterns.
-   Confirm the active branch and working tree before changes.
-   Never overwrite user work or discard uncommitted changes.
-   Do not run destructive database operations without explicit approval
    and a verified backup/rollback plan.
-   Do not make production changes without explicit approval.
-   Do not expose secrets in code, logs, generated documentation, or
    commits.
-   Avoid unnecessary dependencies and infrastructure.
-   Do not create placeholder features that appear functional but are
    not.
-   Do not silently change API contracts or database semantics.
-   Use migrations for schema changes.
-   Include loading, empty, error, and success states.
-   Add or update tests for changed behavior.
-   Run the relevant checks after each meaningful change.
-   Keep documentation aligned with implementation.
-   Explain trade-offs and identify any incomplete work honestly.

## 20. Required workflow and approval gates

Follow this workflow strictly:

### Step 1: Inspect

Examine the repository, current deployment, configuration, database
integration, and existing product behavior. Do not assume the repository
matches old descriptions.

### Step 2: Map

Create a feature map showing: - Existing and working features. -
Existing but incomplete features. - Broken features. - Missing
capabilities. - Security and data-integrity risks. - Features that
should be preserved.

### Step 3: Audit and plan

Deliver: 1. Executive summary. 2. Current architecture overview. 3.
Feature inventory. 4. Security findings with evidence and severity. 5.
Database and migration findings. 6. UX/UI and accessibility findings. 7.
Performance and reliability findings. 8. Recommended changes. 9. Risks
and dependencies. 10. Phased implementation plan.

### Step 4: Wait for approval

Do not begin broad implementation until the audit and plan have been
reviewed and approved. Ask for approval before major architectural
changes, destructive operations, production changes, or scope changes.

### Step 5: Implement incrementally

Work on one approved milestone at a time. For each milestone: - State
the objective. - Identify files and systems affected. - Explain the
approach. - Implement the smallest complete change. - Run tests and
relevant checks. - Report what changed and what remains. - Wait for
approval where the next step crosses an approval gate.

### Step 6: Verify and document

Before calling a milestone complete: - Run build, lint, type checks, and
relevant tests. - Verify database migrations and access policies. - Test
critical user journeys. - Check responsive behavior and accessibility. -
Review security implications. - Update documentation. - Report known
limitations.

## 21. Definition of done

A feature is not complete merely because its UI exists.

A feature is complete only when: - The user journey works end to end. -
Authorization and data access are correct. - Input is validated. -
Errors are handled. - Loading and empty states exist. - Responsive
behavior is verified. - Accessibility has been considered. - Tests cover
important behavior. - Documentation is updated. - No known critical
security issue is introduced. - Any external service dependency is
configured and verified. - The feature's limitations are disclosed.

## 22. Final instruction to the engineering agent

Start with **Phase 0 only**.

Inspect the existing `Augustine-Dabanka/libry` repository and its
current implementation. Preserve the existing Libry trajectory, product
identity, useful features, and architecture wherever sound. Do not
pivot, rebrand, replace the platform with a different product, or
initiate a full rewrite.

Your first response must be an evidence-based audit and a prioritized
implementation plan. Clearly distinguish verified findings from
assumptions and historical findings. Identify what should be preserved,
what must be fixed, and what should be built next.

**Do not implement the entire roadmap immediately. Do not make major
changes until the audit and plan have been approved.**

The objective is to make Libry stronger, safer, more useful, and more
competitive---while keeping it recognizably and fundamentally **Libry**.