import { type Book, formatPrice } from "@/lib/types";

// A gradient cover derived from the title (deterministic) so the card looks
// intentional even before a real cover image exists.
function coverGradient(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) % 360;
  return `linear-gradient(150deg, hsl(${h} 30% 28%), hsl(${(h + 40) % 360} 35% 16%))`;
}

export default function BookCard({ book }: { book: Book }) {
  return (
    <a className="book-card" href={`/book/${book.id}`} style={{ textDecoration: "none" }}>
      <div
        className="book-cover"
        style={{
          background: coverGradient(book.title),
          display: "flex",
          alignItems: "flex-end",
          padding: "1.2rem",
        }}
      >
        <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "rgba(255,255,255,0.95)", fontSize: "1.15rem", lineHeight: 1.2 }}>
          {book.title}
        </span>
      </div>
      <div className="book-info">
        <h3>{book.title}</h3>
        <div className="author">{book.author || "Unknown author"}</div>
        <div className="book-meta">
          <span className="price">{formatPrice(book.price)}</span>
          {book.type ? <span className="badge">{book.type}</span> : null}
        </div>
      </div>
    </a>
  );
}
