import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import BackButton from "@/components/BackButton";
import AddToCartButton from "@/components/AddToCartButton";
import WishlistButton from "@/components/WishlistButton";
import BookCard from "@/components/BookCard";
import Stars from "@/components/Stars";
import ReviewsSection, { type Review } from "@/components/ReviewsSection";
import ReportButton from "@/components/ReportButton";
import { formatPrice, type Book } from "@/lib/types";
import { AGE_LABEL } from "@/lib/content";

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

  const authorHref = book.author ? `/author/${encodeURIComponent(book.author)}` : null;

  return (
    <>
      <AppNav />
      <section className="section">
        <div style={{ marginBottom: "1.5rem" }}>
          <BackButton />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 220px) 1fr", gap: "2.5rem", alignItems: "start", marginBottom: "3rem" }}>
          <div style={{ aspectRatio: "2 / 3", borderRadius: 14, background: coverGradient(book.title), display: "flex", alignItems: "flex-end", padding: "1.3rem", boxShadow: "var(--shadow)" }}>
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
            <div style={{ display: "flex", gap: "0.6rem", margin: "1rem 0", flexWrap: "wrap" }}>
              <span className="price" style={{ fontSize: "1.1rem" }}>{formatPrice(book.price)}</span>
              {book.type ? <span className="badge">{book.type}</span> : null}
              {book.status ? <span className="badge">{book.status}</span> : null}
              {book.age_rating ? (
                <span className="badge" style={{ background: "rgba(124,124,180,0.2)", color: "#B7B7E6" }}>
                  {AGE_LABEL[book.age_rating] ?? book.age_rating}
                </span>
              ) : null}
            </div>
            {book.description ? (
              <p style={{ color: "var(--ivory-muted)", marginTop: "1rem", maxWidth: 560 }}>{book.description}</p>
            ) : null}
            <div style={{ marginTop: "1.6rem", display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
              {book.content ? (
                <a href={`/reader/${book.id}`} className="btn btn-gold">Start reading →</a>
              ) : null}
              {book.content ? (
                <a href={`/reader/${book.id}?sample=1`} className="btn btn-outline">Read a free sample</a>
              ) : null}
              {(book.price ?? 0) > 0 ? (
                <AddToCartButton item={{ id: book.id, title: book.title, author: book.author, price: book.price }} />
              ) : null}
              {user ? <WishlistButton bookId={Number(book.id)} userId={user.id} initial={wishlisted} /> : null}
            </div>
          </div>
        </div>

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
