"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPublished } from "@/app/actions/books";

// Small button on each creator book card that publishes a draft or
// unpublishes a live title.
export default function PublishToggle({
  bookId,
  published,
}: {
  bookId: number;
  published: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function toggle() {
    setErr(null);
    start(async () => {
      const res = await setPublished(bookId, !published);
      if (res?.error) setErr(res.error);
      else router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-outline"
        onClick={toggle}
        disabled={pending}
        style={{ padding: "0.3rem 0.9rem", fontSize: "0.8rem" }}
      >
        {pending ? "…" : published ? "Unpublish" : "Publish"}
      </button>
      {err ? (
        <span style={{ color: "var(--terracotta)", fontSize: "0.75rem", flexBasis: "100%" }}>{err}</span>
      ) : null}
    </>
  );
}
