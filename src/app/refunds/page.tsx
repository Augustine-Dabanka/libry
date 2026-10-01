import type { Metadata } from "next";
import LegalDoc from "@/components/LegalDoc";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Refund Policy — Libry" };

export default function RefundsPage() {
  return (
    <LegalDoc
      title="Refund Policy"
      updated={LEGAL.effectiveDate}
      current="/refunds"
      intro="Libry sells digital stories that are delivered instantly. This policy explains when refunds do and don't apply, and how creator payouts relate to them."
    >
      <h2>1. Digital goods are delivered immediately</h2>
      <p>
        When you buy a book on Libry, you get access — and any downloadable copy — <strong>right away</strong>. Because the goods are digital and delivered on purchase, <strong>we do not offer refunds on delivered digital goods</strong>, except where required by law or in the limited cases below.
      </p>

      <h2>2. When we will put it right</h2>
      <ul>
        <li><strong>Not delivered / not accessible</strong> — if a purchase fails to unlock or a download is genuinely broken and we can&apos;t fix it, we&apos;ll restore access or refund that purchase.</li>
        <li><strong>Duplicate charge</strong> — accidental double purchases of the same title are refundable.</li>
        <li><strong>Materially not as described</strong> — if a title is substantially not what its listing promised, contact us and we&apos;ll review it.</li>
      </ul>

      <h2>3. Your local rights</h2>
      <p>
        Some countries give consumers a statutory cancellation right for digital purchases <em>unless</em> you agreed that delivery begins immediately and thereby waived that right. Where such mandatory rights apply, they are unaffected by this policy. Because Libry operates <strong>internationally</strong>, the exact rights depend on your country.
      </p>

      <h2>4. Subscriptions</h2>
      <p>Any subscription (e.g. Libry Unlimited) can be cancelled to stop future renewals; already-billed periods are non-refundable except as required by law. <strong>{LEGAL.subscriptionTerms}</strong></p>
      <h2>4a. Coins</h2>
      <p>Coins are a store credit for Libry only. They have <strong>no cash value</strong>, can&rsquo;t be withdrawn, sold or transferred, and are spent bought-coins first. Earned coins (ads, coupons, rewards) are never refundable. Bought coins that are still <strong>unspent</strong> can be refunded within <strong>{LEGAL.refundWindow}</strong> of purchase; spent coins follow the rules for the item they unlocked. We may remove coins gained through fraud, abuse or a refunded payment.</p>

      <h2>5. Creator payouts &amp; chargebacks</h2>
      <p>
        Creators earn their share of net sale proceeds. If a purchase is refunded or reversed (including chargebacks or fraud), the corresponding amount is <strong>deducted from or withheld against creator payouts</strong>. Payouts may be <strong>frozen during a review</strong> where fraud or a policy violation is suspected (see the <a href="/terms">Terms</a>, §6).
      </p>

      <h2>6. How to request</h2>
      <p>Email <strong>{LEGAL.supportEmail}</strong> within <strong>{LEGAL.refundWindow}</strong> of purchase with your account email and the order reference. We aim to respond within <strong>{LEGAL.responseTime}</strong>.</p>
    </LegalDoc>
  );
}
