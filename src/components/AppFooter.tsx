"use client";

import { usePathname } from "next/navigation";
import SocialIcons from "@/components/SocialIcons";
import { operatorLine } from "@/lib/legal";

// Site footer for every in-app page. Hidden on the landing (which has its own),
// the auth/onboarding flow, the immersive reader, the link-in-bio page, and
// the standalone campaign pages. Shown everywhere else — including the creator
// section — so the footer is consistent across the app.
const HIDE = ["/login", "/onboarding", "/reader", "/auth", "/links", "/b/"];

export default function AppFooter() {
  const pathname = usePathname() || "/";
  if (pathname === "/" || HIDE.some((p) => pathname.startsWith(p))) return null;

  return (
    <footer className="site-footer">
      <div className="footer-cols">
        <div>
          <div className="footer-logo">
            Lybry<span>.</span>
          </div>
          <p className="footer-tag">Stories worth lingering in.</p>
          <SocialIcons className="footer-social" />
        </div>

        <div className="footer-col">
          <h4>Read</h4>
          <a href="/catalog">Browse the catalog</a>
          <a href="/unlimited">Lybry Unlimited</a>
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
          <a href="/contact">Contact</a>
          <a href="/terms">Terms of Service</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/cookies">Cookie Policy</a>
          <a href="/refunds">Refund Policy</a>
        </div>
      </div>

      <div className="footer-bar">
        <span className="footer-status">
          <span className="status-dot" /> Early access · reading free to start
        </span>
        <span className="footer-copy">© 2026 Lybry. Crafted with care for readers &amp; writers.</span>
      </div>
      <p className="footer-legal">
        Lybry is operated by {operatorLine()}.
        {" "}<a href="/terms">Terms</a> · <a href="/privacy">Privacy</a> · <a href="/cookies">Cookies</a> · <a href="/refunds">Refunds</a>
      </p>
    </footer>
  );
}
