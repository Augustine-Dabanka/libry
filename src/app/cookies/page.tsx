import type { Metadata } from "next";
import LegalDoc from "@/components/LegalDoc";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Cookie Policy — Libry" };

export default function CookiesPage() {
  return (
    <LegalDoc
      title="Cookie Policy"
      updated={LEGAL.effectiveDate}
      current="/cookies"
      intro="Cookies and similar technologies keep Libry working and help us improve it. This page explains what we use and how you control them."
    >
      <h2>1. What cookies are</h2>
      <p>Cookies are small files stored on your device. We also use similar browser storage (for example, to remember your theme or reading position). Below is what Libry uses, grouped by purpose.</p>

      <h2>2. Functional (always on)</h2>
      <p>Needed for Libry to work — you can&apos;t turn these off without breaking core features.</p>
      <ul>
        <li>Keeping you signed in (secure session cookies).</li>
        <li>Remembering your theme, type size, and last reading position.</li>
        <li>Security (e.g. preventing cross-site request forgery).</li>
      </ul>

      <h2>3. Analytical</h2>
      <p>Help us understand which books and features readers use, so we can improve them. Aggregated where possible.</p>
      <ul>
        <li>Anonymous usage counts and feature engagement.</li>
      </ul>

      <h2>4. Performance</h2>
      <p>Help us keep Libry fast and reliable.</p>
      <ul>
        <li>Error diagnostics and load-time measurements.</li>
      </ul>

      <h2>5. Your choices</h2>
      <p>
        When you first visit, our cookie banner lets you <strong>accept</strong> or <strong>decline</strong> non-essential (analytical &amp; performance) cookies; functional cookies remain because the service needs them. You can change your choice any time by clearing your saved preference, and you can block or delete cookies in your browser settings.
      </p>

      <h2>6. Contact</h2>
      <p>Questions about cookies: <strong>{LEGAL.contactEmail}</strong>. See also our <a href="/privacy">Privacy Policy</a>.</p>
    </LegalDoc>
  );
}
