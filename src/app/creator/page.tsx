import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import NewBookForm from "@/components/NewBookForm";
import CollaboratorsPanel from "@/components/CollaboratorsPanel";
import { formatPrice } from "@/lib/types";

type MyBook = {
  id: number | string;
  title: string;
  price: number | null;
  type: string | null;
  status: string | null;
};

export default async function CreatorDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username")
    .eq("id", user.id)
    .maybeSingle();
  const authorName = profile?.full_name || profile?.username || user.email || "Independent Creator";

  const { data: booksData } = await supabase
    .from("books")
    .select("id, title, price, type, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const books = (booksData ?? []) as MyBook[];

  // Collaborators on each owned book (book_id → [{userId, name}]).
  const collabMap = new Map<string, { userId: string; name: string }[]>();
  const ownedIds = books.map((b) => Number(b.id));
  if (ownedIds.length) {
    const { data: collabs } = await supabase
      .from("book_collaborators")
      .select("book_id, user_id")
      .in("book_id", ownedIds);
    const collabUserIds = [...new Set((collabs ?? []).map((c: { user_id: string }) => c.user_id))];
    const nameMap = new Map<string, string>();
    if (collabUserIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, full_name")
        .in("id", collabUserIds);
      (profs ?? []).forEach((p: { id: string; username: string | null; full_name: string | null }) =>
        nameMap.set(p.id, p.username || p.full_name || "reader")
      );
    }
    (collabs ?? []).forEach((c: { book_id: number; user_id: string }) => {
      const arr = collabMap.get(String(c.book_id)) ?? [];
      arr.push({ userId: c.user_id, name: nameMap.get(c.user_id) || "reader" });
      collabMap.set(String(c.book_id), arr);
    });
  }

  // Books shared WITH me (I'm a co-author).
  const { data: myCollabs } = await supabase
    .from("book_collaborators")
    .select("book_id")
    .eq("user_id", user.id);
  const sharedIds = (myCollabs ?? []).map((c: { book_id: number }) => c.book_id);
  let sharedBooks: MyBook[] = [];
  if (sharedIds.length) {
    const { data: sb } = await supabase
      .from("books")
      .select("id, title, price, type, status")
      .in("id", sharedIds);
    sharedBooks = (sb ?? []) as MyBook[];
  }

  return (
    <>
      <AppNav />
      <section className="section">
        <div className="section-header">
          <h2>Creator Dashboard</h2>
        </div>
        <p style={{ color: "var(--muted)", marginTop: "-1.5rem", marginBottom: "2rem" }}>
          Welcome back, {authorName}. Here&apos;s how your stories are performing.
        </p>

        <div style={{ marginBottom: "2.5rem" }}>
          <NewBookForm userId={user.id} authorName={authorName} />
        </div>

        <h3 style={{ marginBottom: "1.2rem" }}>Your Books ({books.length})</h3>
        {books.length > 0 ? (
          <div className="book-grid">
            {books.map((b) => (
              <div key={b.id} className="book-card" style={{ padding: "1.3rem", cursor: "default" }}>
                <a href={`/book/${b.id}`} style={{ textDecoration: "none" }}>
                  <h3 style={{ marginBottom: "0.4rem" }}>{b.title}</h3>
                </a>
                <div className="book-meta">
                  <span className="price">{formatPrice(b.price)}</span>
                  {b.type ? <span className="badge">{b.type}</span> : null}
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", marginTop: "0.9rem", flexWrap: "wrap" }}>
                  <span className="badge" style={{ background: "rgba(78,122,82,0.2)", color: "#7DBE86" }}>
                    {b.status || "Live"}
                  </span>
                  <a className="btn btn-outline" href={`/creator/edit/${b.id}`} style={{ padding: "0.3rem 0.9rem", fontSize: "0.8rem" }}>
                    Edit
                  </a>
                </div>
                <div style={{ marginTop: "0.6rem" }}>
                  <CollaboratorsPanel bookId={Number(b.id)} collaborators={collabMap.get(String(b.id)) ?? []} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--muted)" }}>
            You haven&apos;t published anything yet. Use “＋ New Story” above to
            publish your first title.
          </p>
        )}

        {sharedBooks.length > 0 ? (
          <>
            <h3 style={{ margin: "2.5rem 0 1.2rem" }}>Shared with you ({sharedBooks.length})</h3>
            <div className="book-grid">
              {sharedBooks.map((b) => (
                <div key={b.id} className="book-card" style={{ padding: "1.3rem", cursor: "default" }}>
                  <a href={`/book/${b.id}`} style={{ textDecoration: "none" }}>
                    <h3 style={{ marginBottom: "0.4rem" }}>{b.title}</h3>
                  </a>
                  <div className="book-meta">
                    <span className="price">{formatPrice(b.price)}</span>
                    {b.type ? <span className="badge">{b.type}</span> : null}
                  </div>
                  <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.9rem", flexWrap: "wrap" }}>
                    <span className="badge" style={{ background: "rgba(124,124,180,0.2)", color: "#B7B7E6" }}>Co-author</span>
                    <a className="btn btn-outline" href={`/creator/edit/${b.id}`} style={{ padding: "0.3rem 0.9rem", fontSize: "0.8rem" }}>
                      Edit
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </section>
    </>
  );
}
