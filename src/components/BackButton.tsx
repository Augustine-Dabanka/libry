"use client";

import { useRouter } from "next/navigation";

// A "← Back" control that returns to the previous page, with a sensible
// fallback (the catalog) when there's no history to go back to.
export default function BackButton({ fallback = "/catalog", label = "Back" }: { fallback?: string; label?: string }) {
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(fallback);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        background: "transparent",
        border: "1px solid var(--border)",
        borderRadius: 999,
        padding: "0.4rem 0.9rem",
        color: "var(--ivory-muted)",
        fontFamily: "var(--sans)",
        fontSize: "0.88rem",
        cursor: "pointer",
      }}
    >
      ← {label}
    </button>
  );
}
