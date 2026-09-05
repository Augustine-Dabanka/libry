import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/types";
import Stars from "@/components/Stars";
import ShareCampaign from "@/components/ShareCampaign";

type Campaign = {
  id: number | string;
  title: string;
  author: string | null;
  description: string | null;
  price: number | null;
  type: string | null;
  rating: number | null;
  content: string | null;
};

function coverGradient(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) % 360;
  return `linear-gradient(150deg, hsl(${h} 40% 30%), hsl(${(h + 40) % 360} 45% 16%))`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("books").select("title, author, description").eq("id", id).maybeSingle();
  if (!data) return { title: "Libry" };
  const desc = data.description || `Read ${data.title}${data.author ? ` by ${data.author}` : ""} on Libry.`;
  return {
    title: `${data.title} — Libry`,
    description: desc,
    openGraph: { title: data.title, description: desc, type: "book" },
    twitter: { card: "summary_large_image", title: data.title, description: desc },
  };
}

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("books")
    .select("id, title, author, description, price, type, rating, content")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();
  const book = data as Campaign | null;

  if (!book) {
    return (
      <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "var(--charcoal)", textAlign: "center", padding: "2rem" }}>
        <div>
          <h1>Not found</h1>
          <p style={{ color: "var(--muted)", marginTop: "0.6rem" }}>
            <a href="/catalog" style={{ color: "var(--gold)" }}>Browse the catalog →</a>
          </p>
        </div>
      </main>
    );
  }

  // Rating (guarded).
  let avg = book.rating ?? 0;
  let count = 0;
  const rv = await supabase.from("reviews").select("rating").eq("book_id", book.id);
  if (!rv.error && (rv.data ?? []).length) {
    const rs = rv.data as { rating: number }[];
    count = rs.length;
    avg = rs.reduce((s, r) => s + r.rating, 0) / count;
  }

  const isFree = (book.price ?? 0) <= 0;
  const isInteractive = (book.type || "").toLowerCase() === "interactive";
  const authorHref = book.author ? `/author/${encodeURIComponent(book.author)}` : null;
  const sampleHref = isInteractive ? `/reader/${book.id}` : `/reader/${book.id}?sample=1`;
  const primaryHref = user ? `/book/${book.id}` : "/onboarding";

  return (
    <main style={{ minHeight: "100dvh", background: "radial-gradient(1000px 500px at 50% -10%, rgba(197,160,89,0.10), transparent 60%), var(--charcoal)", color: "var(--ivory)" }}>
      {/* minimal header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.1rem clamp(1.1rem,5vw,3rem)" }}>
        <a href="/" style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: "1.25rem", color: "var(--ivory)", textDecoration: "none" }}>
          Libry<span style={{ color: "var(--gold)" }}>.</span>
        </a>
        <a href="/catalog" style={{ fontFamily: "var(--sans)", fontSize: "0.88rem", color: "var(--muted)", textDecoration: "none" }}>Browse all →</a>
      </div>

      <section style={{ maxWidth: 900, margin: "0 auto", padding: "clamp(1.5rem,5vw,3rem) clamp(1.1rem,5vw,2rem) 4rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 240px) 1fr", gap: "clamp(1.5rem,5vw,3rem)", alignItems: "start" }}>
          <div style={{ aspectRatio: "2 / 3", borderRadius: 16, background: coverGradient(book.title), display: "flex", alignItems: "flex-end", padding: "1.4rem", boxShadow: "0 24px 60px rgba(0,0,0,0.45)" }}>
            <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "rgba(255,255,255,0.96)", fontSize: "1.4rem", lineHeight: 1.2 }}>{book.title}</span>
          </div>

          <div>
            <h1 style={{ fontSize: "clamp(1.9rem, 5vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.01em" }}>{book.title}</h1>
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", marginTop: "0.5rem" }}>
              by {authorHref ? <a href={authorHref} style={{ color: "var(--gold)" }}>{book.author}</a> : "Unknown author"}
            </p>
            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", margin: "1rem 0", flexWrap: "wrap" }}>
              <span className="price" style={{ fontSize: "1.2rem" }}>{formatPrice(book.price)}</span>
              {book.type ? <span className="badge">{book.type}</span> : null}
              {avg > 0 ? <Stars value={avg} size={16} showValue /> : null}
              {count > 0 ? <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem" }}>· {count} review{count === 1 ? "" : "s"}</span> : null}
            </div>
            {book.description ? (
              <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", lineHeight: 1.7, maxWidth: 560, marginTop: "1rem" }}>{book.description}</p>
            ) : null}

            <div style={{ marginTop: "1.8rem", display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
              {book.content ? (
                <a href={sampleHref} className="btn btn-gold" style={{ padding: "0.85rem 1.6rem", fontSize: "1rem" }}>
                  {isInteractive ? "▸ Play the story free" : "Read the first chapter free →"}
                </a>
              ) : null}
              <a href={primaryHref} className="btn btn-outline" style={{ padding: "0.85rem 1.6rem", fontSize: "1rem" }}>
                {isFree ? "Open on Libry" : user ? "Get it on Libry" : "Sign up to read"}
              </a>
            </div>
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.82rem", marginTop: "1rem" }}>
              {isFree ? "Free to read — no card required." : "Read the first chapter free before you buy."}
            </p>
          </div>
        </div>

        {/* Share (for creators promoting the book) */}
        <div style={{ marginTop: "3rem", paddingTop: "1.8rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "var(--sans)", fontWeight: 700, marginBottom: "0.2rem" }}>Share this book</div>
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.88rem", marginBottom: "0.9rem" }}>
            Post this link anywhere — social bios, DMs, a newsletter. Anyone can open it, read the first chapter free, and start reading.
          </p>
          <ShareCampaign path={`/b/${book.id}`} />
        </div>

        <p style={{ textAlign: "center", color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.8rem", marginTop: "3rem" }}>
          Powered by <a href="/" style={{ color: "var(--gold)" }}>Libry</a> — the bookstore that actually pays its writers.
        </p>
      </section>
    </main>
  );
}
