"use client";

import { useEffect, useState } from "react";
import { buyProduct, getDownloadUrl } from "@/app/actions/products";
import { paystackReady } from "@/app/actions/purchases";
import { formatPrice } from "@/lib/types";

const PAYSTACK_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
const PAYSTACK_CURRENCY = process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY || "USD";
const PAYSTACK_RATE = Number(process.env.NEXT_PUBLIC_PAYSTACK_USD_RATE || "1") || 1;

function loadPaystack(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).PaystackPop) return resolve((window as any).PaystackPop);
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v1/inline.js";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    s.onload = () => resolve((window as any).PaystackPop);
    s.onerror = () => reject(new Error("Could not load Paystack."));
    document.body.appendChild(s);
  });
}

export default function ProductBuy({
  productId, price, owned, email, isVideo,
}: {
  productId: number; price: number; owned: boolean; email?: string; isVideo: boolean;
}) {
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [has, setHas] = useState(owned);
  const [showTerms, setShowTerms] = useState(false);

  const TERMS_KEY = "libry-download-terms-ok";
  function termsAccepted() {
    try { return localStorage.getItem(TERMS_KEY) === "1"; } catch { return false; }
  }

  useEffect(() => { paystackReady().then(setLive).catch(() => setLive(false)); }, []);

  async function grant(reference: string) {
    const res = await buyProduct(productId, reference);
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    setHas(true);
  }

  async function buy() {
    setErr(null);
    setBusy(true);
    if (price <= 0) { await grant(`free-${Date.now()}`); return; }
    if (live && email && PAYSTACK_KEY) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Paystack: any = await loadPaystack();
        const handler = Paystack.setup({
          key: PAYSTACK_KEY, email,
          amount: Math.round(price * PAYSTACK_RATE * 100),
          currency: PAYSTACK_CURRENCY,
          ref: `libry-p${productId}-${Date.now()}`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (resp: any) => grant(resp.reference || `paystack-${Date.now()}`),
          onClose: () => setBusy(false),
        });
        handler.openIframe();
      } catch (e) {
        setBusy(false);
        setErr(e instanceof Error ? e.message : "Checkout failed.");
      }
      return;
    }
    await grant(`demo-${Date.now()}`);
  }

  async function doDownload() {
    setErr(null);
    setBusy(true);
    const res = await getDownloadUrl(productId);
    setBusy(false);
    if (res.error) { setErr(res.error); return; }
    const url = res.url || res.external;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  // It's in the reader's library either way; a one-time acknowledgment gates the
  // actual file download (accepting responsibility for how it's used).
  function access() {
    if (isVideo || termsAccepted()) { void doDownload(); return; }
    setShowTerms(true);
  }
  function acceptAndDownload() {
    try { localStorage.setItem(TERMS_KEY, "1"); } catch { /* private mode — acknowledge for this action only */ }
    setShowTerms(false);
    void doDownload();
  }

  const btn: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
    minHeight: 50, padding: "0 1.5rem", background: "var(--gold)", color: "#12100E", border: "none",
    borderRadius: 14, fontFamily: "var(--sans)", fontWeight: 700, fontSize: "1rem", cursor: busy ? "default" : "pointer",
    opacity: busy ? 0.7 : 1, width: "100%", boxSizing: "border-box",
  };

  return (
    <div>
      {has ? (
        showTerms ? (
          <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "1rem 1.1rem", background: "var(--charcoal)" }}>
            <p style={{ fontFamily: "var(--sans)", fontSize: "0.86rem", color: "var(--ivory-muted)", lineHeight: 1.6, margin: "0 0 0.9rem" }}>
              This file is saved in your library. By downloading it you accept that <strong style={{ color: "var(--ivory)" }}>you are responsible for how you store and use it</strong>, that downloads are non-refundable, and that Libry is not liable for anything that happens to the file once it leaves the platform.
            </p>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <button type="button" onClick={acceptAndDownload} disabled={busy} style={{ ...btn, width: "auto", flex: "1 1 auto" }}>{busy ? "Preparing…" : "I understand — download"}</button>
              <button type="button" onClick={() => setShowTerms(false)} style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 14, color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontWeight: 700, padding: "0 1.1rem", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={access} disabled={busy} style={btn}>
            {busy ? "Opening…" : isVideo ? "▶ Watch now" : "↓ Download"}
          </button>
        )
      ) : (
        <button type="button" onClick={buy} disabled={busy} style={btn}>
          {busy ? "Processing…" : price > 0 ? `${live ? "Buy" : "Get"} — ${formatPrice(price)}` : "Get it free"}
        </button>
      )}
      {err ? (
        <p style={{ color: "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.82rem", marginTop: "0.7rem", textAlign: "center" }}>{err}</p>
      ) : (
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.76rem", marginTop: "0.7rem", textAlign: "center", lineHeight: 1.5 }}>
          {has ? "In your library — access anytime." : price > 0 ? (live ? "🔒 Secured by Paystack" : "🔒 Instant access") : "Free — added to your library."}
        </p>
      )}
    </div>
  );
}
