import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import BookCard from "@/components/BookCard";
import { type Book } from "@/lib/types";

export default async function MyLibrary() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Books the reader has started (their reading history).
  const { data: prog } = await supabase
    .from("reading_progress")
    .select("book_id")
    .eq("user_email", user.email ?? "");
  const ids = [...new Set((prog ?? []).map((p: { book_id: number }) => p.book_id))];

  let books: Book[] = [];
  if (ids.length) {
    const { data } = await supabase.from("books").select("id, title, author, price, type").in("id", ids);
    books = (data ?? []) as Book[];
  }

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
          <div className="book-grid">
            {books.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
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
