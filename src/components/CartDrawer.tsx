"use client";

import { useEffect, useState } from "react";
import { type CartItem, getCart, removeFromCart, clearCart, onCartChange } from "@/lib/cart";
import { checkoutCart } from "@/app/actions/purchases";
import { formatPrice } from "@/lib/types";

const PAYSTACK_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
const PAYSTACK_CURRENCY = process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY || "USD";

// Paystack is off until the merchant account is verified. The current test
// integration is a Ghana account that only accepts GHS, so live USD checkout
// fails with "currency not supported". Until verification (and multi-currency
// enablement), checkout is simulated — no real charge, books still added to the
// library. Flip this to true once the account is verified to re-enable Paystack.
const PAYSTACK_ENABLED = false;
const PAYSTACK_LIVE = PAYSTACK_ENABLED && !!PAYSTACK_KEY;

// Load Paystack's inline script once, on demand.
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

// Slide-over cart. Mounted once in the navbar; opens on the "libry:cart-open"
// event (fired by the Cart button and by Add-to-cart).
export default function CartDrawer({ email }: { email?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setItems(getCart());
    const off = onCartChange(() => setItems(getCart()));
    const onOpen = () => setOpen(true);
    window.addEventListener("libry:cart-open", onOpen);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      off();
      window.removeEventListener("libry:cart-open", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const total = items.reduce((s, i) => s + (Number(i.price) || 0), 0);

  async function record(reference: string) {
    const res = await checkoutCart(
      items.map((i) => ({ id: Number(i.id), price: Number(i.price) || 0 })),
      reference
    );
    setBusy(false);
    if (res?.error) {
      setErr(res.error);
      return;
    }
    clearCart();
    setDone(PAYSTACK_LIVE ? "Payment complete — enjoy your books." : "Added to your library — enjoy.");
  }

  async function checkout() {
    setErr(null);
    setBusy(true);

    // Live/test Paystack only when enabled + configured; otherwise simulate.
    if (PAYSTACK_LIVE && email) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Paystack: any = await loadPaystack();
        const handler = Paystack.setup({
          key: PAYSTACK_KEY,
          email,
          amount: Math.round(total * 100), // minor units (kobo/cents/pesewas)
          currency: PAYSTACK_CURRENCY,
          ref: `libry-${Date.now()}`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (resp: any) => {
            record(resp.reference || `paystack-${Date.now()}`);
          },
          onClose: () => setBusy(false),
        });
        handler.openIframe();
      } catch (e) {
        setBusy(false);
        setErr(e instanceof Error ? e.message : "Checkout failed.");
      }
      return;
    }

    // Simulated checkout — no real charge.
    await record(`demo-${Date.now()}`);
  }

  return (
    <>
      {/* backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s ease",
          zIndex: 1300,
        }}
        aria-hidden="true"
      />

      {/* panel */}
      <aside
        role="dialog"
        aria-label="Cart"
        aria-hidden={!open}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100dvh",
          width: "min(400px, 92vw)",
          background: "var(--charcoal)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-24px 0 60px rgba(0,0,0,0.5)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          zIndex: 1301,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.3rem 1.4rem", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: "1.15rem" }}>Your cart {items.length ? `(${items.length})` : ""}</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            style={{ background: "transparent", border: "none", color: "var(--muted)", fontSize: "1.5rem", cursor: "pointer", lineHeight: 1 }}
          >
            ×
          </button>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.4rem" }}>
          {done ? (
            <div style={{ textAlign: "center", fontFamily: "var(--sans)", padding: "3rem 1rem" }}>
              <div style={{ fontSize: "2.4rem", marginBottom: "0.6rem", color: "#7DBE86" }}>✓</div>
              <p style={{ color: "var(--ivory)", fontSize: "1.05rem", marginBottom: "1rem" }}>{done}</p>
              <a href="/my-library?tab=purchased" className="btn btn-gold" onClick={() => { setDone(null); setOpen(false); }}>
                View My Library
              </a>
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--muted)", fontFamily: "var(--sans)", padding: "3rem 1rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.6rem" }}>🛒</div>
              <p style={{ marginBottom: "0.3rem", color: "var(--ivory)" }}>Your cart is empty.</p>
              <p style={{ fontSize: "0.9rem" }}>
                Add a premium book from the{" "}
                <a href="/catalog" style={{ color: "var(--gold)" }} onClick={() => setOpen(false)}>
                  catalog
                </a>
                .
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              {items.map((i) => (
                <div key={i.id} style={{ display: "flex", gap: "0.8rem", alignItems: "center", padding: "0.7rem", background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a href={`/book/${i.id}`} onClick={() => setOpen(false)} style={{ fontFamily: "var(--serif)", color: "var(--ivory)", fontSize: "1rem", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {i.title}
                    </a>
                    <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.82rem" }}>{i.author || "Unknown author"}</span>
                  </div>
                  <span className="price" style={{ whiteSpace: "nowrap" }}>{formatPrice(i.price)}</span>
                  <button
                    type="button"
                    onClick={() => removeFromCart(i.id)}
                    aria-label={`Remove ${i.title}`}
                    style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1.2rem", lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && !done ? (
          <footer style={{ padding: "1.2rem 1.4rem 1.4rem", borderTop: "1px solid var(--border)", background: "var(--charcoal)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem", fontFamily: "var(--sans)" }}>
              <span style={{ color: "var(--ivory)", fontWeight: 700 }}>
                Total <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.85rem" }}>· {items.length} item{items.length === 1 ? "" : "s"}</span>
              </span>
              <span className="price" style={{ fontSize: "1.2rem" }}>{formatPrice(total)}</span>
            </div>
            <button className="btn btn-gold" style={{ width: "100%" }} onClick={checkout} disabled={busy}>
              {busy ? "Adding…" : PAYSTACK_LIVE ? `Pay ${formatPrice(total)}` : "Checkout · Free"}
            </button>
            {err ? (
              <p style={{ color: "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.8rem", textAlign: "center", marginTop: "0.7rem" }}>{err}</p>
            ) : (
              <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.78rem", textAlign: "center", marginTop: "0.7rem", lineHeight: 1.5 }}>
                {PAYSTACK_LIVE ? "🔒 Secured by Paystack." : "Free for now — secure payments coming soon."}
              </p>
            )}
          </footer>
        ) : null}
      </aside>
    </>
  );
}
