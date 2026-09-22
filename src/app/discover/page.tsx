import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import BookMini from "@/components/BookMini";
import BookCarousel from "@/components/BookCarousel";
import ProductMini, { type ProductCard } from "@/components/ProductMini";
import { allowedRatings } from "@/lib/content";
import { type Book } from "@/lib/types";

export const metadata = { title: "Discover — Libry" };

// Distinct discovery modes (spec §7/§20). Each is a SEPARATE, documented ranking
// over real signals — never one universal score. Scoring rules are in code below.
const MODES: { key: string; label: string; why: string }[] = [
  { key: "trending", label: "Trending", why: "Recent genuine attention — readers and reviews this stretch." },
  { key: "new", label: "New", why: "Freshly published stories." },
  { key: "updated", label: "Updated", why: "Recently refreshed with new content." },
  { key: "rising", label: "Rising", why: "Newer stories gaining readers quickly." },
  { key: "completed", label: "Most Completed", why: "Stories readers actually finish." },
  { key: "discussed", label: "Most Discussed", why: "The most reviewed and talked-about." },
  { key: "hidden-gems", label: "Hidden Gems", why: "Loved by readers, not yet widely seen." },
  { key: "new-voices", label: "New Voices", why: "Early work from emerging creators." },
  { key: "interactive", label: "Interactive", why: "Choose-your-path stories that branch." },
  { key: "free", label: "Free reads", why: "Great stories, nothing to pay." },
];

type PoolBook = Book & { rating?: number | null; created_at?: string | null; updated_at?: string | null; age_rating?: string | null };

