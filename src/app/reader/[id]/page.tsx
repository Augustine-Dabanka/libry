import { createClient } from "@/lib/supabase/server";
import ReaderView from "@/components/ReaderView";
import { firstChapterExcerpt } from "@/lib/chapters";

export default async function ReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sample?: string }>;
}) {
  const { id } = await params;
  const { sample } = await searchParams;
  const isSample = sample === "1" || sample === "true";
  const supabase = await createClient();

  const { data: book } = await supabase
    .from("books")
    .select("id, title, author, content, price")
    .eq("id", id)
    .maybeSingle();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!book) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", textAlign: "center" }}>
        <div>
          <h1>Story not found</h1>
          <p style={{ color: "var(--muted)", marginTop: "0.6rem" }}>
            <a href="/catalog" style={{ color: "var(--gold)" }}>Back to catalog →</a>
          </p>
        </div>
      </div>
    );
  }

  const full = book.content ?? "";
  const { excerpt, truncated } = isSample ? firstChapterExcerpt(full) : { excerpt: full, truncated: false };

  return (
    <ReaderView
      bookId={String(book.id)}
      title={book.title}
      author={book.author}
      content={isSample ? excerpt : full}
      userEmail={user?.email ?? null}
      sample={isSample && truncated}
      signedIn={!!user}
    />
  );
}
