import { type Book, bookCover, genCover } from "@/lib/types";

export type ResumeItem = { book: Book; pct: number; label: string };

// The Wattpad-style "Continue reading" rail: cover + title + where-you-are +
// a progress bar and a resume (play) button that drops the reader straight back
// into the story. Horizontal snap-scroll so several fit on a phone.
export default function ContinueReading({ items }: { items: ResumeItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="section" style={{ paddingTop: "1.2rem", paddingBottom: 0 }}>
      <div className="section-header" style={{ marginBottom: "0.8rem" }}>
        <h2>Continue reading</h2>
        <a href="/my-library" style={{ color: "var(--gold)", fontFamily: "var(--sans)" }}>View all →</a>
      </div>
      <div className="cr-row">
        {items.map(({ book, pct, label }) => {
          const cover = bookCover(book) || genCover(book.title, book.author);
          return (
            <a key={book.id} href={`/reader/${book.id}`} className="cr-card" aria-label={`Continue ${book.title}`}>
              <div className="cr-cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover} alt={book.title} loading="lazy" />
                <span className="cr-play" aria-hidden="true">▶</span>
              </div>
              <div className="cr-body">
                <div className="cr-title">{book.title}</div>
                <div className="cr-sub">{label}</div>
                <div className="cr-bar"><span style={{ width: `${Math.max(3, Math.min(100, pct))}%` }} /></div>
                <div className="cr-pct">{Math.round(pct)}%</div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
