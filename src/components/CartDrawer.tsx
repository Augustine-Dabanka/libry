"use client";

import { useEffect, useState } from "react";
import { type CartItem, getCart, removeFromCart, onCartChange } from "@/lib/cart";
import { formatPrice } from "@/lib/types";

// Slide-over cart. Mounted once in the navbar; opens on the "libry:cart-open"
// event (fired by the Cart button and by Add-to-cart).
export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [checkoutNote, setCheckoutNote] = useState(false);

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
          {items.length === 0 ? (
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

        {items.length > 0 ? (
          <footer style={{ padding: "1.2rem 1.4rem", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.9rem", fontFamily: "var(--sans)" }}>
              <span style={{ color: "var(--muted)" }}>Subtotal</span>
              <span className="price" style={{ fontSize: "1.1rem" }}>{formatPrice(total)}</span>
            </div>
            <button className="btn btn-gold" style={{ width: "100%", justifyContent: "center" }} onClick={() => setCheckoutNote(true)}>
              Checkout
            </button>
            {checkoutNote ? (
              <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.8rem", textAlign: "center", marginTop: "0.7rem" }}>
                Payments are coming soon — your cart is saved on this device until then.
              </p>
            ) : null}
          </footer>
        ) : null}
      </aside>
    </>
  );
}
