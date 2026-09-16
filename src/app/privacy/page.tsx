import type { Metadata } from "next";
import LegalDoc from "@/components/LegalDoc";

export const metadata: Metadata = { title: "Privacy Policy — Libry" };

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      updated="[EFFECTIVE DATE]"
      current="/privacy"
      intro="This policy explains what Craft & Anchor collects when you use Libry, why, and the choices you have. We aim to collect only what a calm reading service needs."
    >
      <h2>1. What we collect</h2>
      <ul>
        <li><strong>Account</strong> — name/username, email, password (hashed by our auth provider), and any profile details you add (bio, avatar, preferences).</li>
        <li><strong>Reading activity</strong> — your library, reading progress, streaks, wishlists, ratings, reviews, and paragraph comments.</li>
        <li><strong>Purchases</strong> — records of what you bought and when. Card details are handled by our payment processor; we do not store full card numbers.</li>
        <li><strong>Technical</strong> — device/browser type, approximate region, and error diagnostics needed to keep Libry working.</li>
        <li><strong>Cookies &amp; similar</strong> — see the <a href="/cookies">Cookie Policy</a>.</li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To run your account, sync reading across devices, and personalise recommendations.</li>
        <li>To process purchases and pay creators their share.</li>
        <li>To keep Libry safe (fraud/abuse prevention) and to fix problems.</li>
        <li>To send service messages, and — only if you opt in — occasional product updates.</li>
      </ul>

      <h2>3. Who we share it with</h2>
      <p>We do not sell your personal data. We share it only with service providers that help us run Libry, under contract, including:</p>
      <ul>
        <li><strong>Hosting &amp; database</strong> — [SUPABASE] and [VERCEL].</li>
        <li><strong>Email</strong> — [RESEND] for transactional messages.</li>
        <li><strong>Payments</strong> — [PAYMENT PROCESSOR] for purchases and creator payouts.</li>
        <li><strong>Error monitoring</strong> — [SENTRY] for diagnostics.</li>
      </ul>
      <p>We may also disclose data where legally required, or to protect rights and safety.</p>

      <h2>4. Storage, security &amp; international transfers</h2>
      <p>Data is stored with our providers and protected by access controls and encryption in transit. Because Libry operates <strong>internationally</strong>, your data may be processed in countries other than your own; where required we rely on appropriate safeguards for such transfers.</p>

      <h2>5. Retention</h2>
      <p>We keep your data for as long as your account is active and as needed for the purposes above (e.g. tax/records for purchases). You can delete your account in Settings; some records may be retained where the law requires.</p>

      <h2>6. Your rights</h2>
      <p>Subject to your local law, you may access, correct, export, or delete your data, and object to or restrict certain processing. Contact <strong>[PRIVACY EMAIL]</strong> to exercise these rights. You may also opt out of marketing at any time.</p>

      <h2>7. Children</h2>
      <p>Libry is not directed to children under <strong>[MINIMUM AGE]</strong>. If you believe a child has given us data without appropriate consent, contact us and we will address it.</p>

      <h2>8. Contact</h2>
      <p>Privacy questions: <strong>[PRIVACY EMAIL]</strong> — [CRAFT &amp; ANCHOR — REGISTERED LEGAL NAME], [REGISTERED ADDRESS].</p>
    </LegalDoc>
  );
}
