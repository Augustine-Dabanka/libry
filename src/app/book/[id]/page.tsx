import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import BackButton from "@/components/BackButton";
import AddToCartButton from "@/components/AddToCartButton";
import WishlistButton from "@/components/WishlistButton";
import LikeButton from "@/components/LikeButton";
import BookMini from "@/components/BookMini";
import Stars from "@/components/Stars";
import ReviewsSection, { type Review } from "@/components/ReviewsSection";
import StoryCommunityButton from "@/components/StoryCommunityButton";
import ReportButton from "@/components/ReportButton";
import ShareButton from "@/components/ShareButton";
import ContinueOnPhone from "@/components/ContinueOnPhone";
import { formatPrice, bookCover, genCover, bookFormat, type Book } from "@/lib/types";
import { AGE_LABEL, agePill, isMatureRating } from "@/lib/content";
import { AUTHOR_BIOS } from "@/lib/authorBios";

type BookDetail = {
  id: number | string;
  title: string;
  author: string | null;
  description: string | null;
  content: string | null;
  price: number | null;
  type: string | null;
  status: string | null;
  age_rating: string | null;
  category: string | null;
  rating: number | null;
  cover_url?: string | null;
  user_id?: string | null;
};


export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primary = await supabase
    .from("books")
    .select("id, title, author, description, content, price, type, status, age_rating, category, rating, cover_url, tags, user_id")
    .eq("id", id)
    .maybeSingle();
  let data = primary.data;
  if (primary.error) {
    const alt = await supabase
      .from("books")
      .select("id, title, author, description, content, price, type, status, category, rating, cover_url")
      .eq("id", id)
      .maybeSingle();
    data = alt.data ? { ...alt.data, age_rating: null, tags: [] } : null;
  }
  const book = data as BookDetail | null;

  if (!book) {
    return (
      <>
        <AppNav />
        <section className="section" style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <BackButton />
          </div>
          <h2>Story not found</h2>
          <p style={{ color: "var(--muted)", marginTop: "0.6rem" }}>
            This story may have been removed. <a href="/catalog" style={{ color: "var(--gold)" }}>Back to catalog →</a>
          </p>
        </section>
      </>
    );
  }

  // 18+ age gate — block Mature (16+/18+) titles unless the reader enabled it.
  if (isMatureRating(book.age_rating)) {
    let showMature = false;
    if (user) {
      const sm = await supabase.from("profiles").select("show_mature").eq("id", user.id).maybeSingle();
      showMature = !!sm.data?.show_mature;
    }
    if (!showMature) {
      return (
        <>
          <AppNav />
          <section className="section" style={{ textAlign: "center", maxWidth: 460, margin: "0 auto" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.6rem" }}>🔞</div>
            <h2>This is an 18+ title</h2>
            <p style={{ color: "var(--muted)", margin: "0.6rem 0 1.4rem" }}>
              Mature content is off by default. Turn on <strong>Show mature content</strong> in Settings to view it.
            </p>
            <div style={{ display: "flex", gap: "0.7rem", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/settings" className="btn btn-gold">Open Settings</a>
              <a href="/catalog" className="btn btn-outline">Back to catalog</a>
            </div>
          </section>
        </>
      );
    }
  }

  // Wishlist state (guarded — table may be pre-migration).
  let wishlisted = false;
  if (user) {
    const wl = await supabase.from("wishlist").select("book_id").eq("user_id", user.id).eq("book_id", book.id).maybeSingle();
    wishlisted = !!wl.data;
  }

  // Ownership + saved reading position, so the CTA can become "Continue reading".
  const isFreeBook = (book.price ?? 0) <= 0;
  let owned = isFreeBook;
  let progressPct = 0;
  if (user) {
    if (!owned) {
      const pu = await supabase.from("purchases").select("id").eq("user_id", user.id).eq("book_id", book.id).maybeSingle();
      owned = !!pu.data;
    }
    if (user.email) {
      const rp = await supabase
        .from("reading_progress")
        .select("progress_percentage")
        .eq("user_email", user.email)
        .eq("book_id", String(book.id))
        .maybeSingle();
      if (!rp.error) progressPct = Math.min(100, Math.round(Number(rp.data?.progress_percentage ?? 0)));
    }
  }

  // Story-specific community (spec §31): show the linked community, or let the
  // creator start one, pre-configured from this story.
  const isCreator = !!user && !!book.user_id && book.user_id === user.id;
  let storyCommunity: { slug: string; name: string; member_count: number } | null = null;
  {
    const sc = await supabase.from("communities").select("slug, name, member_count").eq("book_id", book.id).maybeSingle();
    if (!sc.error && sc.data) storyCommunity = sc.data as { slug: string; name: string; member_count: number };
  }
  const isInteractive = (book.type || "").toLowerCase() === "interactive";
  const hasProgress = owned && progressPct > 3 && progressPct < 100;

  // Likes (public read; guarded).
  let likeCount = 0;
  let liked = false;
  {
    const lc = await supabase.from("book_likes").select("user_id", { count: "exact", head: true }).eq("book_id", book.id);
    if (!lc.error) likeCount = lc.count ?? 0;
    if (user) {
      const mine = await supabase.from("book_likes").select("book_id").eq("book_id", book.id).eq("user_id", user.id).maybeSingle();
      liked = !!mine.data;
    }
  }

  // Reviews (guarded).
  let reviews: Review[] = [];
  const rv = await supabase
    .from("reviews")
    .select("id, user_name, rating, body, created_at, user_id")
    .eq("book_id", book.id)
    .order("created_at", { ascending: false });
  if (!rv.error) reviews = (rv.data ?? []) as Review[];
  const reviewCount = reviews.length;
  const reviewAvg = reviewCount ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount : (book.rating ?? 0);
  const myReview = user ? reviews.find((r) => r.user_id === user.id) ?? null : null;

  // "Readers also read" — same category, else same type, else anything published.
  let related: Book[] = [];
  {
    let q = supabase.from("books").select("id, title, author, price, type, rating, category, cover_url").eq("is_published", true).neq("id", book.id).limit(6);
    if (book.category) q = q.eq("category", book.category);
    else if (book.type) q = q.eq("type", book.type);
    const rl = await q;
    related = (rl.data ?? []) as Book[];
    if (related.length === 0) {
      const rl2 = await supabase.from("books").select("id, title, author, price, type, rating, category, cover_url").eq("is_published", true).neq("id", book.id).limit(6);
      related = (rl2.data ?? []) as Book[];
    }
  }

  // Table of contents — chapter titles, if the book has chapter rows.
  let toc: { title: string; n: number }[] = [];
  {
    const ch = await supabase
      .from("chapters")
      .select("title, chapter_number")
      .eq("book_id", book.id)
      .order("chapter_number", { ascending: true });
    toc = (ch.data ?? []).map((c: { title: string | null; chapter_number: number | null }, i: number) => ({
      title: c.title || `Chapter ${i + 1}`,
      n: c.chapter_number ?? i + 1,
    }));
  }

  // About the author — a matching creator profile's bio, if one exists.
  let authorBio: { bio: string | null; avatar: string | null } | null = null;
  if (book.author) {
    const ap = await supabase
      .from("profiles")
      .select("bio, avatar_url, creator_avatar_url, full_name, username, pen_name")
      .or(`pen_name.eq.${book.author},full_name.eq.${book.author},username.eq.${book.author}`)
      .maybeSingle();
    if (!ap.error && ap.data) authorBio = { bio: ap.data.bio ?? null, avatar: (ap.data as { creator_avatar_url?: string | null }).creator_avatar_url ?? ap.data.avatar_url ?? null };
  }

  const authorHref = book.author ? `/author/${encodeURIComponent(book.author)}` : null;
  const authorInitial = (book.author || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <>
      <AppNav />
      <section className="section">
        <div style={{ marginBottom: "1.5rem" }}>
          <BackButton />
        </div>
        <div className="book-hero">
          <div className="book-cover" style={{ padding: 0, overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bookCover(book) || genCover(book.title, book.author)} alt={`Cover of ${book.title}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>

          <div>
            <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>{book.title}</h1>
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", marginTop: "0.4rem" }}>
              by{" "}
              {authorHref ? (
                <a href={authorHref} style={{ color: "var(--gold)" }}>{book.author}</a>
              ) : (
                "Unknown author"
              )}
            </p>
            {reviewAvg > 0 ? (
              <div style={{ marginTop: "0.7rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Stars value={reviewAvg} size={16} showValue />
                <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem" }}>
                  {reviewCount ? `· ${reviewCount} review${reviewCount === 1 ? "" : "s"}` : ""}
                </span>
              </div>
            ) : null}
            <div style={{ display: "flex", gap: "0.6rem", margin: "1rem 0", flexWrap: "wrap", alignItems: "center" }}>
              <span className="price" style={{ fontSize: "1.1rem" }}>{formatPrice(book.price)}</span>
              {(() => { const f = bookFormat(book.type); return <span className="badge" style={{ background: "rgba(196,163,90,0.14)", color: "var(--gold)", borderColor: "rgba(196,163,90,0.35)" }}>{f.icon} {f.label}</span>; })()}
              {book.category ? <span className="badge">{book.category}</span> : null}
              {book.status ? <span className="badge">{book.status}</span> : null}
              <span
                className={`age-pill${isMatureRating(book.age_rating) ? " mature" : ""}`}
                title={book.age_rating ? (AGE_LABEL[book.age_rating] ?? book.age_rating) : "All ages"}
              >
                {agePill(book.age_rating)}
              </span>
            </div>
            {(() => {
              const tags = ((book as { tags?: string[] | null }).tags ?? []).filter(Boolean);
              return tags.length ? (
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.2rem" }}>
                  {tags.slice(0, 8).map((t) => (
                    <a key={t} href={`/catalog?tag=${encodeURIComponent(t)}`} style={{ textDecoration: "none", fontFamily: "var(--sans)", fontSize: "0.75rem", fontWeight: 600, color: "var(--gold)", background: "rgba(196,163,90,0.12)", border: "1px solid rgba(196,163,90,0.3)", borderRadius: 999, padding: "0.2rem 0.6rem" }}>
                      #{t}
                    </a>
                  ))}
                </div>
              ) : null;
            })()}
            {book.description ? (
              <p style={{ color: "var(--ivory-muted)", marginTop: "1rem", maxWidth: 560 }}>{book.description}</p>
            ) : null}
            {(book.price ?? 0) > 0 && !owned && !isInteractive ? (
              <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.84rem", marginTop: "0.8rem" }}>
                ✓ Buy once — read online <em>and</em> download your own EPUB copy to keep.
              </p>
            ) : null}
            <div className="book-actions">
              {book.content ? (
                isInteractive ? (
                  <a href={`/reader/${book.id}`} className="btn btn-gold">▸ Play the story →</a>
                ) : owned ? (
                  <a href={`/reader/${book.id}`} className="btn btn-gold">
                    {hasProgress ? `Continue reading · ${progressPct}%` : "Read now →"}
                  </a>
                ) : (
                  <a href={`/reader/${book.id}?sample=1`} className="btn btn-gold">Read a free sample →</a>
                )
              ) : null}
              {owned && book.content && !isInteractive ? (
                <a href={`/api/book/${book.id}/epub`} className="btn btn-outline" download title="Download a personal, watermarked EPUB you keep">
                  ⬇ Download EPUB
                </a>
              ) : null}
              {(book.price ?? 0) > 0 && !owned ? (
                <AddToCartButton item={{ id: book.id, title: book.title, author: book.author, price: book.price }} />
              ) : null}
              {user ? <WishlistButton bookId={Number(book.id)} userId={user.id} initial={wishlisted} /> : null}
              <LikeButton bookId={Number(book.id)} userId={user?.id ?? null} initialLiked={liked} initialCount={likeCount} />
              <ShareButton path={`/book/${book.id}`} title={book.title} />
              {owned ? <ContinueOnPhone path={`/reader/${book.id}`} /> : null}
            </div>
            {hasProgress ? (
              <div style={{ marginTop: "0.4rem", maxWidth: 320 }}>
                <div style={{ height: 5, borderRadius: 999, background: "var(--border)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg,#5FA068,#C5A059)" }} />
                </div>
                <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.76rem", marginTop: "0.35rem" }}>
                  You&apos;re {progressPct}% through — pick up where you left off.
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Table of contents */}
        {toc.length > 0 ? (
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "0.6rem" }}>Table of contents</h2>
            <ol className="book-toc">
              {toc.map((c, i) => (
                <li key={i}>
                  <a href={`/reader/${book.id}`}>
                    <span className="n">{String(c.n).padStart(2, "0")}</span>
                    <span>{c.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {/* Story community (spec §31) */}
        {storyCommunity ? (
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "0.8rem" }}>Community</h2>
            <a href={`/c/${storyCommunity.slug}`} style={{ display: "flex", alignItems: "center", gap: "1rem", textDecoration: "none", background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "1rem 1.2rem" }}>
              <span style={{ fontSize: "1.6rem" }}>📖</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--serif)", color: "var(--ivory)", fontSize: "1.08rem" }}>{storyCommunity.name}</div>
                <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.82rem" }}>👥 {storyCommunity.member_count.toLocaleString()} member{storyCommunity.member_count === 1 ? "" : "s"} · theories, chapter chat &amp; more</div>
              </div>
              <span style={{ color: "var(--gold)", fontFamily: "var(--sans)", fontWeight: 700, flexShrink: 0 }}>Open →</span>
            </a>
          </div>
        ) : isCreator ? (
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "0.4rem" }}>Community</h2>
            <StoryCommunityButton bookId={Number(book.id)} />
          </div>
        ) : null}

        {/* About the author */}
        {book.author ? (
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "0.8rem" }}>About the author</h2>
            <div className="author-card">
              {authorBio?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={authorBio.avatar} alt={book.author} className="avatar" style={{ objectFit: "cover" }} />
              ) : (
                <div className="avatar">{authorInitial}</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: "1.2rem", color: "var(--ivory)" }}>{book.author}</div>
                <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.92rem", margin: "0.4rem 0 0.7rem", lineHeight: 1.6 }}>
                  {authorBio?.bio || (book.author && AUTHOR_BIOS[book.author]) || "This author hasn't added a bio yet."}
                </p>
                {authorHref ? (
                  <a href={authorHref} className="btn btn-outline" style={{ padding: "0.35rem 0.9rem", fontSize: "0.82rem" }}>
                    More from {book.author} →
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {/* Readers also read */}
        {related.length > 0 ? (
          <div style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>Readers also read</h2>
            <div className="book-grid-mini">
              {related.map((b) => <BookMini key={b.id} book={b} />)}
            </div>
          </div>
        ) : null}

        {/* Reviews */}
        <ReviewsSection bookId={Number(book.id)} reviews={reviews} canReview={!!user} myReview={myReview} signedIn={!!user} />

        {/* Trust & safety */}
        <div style={{ marginTop: "2.5rem", paddingTop: "1.4rem", borderTop: "1px solid var(--border)" }}>
          <ReportButton bookId={Number(book.id)} canReport={!!user} />
        </div>
      </section>
    </>
  );
}
