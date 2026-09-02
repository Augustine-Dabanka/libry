import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import LibraryTabs, { type LibBook } from "@/components/LibraryTabs";

type ProgRow = { book_id: number; progress_percentage: number | null };
type BookRow = { id: number; title: string; author: string | null; price: number | null; type: string | null };

export default async function MyLibrary() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Reading history with progress.
  const { data: prog } = await supabase
    .from("reading_progress")
    .select("book_id, progress_percentage")
    .eq("user_email", user.email ?? "");
  const rows = (prog ?? []) as ProgRow[];

  // Highest progress per book.
  const pctById = new Map<number, number>();
  for (const r of rows) {
    const pct = Math.max(0, Math.min(100, Number(r.progress_percentage ?? 0)));
    pctById.set(r.book_id, Math.max(pctById.get(r.book_id) ?? 0, pct));
  }
  const ids = [...pctById.keys()];

  let books: LibBook[] = [];
  if (ids.length) {
    const { data } = await supabase.from("books").select("id, title, author, price, type").in("id", ids);
    books = ((data ?? []) as BookRow[]).map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      price: b.price,
      type: b.type,
      pct: pctById.get(Number(b.id)) ?? 0,
    }));
  }

  const reading = books.filter((b) => b.pct < 100).sort((a, b) => b.pct - a.pct);
  const finished = books.filter((b) => b.pct >= 100);

  return (
    <>
      <AppNav />
      <section className="section">
        <div className="section-header">
          <h2>My Library</h2>
        </div>
        <p style={{ color: "var(--muted)", marginTop: "-1.5rem", marginBottom: "2rem" }}>
          Your purchased books and reading history.
        </p>

        {books.length > 0 ? (
          <LibraryTabs reading={reading} finished={finished} />
        ) : (
          <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "3rem 2rem", textAlign: "center", background: "var(--stone)" }}>
            <p style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Your library is empty.</p>
            <p style={{ color: "var(--muted)", maxWidth: 440, margin: "0 auto" }}>
              Open a story from the <a href="/catalog" style={{ color: "var(--gold)" }}>catalog</a> and it joins your library.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
