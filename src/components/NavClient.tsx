"use client";

import { useEffect, useRef, useState } from "react";
import CartDrawer from "@/components/CartDrawer";
import { cartCount, onCartChange, openCart } from "@/lib/cart";

type Dd = null | "catalog" | "library" | "user";

export default function NavClient({
  signedIn,
  name,
  avatarUrl,
  initials,
}: {
  signedIn: boolean;
  name: string;
  avatarUrl: string | null;
  initials: string;
}) {
  const [dd, setDd] = useState<Dd>(null);
  const [mobile, setMobile] = useState(false);
  const [cartN, setCartN] = useState(0);
  const rootRef = useRef<HTMLElement>(null);

  // Live cart count from localStorage.
  useEffect(() => {
    const sync = () => setCartN(cartCount());
    sync();
    return onCartChange(sync);
  }, []);

  // Close any open dropdown on an outside click or Escape.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Element | null;
      if (t && !t.closest("[data-dd-root]")) setDd(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDd(null);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const toggle = (which: Exclude<Dd, null>) => setDd((cur) => (cur === which ? null : which));

  const avatar = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl} alt="" />
  ) : (
    initials
  );

  const menuBtn: React.CSSProperties = {
    display: "block",
    width: "100%",
    textAlign: "left",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "0.6rem 0.8rem",
    borderRadius: 8,
    color: "var(--ivory-muted)",
    fontFamily: "var(--sans)",
    fontSize: "0.9rem",
  };

  return (
    <>
      <nav className="navbar" ref={rootRef}>
        <a href="/home" className="logo">
          Libry<span>.</span>
        </a>

        <form className="search-box" action="/catalog" method="get">
          <input name="q" type="text" placeholder="Search books..." aria-label="Search books" />
          <button type="submit">Search</button>
        </form>

        <ul className="nav-links">
          <li>
            <a href="/wishlist" className="icon-link" title="Wishlist" aria-label="Wishlist">
              &#9829; Wishlist <span className="badge-count">0</span>
            </a>
          </li>
          <li>
            <button type="button" className="icon-link" title="Cart" aria-label="Cart" onClick={openCart} style={{ background: "transparent", border: "none", cursor: "pointer", font: "inherit" }}>
              &#128722; Cart <span className="badge-count">{cartN}</span>
            </button>
          </li>
          <li>
            <a href="/home">Home</a>
          </li>

          {/* Catalog dropdown */}
          <li className="nav-dd" data-dd-root>
            <button
              type="button"
              className={`nav-dd-link${dd === "catalog" ? " active" : ""}`}
              aria-haspopup="true"
              aria-expanded={dd === "catalog"}
              onClick={() => toggle("catalog")}
            >
              Catalog <span className="caret">▾</span>
            </button>
            <div className={`nav-dd-menu${dd === "catalog" ? " open" : ""}`}>
              <a href="/catalog?type=Fiction">Fiction</a>
              <a href="/catalog?type=Non-Fiction">Non-Fiction</a>
              <a href="/catalog?type=Interactive">Interactive stories</a>
              <a href="/catalog?free=1">Free to read</a>
              <a href="/catalog" className="dd-all">Browse everything →</a>
            </div>
          </li>

          {/* My Library dropdown */}
          <li className="nav-dd" data-dd-root>
            <button
              type="button"
              className={`nav-dd-link${dd === "library" ? " active" : ""}`}
              aria-haspopup="true"
              aria-expanded={dd === "library"}
              onClick={() => toggle("library")}
            >
              My Library <span className="caret">▾</span>
            </button>
            <div className={`nav-dd-menu${dd === "library" ? " open" : ""}`}>
              <a href="/my-library">Continue reading</a>
              <a href="/my-library">Reading history</a>
              <a href="/wishlist">Saved &amp; wishlist</a>
              <a href="/cart" onClick={(e) => { e.preventDefault(); setDd(null); openCart(); }}>Your cart</a>
              <a href="/my-library" className="dd-all">Open My Library →</a>
            </div>
          </li>

          <li>
            <a href="/about">About</a>
          </li>
        </ul>

        <div className="nav-right">
          {signedIn ? (
            <div className="nav-user" data-dd-root>
              <button className="user-chip" onClick={() => toggle("user")} aria-haspopup="true" aria-expanded={dd === "user"}>
                <span className="user-avatar">{avatar}</span>
                <span className="user-name">{name}</span>
                <span className="user-caret">▾</span>
              </button>
              <div className={`user-menu${dd === "user" ? " open" : ""}`}>
                <div className="user-menu-head">
                  <span className="user-avatar">{avatar}</span>
                  <span className="user-menu-name">{name}</span>
                </div>
                <a href="/home">Home</a>
                <a href="/my-library">My Library</a>
                <a href="/creator">Creator Dashboard</a>
                <a href="/settings">Settings</a>
                <form action="/auth/signout" method="post">
                  <button type="submit" style={menuBtn}>Log out</button>
                </form>
              </div>
            </div>
          ) : (
            <a href="/login" className="btn-login">Log in</a>
          )}
          <div className="hamburger" onClick={() => setMobile((v) => !v)}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>

      <div id="mobile-menu" className={mobile ? "open" : ""}>
        {signedIn ? (
          <div className="mm-user">
            <span className="user-avatar">{avatar}</span>
            <span className="mm-user-name">{name}</span>
          </div>
        ) : null}
        <a href="/home">Home</a>
        <a href="/catalog">Catalog</a>
        <a href="/my-library">My Library</a>
        <a href="/wishlist">Wishlist</a>
        <a href="/cart" onClick={(e) => { e.preventDefault(); setMobile(false); openCart(); }}>Cart</a>
        <a href="/creator">Creator Dashboard</a>
        <a href="/about">About</a>
        <a href="/settings">Settings</a>
        {signedIn ? (
          <form action="/auth/signout" method="post">
            <button type="submit" style={{ ...menuBtn, padding: "0.4rem 0" }}>Log out</button>
          </form>
        ) : (
          <a href="/login">Log in</a>
        )}
      </div>

      <CartDrawer />
    </>
  );
}
