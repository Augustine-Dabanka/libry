# Phase 1 — Landing Page Design Specification

Status: **Design proposal prepared — owner visual approval required before source implementation**
Working branch: `redesign/foundation`
Scope: public route `/` only. Authenticated users must continue to redirect to `/home`.

## 1. Design intent

Create a premium, global literary and visual-storytelling front door for Libry. The visual language is editorial and cinematic, not a generic SaaS template and not an endless social feed.

The approved brand reference is:
- Deep charcoal: `#1C1917`
- Soft ivory: `#FAF7F2`
- Muted gold: `#C4A35A`
- Supporting surfaces: warm charcoal/stone variations, subtle neutral borders and restrained shadows.

Use gold as a deliberate accent for active navigation, primary actions, small metadata and selected highlights. Do not turn every element gold. Avoid neon gradients, glassmorphism overload, decorative blobs, emoji iconography and excessive rounded-card repetition.

Typography roles:
- Display/editorial: a high-quality serif with strong contrast and readable italics.
- Interface/body: a neutral, highly legible sans-serif.
- Metadata: same sans-serif with clear size/contrast hierarchy.
- Keep font loading lean; avoid loading decorative fonts that have no assigned role.

## 2. Proposed page composition

### A. Announcement strip
A compact, dismissible announcement for a real launch/update message. Do not claim a feature is live unless it is live. Keep it out of the way of the main navigation.

### B. Global navigation
- Libry wordmark and approved book mark.
- Primary destinations: Books, Comics, Manga, Manhwa, Creators, More.
- Search entry with a clear search affordance.
- Log in and primary Join/Sign up action.
- Mobile: accessible menu with the same destinations; no horizontal overflow.

**Route integrity rule:** current repository inspection confirms routes for `/comics`, `/catalog`, `/unlimited`, `/communities`, `/creator` and `/home`. It does not currently confirm first-class routes for `/manga`, `/manhwa`, `/videos` or `/channels`. Do not link to nonexistent routes. Until those sections exist, use clearly labeled filtered catalog destinations only when the underlying content model supports them, or present them as upcoming with no misleading click target.

### C. Hero — primary brand moment
Editorial headline direction: **“Find the story that stays with you.”**
Supporting copy should explain the actual current offer: discover books, original stories and visual storytelling from creators. Avoid vague claims and unverified creator payout figures.

Primary CTA: Explore stories (must lead to a real browse route).
Secondary CTA: Meet the creators / How Libry works (must lead to an existing section or route).

Hero art direction:
- A richly art-directed, warm-lit library or reading room with a small number of large, legible, properly licensed story-cover artworks.
- Art should feel commissioned and curated, with varied visual genres and coherent lighting.
- Do not use the generated concept's placeholder/fictitious titles, fabricated creator identity, fake follower counts, or invented book metadata in production.
- Prefer real published cover assets from Supabase. If suitable images are unavailable, use a commissioned brand illustration that is not presented as a real book.

### D. Content-family navigation
Four distinct entry points with equal design quality:
- Books
- Comics
- Manga
- Manhwa

Keep the destinations visually distinct but within one design system. Only expose routes and counts backed by actual product support. Manga/manhwa may initially resolve to catalog filters if the database's type/category values can be verified; otherwise mark as forthcoming without a dead link.

### E. Editorial discovery shelf
A restrained “Editor's picks” / “Reader favourites” shelf backed by published content. Cards need:
- Cover image with robust fallback.
- Title and creator/author from the database.
- Format/genre labels only when verified.
- Rating/review metadata only when available and meaningful.
- One obvious action to open the title.

Never fabricate titles, authors, cover art, review counts, ratings, or popularity.

### F. Creator and community preview
Showcase the creator proposition and communities using real public data and honest wording. Keep any revenue-share claim aligned with the current approved partnership terms and current application implementation; do not repeat an unverified percentage as a universal promise.

