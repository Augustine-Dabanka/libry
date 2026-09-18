import { type Book } from "@/lib/types";
import BookMini from "@/components/BookMini";

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
        {books.map((b) => (
          <div key={b.id} className="cc-slot">
            <BookMini book={b} />
          </div>
        ))}
      </div>
    </section>
  );
}
