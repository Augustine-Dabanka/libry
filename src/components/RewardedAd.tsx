"use client";

import { useEffect, useRef, useState } from "react";
import { startRewardedAd, finishRewardedAd } from "@/app/actions/coins";
import { AD_REWARD, AD_SECONDS, AD_SKIP_AFTER } from "@/lib/coins";

// Opt-in rewarded ad. Nothing plays unless the reader taps the button.
// Skip unlocks after 5 s (and forfeits the coins); finishing 15 s earns them.
// The server also times the view, so the reward can't be claimed early.
// The slot below is where an ad network's player goes; until one is connected
// it shows a clearly labelled placeholder.
export default function RewardedAd({ onEarned }: { onEarned?: (coins: number) => void }) {
  const [id, setId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);
  useEffect(() => { if (id) closeRef.current?.focus(); }, [id]);

  async function begin() {
    setMsg(null);
    setBusy(true);
    const r = await startRewardedAd();
    setBusy(false);
    if (!r.id) { setMsg(r.message); return; }
    setId(r.id);
    setElapsed(0);
    const t0 = Date.now();
    timer.current = window.setInterval(() => setElapsed((Date.now() - t0) / 1000), 200);
  }

  function stop() {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setId(null);
  }

  useEffect(() => {
    if (!id || elapsed < AD_SECONDS) return;
    const viewId = id;
    stop();
    (async () => {
      const r = await finishRewardedAd(viewId);
      if (r.coins > 0) { setMsg(`+${r.coins} coins added.`); onEarned?.(r.coins); }
      else setMsg("That view didn't count. Try again later.");
    })();
  }, [elapsed, id, onEarned]);

  const canSkip = elapsed >= AD_SKIP_AFTER;
  const left = Math.max(0, Math.ceil(AD_SECONDS - elapsed));

  return (
    <div>
      <button type="button" className="btn btn-gold" onClick={begin} disabled={busy || !!id}>
        Watch a short ad, earn {AD_REWARD} coins
      </button>
      {msg ? <p role="status" style={{ marginTop: "0.6rem", fontFamily: "var(--sans)", color: "var(--muted)" }}>{msg}</p> : null}

      {id ? (
        <div role="dialog" aria-modal="true" aria-label="Rewarded ad" style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.92)", display: "grid", placeItems: "center", padding: "1rem" }}>
          <div style={{ width: "100%", maxWidth: 420, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
              <span style={{ fontFamily: "var(--sans)", fontSize: "0.75rem", fontWeight: 700, background: "rgba(255,255,255,0.12)", padding: "0.2rem 0.5rem", borderRadius: 6 }}>Ad</span>
              <button
                ref={closeRef}
                type="button"
                onClick={canSkip ? stop : undefined}
                aria-disabled={!canSkip}
                aria-label={canSkip ? "Skip ad (no coins)" : `Skip available in ${Math.ceil(AD_SKIP_AFTER - elapsed)} seconds`}
                style={{ minWidth: 44, height: 44, borderRadius: 22, border: "none", padding: canSkip ? "0 16px" : 0, background: canSkip ? "#fff" : "rgba(255,255,255,0.15)", color: canSkip ? "#111" : "#fff", fontFamily: "var(--sans)", fontWeight: 700, cursor: canSkip ? "pointer" : "default" }}
              >
                {canSkip ? "Skip" : Math.ceil(AD_SKIP_AFTER - elapsed)}
              </button>
            </div>
            <div style={{ aspectRatio: "9 / 12", borderRadius: 16, background: "#1f3550", display: "grid", placeItems: "center", textAlign: "center", padding: "1.5rem", color: "#e8eef5", fontFamily: "var(--sans)" }}>
              {/* Ad network player mounts here. */}
              <div>
                <div style={{ fontFamily: "var(--serif)", fontSize: "1.4rem", marginBottom: "0.4rem" }}>Sponsor slot</div>
                <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>Connect an ad network to show real ads here.</div>
              </div>
            </div>
            <div style={{ marginTop: "0.9rem", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
              <div style={{ height: 6, width: `${Math.min(100, (elapsed / AD_SECONDS) * 100)}%`, background: "var(--gold)" }} />
            </div>
            <p style={{ textAlign: "center", marginTop: "0.6rem", fontFamily: "var(--sans)", fontSize: "0.85rem", color: "#ddd" }}>
              {canSkip ? `Skipping now earns nothing. ${left}s to earn ${AD_REWARD} coins.` : `${left}s to earn ${AD_REWARD} coins`}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
