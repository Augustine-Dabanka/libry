"use client";

import { useEffect, useState } from "react";

const THEMES = ["gold", "obsidian", "emerald", "amethyst"];

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
  const [cat, setCat] = useState(false);
  const [menu, setMenu] = useState(false);
  const [mobile, setMobile] = useState(false);

  // Close dropdowns on any outside click.
  useEffect(() => {
    const close = () => {
      setCat(false);
      setMenu(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  function cycleTheme() {
    let cur = "gold";
    try {
      cur = localStorage.getItem("libry-brand") || "gold";
    } catch {}
    const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
    try {
      localStorage.setItem("libry-brand", next);
    } catch {}
    document.documentElement.setAttribute("data-brand", next);
  }

  const avatar = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl} alt="" />
  ) : (
    initials
  );

  const menuLink: React.CSSProperties = {
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
      <nav className="navbar">
        <div className="nav-left">
          <a href="/home" className="logo">
            Libry<span>.</span>
          </a>
          <div className="nav-dd" id="cat-dd" onClick={(e) => e.stopPropagation()}>
            <button className="nav-dd-btn" onClick={() => { setCat((v) => !v); setMenu(false); }}>
              ☰ Browse Categories <span className="caret">▾</span>
            </button>
            <div className={`nav-dd-menu${cat ? " open" : ""}`}>
              <a href="/catalog?q=Literary">Literary Fiction</a>
              <a href="/catalog?q=Interactive">Interactive Storybooks</a>
              <a href="/catalog?q=Science">Sci-Fi &amp; Fantasy</a>
              <a href="/catalog?q=Children">Children&rsquo;s</a>
              <a href="/catalog?q=Non-Fiction">Non-Fiction</a>
              <a href="/catalog" className="dd-all">Browse all titles →</a>
            </div>
          </div>
          <a href="/discover?filter=interactive" className="nav-badge">✦ Interactive Stories</a>
        </div>

        <div className="nav-center">
          <form className="nav-search" id="nav-search" action="/catalog" method="get">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input name="q" type="text" placeholder="Search titles, authors, tags…" autoComplete="off" aria-label="Search" />
          </form>
        </div>

        <div className="nav-right">
          <a href="/creator" className="btn-write">✎ Write / Publish</a>
          <button className="nav-icon-btn" onClick={cycleTheme} title="Cycle theme" aria-label="Cycle theme" type="button">
            ◐
          </button>
          <a href="/leagues" className="icon-link" title="Leagues" aria-label="Leagues">🏆</a>
          <a href="/shop" className="icon-link" title="Token shop" aria-label="Token shop">⚡</a>

          {signedIn ? (
            <div className="nav-user" id="nav-user" onClick={(e) => e.stopPropagation()}>
              <button className="user-chip" onClick={() => { setMenu((v) => !v); setCat(false); }} aria-haspopup="true">
                <span className="user-avatar">{avatar}</span>
                <span className="user-name">{name}</span>
                <span className="user-caret">▾</span>
              </button>
              <div className={`user-menu${menu ? " open" : ""}`}>
                <div className="user-menu-head">
                  <span className="user-avatar">{avatar}</span>
                  <span className="user-menu-name">{name}</span>
                </div>
                <a href="/home">Home</a>
                <a href="/creator">Creator Dashboard</a>
                <a href="/leagues">Leagues</a>
                <a href="/settings">Settings</a>
                <form action="/auth/signout" method="post">
                  <button type="submit" style={menuLink}>Log out</button>
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
        <a href="/discover?filter=interactive">Interactive Stories</a>
        <a href="/creator">Write / Publish</a>
        <a href="/leagues">Leagues</a>
        <a href="/shop">Shop</a>
        <a href="/settings">Settings</a>
        {signedIn ? (
          <form action="/auth/signout" method="post">
            <button type="submit" style={{ ...menuLink, padding: "0.4rem 0" }}>Log out</button>
          </form>
        ) : (
          <a href="/login">Log in</a>
        )}
      </div>
    </>
  );
}
