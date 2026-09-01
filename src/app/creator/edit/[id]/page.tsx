import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import EditBookForm from "@/components/EditBookForm";

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
    .select("id, title, description, content, price, type, age_rating, user_id")
    .eq("id", id)
    .maybeSingle();
  let book = primary.data;
  if (primary.error) {
    // age_rating not migrated yet — retry without it.
    const alt = await supabase
      .from("books")
      .select("id, title, description, content, price, type, user_id")
      .eq("id", id)
      .maybeSingle();
    book = alt.data ? { ...alt.data, age_rating: "All Ages" } : null;
  }

  let allowed = false;
  if (book) {
    if (book.user_id === user.id) {
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

  return (
    <>
      <AppNav />
      <section className="section">
        <div className="section-header">
          <h2>Edit story</h2>
        </div>
        {!book ? (
          <p style={{ color: "var(--muted)" }}>Story not found.</p>
        ) : !allowed ? (
          <p style={{ color: "var(--muted)" }}>
            You don&apos;t have edit access to this story.
          </p>
        ) : (
          <EditBookForm book={book} />
        )}
      </section>
    </>
  );
}
