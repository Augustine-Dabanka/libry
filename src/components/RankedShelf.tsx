import { type Book } from "@/lib/types";
import BookMini from "@/components/BookMini";

// A ranked carousel (Wattpad "Hot list" idiom): a large gold numeral sits over
// each cover so the row reads as an ordered chart, not just another shelf.
export default function RankedShelf({ title, books, href = "/discover" }: { title: string; books: Book[]; href?: string }) {
  if (!books.length) return null;
  return (
    <section className="carousel-section">
      <div className="carousel-head">
        <h2 style={{ fontSize: "clamp(1.1rem,3.4vw,1.4rem)", margin: 0 }}>{title}</h2>
        <a href={href} style={{ color: "var(--gold)", fontFamily: "var(--sans)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>View all →</a>
      </div>
      <div className="book-carousel">
        {books.slice(0, 12).map((b, i) => (
          <div key={b.id} className="cc-slot rank-slot">
            <span className="rank-num" aria-hidden="true">{i + 1}</span>
            <BookMini book={b} />
          </div>
        ))}
      </div>
    </section>
  );
}
