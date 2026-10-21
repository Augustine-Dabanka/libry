import type { Metadata } from "next";
import LegalDoc from "@/components/LegalDoc";
import { LEGAL, operatorLine } from "@/lib/legal";
import { ContactLink } from "@/components/LegalDoc";

export const metadata: Metadata = { title: "Terms of Service — Lybry" };

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms of Service"
      updated={LEGAL.effectiveDate}
      current="/terms"
      intro={`These Terms govern your use of Lybry, the reading and interactive-storytelling platform operated by ${LEGAL.entity}. By creating an account or using Lybry, you agree to them.`}
    >
      <h2>1. Who we are</h2>
      <p>
        Lybry is operated by <strong>{operatorLine()}</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;). You can reach us through <ContactLink />.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>You must provide accurate information and keep your login secure; you are responsible for activity under your account.</li>
        <li>You must give your real date of birth when you create an account, and be at least <strong>{LEGAL.minimumAge}</strong> years old. If you are under 18 (or the age of majority where you live), you may use Lybry only with a parent or guardian&apos;s permission, and they must make any purchase.</li>
        <li>A standard account is a <strong>reader</strong> account. Publishing requires a separate <strong>creator</strong> profile (see §5).</li>
        <li><strong>Mature (18+) content</strong> is hidden by default. To turn it on you must confirm it&apos;s you (your password, or a recent sign-in), and the date of birth on your account must show you are 18 or older. This is a self-declaration, not an identity check: giving a false date of birth breaks these Terms, and a parent or guardian is responsible for a minor&apos;s use of the account. If the date given is under 18, the setting stays off for at least 30 days. We may switch it off for any account at any time.</li>
      </ul>

      <h2>3. Reading, access &amp; your copies</h2>
      <ul>
        <li>Anyone can read a <strong>free sample</strong> of a book without an account. A sample is at least about 2,500 words or 10% of the book (never more than half), in whole chapters where the book has them.</li>
        <li>Free books are readable in full with a free account. Paid books unlock after purchase, or by keeping them with a free trial or Lybry Unlimited (§4a).</li>
        <li>Where a downloadable copy (e.g. EPUB) is offered, it is licensed to you for your <strong>personal, non-commercial use</strong>. Copies are personalised/watermarked; please don&apos;t redistribute them.</li>
        <li>Access to a title may end if the title is removed for legal reasons (see §6); we&apos;ll act reasonably and, where required, address purchases under the Refund Policy.</li>
      </ul>

      <h2>4. Purchases</h2>
      <ul>
        <li>Prices are shown before purchase and may include applicable taxes. Prices are set in US dollars and shown in the currency you pay in, converted at the rate we display; <strong>the amount on the checkout screen is the amount you are charged</strong>. Your bank or mobile-money provider may add its own fees.</li>
        <li>Payments are handled by our payment processor; we don&apos;t store full card details.</li>
        <li><strong>Digital products</strong> (courses, files and similar items sold by creators) are currently paused. Anyone who already bought one keeps access in their library.</li>
        <li>Digital goods are <strong>delivered immediately</strong> on purchase. Refund rules are set out in the <a href="/refunds">Refund Policy</a>.</li>
      </ul>

      <h2>4a. Free trial &amp; Lybry Unlimited</h2>
      <ul>
        <li><strong>Free trial.</strong> Each person may start <strong>one</strong> free trial, on one account, after confirming their email or phone. No payment details are needed and nothing is charged when it ends; it simply stops. The trial length and the number of books you can keep are shown before you start and apply to your trial for its whole length. We may change them for trials that haven&apos;t started yet, limit how many trials start each day, or pause trials.</li>
        <li><strong>Lybry Unlimited</strong> is a one-off payment for a fixed period (for example a week, a month or a year). It <strong>does not renew automatically</strong>; it ends at the date shown unless you choose to pay again. Each period lets you keep the number of books shown for your plan. Unused picks do not carry over.</li>
        <li><strong>Keeping a book.</strong> Only books whose creator has included them in Unlimited can be kept. A kept book stays in your library after your trial or plan ends, under the same personal, non-commercial license as a purchased book (§3), including the rule that access may end if a title must be removed for legal reasons.</li>
        <li>If a creator removes a book from Unlimited, it can no longer be kept, but copies already kept stay with the readers who kept them.</li>
        <li><strong>Abuse.</strong> Using several accounts, false details or automated tools to get extra trials or picks is not allowed. We may end the trial or plan and remove books kept that way.</li>
      </ul>

      <h2>5. Creators — publishing &amp; revenue</h2>
      <ul>
        <li><strong>You keep ownership</strong> of the work you publish. You grant {LEGAL.entity} a worldwide, non-exclusive license to host, display, distribute, and sell it on Lybry while it is published, and to make copies as needed to operate the service.</li>
        <li>You are responsible for your content and confirm you have the rights to publish it, and that its age rating is accurate.</li>
        <li><strong>Including a book in Lybry Unlimited is your choice and is off by default.</strong> If you switch it on for a paid book, readers on a free trial or Unlimited plan can keep a copy of it for good. <strong>Today, you are not paid for copies kept this way.</strong> If we introduce payments for kept copies, we will publish how they work and give you at least 30 days&apos; notice. You can switch the setting off at any time; that stops new copies being kept but does not take back copies already kept.</li>
        <li><strong>Creators under 18</strong> (by the date of birth on the account) can&apos;t publish books rated Mature; this limit ends on their 18th birthday. Content involving minors in any sexual way is banned outright and is reported to the authorities as the law requires. We may use automated tools to check uploaded images and text for this and other banned content, and we review what they flag.</li>
        <li><strong>Videos on your channel</strong> must be yours or ones you have the right to share. They stay hosted on YouTube or Vimeo and follow those services' rules too; we can remove any link from your channel.</li>
        <li><strong>Badges and awards.</strong> Creator badges (Bronze to Diamond) are worked out from real follower counts and sales awards from paid sales. They are recognition, not a payment or a promise of income, and they are removed if the numbers fall or were gained by fake accounts or other manipulation. A physical award can be requested from Gold upward; we decide whether and when to send one, may change or end the awards, and will only ask for a delivery address when we approve a request.</li>
        <li>Revenue share is <strong>65% to the creator</strong> of net sale proceeds; {LEGAL.entity} retains 35% — a 30% platform commission plus a 5% platform &amp; infrastructure fee (payment processing, hosting, and discovery). Payouts are subject to the enforcement rules below. During early access, payouts are <strong>reviewed and sent manually</strong>; we will confirm the schedule and any minimum balance with you before your first payout, and give at least 30 days&apos; notice before changing them.</li>
      </ul>

      <h2>6. Creator conduct &amp; enforcement</h2>
      <p>To keep Lybry safe and lawful, creator status is governed separately from your reader account. We may take the following actions:</p>
      <ul>
        <li>
          <strong>Temporary suspension (14–30 days).</strong> Triggered by minor content flags or metadata violations (e.g. mis-tagged age rating, misleading metadata). Publishing is paused and <strong>payouts are frozen pending review</strong>. Your reader account stays active. Access is restored if the issue is resolved.
        </li>
        <li>
          <strong>Permanent ban.</strong> Triggered by copyright infringement, illegal or hateful content, or engagement fraud (e.g. manipulating reads, reviews, or payouts). The <strong>creator profile is deactivated and payout endpoints are blocked</strong>. Affected titles may be removed. Your underlying account remains as a <strong>read-only reader</strong> account.
        </li>
        <li><strong>Appeals.</strong> You may contest a decision through <ContactLink /> within <strong>{LEGAL.appealWindow}</strong> of being notified.</li>
      </ul>

      <h2>7. Acceptable use</h2>
      <p>You agree not to: publish unlawful, infringing, or hateful material; impersonate others; manipulate metrics or payouts; attempt to breach security; or scrape the service. We may remove content and suspend access to enforce these rules.</p>

      <h2>8. Intellectual property</h2>
      <p>The Lybry name, logo, and software are owned by {LEGAL.entity}. Creator content is owned by its creators, licensed to us as described in §5.</p>

      <h2>9. Disclaimers &amp; liability</h2>
      <p>Lybry is provided &ldquo;as is&rdquo;. To the fullest extent permitted by law, {LEGAL.entity} is not liable for indirect or consequential losses, and our total liability is limited to the amount you paid us in the <strong>{LEGAL.liabilityPeriod}</strong> preceding the claim. Nothing limits liability that cannot lawfully be limited.</p>

      <h2>10. Changes</h2>
      <p>We may update these Terms; material changes will be notified in-app or by email. Continued use after changes take effect means you accept them.</p>

      <h2>11. Governing law &amp; disputes</h2>
      <p>
        These Terms are governed by the laws of <strong>{LEGAL.jurisdiction}</strong>, without regard to conflict-of-laws rules. Because Lybry serves readers and creators <strong>internationally</strong>, you agree that disputes will be resolved on an individual basis, and — where permitted — by binding arbitration or the courts of <strong>{LEGAL.venue}</strong>. Your local mandatory consumer-protection rights are unaffected.
      </p>

      <h2>12. Contact</h2>
      <p>Questions about these Terms: <ContactLink />.</p>
    </LegalDoc>
  );
}
