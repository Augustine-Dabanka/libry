"use client";

import { useState, useTransition } from "react";
import { deleteBook } from "@/app/actions/books";

// Delete control for a book the creator owns. Two-step: the first tap arms a
// "Confirm?" state so a stray click can't wipe a title.
export default function DeleteBookButton({ bookId, title }: { bookId: number; title: string }) {
  const [armed, setArmed] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    setErr(null);
    startTransition(async () => {
      const res = await deleteBook(bookId);
      if (res?.error) {
        setErr(res.error);
        setArmed(false);
      }
      // On success the row disappears when the page revalidates.
    });
  }

  if (armed) {
    return (
      <span style={{ display: "inline-flex", gap: "0.35rem", alignItems: "center" }}>
        <button
          type="button"
          className="btn"
          onClick={onDelete}
          disabled={pending}
          title={`Permanently delete “${title}”`}
          style={{ padding: "0.3rem 0.8rem", fontSize: "0.8rem", background: "var(--terracotta, #b5533f)", color: "#fff", border: "none" }}
        >
          {pending ? "Deleting…" : "Confirm"}
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => setArmed(false)}
          disabled={pending}
          style={{ padding: "0.3rem 0.8rem", fontSize: "0.8rem" }}
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-outline"
        onClick={() => setArmed(true)}
        title={`Delete “${title}”`}
        style={{ padding: "0.3rem 0.9rem", fontSize: "0.8rem", color: "var(--terracotta, #b5533f)", borderColor: "rgba(181,83,63,0.5)" }}
      >
        Delete
      </button>
      {err ? <span style={{ color: "var(--terracotta)", fontSize: "0.75rem", marginLeft: "0.4rem" }}>{err}</span> : null}
    </>
  );
}
