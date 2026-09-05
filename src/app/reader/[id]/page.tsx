import { createClient } from "@/lib/supabase/server";
import ReaderView from "@/components/ReaderView";
import InteractiveReader from "@/components/InteractiveReader";
import { firstChapterExcerpt } from "@/lib/chapters";
import { parseInteractive } from "@/lib/interactive";

function Gate({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", textAlign: "center", background: "var(--charcoal)" }}>
      <div style={{ maxWidth: 420 }}>{children}</div>
    </div>
  );
}

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
    .select("id, title, author, content, price, user_id, type, age_rating")
    .eq("id", id)
    .maybeSingle();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!book) {
    return (
      <Gate>
        <h1>Story not found</h1>
        <p style={{ color: "var(--muted)", marginTop: "0.6rem" }}>
          <a href="/catalog" style={{ color: "var(--gold)" }}>Back to catalog →</a>
        </p>
      </Gate>
    );
  }

  // ---- 18+ age gate: block Mature titles unless the reader enabled it ----
  if ((book as { age_rating?: string }).age_rating === "Mature") {
    let showMature = false;
    if (user) {
      const sm = await supabase.from("profiles").select("show_mature").eq("id", user.id).maybeSingle();
      showMature = !!sm.data?.show_mature;
    }
    if (!showMature) {
      return (
        <Gate>
          <div style={{ fontSize: "2rem", marginBottom: "0.6rem" }}>🔞</div>
          <h1 style={{ marginBottom: "0.6rem" }}>This is an 18+ title</h1>
          <p style={{ color: "var(--muted)", marginBottom: "1.4rem" }}>
            Mature content is off by default. Turn on <strong style={{ color: "var(--ivory)" }}>Show mature content</strong> in Settings to read it.
          </p>
          <div style={{ display: "flex", gap: "0.7rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/settings" className="btn btn-gold">Open Settings</a>
            <a href={`/book/${book.id}`} className="btn btn-outline">Back</a>
          </div>
        </Gate>
      );
    }
  }

  const content = book.content ?? "";

  // ---- Interactive stories: real, choice-driven branching ----
  if ((book.type || "").toLowerCase() === "interactive" && content) {
    const story = parseInteractive(content);
    if (story.chapters.length >= 1) {
      return (
        <InteractiveReader
          bookId={String(book.id)}
          title={book.title}
          author={book.author}
          story={story}
          userEmail={user?.email ?? null}
        />
      );
    }
  }

  // ---- Standard reader with the purchase gate ----
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

  const { excerpt, truncated } = showSample ? firstChapterExcerpt(content) : { excerpt: content, truncated: false };

  return (
    <ReaderView
      bookId={String(book.id)}
      title={book.title}
      author={book.author}
      content={showSample ? excerpt : content}
      userEmail={user?.email ?? null}
      sample={showSample && (truncated || locked)}
      signedIn={!!user}
      locked={locked}
      price={book.price}
    />
  );
}
