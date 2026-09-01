import { createClient } from "@/lib/supabase/server";
import ReaderView from "@/components/ReaderView";
import Koala from "@/components/Koala";
import RefillButton from "@/components/RefillButton";
import { completeQuest, clearStreakBroken, trySpendToken } from "@/lib/gamification";

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

  if (user) {
    // Starting a NEW book costs one token (energy). Continuing one you've already
    // opened (a saved progress row exists) is free.
    const { data: prog } = await supabase
      .from("reading_progress")
      .select("book_id")
      .eq("user_email", user.email ?? "")
      .eq("book_id", id)
      .maybeSingle();

    if (!prog) {
      const spend = await trySpendToken(user.id);
      if (!spend.ok) {
        return (
          <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", textAlign: "center" }}>
            <div style={{ maxWidth: 380 }}>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Koala state="sad" size={110} />
              </div>
              <h1 style={{ marginTop: "1rem" }}>Out of reading tokens</h1>
              <p style={{ color: "var(--muted)", margin: "0.7rem 0 1.5rem" }}>
                Tokens refill on their own over time — or top up instantly to keep reading now.
              </p>
              <RefillButton />
              <div style={{ marginTop: "1rem" }}>
                <a href={`/book/${id}`} style={{ color: "var(--gold)" }}>← Back to the book</a>
              </div>
            </div>
          </div>
        );
      }
    }

    // Opening a story completes the daily quest and counts as streak recovery.
    await completeQuest(user.id, "open_book");
    await clearStreakBroken(user.id);
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
