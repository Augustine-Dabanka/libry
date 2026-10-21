import type { Metadata } from "next";
import LegalDoc from "@/components/LegalDoc";
import { LEGAL, operatorLine } from "@/lib/legal";
import { ContactLink } from "@/components/LegalDoc";

export const metadata: Metadata = { title: "Privacy Policy — Lybry" };

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      updated={LEGAL.effectiveDate}
      current="/privacy"
      intro={`This policy explains what ${LEGAL.entity} collects when you use Lybry, why, and the choices you have. We aim to collect only what a calm reading service needs.`}
    >
      <h2>1. What we collect</h2>
      <ul>
        <li><strong>Account</strong> — name/username, email, password (hashed by our auth provider), and any profile details you add (bio, avatar or bushbaby, pronouns, preferences). Your bushbaby and pronouns are shown on your public profile; pronouns are optional.</li>
        <li><strong>Date of birth</strong> — asked when you create an account. It is kept <strong>private</strong> (only you and Lybry can see it) and used to check you are old enough to join (13+), to read age-rated books (18+), to limit what creators under 18 can publish, and to pick a greeting for your birthday and age group (for example &ldquo;Gen Z&rdquo;). We work out the age group from the year you were born; we never use photos or face scans to guess your age. You can&apos;t change it yourself once set; contact us to correct a mistake.</li>
        <li><strong>Reading activity</strong> — your library, reading progress, streaks, wishlists, ratings, reviews, and paragraph comments.</li>
        <li><strong>Purchases</strong> — records of what you bought and when. Card details are handled by our payment processor; we do not store full card numbers.</li>
        <li><strong>Two-step sign-in</strong> — if you turn it on, our auth provider stores a secret shared with your authenticator app so it can check your 6-digit codes. We don&apos;t see your phone or the app.</li>
        <li><strong>Creator badges and award requests</strong> — your badge is calculated from your follower count and sales and shown on your public profile. If you request a physical award we store the request; we ask for a delivery address by email only if we approve it, and delete it after delivery.</li>
        <li><strong>Channel</strong> — creators can add a banner image, a tagline and links to their YouTube or Vimeo videos; these are public. A video's player only loads from YouTube (privacy-enhanced mode) or Vimeo when someone presses play, and those services then apply their own privacy policies.</li>
        <li><strong>Staff records</strong> — when our team takes an action on an account (a warning, suspension, ban, payout freeze or rank change), we keep a record of who did it, when and why, to keep moderation accountable. Team chat between staff is stored so we can work together and review decisions.</li>
        <li><strong>Sounds and backgrounds you add</strong> — sound files, photos and videos you pick for background ambience stay in your browser on that device (IndexedDB). They are never uploaded to Lybry.</li>
        <li><strong>Trial and Unlimited</strong> — when your free trial started and ends, your plan dates, and which books you kept with it.</li>
        <li><strong>Mature content check</strong> — turning on mature (18+) content uses your stored date of birth (or asks for it once if your account doesn&apos;t have one, for example after signing in with Google). We also record when the check passed, or, if it didn&apos;t, that the setting is locked for 30 days.</li>
        <li><strong>Before you have an account</strong> — if you answer the welcome questions or open books as a guest, your answers and the books you opened are kept <strong>in your own browser</strong> (not on our servers). If you later create an account on that device, they are copied into it so your picks and books carry over. You can remove them by clearing this site&apos;s data in your browser.</li>
        <li><strong>Technical</strong> — device/browser type, approximate region, and error diagnostics needed to keep Lybry working.</li>
        <li><strong>Cookies &amp; similar</strong> — see the <a href="/cookies">Cookie Policy</a>.</li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To run your account, sync reading across devices, and personalize recommendations.</li>
        <li>To process purchases and pay creators their share.</li>
        <li>To keep Lybry safe (fraud/abuse prevention) and to fix problems.</li>
        <li>To send service messages, and — only if you opt in — occasional product updates.</li>
      </ul>

      <h2>3. Who we share it with</h2>
      <p>We do not sell your personal data. We share it only with service providers that help us run Lybry, under contract, including:</p>
      <ul>
        <li><strong>Hosting &amp; database</strong> — {LEGAL.host} and {LEGAL.web}.</li>
        <li><strong>Email</strong> — {LEGAL.mail} for transactional messages.</li>
        <li><strong>Payments</strong> — {LEGAL.payments} for purchases and creator payouts.</li>
        <li><strong>Error monitoring</strong> — {LEGAL.monitoring} for diagnostics.</li>
      </ul>
      <p>We may also disclose data where legally required, or to protect rights and safety.</p>

      <h2>4. Storage, security &amp; international transfers</h2>
      <p>Data is stored with our providers and protected by access controls and encryption in transit. Because Lybry operates <strong>internationally</strong>, your data may be processed in countries other than your own; where required we rely on appropriate safeguards for such transfers.</p>

      <h2>5. Retention</h2>
      <p>We keep your data for as long as your account is active and as needed for the purposes above (e.g. tax/records for purchases). You can delete your account in Settings; some records may be retained where the law requires.</p>

      <h2>6. Your rights</h2>
      <p>Subject to your local law, you may access, correct, export, or delete your data, and object to or restrict certain processing. Contact us through <ContactLink /> to exercise these rights; we may need to confirm it&apos;s really you first. You may also opt out of marketing at any time.</p>

      <h2>7. Children</h2>
      <p>You must be at least <strong>{LEGAL.minimumAge}</strong> to create an account. Readers under 18 should use Lybry with a parent or guardian&apos;s permission. Mature (18+) content is hidden by default and can only be turned on after the age check described above. We do not knowingly collect personal information from children under 13; sign-up refuses anyone under 13, and if we learn that a child under 13 has given us data, we delete it. If you believe this has happened, contact us.</p>

      <h2>8. Contact</h2>
      <p>Privacy questions: <ContactLink />. Data controller: {operatorLine()}.</p>
    </LegalDoc>
  );
}
