# Libry implementation plan — architecture baseline

Status: planning and implementation branch only. Do not enable production payments or creator payouts until the release gates below are satisfied.

## Approved product decisions

- Operating business target: Ghana.
- Product reach: readers globally; payment and payout availability expands by approved country/provider phases.
- Reader monetization: hybrid subscriptions and virtual coins.
- Coin uses: paid chapters, interactive story content, comics, and tips.
- Reader coins are non-cash virtual value; creator earnings are a separate real-money accounting system.
- Creator share: 65% of defined net revenue; tips use the same share.
- Net-revenue proposal: deduct refunds, chargebacks, applicable indirect taxes, and agreed processing costs; document discount/promotion treatment explicitly.
- Subscription earnings: a monthly creator pool allocated by eligible reading engagement.
- Coin pricing: local display prices where supported, with explicit currency, conversion, and rounding rules.
- Publishing: open under content rules; monetization and payout eligibility reviewed separately.
- Creator payouts: worldwide target, gated by country and provider eligibility.
- Payout controls: MFA and server-side permissions; second approver for large, unusual, or flagged payouts.
- Staff security: MFA for administrative actions; every privileged action re-checks authorization on the server and is audited.
- CEO account: `gamehigh31@gmail.com`, intended role `ultra_admin`.
- Login: cinematic glassmorphism while preserving the existing Supabase auth flows.
- Waitlist: remove public waitlist experiences and obsolete references; preserve account signup, login, onboarding, and legitimate creator/contact flows.

## Architecture boundaries

1. **Identity and authorization:** Supabase Auth identifies the user. A trusted server-side role source determines staff access. Never grant staff roles from user-editable profile metadata or from an email field submitted by a visitor.
2. **Reader coin ledger:** track purchases, bonus credits, spends, unlocks, tips, refunds, and adjustments. Free/bonus coins must not create cash earnings unless a future approved policy explicitly says otherwise.
3. **Payments ledger:** record provider, immutable provider reference, purpose, amount in integer minor units, currency, verification status, timestamps, and idempotency.
4. **Creator earnings ledger:** calculate eligible revenue independently from reader coin balances; represent pending, available, reserved, paid, and reversed amounts.
5. **Payout workflow:** verify eligibility and payout details, review risk flags, enforce approval policy, submit to a provider, then reconcile provider-confirmed status. A submitted transfer is not automatically a completed payout.
6. **Subscription pool:** define pool size, qualifying reading events, anti-fraud rules, collaborative-work attribution, and period close before implementation.
7. **Provider adapter:** isolate provider-specific checkout, webhook verification, refunds, payouts, and reconciliation from product business logic.
8. **Admin operations:** permission-specific sections for users, moderation, content, payments, subscriptions, coins, creator earnings, payouts, settings, and audit records.

## Staff authorization baseline

- `ultra_admin`: CEO-level administration and staff/security controls.
- `super_admin`: broad administration, unable to change Ultra Admin or Super Admin roles.
- `admin`: general operations and approved permissions.
- `manager`: limited operational management.
- `moderator`: content and report moderation.
- `accountant`: financial review and payout actions within the current permission model.
- `accountant_2`: financial viewing; payout actions only when explicitly enabled.
- `staff`: support-level access.
- `creator`: own content, creator tools, and eligible monetization; no admin access.
- `reader`: reader product access only.

The existing repository role names are retained for compatibility. Before expanding permissions, reconcile this baseline with `src/lib/staff.ts`, all server actions, and RLS policies. Keep high-impact actions least-privilege and auditable.

## Release gates

### Before accepting real money
- Confirm Ghanaian business registration and provider onboarding.
- Obtain legal/provider review for virtual coins, subscriptions, creator revenue sharing, cross-border payouts, consumer terms, tax, refunds, and chargebacks.
- Approve net-revenue deductions and discount rules.
- Approve subscription pool percentage, engagement eligibility, fraud rules, and attribution.
- Approve minimum payout thresholds by currency and provider economics.
- Verify country coverage separately for reader payments and creator payouts.
- Verify webhook signatures, idempotency, refunds, disputes, reconciliation, and failure recovery.

### Before granting CEO staff access
- Confirm the authenticated account exists and has a confirmed email.
- Configure `ADMIN_EMAILS=gamehigh31@gmail.com` in Vercel Production and Preview environments as needed; this repository currently treats those addresses as Ultra Admin owners.
- Apply the staff schema migration before running the CEO role upsert SQL.
- Enforce MFA at the server boundary for sensitive actions; UI prompts alone are insufficient.
- Test that creators/readers cannot call staff actions or read staff-only data.
- Keep service-role credentials server-only.

### Waitlist removal
- The public `/waitlist` route redirects to normal signup.
- Public landing/link CTAs no longer promote a waitlist.
- Creator updates route through the existing contact flow, not new waitlist records.
- Keep historic waitlist schema/data until retention and deletion obligations are reviewed; do not drop customer data as part of UI cleanup.
- Remove or update obsolete waitlist copy in privacy documentation and operational notes as follow-up.

## UI/UX scope

- Login: cinematic glass panel, restrained ambient light, strong contrast, responsive layout, keyboard and screen-reader support, reduced-motion compatibility.
- Reader: landing/discovery, search, book details, library, reader, interactive stories, comics, coin checkout, subscription and transaction history.
- Creator Studio: publishing, eligibility review, analytics, earnings-state breakdown, payout setup/history and transparent explanations.
- Admin: staff roles, users, moderation, payments/refunds, subscriptions, coin ledger, earnings, payout review, reconciliation, settings, audit logs.
- Accessibility: audit both themes for contrast, labels, focus states, errors, disabled states, zoom, keyboard navigation, and reduced motion.

## Required tests

- Email identity cannot be spoofed to obtain admin access.
- Unconfirmed accounts cannot become staff.
- MFA assurance is checked server-side for protected actions.
- Readers and creators cannot invoke admin actions or write financial ledger entries directly.
- Duplicate provider webhooks do not duplicate coin credits or earnings.
- Failed, reversed, refunded, and disputed payments reconcile correctly.
- Large/flagged payouts require the second approver.
- UI and route cleanup does not break signup, creator onboarding, or existing accounts.
