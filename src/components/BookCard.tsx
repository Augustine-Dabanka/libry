import { type Book, formatPrice } from "@/lib/types";

// Two-tone card: a gold-framed "LIBRY" inset (mark, serif title, author) above
// a compact info row (title, author, price, type).
export default function BookCard({ book }: { book: Book }) {
  return (
    <a className="book-card book-card-v2" href={`/book/${book.id}`} style={{ textDecoration: "none", display: "block", padding: "1rem" }}>
      <div
        style={{
          border: "1px solid rgba(197,160,89,0.45)",
          borderRadius: 10,
          background: "linear-gradient(160deg, rgba(197,160,89,0.07), rgba(0,0,0,0.22))",
          padding: "1.4rem 1rem 2rem",
          textAlign: "center",
          minHeight: 200,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.85rem",
        }}
      >
        <span style={{ fontFamily: "var(--sans)", fontSize: "0.66rem", letterSpacing: "0.28em", color: "var(--gold-hi)", fontWeight: 600 }}>LIBRY</span>
        <h3 style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: "1.2rem", color: "var(--ivory)", lineHeight: 1.2, margin: 0 }}>{book.title}</h3>
        <span style={{ width: 34, height: 1, background: "var(--gold-hi)", opacity: 0.55 }} />
        <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "0.82rem", color: "var(--muted)" }}>{book.author || "Unknown author"}</span>
      </div>

      <div style={{ padding: "0.9rem 0.3rem 0.2rem" }}>
        <h3 style={{ fontFamily: "var(--serif)", fontSize: "1.05rem", color: "var(--ivory)", margin: "0 0 0.2rem", lineHeight: 1.25 }}>{book.title}</h3>
        <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem" }}>{book.author || "Unknown author"}</div>
        <div className="book-meta" style={{ marginTop: "0.6rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="price">{formatPrice(book.price)}</span>
          {book.type ? <span className="badge">{book.type}</span> : null}
        </div>
      </div>
    </a>
  );
}
