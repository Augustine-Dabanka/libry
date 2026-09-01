import DocsLayout, { type DocTab } from "@/components/DocsLayout";

const TABS: DocTab[] = [
  { key: "analytics", label: "Author Analytics Guide" },
  { key: "guidelines", label: "Creator Guidelines" },
  { key: "api", label: "Publishing API" },
];

function Content({ tab }: { tab: string }) {
  if (tab === "guidelines") {
    return (
      <>
        <h3>Creator Guidelines</h3>
        <p>How to publish well on Libry and grow a readership.</p>
        <h4>Metadata that ranks</h4>
        <ul>
          <li>Write a punchy description — it&apos;s the hook on every card.</li>
          <li>Pick the right type and a correct age rating (Everyday / Teen / Mature).</li>
          <li>Add a cover; illustrated stories can drop images inline in the editor.</li>
        </ul>
        <h4>Earning</h4>
        <p>Everyone can publish. Earning unlocks at <strong>6 books sold</strong> and <strong>15 successful referrals</strong> — track both in your dashboard&apos;s Monetization panel. You keep 70%.</p>
        <h4>Promotion</h4>
        <p>Use the <strong>Promote</strong> modal to sponsor a slot in the home-page <strong>Featured Stories</strong> carousel. Promotion is separate from organic ranking.</p>
      </>
    );
  }
  if (tab === "api") {
    return (
      <>
        <h3>Publishing API</h3>
        <p>
          Publish and sync drafts programmatically instead of using the editor UI. The API is the Supabase
          REST endpoint for the <code>books</code> table, authorized with your session token. Row-Level
          Security ensures you can only write rows where <code>user_id</code> is you.
        </p>
        <h4>Create / publish a book</h4>
        <pre>
          <code>{`POST https://<project>.supabase.co/rest/v1/books
apikey: <anon-key>
Authorization: Bearer <your-access-token>
Content-Type: application/json
Prefer: return=representation

{
  "id": 1735680000000,
  "title": "My Story",
  "type": "Fiction",
  "age_rating": "Everyday",
  "price": 0,
  "is_free": true,
  "status": "Ongoing",
  "content": "Chapter one…",
  "user_id": "<your-uuid>"
}`}</code>
        </pre>
        <h4>Sync a draft (update)</h4>
        <pre>
          <code>{`PATCH .../rest/v1/books?id=eq.1735680000000
{ "content": "Updated draft text…", "status": "Ongoing" }`}</code>
        </pre>
        <h4>EPUB imports</h4>
        <p>
          Standard <code>.epub</code> import is on the roadmap: upload an EPUB and Libry extracts chapters
          into the reader format automatically. Until then, paste chapter text (Markdown-style images with
          <code> ![caption](url) </code> are supported inline).
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Author Analytics Guide</h3>
      <p>Make sense of the numbers on your Creator Dashboard.</p>
      <h4>Books sold</h4>
      <p>Unique purchases of your titles. This drives the first earning milestone (target: 6).</p>
      <h4>Referrals</h4>
      <p>Readers who joined through your share links and stuck around. Drives the second milestone (target: 15).</p>
      <h4>Featured performance</h4>
      <p>When you Promote a book, it appears in Featured Stories by tier priority (Spotlight &gt; Featured &gt; Boost) for the tier&apos;s duration.</p>
      <h4>Reading signal</h4>
      <p>Reader progress and completion tell you which chapters hook people and where they drop — write to the drop-off.</p>
    </>
  );
}

export default async function CreatorHubDocs({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const active = TABS.some((t) => t.key === tab) ? (tab as string) : "analytics";
  const title = TABS.find((t) => t.key === active)?.label ?? "Creator Hub";
  return (
    <DocsLayout title={title} basePath="/creator-hub/docs" tabs={TABS} active={active}>
      <Content tab={active} />
    </DocsLayout>
  );
}
