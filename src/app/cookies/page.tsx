import type { Metadata } from "next";
import LegalDoc from "@/components/LegalDoc";
import { LEGAL } from "@/lib/legal";
import { ContactLink } from "@/components/LegalDoc";

export const metadata: Metadata = { title: "Cookie Policy — Lybry" };

export default function CookiesPage() {
  return (
    <LegalDoc
      title="Cookie Policy"
      updated={LEGAL.effectiveDate}
      current="/cookies"
      intro="Cookies and similar technologies keep Lybry working and help us improve it. This page explains what we use and how you control them."
    >
      <h2>1. What cookies are</h2>
      <p>Cookies are small files stored on your device. We also use similar browser storage (for example, to remember your theme or reading position). Below is what Lybry uses, grouped by purpose.</p>

      <h2>2. Functional (always on)</h2>
      <p>Needed for Lybry to work — you can&apos;t turn these off without breaking core features.</p>
      <ul>
        <li>Keeping you signed in (secure session cookies).</li>
        <li>Remembering your theme, accent color, type size, and last reading position (browser storage: <code>libry-theme</code>, <code>leep-accent</code>).</li>
        <li>Remembering your sound, comfort and style choices on this device: interface sound volume (<code>leep-sound</code>), background sound and scene (<code>leep-ambience</code>, plus any sound or background file you add, kept in the browser&apos;s IndexedDB), font style (<code>leep-font</code>), text size (<code>leep-text</code>), reduced motion (<code>leep-motion</code>) and interface style (<code>leep-ui</code>).</li>
        <li>Showing the welcome screen once after you sign in (cookie <code>leep_splash</code>, deleted within a minute; browser session storage <code>leep-welcome</code>).</li>
        <li>Remembering your welcome answers before you have an account, so they can be copied into your account if you sign up (cookie <code>libry_prefs</code>, kept up to 30 days; browser storage <code>leep-guest-prefs</code>).</li>
        <li>Remembering that you&apos;ve seen the welcome questions (cookie <code>libry_seen_onboarding</code>, up to 1 year).</li>
        <li>Remembering the books you opened as a guest, so they appear in &ldquo;Continue reading&rdquo; if you sign up (browser storage <code>leep-guest-books</code>, removed once copied).</li>
        <li>Security (e.g. preventing cross-site request forgery).</li>
      </ul>

      <h2>3. Analytical</h2>
      <p>Help us understand which books and features readers use, so we can improve them. Aggregated where possible.</p>
      <ul>
        <li>Anonymous usage counts and feature engagement.</li>
      </ul>

      <h2>4. Performance</h2>
      <p>Help us keep Lybry fast and reliable.</p>
      <ul>
        <li>Error diagnostics and load-time measurements.</li>
      </ul>

      <h2>5. Your choices</h2>
      <p>
        When you first visit, our cookie banner lets you <strong>accept</strong> or <strong>decline</strong> non-essential (analytical &amp; performance) cookies; functional cookies remain because the service needs them. You can change your choice any time by clearing your saved preference, and you can block or delete cookies in your browser settings.
      </p>

      <h2>6. Contact</h2>
      <p>Questions about cookies: <ContactLink />. See also our <a href="/privacy">Privacy Policy</a>.</p>
    </LegalDoc>
  );
}
