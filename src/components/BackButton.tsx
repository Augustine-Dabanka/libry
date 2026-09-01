"use client";

import { useRouter } from "next/navigation";

// Returns the reader to wherever they came from — never bounces them to /login or /.
export default function BackButton({ fallback = "/home" }: { fallback?: string }) {
  const router = useRouter();
  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }
  return (
    <button
      type="button"
      onClick={goBack}
      style={{
        background: "transparent",
        border: "1px solid var(--border)",
        color: "var(--ivory)",
        borderRadius: 999,
        padding: "0.4rem 1rem",
        fontFamily: "var(--sans)",
        fontSize: "0.85rem",
        cursor: "pointer",
      }}
    >
      ← Back
    </button>
  );
}
