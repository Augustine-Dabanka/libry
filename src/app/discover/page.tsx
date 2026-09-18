import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import BookMini from "@/components/BookMini";
import BookCarousel from "@/components/BookCarousel";
import { allowedRatings } from "@/lib/content";
import { type Book } from "@/lib/types";

const FILTERS = [
  { key: "editors-pick", label: "Editor's Pick" },
  { key: "free", label: "Free reads" },
  { key: "interactive", label: "Interactive" },
  { key: "all", label: "Everything" },
];

export default async function Discover({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: rawFilter } = await searchParams;
  const filter = FILTERS.some((f) => f.key === rawFilter) ? (rawFilter as string) : "editors-pick";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let showMature = false;
  if (user) {
    const sm = await supabase.from("profiles").select("show_mature").eq("id", user.id).maybeSingle();
    showMature = sm.data?.show_mature ?? false;
  }
  const allowed = allowedRatings(showMature);

  const run = (withAge: boolean, withPick: boolean) => {
    let q = supabase
      .from("books")
      .select(withAge ? "id, title, author, price, type, age_rating, cover_url" : "id, title, author, price, type, cover_url");
    if (withAge) q = q.eq("is_published", true).in("age_rating", allowed);
    if (filter === "editors-pick" && withPick) q = q.eq("is_editors_pick", true);
    else if (filter === "free") q = q.or("price.eq.0,is_free.eq.true");
    else if (filter === "interactive") q = q.eq("type", "Interactive");
    return q.limit(48);
  };

  let res = await run(true, true);
  if (res.error) res = await run(false, true); // age_rating not migrated
  if (res.error) res = await run(false, false); // is_editors_pick not migrated
  const books = (res.data ?? []) as unknown as Book[];
  const activeLabel = FILTERS.find((f) => f.key === filter)?.label ?? "Discover";

  // Spotlight: books with an active, paid promotion (guarded pre-migration).
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
      <section className="section">
        <div className="section-header">
          <h2>Discover · {activeLabel}</h2>
        </div>

        {spotlight.length > 0 ? (
          <div style={{ marginBottom: "1.6rem" }}>
            <BookCarousel title="✦ Spotlight" books={spotlight} href="/discover" />
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.78rem", marginTop: "-0.4rem" }}>Promoted by their creators.</p>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "-1.5rem", marginBottom: "2rem" }}>
          {FILTERS.map((f) => (
            <a
              key={f.key}
              href={`/discover?filter=${f.key}`}
              className="badge"
              style={
                f.key === filter
                  ? { background: "var(--gold)", color: "#20180a", padding: "0.4rem 0.9rem" }
                  : { padding: "0.4rem 0.9rem" }
              }
            >
              {f.label}
            </a>
          ))}
        </div>

        {books.length > 0 ? (
          <div className="book-grid-mini">
            {books.map((b) => (
              <BookMini key={b.id} book={b} />
            ))}
          </div>
        ) : (
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "3rem 2rem",
              textAlign: "center",
              background: "var(--stone)",
            }}
          >
            <p style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Nothing here yet.</p>
            <p style={{ color: "var(--muted)", maxWidth: 440, margin: "0 auto" }}>
              {filter === "editors-pick"
                ? "No editor's picks curated yet — check back soon."
                : "No stories match this filter yet."}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
