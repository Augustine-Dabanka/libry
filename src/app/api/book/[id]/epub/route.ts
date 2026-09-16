import { createClient } from "@/lib/supabase/server";
import { looksLikeHtml } from "@/lib/sanitize";
import { buildEpub, contentToChapters, bookFilename } from "@/lib/epub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Download a personalised, watermarked EPUB of a book the reader owns (a free
// book, a purchased one, or their own). Option B: read online AND keep a copy.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Sign in to download your copy.", { status: 401 });

  const { data: book } = await supabase
    .from("books")
    .select("id, title, author, content, price, type, user_id")
    .eq("id", id)
    .maybeSingle();
  if (!book || !book.content) return new Response("Book not found.", { status: 404 });

  // Ownership: free books, your own books, or a recorded purchase.
  const isFree = (book.price ?? 0) <= 0;
  const isOwner = (book as { user_id?: string }).user_id === user.id;
  let owned = isFree || isOwner;
  if (!owned) {
    const pu = await supabase.from("purchases").select("id").eq("user_id", user.id).eq("book_id", book.id).maybeSingle();
    owned = !!pu.data;
  }
  if (!owned) return new Response("Buy this book to download your copy.", { status: 403 });

  const pr = await supabase.from("profiles").select("full_name, username").eq("id", user.id).maybeSingle();
  const who = pr.data?.full_name || pr.data?.username || user.email || "a Libry reader";
  const watermark = `Prepared for ${who}${user.email ? ` (${user.email})` : ""} via Libry on ${new Date().toISOString().slice(0, 10)}. This is your personal copy — please keep it to yourself.`;

  const chapters = contentToChapters(book.content, looksLikeHtml(book.content));
  const epub = await buildEpub({
    bookId: String(book.id),
    title: book.title,
    author: book.author ?? "",
    chapters,
    watermark,
  });

  return new Response(new Uint8Array(epub), {
    headers: {
      "Content-Type": "application/epub+zip",
      "Content-Disposition": `attachment; filename="${bookFilename(book.title)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
