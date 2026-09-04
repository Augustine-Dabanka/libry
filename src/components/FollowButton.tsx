"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFollow } from "@/app/actions/follows";

export default function FollowButton({ author, initialFollowing }: { author: string; initialFollowing: boolean }) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onClick() {
    setErr(null);
    const next = !following;
    setFollowing(next); // optimistic
    start(async () => {
      const res = await toggleFollow(author);
      if (res?.error) {
        setFollowing(!next);
        setErr(res.error);
        return;
      }
      const f = (res as { following?: boolean }).following;
      if (typeof f === "boolean") setFollowing(f);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        className={following ? "btn btn-outline" : "btn btn-gold"}
        onClick={onClick}
        disabled={pending}
        style={{ padding: "0.5rem 1.3rem" }}
      >
        {following ? "Following ✓" : "＋ Follow"}
      </button>
      {err ? <span style={{ color: "var(--terracotta)", fontSize: "0.8rem", marginLeft: "0.5rem" }}>{err}</span> : null}
    </>
  );
}
