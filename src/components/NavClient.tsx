"use client";

import { useEffect, useState } from "react";

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
  const [menu, setMenu] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const close = () => setMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

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
      <nav className="navbar">
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
            <a href="/cart" className="icon-link" title="Cart" aria-label="Cart">
              &#128722; Cart <span className="badge-count">0</span>
            </a>
          </li>
          <li>
            <a href="/home">Home</a>
          </li>
          <li>
            <a href="/catalog">Catalog</a>
          </li>
          <li>
            <a href="/my-library">My Library</a>
          </li>
          <li>
            <a href="/about">About</a>
          </li>
        </ul>

        <div className="nav-right">
          {signedIn ? (
            <div className="nav-user" id="nav-user" onClick={(e) => e.stopPropagation()}>
              <button className="user-chip" onClick={() => setMenu((v) => !v)} aria-haspopup="true">
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
        <a href="/cart">Cart</a>
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
    </>
  );
}