export default async function Discover({ searchParams }: { searchParams: Promise<{ mode?: string; filter?: string }> }) {
  const sp = await searchParams;
  const raw = sp.mode || sp.filter || "trending"; // back-compat with ?filter=
  const mode = MODES.some((m) => m.key === raw) ? raw : "trending";
  const active = MODES.find((m) => m.key === mode) ?? MODES[0]!;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let showMature = false;
  if (user) {
    const sm = await supabase.from("profiles").select("show_mature").eq("id", user.id).maybeSingle();
    showMature = sm.data?.show_mature ?? false;
  }
  const allowed = allowedRatings(showMature);

  // Candidate pool (published, age-filtered) — bounded, never the whole catalog.
  let pool: PoolBook[] = [];
  {
    const q = await supabase
      .from("books")
      .select("id, title, author, price, type, category, cover_url, rating, created_at, updated_at, age_rating")
      .eq("is_published", true)
      .in("age_rating", allowed)
      .limit(300);
    if (!q.error && q.data) pool = q.data as PoolBook[];
    else {
      const q2 = await supabase.from("books").select("id, title, author, price, type, category, cover_url, rating").eq("is_published", true).limit(300);
      pool = (q2.data ?? []) as PoolBook[];
    }
  }

  // Real reading signals: unique readers + finishers per book.
  const readers = new Map<number, number>();
  const finishers = new Map<number, number>();
  {
    const prog = await supabase.from("reading_progress").select("book_id, user_email, progress_percentage").limit(8000);
    if (!prog.error && prog.data) {
      const seen = new Map<number, Set<string>>();
      for (const r of prog.data as { book_id: number; user_email: string; progress_percentage: number | null }[]) {
        const id = Number(r.book_id);
        if (!seen.has(id)) seen.set(id, new Set());
        seen.get(id)!.add(r.user_email);
        if (Number(r.progress_percentage ?? 0) >= 100) finishers.set(id, (finishers.get(id) ?? 0) + 1);
      }
      for (const [id, set] of seen) readers.set(id, set.size);
    }
  }
  // Review counts (proxy for discussion).
  const reviews = new Map<number, number>();
  {
    const rv = await supabase.from("reviews").select("book_id");
    if (!rv.error && rv.data) for (const r of rv.data as { book_id: number }[]) reviews.set(Number(r.book_id), (reviews.get(Number(r.book_id)) ?? 0) + 1);
  }

  const now = Date.now();
  const ageDays = (b: PoolBook) => (b.created_at ? Math.max(1, (now - new Date(b.created_at).getTime()) / 86400000) : 3650);
  const rd = (b: PoolBook) => readers.get(Number(b.id)) ?? 0;
  const fin = (b: PoolBook) => finishers.get(Number(b.id)) ?? 0;
  const rev = (b: PoolBook) => reviews.get(Number(b.id)) ?? 0;
  const isComic = (t?: string | null) => ["comic", "comics", "graphic novel", "webtoon"].includes((t || "").toLowerCase());

  // Per-author published counts within the pool (for New Voices).
  const byAuthor = new Map<string, number>();
  for (const b of pool) if (b.author) byAuthor.set(b.author, (byAuthor.get(b.author) ?? 0) + 1);

  const medianReaders = (() => {
    const v = pool.map(rd).sort((a, b) => a - b);
    return v.length ? v[Math.floor(v.length / 2)] ?? 0 : 0;
  })();

  let books: PoolBook[] = [];
  switch (mode) {
    case "new":
      books = [...pool].sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime() || Number(b.id) - Number(a.id));
      break;
    case "updated":
      books = [...pool].sort((a, b) => new Date(b.updated_at ?? b.created_at ?? 0).getTime() - new Date(a.updated_at ?? a.created_at ?? 0).getTime());
      break;
    case "rising":
      // readers per day since publish, biased to newer stories with real pickup.
      books = [...pool].filter((b) => rd(b) > 0).sort((a, b) => rd(b) / ageDays(b) - rd(a) / ageDays(a));
      break;
    case "completed":
      books = [...pool].filter((b) => fin(b) > 0).sort((a, b) => fin(b) - fin(a) || (fin(b) / Math.max(1, rd(b))) - (fin(a) / Math.max(1, rd(a))));
      break;
    case "discussed":
      books = [...pool].filter((b) => rev(b) > 0).sort((a, b) => rev(b) - rev(a));
      break;
    case "hidden-gems":
      // Well-rated but under-seen: rating ≥ 4 and readers at/below the median.
      books = [...pool].filter((b) => Number(b.rating ?? 0) >= 4 && rd(b) <= medianReaders).sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0));
      break;
    case "new-voices":
      books = [...pool].filter((b) => b.author && (byAuthor.get(b.author) ?? 0) <= 2).sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
      break;
    case "interactive":
      books = [...pool].filter((b) => (b.type || "").toLowerCase() === "interactive");
      break;
    case "free":
      books = [...pool].filter((b) => !b.price || Number(b.price) <= 0);
      break;
    case "trending":
    default:
      // Recent genuine attention: readers + finishers + reviews, with a mild
      // freshness nudge so stale back-catalog doesn't dominate.
      books = [...pool].sort((a, b) => {
        const s = (x: PoolBook) => rd(x) * 2 + fin(x) * 3 + rev(x) * 2 + (ageDays(x) < 30 ? 2 : 0);
        return s(b) - s(a);
      });
      break;
  }
  books = books.slice(0, 48);

  // Comics get their own home; keep the grid focused on stories unless the mode is broad.
  if (!["interactive", "free"].includes(mode)) books = books.filter((b) => !isComic(b.type));

  // Digital products + creator spotlight (guarded pre-migration).
  let products: ProductCard[] = [];
  {
    const pp = await supabase.from("products").select("id, title, type, price, cover_url, category").eq("is_published", true).order("created_at", { ascending: false }).limit(18);
    if (!pp.error && pp.data) products = pp.data as ProductCard[];
  }
  let spotlight: Book[] = [];
  {
    const pr = await supabase.from("promotions").select("book_id").eq("status", "active").gt("ends_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(12);
    if (!pr.error && pr.data?.length) {
      const ids = [...new Set((pr.data as { book_id: number }[]).map((r) => r.book_id))];
      const sb = await supabase.from("books").select("id, title, author, price, type, category, cover_url").in("id", ids).eq("is_published", true);
      if (!sb.error) spotlight = (sb.data ?? []) as unknown as Book[];
    }
  }

  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 1100, marginInline: "auto" }}>
        <div className="section-header" style={{ marginBottom: "0.3rem" }}>
          <h1 style={{ fontSize: "clamp(1.7rem,4.5vw,2.4rem)" }}>Discover</h1>
          <a href="/search" style={{ color: "var(--gold)", fontFamily: "var(--sans)" }}>🔍 Search</a>
        </div>

        {spotlight.length > 0 ? (
          <div style={{ margin: "0.8rem 0 1.4rem" }}>
            <BookCarousel title="✦ Spotlight" books={spotlight} href="/discover" />
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.78rem", marginTop: "-0.4rem" }}>Promoted by their creators.</p>
          </div>
        ) : null}

        {/* Mode chips */}
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
          {MODES.map((m) => {
            const on = m.key === mode;
            return (
              <a key={m.key} href={`/discover?mode=${m.key}`} style={{ flexShrink: 0, textDecoration: "none", padding: "0.45rem 0.95rem", borderRadius: 999, fontFamily: "var(--sans)", fontSize: "0.85rem", fontWeight: 700, whiteSpace: "nowrap", border: `1px solid ${on ? "var(--gold)" : "var(--border)"}`, background: on ? "var(--gold)" : "var(--stone)", color: on ? "#12100E" : "var(--ivory-muted)" }}>{m.label}</a>
            );
          })}
        </div>
        {/* Transparent "why this ranking" (spec §19/§20) */}
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.86rem", marginBottom: "1.4rem" }}>{active.why}</p>

        {books.length > 0 ? (
          <div className="book-grid-mini">
            {books.map((b) => (
              <BookMini key={b.id} book={b} />
            ))}
          </div>
        ) : (
          <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "2.8rem 2rem", textAlign: "center", background: "var(--stone)" }}>
            <div style={{ fontSize: "1.6rem", marginBottom: "0.4rem" }}>✦</div>
            <p style={{ fontSize: "1.1rem", marginBottom: "0.4rem", color: "var(--ivory)" }}>Nothing here yet.</p>
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", maxWidth: 460, margin: "0 auto" }}>
              This ranking fills in as readers read and review. Meanwhile, try <a href="/discover?mode=new" style={{ color: "var(--gold)" }}>New</a> or <a href="/catalog" style={{ color: "var(--gold)" }}>browse the catalog</a>.
            </p>
          </div>
        )}

        {products.length > 0 ? (
          <div style={{ marginTop: "2.6rem" }}>
            <div className="section-header">
              <h2>🎁 Digital products</h2>
              <a href="/discover" style={{ color: "var(--gold)", fontFamily: "var(--sans)" }}>From creators</a>
            </div>
            <div className="book-grid-mini">
              {products.map((p) => (
                <ProductMini key={p.id} product={p} />
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
