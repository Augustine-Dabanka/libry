import DocsLayout, { type DocTab } from "@/components/DocsLayout";

const TABS: DocTab[] = [
  { key: "terms", label: "Terms of Service" },
  { key: "privacy", label: "Privacy Policy" },
  { key: "guidelines", label: "Community Guidelines" },
];

function Content({ tab }: { tab: string }) {
  if (tab === "privacy") {
    return (
      <>
        <h3>Privacy Policy</h3>
        <p>Last updated September 2026. This policy explains what Libry collects and why.</p>
        <h4>What we store</h4>
        <ul>
          <li>Your account identity — from email sign-up, or from Google or Discord sign-in (email, name, and avatar where provided).</li>
          <li>Your reading progress, streaks, tokens, achievements, and preferences.</li>
          <li>Books you publish, your author profile and bio, and interactions like likes, reviews, comments, and wishlists.</li>
        </ul>
        <h4>Email</h4>
        <p>We send transactional email (such as a waitlist confirmation) through our email provider. We don&apos;t send marketing email without your consent.</p>
        <h4>Cookies</h4>
        <p>Your session lives in a secure, http-only cookie — not in the browser&apos;s localStorage. We also use short-lived cookies to remember an onboarding choice, a referral, or a reader/writer selection while you sign in.</p>
        <h4>What we don&apos;t do</h4>
        <p>We don&apos;t sell your personal data.</p>
        <h4>Your controls</h4>
        <p>You can toggle mature content in Settings and permanently delete your account and its data at any time from the Danger zone in Settings.</p>
      </>
    );
  }
  if (tab === "guidelines") {
    return (
      <>
        <h3>Community Guidelines</h3>
        <p>Libry is a place to linger in good stories. Keep it that way.</p>
        <h4>Do</h4>
        <ul>
          <li>Rate your work honestly with the correct age rating.</li>
          <li>Credit co-authors and respect collaborators.</li>
          <li>Give constructive, kind feedback in comments.</li>
        </ul>
        <h4>Don&apos;t</h4>
        <ul>
          <li>Publish content you don&apos;t have the rights to.</li>
          <li>Mislabel Mature (18+) content as family-friendly.</li>
          <li>Spam, harass, or manipulate rankings.</li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Terms of Service</h3>
      <p>By creating an account or using Libry, you agree to these terms. Be excellent to each other.</p>
      <h4>Your account</h4>
      <p>You can sign up with an email and password, or sign in with Google or Discord. You choose a reader or writer account (writers can also enable this later from the creator dashboard). You&apos;re responsible for activity under your account and for keeping your password safe.</p>
      <h4>Age and mature content</h4>
      <p>Mature (18+) titles are hidden by default and shown only when you turn on mature content in Settings. Don&apos;t enable it unless you&apos;re old enough, and creators must rate their work with the correct age rating.</p>
      <h4>Publishing</h4>
      <p>You retain ownership of what you publish and grant Libry a license to host and display it. Creators keep <strong>70%</strong> of each sale; Libry keeps 30% to run the platform. Payments are being finalised — books are free to read for now, and projected earnings are shown at list price until payouts begin.</p>
      <h4>Acceptable use</h4>
      <p>Follow the Community Guidelines. We may remove content or accounts that violate them.</p>
      <h4>Changes</h4>
      <p>We may update these terms as Libry grows. Continued use after an update means you accept the revised terms.</p>
    </>
  );
}

export default async function DocsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const active = TABS.some((t) => t.key === tab) ? (tab as string) : "terms";
  const title = TABS.find((t) => t.key === active)?.label ?? "Legal";
  return (
    <DocsLayout title={title} basePath="/docs" tabs={TABS} active={active}>
      <Content tab={active} />
    </DocsLayout>
  );
}
