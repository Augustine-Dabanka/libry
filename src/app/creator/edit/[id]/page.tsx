import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditBookForm from "@/components/EditBookForm";
import ChapterEditor, { type Chapter } from "@/components/ChapterEditor";
import CollaboratorsPanel from "@/components/CollaboratorsPanel";

export default async function EditBook({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const primary = await supabase
    .from("books")
    .select("id, title, description, content, price, type, age_rating, category, cover_url, user_id")
    .eq("id", id)
    .maybeSingle();
  let book = primary.data;
  if (primary.error) {
    // age_rating/category not migrated yet — retry without them.
    const alt = await supabase
      .from("books")
      .select("id, title, description, content, price, type, cover_url, user_id")
      .eq("id", id)
      .maybeSingle();
    book = alt.data ? { ...alt.data, age_rating: "Everyday", category: null } : null;
  }

  let allowed = false;
  const isOwner = !!book && book.user_id === user.id;
  if (book) {
    if (isOwner) {
      allowed = true;
    } else {
      const { data: collab } = await supabase
        .from("book_collaborators")
        .select("id")
        .eq("book_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      allowed = !!collab;
    }
  }

  // Chapters for the chapter editor: existing chapter rows, else the book body
  // as a single chapter, else one empty chapter to start.
  let initialChapters: Chapter[] = [];
  if (book && allowed) {
    const { data: chs } = await supabase
      .from("chapters")
      .select("title, content, chapter_number")
      .eq("book_id", book.id)
      .order("chapter_number", { ascending: true });
    if (chs && chs.length) {
      initialChapters = chs.map((c: { title: string | null; content: string | null }) => ({
        title: c.title || "Untitled chapter",
        content: c.content || "",
      }));
    } else if (book.content) {
      initialChapters = [{ title: "Chapter One", content: book.content }];
    }
  }

  // Current co-authors (owner manages them in project settings).
  const collaborators: { userId: string; name: string }[] = [];
  if (isOwner) {
    const { data: collabs } = await supabase.from("book_collaborators").select("user_id").eq("book_id", id);
    const ids = (collabs ?? []).map((c: { user_id: string }) => c.user_id);
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username, full_name").in("id", ids);
      const nameMap = new Map<string, string>();
      (profs ?? []).forEach((p: { id: string; username: string | null; full_name: string | null }) =>
        nameMap.set(p.id, p.username || p.full_name || "reader")
      );
      ids.forEach((uid) => collaborators.push({ userId: uid, name: nameMap.get(uid) || "reader" }));
    }
  }

  return (
    <>
      <section className="section">
        <a
          href="/creator?tab=books"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.9rem" }}
        >
          ← Back to dashboard
        </a>
        <div className="section-header">
          <h2>Edit story</h2>
        </div>
        {book && allowed ? (
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.86rem", margin: "-0.4rem 0 1.2rem" }}>
            You keep <strong style={{ color: "var(--ivory)" }}>65%</strong> of every sale · Libry keeps 35% (30% platform + 5% infra fee).
          </p>
        ) : null}
        {!book ? (
          <p style={{ color: "var(--muted)" }}>Story not found.</p>
        ) : !allowed ? (
          <p style={{ color: "var(--muted)" }}>
            You don&apos;t have edit access to this story.
          </p>
        ) : (
          <>
            <ChapterEditor bookId={Number(book.id)} initial={initialChapters} />
            <EditBookForm book={book} />
            {isOwner ? (
              <div style={{ marginTop: "2.5rem", maxWidth: 640 }}>
                <h3 style={{ marginBottom: "0.3rem" }}>Project settings · Co-authors</h3>
                <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", marginBottom: "0.8rem" }}>
                  Invite collaborators by @username to draft and publish this story with you.
                </p>
                <CollaboratorsPanel bookId={Number(book.id)} collaborators={collaborators} />
              </div>
            ) : null}
          </>
        )}
      </section>
    </>
  );
}
