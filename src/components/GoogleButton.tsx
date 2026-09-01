"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function GoogleButton({ next }: { next?: string }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function signIn() {
    setLoading(true);
    setErr(null);
    const supabase = createClient();
    const callback = `${window.location.origin}/auth/callback${
      next ? `?next=${encodeURIComponent(next)}` : ""
    }`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback },
    });
    if (error) {
      setErr(error.message);
      setLoading(false);
    }
    // On success the browser is redirected to Google, so no further UI here.
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-gold"
        onClick={signIn}
        disabled={loading}
        style={{ width: "100%", justifyContent: "center", gap: "0.6rem" }}
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 3.5 29.5 1.5 24 1.5 11.7 1.5 1.5 11.7 1.5 24S11.7 46.5 24 46.5 46.5 36.3 46.5 24c0-1.2-.1-2.3-.4-3.5z"
          />
          <path
            fill="#FF3D00"
            d="M4.3 13.7l6.6 4.8C12.7 15 18 11.5 24 11.5c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 5.5 29.5 3.5 24 3.5 15.6 3.5 8.3 8.3 4.3 13.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 46.5c5.4 0 10.3-2.1 14-5.4l-6.5-5.5C29.6 37.3 26.9 38.5 24 38.5c-5.3 0-9.7-2.6-11.3-6.9l-6.5 5C9.5 42.6 16.2 46.5 24 46.5z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.6l6.5 5.5C40.9 36.3 46.5 30.9 46.5 24c0-1.2-.1-2.3-.4-3.5z"
          />
        </svg>
        {loading ? "Redirecting…" : "Continue with Google"}
      </button>
      {err ? (
        <p
          style={{
            color: "var(--terracotta)",
            textAlign: "center",
            marginTop: "0.9rem",
            fontSize: "0.88rem",
          }}
        >
          {err}
        </p>
      ) : null}
    </>
  );
}
