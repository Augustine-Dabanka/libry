import { createClient } from "@/lib/supabase/server";
import ReaderView from "@/components/ReaderView";

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: book } = await supabase
    .from("books")
    .select("id, title, author, content")
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

  return (
    <ReaderView
      bookId={String(book.id)}
      title={book.title}
      author={book.author}
      content={book.content ?? ""}
      userEmail={user?.email ?? null}
    />
  );
}
