import { type Book, formatPrice, bookCover } from "@/lib/types";

// A horizontal, snap-scrolling row of compact book cards (Wattpad-style),
// grouped under a section title. Keeps several categories visible per screen on
// mobile instead of one full-width card at a time.
export default function BookCarousel({ title, books, href = "/catalog" }: { title: string; books: Book[]; href?: string }) {
  if (!books.length) return null;
  return (
    <section className="carousel-section">
      <div className="carousel-head">
        <h2 style={{ fontSize: "clamp(1.1rem,3.4vw,1.4rem)", margin: 0 }}>{title}</h2>
        <a href={href} style={{ color: "var(--gold)", fontFamily: "var(--sans)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>View all →</a>
      </div>
      <div className="book-carousel">
        {books.map((b) => {
          const cover = bookCover(b);
          const label = (b.type || "").toLowerCase() === "interactive" ? "Interactive" : b.category || b.type || null;
          return (
            <a key={b.id} className="cc-card" href={`/book/${b.id}`}>
              <div className="cc-cover">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt={`Cover of ${b.title}`} loading="lazy" />
                ) : (
                  <div className="cc-fallback">
                    <span className="cc-mark">LIBRY</span>
                    <span className="cc-fallback-title">{b.title}</span>
                  </div>
                )}
                {label ? <span className="cc-badge">{label}</span> : null}
              </div>
              <div className="cc-title">{b.title}</div>
              <div className="cc-author">{b.author || "Unknown author"}</div>
              <div className="cc-price">{b.price != null && b.price > 0 ? formatPrice(b.price) : "Free"}</div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
