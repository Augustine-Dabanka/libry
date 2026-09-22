"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStoryCommunity } from "@/app/actions/communities";

// Creator-only: spin up a community pre-configured from this story (spec §31).
export default function StoryCommunityButton({ bookId }: { bookId: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function go() {
    setErr(null);
    start(async () => {
      const res = await createStoryCommunity(bookId);
      if (res?.error) { setErr(res.error); return; }
      if (res?.slug) router.push(`/c/${res.slug}`);
    });
  }

  return (
    <div style={{ marginTop: "0.6rem" }}>
      <button type="button" className="btn btn-outline" onClick={go} disabled={pending} style={{ padding: "0.55rem 1.1rem" }}>
        {pending ? "Creating…" : "＋ Start a community for this story"}
      </button>
      <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.78rem", marginTop: "0.4rem", maxWidth: 460 }}>
        Bring your readers together for theories, chapter chat and discussion — pre-set up from this story.
      </p>
      {err ? <p style={{ color: "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.8rem", marginTop: "0.3rem" }}>{err}</p> : null}
    </div>
  );
}
