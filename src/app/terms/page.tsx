import type { Metadata } from "next";
import LegalDoc from "@/components/LegalDoc";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms of Service — Libry" };

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms of Service"
      updated={LEGAL.effectiveDate}
      current="/terms"
      intro="These Terms govern your use of Libry — the reading and interactive-storytelling platform operated by Craft & Anchor. By creating an account or using Libry, you agree to them."
    >
      <h2>1. Who we are</h2>
      <p>
        Libry is operated by <strong>{LEGAL.entity}</strong> (&ldquo;Craft &amp; Anchor&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), of <strong>{LEGAL.address}</strong>. You can reach us at <strong>{LEGAL.contactEmail}</strong>.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>You must provide accurate information and keep your login secure; you are responsible for activity under your account.</li>
        <li>You must be old enough to form a binding contract in your country, or have a parent/guardian&apos;s consent.</li>
        <li>A standard account is a <strong>reader</strong> account. Publishing requires a separate <strong>creator</strong> profile (see §5).</li>
      </ul>

      <h2>3. Reading, access &amp; your copies</h2>
      <ul>
        <li>Free books are readable with a free account. Paid books unlock after purchase.</li>
        <li>Where a downloadable copy (e.g. EPUB) is offered, it is licensed to you for your <strong>personal, non-commercial use</strong>. Copies are personalised/watermarked; please don&apos;t redistribute them.</li>
        <li>Access to a title may end if the title is removed for legal reasons (see §6); we&apos;ll act reasonably and, where required, address purchases under the Refund Policy.</li>
      </ul>

      <h2>4. Purchases</h2>
      <ul>
        <li>Prices are shown before purchase and may include applicable taxes. Payments are handled by our payment processor; we don&apos;t store full card details.</li>
        <li>Digital goods are <strong>delivered immediately</strong> on purchase. Refund rules are set out in the <a href="/refunds">Refund Policy</a>.</li>
      </ul>

      <h2>5. Creators — publishing &amp; revenue</h2>
      <ul>
        <li><strong>You keep ownership</strong> of the work you publish. You grant Craft &amp; Anchor a worldwide, non-exclusive licence to host, display, distribute, and sell it on Libry while it is published, and to make copies as needed to operate the service.</li>
        <li>You are responsible for your content and confirm you have the rights to publish it.</li>
        <li>Revenue share is <strong>65% to the creator</strong> of net sale proceeds; Craft &amp; Anchor retains 35% — a 30% platform commission plus a 5% platform &amp; infrastructure fee (payment processing, hosting, and discovery). Payouts are made per our payout schedule and subject to the enforcement rules below and to <strong>{LEGAL.payoutTerms}</strong>.</li>
      </ul>

      <h2>6. Creator conduct &amp; enforcement</h2>
      <p>To keep Libry safe and lawful, creator status is governed separately from your reader account. We may take the following actions:</p>
      <ul>
        <li>
          <strong>Temporary suspension (14–30 days).</strong> Triggered by minor content flags or metadata violations (e.g. mis-tagged age rating, misleading metadata). Publishing is paused and <strong>payouts are frozen pending review</strong>. Your reader account stays active. Access is restored if the issue is resolved.
        </li>
        <li>
          <strong>Permanent ban.</strong> Triggered by copyright infringement, illegal or hateful content, or engagement fraud (e.g. manipulating reads, reviews, or payouts). The <strong>creator profile is deactivated and payout endpoints are blocked</strong>. Affected titles may be removed. Your underlying account remains as a <strong>read-only reader</strong> account.
        </li>
        <li><strong>Appeals.</strong> You may contest a decision by writing to <strong>{LEGAL.safetyEmail}</strong> within <strong>{LEGAL.appealWindow}</strong>.</li>
      </ul>

      <h2>7. Acceptable use</h2>
      <p>You agree not to: publish unlawful, infringing, or hateful material; impersonate others; manipulate metrics or payouts; attempt to breach security; or scrape the service. We may remove content and suspend access to enforce these rules.</p>

      <h2>8. Intellectual property</h2>
      <p>The Libry name, logo, and software are owned by Craft &amp; Anchor. Creator content is owned by its creators, licensed to us as described in §5.</p>

      <h2>9. Disclaimers &amp; liability</h2>
      <p>Libry is provided &ldquo;as is&rdquo;. To the fullest extent permitted by law, Craft &amp; Anchor is not liable for indirect or consequential losses, and our total liability is limited to the amount you paid us in the <strong>{LEGAL.liabilityPeriod}</strong> preceding the claim. Nothing limits liability that cannot lawfully be limited.</p>

      <h2>10. Changes</h2>
      <p>We may update these Terms; material changes will be notified in-app or by email. Continued use after changes take effect means you accept them.</p>

      <h2>11. Governing law &amp; disputes</h2>
      <p>
        These Terms are governed by the laws of <strong>{LEGAL.jurisdiction}</strong>, without regard to conflict-of-laws rules. Because Libry serves readers and creators <strong>internationally</strong>, you agree that disputes will be resolved on an individual basis, and — where permitted — by binding arbitration or the courts of <strong>{LEGAL.venue}</strong>. Your local mandatory consumer-protection rights are unaffected.
      </p>

      <h2>12. Contact</h2>
      <p>Questions about these Terms: <strong>{LEGAL.contactEmail}</strong>.</p>
    </LegalDoc>
  );
}
