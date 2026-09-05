"use client";

import { usePathname } from "next/navigation";

// Site footer for every in-app page. Hidden on the landing (which has its own),
// on the auth/onboarding flow, and in the immersive reader.
const HIDE = ["/login", "/onboarding", "/reader", "/auth", "/links", "/creator", "/b/"];

export default function AppFooter() {
  const pathname = usePathname() || "/";
  if (pathname === "/" || HIDE.some((p) => pathname.startsWith(p))) return null;

  return (
    <footer className="site-footer">
      <div className="footer-cols">
        <div>
          <div className="footer-logo">
            Libry<span>.</span>
          </div>
          <p className="footer-tag">Stories worth lingering in.</p>
          <div className="footer-social">
            <a href="https://www.youtube.com/@officially_libry" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.8-1.8C19.3 5 12 5 12 5s-7.3 0-8.8.5A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.8 1.8C4.7 19 12 19 12 19s7.3 0 8.8-.5a2.5 2.5 0 0 0 1.8-1.8C23 15.2 23 12 23 12zM9.8 15.3V8.7l5.7 3.3z" /></svg>
            </a>
            <a href="https://x.com/officially_libry" target="_blank" rel="noopener noreferrer" aria-label="X">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.2 2h3.3l-7.2 8.3L23 22h-6.6l-5.2-6.8L5.3 22H2l7.7-8.8L1.5 2h6.8l4.7 6.2zm-1.2 18h1.8L7.1 3.9H5.2z" /></svg>
            </a>
            <a href="https://www.instagram.com/officially_libry" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
            </a>
            <a href="https://www.tiktok.com/@officially_libry" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.3 2.1 1.6 3.7 3.7 4.1v2.7c-1.4 0-2.7-.4-3.7-1.1v5.9a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.8a2.8 2.8 0 1 0 2 2.7V3z" /></svg>
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Read</h4>
          <a href="/catalog">Browse the catalog</a>
          <a href="/unlimited">Libry Unlimited</a>
          <a href="/discover?filter=free">Free to read</a>
          <a href="/discover?filter=interactive">Interactive stories</a>
          <a href="/my-library">My Library</a>
        </div>

        <div className="footer-col">
          <h4>Write</h4>
          <a href="/creator">Creator Dashboard</a>
          <a href="/creator-hub/docs?tab=guidelines">Publishing guidelines</a>
          <a href="/creator-hub/docs?tab=analytics">Creator Hub</a>
        </div>

        <div className="footer-col">
          <h4>Company</h4>
          <a href="/about">About</a>
          <a href="/docs?tab=terms">Terms of Service</a>
          <a href="/docs?tab=privacy">Privacy Policy</a>
        </div>
      </div>

      <div className="footer-bar">
        <span className="footer-status">
          <span className="status-dot" /> Early access · reading free to start
        </span>
        <span className="footer-copy">© 2026 Libry. Crafted with care for readers &amp; writers.</span>
      </div>
    </footer>
  );
}
