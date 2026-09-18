"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import CartDrawer from "@/components/CartDrawer";
import LogoutSurvey from "@/components/LogoutSurvey";
import StreakCard from "@/components/StreakCard";
import { cartCount, onCartChange, openCart } from "@/lib/cart";

/* ── line icons (22px, stroke = currentColor) ─────────────────────────────── */
type IconName = "home" | "browse" | "spark" | "compass" | "library" | "medal" | "pen" | "heart" | "cart" | "theme" | "cog" | "community" | "bell";
function Icon({ name }: { name: IconName }) {
  const p: React.SVGProps<SVGSVGElement> = { width: 21, height: 21, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  switch (name) {
    case "home": return (<svg {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></svg>);
    case "browse": return (<svg {...p}><rect x="3" y="4" width="7" height="16" rx="1.2" /><path d="M13 4h3.4a1 1 0 0 1 1 1l2.2 13a1 1 0 0 1-.8 1.16l-2.5.42a1 1 0 0 1-1.15-.8L13 4Z" /></svg>);
    case "spark": return (<svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M12 8.5 13.4 11 16 12l-2.6 1L12 15.5 10.6 13 8 12l2.6-1L12 8.5Z" /></svg>);
    case "compass": return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></svg>);
    case "library": return (<svg {...p}><path d="M6 4h12a1 1 0 0 1 1 1v15l-7-3.2L5 20V5a1 1 0 0 1 1-1Z" /></svg>);
    case "medal": return (<svg {...p}><circle cx="12" cy="14" r="5" /><path d="M9 9.2 7 3h10l-2 6.2M12 12v1.6l1.3.8-.5-1.5" /></svg>);
    case "pen": return (<svg {...p}><path d="M15.5 5.5 18.5 8.5M4 20l1-4L16 5a1.4 1.4 0 0 1 2 0l1 1a1.4 1.4 0 0 1 0 2L8 19l-4 1Z" /></svg>);
    case "heart": return (<svg {...p}><path d="M12 20s-7-4.3-7-9.3A3.7 3.7 0 0 1 12 8a3.7 3.7 0 0 1 7-2.3c0 5-7 9.3-7 9.3Z" /></svg>);
    case "cart": return (<svg {...p}><path d="M4 5h2l1.6 10.5a1 1 0 0 0 1 .85h8.2a1 1 0 0 0 1-.8L20 8H7" /><circle cx="9.5" cy="20" r="1.1" /><circle cx="17.5" cy="20" r="1.1" /></svg>);
    case "theme": return (<svg {...p}><circle cx="12" cy="12" r="4.2" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></svg>);
    case "cog": return (<svg {...p}><circle cx="12" cy="12" r="3" /><path d="M12 3v2.2M12 18.8V21M4.2 7l1.9 1.1M17.9 15.9 19.8 17M4.2 17l1.9-1.1M17.9 8.1 19.8 7" /></svg>);
    case "community": return (<svg {...p}><circle cx="9" cy="9" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 6.2a3 3 0 0 1 0 5.6M17.5 19a5.5 5.5 0 0 0-3-4.9" /></svg>);
    case "bell": return (<svg {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>);
  }
}

type RailItem = { href: string; label: string; icon: IconName; match?: (path: string, q: string) => boolean };

const PRIMARY: RailItem[] = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/catalog", label: "Browse", icon: "browse", match: (p) => p === "/catalog" },
  { href: "/discover", label: "Discover", icon: "compass" },
  { href: "/community", label: "Community", icon: "community" },
  { href: "/my-library", label: "My Library", icon: "library" },
  { href: "/achievements", label: "Achievements", icon: "medal" },
  { href: "/creator", label: "Write", icon: "pen" },
];

export default function NavClient({
  signedIn,
  name,
  avatarUrl,
  initials,
  email,
  wishCount = 0,
  notifCount = 0,
  genres = [],
}: {
  signedIn: boolean;
  name: string;
  avatarUrl: string | null;
  initials: string;
  email?: string;
  wishCount?: number;
  notifCount?: number;
  genres?: string[];
}) {
  const pathname = usePathname() || "/";
  const [railMenu, setRailMenu] = useState<null | "browse" | "user">(null);
  const [mobUser, setMobUser] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [mSection, setMSection] = useState<null | "genres" | "discover">(null);
  const [cartN, setCartN] = useState(0);
  const [wishN, setWishN] = useState(wishCount);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLElement>(null);

  // The rail reserves a slim gutter on the left for every shell page; the mobile
  // top bar takes over below 900px (CSS drops the padding there).
  useEffect(() => {
    document.body.classList.add("has-rail");
    return () => document.body.classList.remove("has-rail");
  }, []);

  useEffect(() => setSearch(typeof window !== "undefined" ? window.location.search : ""), [pathname]);

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
      if (t && !t.closest("[data-dd-root]")) { setRailMenu(null); setMobUser(false); }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setRailMenu(null); setMobUser(false); }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("libry-theme", next);
    } catch {}
  }

  function isActive(it: RailItem) {
    if (it.match) return it.match(pathname, search);
    return pathname === it.href || pathname.startsWith(it.href + "/");
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

  const genreList = genres.length ? genres : ["Fiction", "Non-Fiction"];

  return (
    <>
      {/* ══════════ DESKTOP: Chrome-style vertical rail ══════════ */}
      <aside className="railnav" aria-label="Primary">
        <a href="/home" className="rail-logo" title="Libry — Home" aria-label="Libry home">
          L<span>.</span>
        </a>

        <nav className="rail-main">
          {PRIMARY.map((it) => {
            const active = isActive(it);
            // "Browse" carries a hover flyout with genres & formats.
            if (it.href === "/catalog") {
              return (
                <div key={it.href} className="rail-item-wrap" data-dd-root>
                  <a href={it.href} className={`rail-item${active ? " active" : ""}`} aria-current={active ? "page" : undefined}>
                    <span className="rail-ico"><Icon name={it.icon} /></span>
                    <span className="rail-label">{it.label}</span>
                  </a>
                  <div className="rail-flyout" role="menu">
                    <div className="rf-col">
                      <h6>Genres</h6>
                      <div className="rf-genres">
                        <a href="/catalog?type=Interactive">✦ Interactive</a>
                        {genreList.map((g) => (
                          <a key={g} href={`/catalog?genre=${encodeURIComponent(g)}`}>{g}</a>
                        ))}
                      </div>
                    </div>
                    <div className="rf-col">
                      <h6>Formats</h6>
                      <a href="/catalog?free=1">Free to read</a>
                      <a href="/catalog?paid=1">Premium</a>
                      <a href="/unlimited">Libry Unlimited</a>
                    </div>
                  </div>
                </div>
              );
            }
            // "Community" carries a flyout with the feed + notifications.
            if (it.href === "/community") {
              return (
                <div key={it.href} className="rail-item-wrap" data-dd-root>
                  <a href={it.href} className={`rail-item${active ? " active" : ""}`} aria-current={active ? "page" : undefined}>
                    <span className="rail-ico">
                      <Icon name={it.icon} />
                      {notifCount > 0 ? <span className="rail-dot">{notifCount}</span> : null}
                    </span>
                    <span className="rail-label">{it.label}</span>
                  </a>
                  <div className="rail-flyout" role="menu" style={{ gridTemplateColumns: "1fr", minWidth: 210 }}>
                    <div className="rf-col">
                      <h6>Community</h6>
                      <a href="/community">Feed</a>
                      <a href="/notifications">Notifications{notifCount > 0 ? ` (${notifCount})` : ""}</a>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <a key={it.href} href={it.href} className={`rail-item${active ? " active" : ""}`} aria-current={active ? "page" : undefined}>
                <span className="rail-ico"><Icon name={it.icon} /></span>
                <span className="rail-label">{it.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="rail-bottom">
          {signedIn ? (
            <div className="rail-streak"><StreakCard compact /></div>
          ) : null}

          <a href="/my-library?tab=wishlist" className="rail-item" title="Wishlist">
            <span className="rail-ico">
              <Icon name="heart" />
              {wishN > 0 ? <span className="rail-dot">{wishN}</span> : null}
            </span>
            <span className="rail-label">Wishlist</span>
          </a>

          <button type="button" className="rail-item" onClick={openCart} title="Cart">
            <span className="rail-ico">
              <Icon name="cart" />
              {cartN > 0 ? <span className="rail-dot">{cartN}</span> : null}
            </span>
            <span className="rail-label">Cart</span>
          </button>

          <button type="button" className="rail-item" onClick={toggleTheme} title="Toggle light / dark">
            <span className="rail-ico"><Icon name="theme" /></span>
            <span className="rail-label">Theme</span>
          </button>

          {signedIn ? (
            <div className="rail-item-wrap rail-user-wrap" data-dd-root>
              <button
                type="button"
                className={`rail-item rail-user${railMenu === "user" ? " open" : ""}`}
                onClick={() => setRailMenu((m) => (m === "user" ? null : "user"))}
                aria-haspopup="true"
                aria-expanded={railMenu === "user"}
                title={name}
              >
                <span className="rail-ico"><span className="rail-avatar">{avatar}</span></span>
                <span className="rail-label">{name || "Account"}</span>
              </button>
              <div className={`rail-usermenu${railMenu === "user" ? " open" : ""}`} role="menu">
                <div className="rail-usermenu-head">
                  <span className="rail-avatar lg">{avatar}</span>
                  <span className="rail-usermenu-name">{name}</span>
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
            <a href="/login" className="rail-item rail-login" title="Log in">
              <span className="rail-ico"><Icon name="cog" /></span>
              <span className="rail-label">Log in</span>
            </a>
          )}
        </div>
      </aside>

      {/* ══════════ MOBILE: top bar + slide-in menu ══════════ */}
      <nav className="navbar" ref={rootRef}>
        <div className="nav-left">
          <a href="/home" className="logo">
            Libry<span>.</span>
          </a>
        </div>

        <div className="nav-right">
          {signedIn ? <StreakCard compact /> : null}

          {!signedIn ? (
            <button type="button" className="nav-icon-btn" title="Toggle theme" aria-label="Toggle light or dark" onClick={toggleTheme}>◑</button>
          ) : null}

          {signedIn ? (
            <a href="/notifications" className="icon-link" title="Notifications" aria-label="Notifications">
              &#128276;{notifCount > 0 ? <span className="badge-count">{notifCount}</span> : null}
            </a>
          ) : null}

          <button type="button" className="icon-link" title="Cart" aria-label="Cart" onClick={openCart} style={{ background: "transparent", border: "none", cursor: "pointer", font: "inherit" }}>
            &#128722; <span className="badge-count">{cartN}</span>
          </button>

          {signedIn ? (
            <div className="mob-user" data-dd-root style={{ position: "relative" }}>
              <button type="button" className="mob-user-btn" onClick={() => setMobUser((v) => !v)} aria-haspopup="true" aria-expanded={mobUser} aria-label="Account menu">
                <span className="user-avatar">{avatar}</span>
              </button>
              <div className={`mob-user-menu${mobUser ? " open" : ""}`} role="menu">
                <a href="/home">Home</a>
                <a href="/my-library">My Library</a>
                <a href="/achievements">Achievements</a>
                <a href="/creator">Creator Dashboard</a>
                <a href="/settings">Settings</a>
                <button type="button" onClick={toggleTheme} style={menuBtn}>◑ Toggle theme</button>
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
          <a className="mm-link" href="/home">Home</a>
          <a className="mm-link" href="/catalog">Browse all</a>

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
              <a href="/catalog?type=Interactive">✦ Interactive</a>
              {genreList.map((g) => (
                <a key={g} href={`/catalog?genre=${encodeURIComponent(g)}`}>{g}</a>
              ))}
            </div>
          </div>

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

          <a className="mm-link" href="/community">Community</a>
          <a className="mm-link" href="/notifications">
            Notifications{notifCount > 0 ? <span className="mm-count">{notifCount}</span> : null}
          </a>
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
