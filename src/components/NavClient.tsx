"use client";

import { useEffect, useRef, useState } from "react";
import CartDrawer from "@/components/CartDrawer";
import LogoutSurvey from "@/components/LogoutSurvey";
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
  const [mSection, setMSection] = useState<null | "genres" | "discover">(null);
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
                <LogoutSurvey style={menuBtn} />
              </div>
            </div>
          ) : (
            <a href="/login" className="btn-login">Log in</a>
          )}

          <button
            type="button"
            className={`hamburger${mobile ? " open" : ""}`}
            aria-label={mobile ? "Close menu" : "Open menu"}
            aria-expanded={mobile}
            aria-controls="mobile-menu"
            onClick={() => setMobile((v) => !v)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <div id="mobile-menu" className={mobile ? "open" : ""} aria-hidden={!mobile}>
        {signedIn ? (
          <div className="mm-user">
            <span className="user-avatar">{avatar}</span>
            <span className="mm-user-name">{name}</span>
          </div>
        ) : null}

        <div className="mm-scroll">
          <a className="mm-link" href="/catalog">Browse all</a>
          <a className="mm-link" href="/catalog?type=Interactive">✦ Interactive stories</a>

          {/* Genres — collapsed by default so the menu stays short & scrollable */}
          <div className="mm-group">
            <button
              type="button"
              className={`mm-acc${mSection === "genres" ? " open" : ""}`}
              aria-expanded={mSection === "genres"}
              onClick={() => setMSection((s) => (s === "genres" ? null : "genres"))}
            >
              <span>Genres</span>
              <span className="mm-caret">▾</span>
            </button>
            <div className={`mm-sub${mSection === "genres" ? " open" : ""}`}>
              {(genres.length ? genres : ["Fiction", "Non-Fiction"]).map((g) => (
                <a key={g} href={`/catalog?genre=${encodeURIComponent(g)}`}>{g}</a>
              ))}
            </div>
          </div>

          {/* Discover */}
          <div className="mm-group">
            <button
              type="button"
              className={`mm-acc${mSection === "discover" ? " open" : ""}`}
              aria-expanded={mSection === "discover"}
              onClick={() => setMSection((s) => (s === "discover" ? null : "discover"))}
            >
              <span>Discover</span>
              <span className="mm-caret">▾</span>
            </button>
            <div className={`mm-sub${mSection === "discover" ? " open" : ""}`}>
              <a href="/discover">Trending</a>
              <a href="/discover?filter=editors-pick">Editor&apos;s Pick</a>
              <a href="/catalog?free=1">Free to read</a>
              <a href="/catalog?paid=1">Premium</a>
              <a href="/unlimited">Libry Unlimited</a>
            </div>
          </div>

          <div className="mm-divider" />

          <a className="mm-link" href="/my-library">My Library</a>
          <a className="mm-link" href="/my-library?tab=wishlist">
            Wishlist{wishN > 0 ? <span className="mm-count">{wishN}</span> : null}
          </a>
          <a className="mm-link" href="/cart" onClick={(e) => { e.preventDefault(); setMobile(false); openCart(); }}>
            Cart{cartN > 0 ? <span className="mm-count">{cartN}</span> : null}
          </a>
          <a className="mm-link" href="/achievements">Achievements</a>
          <a className="mm-link" href="/creator">✎ Write / Creator</a>

          <div className="mm-divider" />

          <a className="mm-link" href="/about">About</a>
          <a className="mm-link" href="/settings">Settings</a>
        </div>

        {signedIn ? (
          <LogoutSurvey className="mm-signout" />
        ) : (
          <a className="btn btn-gold mm-cta" href="/login">Log in</a>
        )}
      </div>

      <CartDrawer email={email} />
    </>
  );
}
