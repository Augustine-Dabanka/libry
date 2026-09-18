"use client";

import { useEffect, useState } from "react";
import { subscribeToWebPush, unsubscribeFromWebPush, getPushState } from "@/lib/pushNotifications";

// "Enable notifications on this device" — opts the reader into Web Push, then
// fires a test push so they see it working immediately.
export default function PushToggle({ userId }: { userId: string }) {
  const [state, setState] = useState<"loading" | "unsupported" | "denied" | "subscribed" | "default">("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { getPushState().then(setState); }, []);

  async function enable() {
    setBusy(true);
    setMsg(null);
    const res = await subscribeToWebPush(userId);
    if (!res.ok) { setBusy(false); setMsg(res.error || "Couldn't enable notifications."); return; }
    try {
      await fetch("/api/push/test", { method: "POST" });
    } catch {}
    setBusy(false);
    setState("subscribed");
    setMsg("Enabled — we sent a test notification to this device.");
  }

  async function disable() {
    setBusy(true);
    await unsubscribeFromWebPush();
    setBusy(false);
    setState("default");
    setMsg("Push notifications turned off on this device.");
  }

  if (state === "loading" || state === "unsupported") return null;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", padding: "0.85rem 1rem", borderRadius: 12, border: "1px solid var(--border)", background: "var(--stone)", marginBottom: "1.4rem" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "var(--sans)", fontWeight: 700, color: "var(--ivory)", fontSize: "0.95rem" }}>Push notifications</div>
        <div style={{ fontFamily: "var(--sans)", fontSize: "0.82rem", color: "var(--muted)" }}>
          {state === "denied" ? "Blocked in your browser settings — enable them there to turn this on." : "Get replies, likes and follows on this device, even when Libry is closed."}
        </div>
        {msg ? <div style={{ fontFamily: "var(--sans)", fontSize: "0.8rem", color: "var(--gold)", marginTop: "0.3rem" }}>{msg}</div> : null}
      </div>
      {state === "subscribed" ? (
        <button type="button" onClick={disable} disabled={busy} className="btn btn-outline" style={{ whiteSpace: "nowrap" }}>{busy ? "…" : "Turn off"}</button>
      ) : state === "denied" ? null : (
        <button type="button" onClick={enable} disabled={busy} className="btn btn-gold" style={{ whiteSpace: "nowrap" }}>{busy ? "…" : "Enable on this device"}</button>
      )}
    </div>
  );
}