### G. Video/channels teaser
The product roadmap includes creator channels and video, but route inspection did not confirm a production video or channel destination. The landing page may introduce the long-term vision as a clearly labeled preview or “coming later” section. Do not present a fake video player, fake creator channel, invented metrics, or nonfunctional subscribe/play controls.

### H. Footer
Clear links to verified routes and legal pages, social links only where official handles are confirmed, and the Libry tagline: **“Stories worth lingering in.”**

## 3. Functional and data requirements

Preserve the existing server-side behavior:
- Read authenticated user and redirect to `/home`.
- Query published and free book counts from Supabase.
- Query an age-appropriate free-book shelf using existing content rules.
- Query communities for the public showcase.
- Handle query errors and empty data gracefully; no blank sections or fake fallback metrics.

Improve the page behavior:
- Search and navigation must be keyboard accessible.
- Use semantic landmarks, one clear H1, logical heading order and visible focus.
- Every interactive element must have a real destination/action.
- Provide responsive image sizing, meaningful alt text and image fallbacks.
- Honor `prefers-reduced-motion`; do not use autoplaying marquee shelves as the default.
- Avoid loading heavy client components above the fold unless necessary.
- Do not introduce new database migrations or change Supabase data for a visual redesign.

## 4. Responsive behavior

### Desktop
Wide editorial hero with text and artwork composition; clear four-category navigation; content shelf with consistent cover ratios and readable metadata.

### Tablet
Reduce hero complexity, preserve hierarchy and keep navigation/search usable without crowding.

### Mobile
Single-column hero; artwork remains visible without pushing the primary CTA far below the fold; category cards become a swipeable or stacked accessible list; content shelves scroll horizontally only when keyboard and touch interaction remain usable; footer becomes compact columns/accordions.

## 5. Accessibility and quality bar

- WCAG 2.2 AA target for text contrast and interactive controls.
- Keyboard navigation and visible focus across all links, buttons and menus.
- Reduced-motion support and pause controls for any nonessential auto-moving content.
- Touch targets sized for mobile use.
- Avoid text embedded in imagery.
- No layout shift from missing covers; define image aspect ratios and fallback states.
- Test at narrow mobile, standard mobile, tablet, laptop and wide desktop breakpoints.

## 6. Implementation sequence

1. Confirm the owner approves the visual direction.
2. Inspect the complete current landing page and CSS, shared navigation/footer behavior, all linked routes and relevant data types.
3. Implement the new landing markup while preserving server-side queries and auth redirect.
4. Implement landing-scoped CSS/tokens; do not globally alter the rest of the application.
5. Replace unsupported/legacy claims with verified product copy.
6. Validate links, empty states, image fallbacks, responsive layouts, accessibility and reduced motion.
7. Run `npm run typecheck`, `npm run lint`, `npm run check:launch` and `npm run build` in the project environment.
8. Review the Vercel preview and fix issues.
9. Obtain explicit owner approval before marking the landing page complete or moving to another section.

## 7. Known baseline issues to resolve during implementation

- Landing page currently spells the brand `Lybry`; the approved brand is `Libry`.
- Existing landing page and global design tokens use a laterite/terracotta-led palette, which conflicts with the approved charcoal/ivory/muted-gold direction.
- The current page contains claims such as a 65% creator share, “unlimited free for 7 days,” “no card,” and a minimum 2,500-word sample. Verify each claim against current product logic and partnership terms before retaining it.
- Existing marketing page references interactive story demo, moving book shelf, preview clip and community showcase. Reuse only where the functionality and data are accurate and the visual quality meets the new standard.
- Existing route inspection did not confirm dedicated manga, manhwa, video or channel pages. Do not ship dead links.

## 8. Definition of done

The landing page is complete only when the section completion contract in `FOUNDATION.md` is satisfied, the preview is reviewed on real device sizes, all claims and links are verified, the required checks pass, and the owner explicitly approves it.
