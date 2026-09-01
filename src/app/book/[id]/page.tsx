import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import { formatPrice } from "@/lib/types";
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
};

function coverGradient(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) % 360;
  return `linear-gradient(150deg, hsl(${h} 30% 28%), hsl(${(h + 40) % 360} 35% 16%))`;
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const primary = await supabase
    .from("books")
    .select("id, title, author, description, content, price, type, status, age_rating")
    .eq("id", id)
    .maybeSingle();
  let data = primary.data;
  if (primary.error) {
    // age_rating column not migrated yet — retry without it.
    const alt = await supabase
      .from("books")
      .select("id, title, author, description, content, price, type, status")
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
          <h2>Story not found</h2>
          <p style={{ color: "var(--muted)", marginTop: "0.6rem" }}>
            This story may have been removed. <a href="/catalog" style={{ color: "var(--gold)" }}>Back to catalog →</a>
          </p>
        </section>
      </>
    );
  }

  return (
    <>
      <AppNav />
      <section className="section">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 220px) 1fr",
            gap: "2.5rem",
            alignItems: "start",
            marginBottom: "3rem",
          }}
        >
          <div
            style={{
              aspectRatio: "2 / 3",
              borderRadius: 14,
              background: coverGradient(book.title),
              display: "flex",
              alignItems: "flex-end",
              padding: "1.3rem",
              boxShadow: "var(--shadow)",
            }}
          >
            <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "rgba(255,255,255,0.96)", fontSize: "1.3rem", lineHeight: 1.2 }}>
              {book.title}
            </span>
          </div>

          <div>
            <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>{book.title}</h1>
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", marginTop: "0.4rem" }}>
              by {book.author || "Unknown author"}
            </p>
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
              <p style={{ color: "var(--ivory-muted)", marginTop: "1rem", maxWidth: 560 }}>
                {book.description}
              </p>
            ) : null}
            {book.content ? (
              <div style={{ marginTop: "1.6rem" }}>
                <a href={`/reader/${book.id}`} className="btn btn-gold">
                  Start reading →
                </a>
              </div>
            ) : null}
          </div>
        </div>

      </section>
    </>
  );
}
