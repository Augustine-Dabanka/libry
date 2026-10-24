"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, Bell, Compass, Heart, Home, LibraryBig, Medal, Moon, PenLine, Settings, ShoppingCart, Sparkles, Sun, Users, type LucideIcon } from "lucide-react";
import CartDrawer from "@/components/CartDrawer";
import LogoutSurvey from "@/components/LogoutSurvey";
import StreakCard from "@/components/StreakCard";
import { cartCount, onCartChange, openCart } from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";
import LibryIcon from "@/components/Icon";
import GuestSync from "@/components/GuestSync";
import GuestSaveBanner from "@/components/GuestSaveBanner";

/* Shared Lucide icon presets: consistent geometry, with a filled active state. */
type IconName = "home" | "browse" | "spark" | "compass" | "library" | "medal" | "pen" | "heart" | "cart" | "theme" | "cog" | "community" | "bell";
const NAV_ICONS: Record<IconName, LucideIcon> = {
  home: Home,
  browse: BookOpen,
  spark: Sparkles,
  compass: Compass,
  library: LibraryBig,
  medal: Medal,
  pen: PenLine,
  heart: Heart,
  cart: ShoppingCart,
  theme: Sun,
  cog: Settings,
  community: Users,
  bell: Bell,
};
function Icon({ name, active = false }: { name: IconName; active?: boolean }) {
  const Preset = NAV_ICONS[name];
  return (
    <Preset
      size={21}
      strokeWidth={active ? 2.2 : 1.7}
      fill={active ? "currentColor" : "none"}
      aria-hidden="true"
    />
  );
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
  const [cartN, setCartN] = useState(0);
  const [wishN, setWishN] = useState(wishCount);
  const [notifN, setNotifN] = useState(notifCount);
  const [search, setSearch] = useState("");
  const [activeTheme, setActiveTheme] = useState<"light" | "dark">("light");

  // Live notification badge (Supabase Realtime). notifications RLS is scoped to
  // user_id = auth.uid(), so an unfiltered subscription only delivers this
  // user's own new notifications.
  useEffect(() => {
    if (!signedIn) return;
    const supabase = createClient();
    const ch = supabase
      .channel("nav-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => setNotifN((n) => n + 1))
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [signedIn]);
  const rootRef = useRef<HTMLElement>(null);

  // The rail reserves a slim gutter on the left for every shell page; the mobile
  // top bar takes over below 900px (CSS drops the padding there).
  useEffect(() => {
    document.body.classList.add("has-rail");
    document.body.classList.add("has-mobtabs");
    return () => {
      document.body.classList.remove("has-rail");
      document.body.classList.remove("has-mobtabs");
    };
  }, [signedIn]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setSearch(window.location.search));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    const sync = () => setCartN(cartCount());
    const frame = window.requestAnimationFrame(sync);
    const unsubscribe = onCartChange(sync);
    return () => { window.cancelAnimationFrame(frame); unsubscribe(); };
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

  useEffect(() => {
    const syncTheme = () => setActiveTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
    const frame = window.requestAnimationFrame(syncTheme);
    window.addEventListener("storage", syncTheme);
    window.addEventListener("libry:theme-change", syncTheme);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("storage", syncTheme); window.removeEventListener("libry:theme-change", syncTheme); };
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    setActiveTheme(next);
    try { localStorage.setItem("libry-theme", next); } catch {}
    window.dispatchEvent(new CustomEvent("libry:theme-change", { detail: next }));
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
        <a href="/home" className="rail-logo" title="Lybry — Home" aria-label="Lybry home">
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
                    <span className="rail-ico"><Icon name={it.icon} active={active} /></span>
                    <span className="rail-label">{it.label}</span>
                  </a>
                  <div className="rail-flyout" role="menu">
                    <div className="rf-col">
                      <h6>Genres</h6>
                      <div className="rf-genres">
                        <a href="/catalog?type=Interactive"><LibryIcon name="interactive" size={16} /> Interactive</a>
                        {genreList.map((g) => (
                          <a key={g} href={`/catalog?genre=${encodeURIComponent(g)}`}>{g}</a>
                        ))}
                      </div>
                    </div>
                    <div className="rf-col">
                      <h6>Formats</h6>
                      <a href="/search"><LibryIcon name="search" size={16} /> Search</a>
                      <a href="/comics"><LibryIcon name="comics" size={16} /> Comics</a>
                      <a href="/catalog?type=Interactive"><LibryIcon name="interactive" size={16} /> Interactive</a>
                      <a href="/catalog?free=1">Free to read</a>
                      <a href="/catalog?paid=1">Premium</a>
                      <a href="/unlimited">Lybry Unlimited</a>
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
                      <Icon name={it.icon} active={active} />
                      {notifN > 0 ? <span className="rail-dot">{notifN}</span> : null}
                    </span>
                    <span className="rail-label">{it.label}</span>
                  </a>
                  <div className="rail-flyout" role="menu" style={{ gridTemplateColumns: "1fr", minWidth: 210 }}>
                    <div className="rf-col">
                      <h6>Community</h6>
                      <a href="/community">Feed</a>
                      <a href="/communities">Communities</a>
                      <a href="/notifications">Notifications{notifN > 0 ? ` (${notifN})` : ""}</a>
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
                <a href="/wallet">Wallet</a>
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

      {/* ══════════ MOBILE: slim top bar (logo, search, cart, account) ══════════
          Phones get ONE navigation system: the bottom tabs. The top bar only
          holds search and account; there is no hamburger menu any more. */}
      <nav className="navbar" ref={rootRef} aria-label="Account and search">
        <div className="nav-left">
          <a href={signedIn ? "/home" : "/"} className="logo">
            Lybry<span>.</span>
          </a>
        </div>

        <div className="nav-right">
          {signedIn ? <StreakCard compact /> : null}

          <a href="/search" className="nav-icon-btn" aria-label="Search" title="Search">
            <LibryIcon name="search" size={20} />
          </a>

          <button type="button" className="nav-icon-btn" onClick={toggleTheme} title={activeTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"} aria-label={activeTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>\n            {activeTheme === "dark" ? <Moon size={20} strokeWidth={1.8} /> : <Sun size={20} strokeWidth={1.8} />}\n          </button>\n\n          <button type="button" className="nav-icon-btn" title="Cart" aria-label={`Cart, ${cartN} item${cartN === 1 ? "" : "s"}`} onClick={openCart} style={{ position: "relative" }}>
            <Icon name="cart" />
            {cartN > 0 ? <span className="badge-count" style={{ position: "absolute", top: -4, right: -4 }}>{cartN}</span> : null}
          </button>

          {signedIn ? (
            <div className="mob-user" data-dd-root style={{ position: "relative" }}>
              <button type="button" className="mob-user-btn" onClick={() => setMobUser((v) => !v)} aria-haspopup="true" aria-expanded={mobUser} aria-label="Account menu">
                <span className="user-avatar">{avatar}</span>
              </button>
              <div className={`mob-user-menu${mobUser ? " open" : ""}`} role="menu">
                <a href="/profile">Profile</a>
                <a href="/achievements">Achievements</a>
                <a href="/notifications">Notifications{notifN > 0 ? ` (${notifN})` : ""}</a>
                <a href="/my-library?tab=wishlist">Wishlist{wishN > 0 ? ` (${wishN})` : ""}</a>
                <a href="/wallet">Wallet</a>
                <a href="/creator">Write / Creator</a>
                <a href="/unlimited">Lybry Unlimited</a>
                <a href="/settings">Settings</a>
                <a href="/about">About</a>
                <button type="button" onClick={toggleTheme} style={menuBtn}>Light / dark</button>
                <LogoutSurvey style={menuBtn} />
              </div>
            </div>
          ) : (
            <a href="/login" className="btn-login">Log in</a>
          )}
        </div>
      </nav>

      {/* ══════════ MOBILE: app-style bottom tab bar (everyone; guests get browse tabs + sign up) ══════════ */}
      <nav className="mobtabs" aria-label="Primary">
        {(signedIn
          ? [
              { href: "/home", label: "Home", icon: "home" as IconName },
              { href: "/discover", label: "Discover", icon: "compass" as IconName },
              { href: "/my-library", label: "Library", icon: "library" as IconName },
              { href: "/communities", label: "Rooms", icon: "community" as IconName },
              { href: "/profile", label: "Profile", icon: null },
            ]
          : [
              { href: "/discover", label: "Discover", icon: "compass" as IconName },
              { href: "/catalog", label: "Browse", icon: "browse" as IconName },
              { href: "/communities", label: "Rooms", icon: "community" as IconName },
              { href: "/unlimited", label: "Try free", icon: "spark" as IconName },
              { href: "/login", label: "Sign up", icon: null },
            ]
        ).map((t) => {
          const on = pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <a key={t.href} href={t.href} className={`mobtab${on ? " active" : ""}`} aria-current={on ? "page" : undefined}>
              <span className="mobtab-ico">{t.icon ? <Icon name={t.icon} active={on} /> : <span className="mobtab-avatar">{signedIn ? avatar : "+"}</span>}</span>
              <span className="mobtab-label">{t.label}</span>
            </a>
          );
        })}
      </nav>

      {signedIn && email ? <GuestSync email={email} /> : null}
      {!signedIn ? <GuestSaveBanner /> : null}
      <CartDrawer email={email} />
    </>
  );
}
