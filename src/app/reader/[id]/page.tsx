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
    .select("id, title, author, content, price, user_id")
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

  // Purchase gate: paid books can only be read in full once bought (or by the
  // author). Free books are always fully readable. Otherwise readers only ever
  // get the free sample, with a "buy to keep reading" prompt at the end.
  const isFree = (book.price ?? 0) <= 0;
  const isOwner = !!user && (book as { user_id?: string }).user_id === user.id;
  let purchased = false;
  if (user && !isFree && !isOwner) {
    const p = await supabase.from("purchases").select("book_id").eq("user_id", user.id).eq("book_id", book.id).maybeSingle();
    purchased = !!p.data;
  }
  const canFull = isFree || isOwner || purchased;
  const showSample = isSample || !canFull;
  const locked = !canFull && (book.price ?? 0) > 0;

  const full = book.content ?? "";
  const { excerpt, truncated } = showSample ? firstChapterExcerpt(full) : { excerpt: full, truncated: false };

  return (
    <ReaderView
      bookId={String(book.id)}
      title={book.title}
      author={book.author}
      content={showSample ? excerpt : full}
      userEmail={user?.email ?? null}
      sample={showSample && (truncated || locked)}
      signedIn={!!user}
      locked={locked}
      price={book.price}
    />
  );
}
