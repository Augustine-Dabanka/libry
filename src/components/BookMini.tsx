import { type Book, formatPrice, bookCover } from "@/lib/types";

// The compact 2:3 book card shared by the home carousels and the catalog grid,
// so a book is the same size everywhere. Fills its container's width; the
// parent (carousel slot or grid cell) controls the footprint.
export default function BookMini({ book }: { book: Book }) {
  const cover = bookCover(book);
  const label = (book.type || "").toLowerCase() === "interactive" ? "Interactive" : book.category || book.type || null;
  return (
    <a className="cc-card" href={`/book/${book.id}`}>
      <div className="cc-cover">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={`Cover of ${book.title}`} loading="lazy" />
        ) : (
          <div className="cc-fallback">
            <span className="cc-mark">LIBRY</span>
            <span className="cc-fallback-title">{book.title}</span>
          </div>
        )}
        {label ? <span className="cc-badge">{label}</span> : null}
      </div>
      <div className="cc-title">{book.title}</div>
      <div className="cc-author">{book.author || "Unknown author"}</div>
      <div className="cc-price">{book.price != null && book.price > 0 ? formatPrice(book.price) : "Free"}</div>
    </a>
  );
}
