"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// "Continue with Discord" — same OAuth flow and /auth/callback as Google, just
// a different provider. Needs the Discord provider enabled in Supabase Auth
// with a Client ID/Secret from the Discord Developer Portal.
export default function DiscordButton({
  next,
  style,
}: {
  next?: string;
  style?: React.CSSProperties;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function signIn() {
    setLoading(true);
    setErr(null);
    const supabase = createClient();
    const callback = `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: callback },
    });
    if (error) {
      setErr(/provider is not enabled/i.test(error.message) ? "Discord sign-in isn't switched on yet." : error.message);
      setLoading(false);
    }
    // On success the browser redirects to Discord.
  }

  return (
    <>
      <button
        type="button"
        className="btn"
        onClick={signIn}
        disabled={loading}
        style={{ width: "100%", justifyContent: "center", gap: "0.6rem", background: "#5865F2", color: "#fff", border: "none", ...style }}
      >
        <svg width="19" height="19" viewBox="0 0 127.14 96.36" fill="#fff" aria-hidden="true">
          <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
        </svg>
        {loading ? "Redirecting…" : "Continue with Discord"}
      </button>
      {err ? (
        <p style={{ color: "var(--terracotta)", textAlign: "center", marginTop: "0.9rem", fontSize: "0.88rem" }}>{err}</p>
      ) : null}
    </>
  );
}
