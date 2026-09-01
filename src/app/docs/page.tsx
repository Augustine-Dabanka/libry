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
        <p>Last updated 2026. This policy explains what Libry collects and why.</p>
        <h4>What we store</h4>
        <ul>
          <li>Your account identity from Google sign-in (email, name, avatar).</li>
          <li>Your reading progress, streaks, tokens, and preferences.</li>
          <li>Books you publish, and interactions like votes and comments.</li>
        </ul>
        <h4>What we don&apos;t do</h4>
        <p>We don&apos;t sell your personal data. Your session lives in a secure, http-only cookie — not in the browser&apos;s localStorage.</p>
        <h4>Your controls</h4>
        <p>You can toggle content visibility in Reader Settings and request deletion of your account data at any time.</p>
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
      <p>By using Libry you agree to these terms. Be excellent to each other.</p>
      <h4>Your account</h4>
      <p>You&apos;re responsible for activity under your account. Sign in is handled by Google OAuth.</p>
      <h4>Publishing</h4>
      <p>You retain ownership of what you publish and grant Libry a license to host and display it. Creators keep <strong>70%</strong> of sales.</p>
      <h4>Acceptable use</h4>
      <p>Follow the Community Guidelines. We may remove content or accounts that violate them.</p>
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
