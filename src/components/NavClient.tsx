"use client";

import { useEffect, useRef, useState } from "react";
import CartDrawer from "@/components/CartDrawer";
import { cartCount, onCartChange, openCart } from "@/lib/cart";

type Dd = null | "browse" | "user";

export default function NavClient({
  signedIn,
  name,
  avatarUrl,
  initials,
  email,
  wishCount = 0,
  genres = [],
}: {
  signedIn: boolean;
  name: string;
  avatarUrl: string | null;
  initials: string;
  email?: string;
  wishCount?: number;
  genres?: string[];
}) {
  const [dd, setDd] = useState<Dd>(null);
  const [mobile, setMobile] = useState(false);
  const [cartN, setCartN] = useState(0);
  const [wishN, setWishN] = useState(wishCount);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sync = () => setCartN(cartCount());
    sync();
    return onCartChange(sync);
  }, []);

  useEffect(() => { setWishN(wishCount); }, [wishCount]);
  useEffect(() => {
    const onWish = (e: Event) => setWishN((n) => Math.max(0, n + ((e as CustomEvent).detail || 0)));
    window.addEventListener("libry:wishlist-change", onWish);
    return () => window.removeEventListener("libry:wishlist-change", onWish);
  }, []);

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

  function toggleTheme() {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("libry-theme", next);
    } catch {}
  }

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
        {/* LEFT: logo · Browse ▾ · Interactive */}
        <div className="nav-left">
          <a href="/home" className="logo">
            Libry<span>.</span>
          </a>

          <div className="nav-dd" data-dd-root>
            <button
              type="button"
              className="nav-dd-btn"
              aria-haspopup="true"
              aria-expanded={dd === "browse"}
              onClick={() => toggle("browse")}
            >
              &#9776; Browse <span className="caret">▾</span>
            </button>
            <div className={`nav-mega${dd === "browse" ? " open" : ""}`}>
              <div className="nav-mega-col nav-mega-genres">
                <h5>Genres</h5>
                {(genres.length ? genres : ["Fiction", "Non-Fiction"]).map((g) => (
                  <a key={g} href={`/catalog?genre=${encodeURIComponent(g)}`}>{g}</a>
                ))}
              </div>
              <div className="nav-mega-col">
                <h5>Formats</h5>
                <a href="/catalog?type=Interactive">✦ Interactive</a>
                <a href="/catalog?free=1">Free to read</a>
                <a href="/catalog?paid=1">Premium</a>
              </div>
              <div className="nav-mega-col">
                <h5>Discover</h5>
                <a href="/catalog">Browse all</a>
                <a href="/discover">Trending</a>
                <a href="/discover?filter=editors-pick">Editor&apos;s Pick</a>
                <a href="/unlimited">Libry Unlimited</a>
              </div>
            </div>
          </div>

          <a className="nav-badge" href="/catalog?type=Interactive">✦ Interactive</a>
        </div>

        {/* RIGHT: Write · theme · wishlist · cart · avatar */}
        <div className="nav-right">
          <a className="btn-write" href="/creator">✎ Write</a>

          <button type="button" className="nav-icon-btn" title="Toggle theme" aria-label="Toggle light or dark" onClick={toggleTheme}>
            ◑
          </button>

          <a href="/my-library?tab=wishlist" className="icon-link" title="Wishlist" aria-label="Wishlist">
            &#9829;{wishN > 0 ? <span className="badge-count">{wishN}</span> : null}
          </a>
          <button type="button" className="icon-link" title="Cart" aria-label="Cart" onClick={openCart} style={{ background: "transparent", border: "none", cursor: "pointer", font: "inherit" }}>
            &#128722; <span className="badge-count">{cartN}</span>
          </button>

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
                <a href="/achievements">Achievements</a>
                <a href="/creator">Creator Dashboard</a>
                <a href="/settings">Settings</a>
                <a href="/about">About</a>
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
        <a href="/catalog">Browse all</a>
        <a href="/catalog?type=Interactive">Interactive stories</a>
        {(genres.length ? genres : ["Fiction", "Non-Fiction"]).slice(0, 8).map((g) => (
          <a key={g} href={`/catalog?genre=${encodeURIComponent(g)}`}>{g}</a>
        ))}
        <a href="/my-library">My Library</a>
        <a href="/achievements">Achievements</a>
        <a href="/wishlist">Wishlist</a>
        <a href="/cart" onClick={(e) => { e.preventDefault(); setMobile(false); openCart(); }}>Cart</a>
        <a href="/creator">Write / Creator Dashboard</a>
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

      <CartDrawer email={email} />
    </>
  );
}
