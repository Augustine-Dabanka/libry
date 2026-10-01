"use client";

import { useState } from "react";
import { type Book } from "@/lib/types";
import BookMini from "@/components/BookMini";

// A slowly drifting shelf of books. Pauses on hover and keyboard focus, and has
// a real Pause button (auto-moving content must be pausable, WCAG 2.2.2, and
// hover doesn't exist on phones). With reduced motion it becomes a normal
// swipeable row.
export default function MovingShelf({ books, seconds = 60 }: { books: Book[]; seconds?: number }) {
  const [paused, setPaused] = useState(false);
  if (books.length < 4) return null;
  const loop = [...books, ...books];
  return (
    <div className="mshelf">
      <button
        type="button"
        className="btn btn-outline mshelf-toggle"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
      >
        {paused ? "Play shelf" : "Pause shelf"}
      </button>
      <div className="mshelf-viewport">
        <div className="mshelf-track" style={{ animationDuration: `${seconds}s`, animationPlayState: paused ? "paused" : undefined }}>
          {loop.map((b, i) => (
            <div key={`${b.id}-${i}`} className="mshelf-slot" aria-hidden={i >= books.length ? true : undefined}>
              <BookMini book={b} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
