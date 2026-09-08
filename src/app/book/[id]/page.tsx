import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import BackButton from "@/components/BackButton";
import AddToCartButton from "@/components/AddToCartButton";
import WishlistButton from "@/components/WishlistButton";
import BookCard from "@/components/BookCard";
import Stars from "@/components/Stars";
import ReviewsSection, { type Review } from "@/components/ReviewsSection";
import ReportButton from "@/components/ReportButton";
import ShareButton from "@/components/ShareButton";
import { formatPrice, type Book } from "@/lib/types";
import { AGE_LABEL, agePill, isMatureRating } from "@/lib/content";

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
};

function coverGradient(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) % 360;
  return `linear-gradient(150deg, hsl(${h} 30% 28%), hsl(${(h + 40) % 360} 35% 16%))`;
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primary = await supabase
    .from("books")
    .select("id, title, author, description, content, price, type, status, age_rating, category, rating")
    .eq("id", id)
    .maybeSingle();
  let data = primary.data;
  if (primary.error) {
    const alt = await supabase
      .from("books")
      .select("id, title, author, description, content, price, type, status, category, rating")
      .eq("id", id)
      .maybeSingle();
    data = alt.data ? { ...alt.data, age_rating: null } : null;
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

  // Reviews (guarded).
  let reviews: Review[] = [];
  const rv = await supabase
    .from("reviews")
    .select("user_name, rating, body, created_at, user_id")
    .eq("book_id", book.id)
    .order("created_at", { ascending: false });
  if (!rv.error) reviews = (rv.data ?? []) as Review[];
  const reviewCount = reviews.length;
  const reviewAvg = reviewCount ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount : (book.rating ?? 0);
  const myReview = user ? reviews.find((r) => r.user_id === user.id) ?? null : null;

  // "Readers also read" — same category, else same type, else anything published.
  let related: Book[] = [];
  {
    let q = supabase.from("books").select("id, title, author, price, type, rating").eq("is_published", true).neq("id", book.id).limit(6);
    if (book.category) q = q.eq("category", book.category);
    else if (book.type) q = q.eq("type", book.type);
    const rl = await q;
    related = (rl.data ?? []) as Book[];
    if (related.length === 0) {
      const rl2 = await supabase.from("books").select("id, title, author, price, type, rating").eq("is_published", true).neq("id", book.id).limit(6);
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
      .select("bio, avatar_url, full_name, username")
      .or(`full_name.eq.${book.author},username.eq.${book.author}`)
      .maybeSingle();
    if (!ap.error && ap.data) authorBio = { bio: ap.data.bio ?? null, avatar: ap.data.avatar_url ?? null };
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
          <div className="book-cover" style={{ background: coverGradient(book.title) }}>
            <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "rgba(255,255,255,0.96)", fontSize: "1.3rem", lineHeight: 1.2 }}>
              {book.title}
            </span>
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
              {book.category ? <span className="badge">{book.category}</span> : null}
              {book.type && book.type !== book.category ? <span className="badge">{book.type}</span> : null}
              {book.status ? <span className="badge">{book.status}</span> : null}
              <span
                className={`age-pill${isMatureRating(book.age_rating) ? " mature" : ""}`}
                title={book.age_rating ? (AGE_LABEL[book.age_rating] ?? book.age_rating) : "All ages"}
              >
                {agePill(book.age_rating)}
              </span>
            </div>
            {book.description ? (
              <p style={{ color: "var(--ivory-muted)", marginTop: "1rem", maxWidth: 560 }}>{book.description}</p>
            ) : null}
            <div className="book-actions">
              {book.content ? (
                (book.type || "").toLowerCase() === "interactive" ? (
                  <a href={`/reader/${book.id}`} className="btn btn-gold">▸ Play the story →</a>
                ) : (
                  <a href={`/reader/${book.id}?sample=1`} className="btn btn-gold">Read a free sample →</a>
                )
              ) : null}
              {(book.price ?? 0) > 0 ? (
                <AddToCartButton item={{ id: book.id, title: book.title, author: book.author, price: book.price }} />
              ) : null}
              {user ? <WishlistButton bookId={Number(book.id)} userId={user.id} initial={wishlisted} /> : null}
              <ShareButton path={`/book/${book.id}`} title={book.title} />
            </div>
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
                  {authorBio?.bio || "This author hasn't added a bio yet."}
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
            <div className="book-grid">
              {related.map((b) => <BookCard key={b.id} book={b} />)}
            </div>
          </div>
        ) : null}

        {/* Reviews */}
        <ReviewsSection bookId={Number(book.id)} reviews={reviews} canReview={!!user} myReview={myReview} />

        {/* Trust & safety */}
        <div style={{ marginTop: "2.5rem", paddingTop: "1.4rem", borderTop: "1px solid var(--border)" }}>
          <ReportButton bookId={Number(book.id)} canReport={!!user} />
        </div>
      </section>
    </>
  );
}
