import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import LibraryTabs, { type LibBook } from "@/components/LibraryTabs";

type BookRow = { id: number; title: string; author: string | null; price: number | null; type: string | null };

async function booksByIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: number[]
): Promise<Map<number, BookRow>> {
  const map = new Map<number, BookRow>();
  if (!ids.length) return map;
  const { data } = await supabase.from("books").select("id, title, author, price, type, category").in("id", ids);
  (data as BookRow[] | null)?.forEach((b) => map.set(Number(b.id), b));
  return map;
}

export default async function MyLibrary({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Currently reading — highest progress per book.
  const { data: prog } = await supabase
    .from("reading_progress")
    .select("book_id, progress_percentage")
    .eq("user_email", user.email ?? "");
  const pctById = new Map<number, number>();
  for (const r of (prog ?? []) as { book_id: number; progress_percentage: number | null }[]) {
    const pct = Math.max(0, Math.min(100, Number(r.progress_percentage ?? 0)));
    pctById.set(r.book_id, Math.max(pctById.get(r.book_id) ?? 0, pct));
  }
  const readingBooks = await booksByIds(supabase, [...pctById.keys()]);
  const reading: LibBook[] = [...readingBooks.values()]
    .map((b) => ({ ...b, pct: pctById.get(Number(b.id)) ?? 0 }))
    .sort((a, b) => (a.pct === 100 ? 1 : 0) - (b.pct === 100 ? 1 : 0) || (b.pct ?? 0) - (a.pct ?? 0));

  // Wishlist (guarded — table may not be migrated yet).
  let wishlist: LibBook[] = [];
  const wl = await supabase.from("wishlist").select("book_id").eq("user_id", user.id);
  if (!wl.error) {
    const ids = (wl.data ?? []).map((r: { book_id: number }) => r.book_id);
    const m = await booksByIds(supabase, ids);
    wishlist = [...m.values()];
  }

  // Purchased (guarded).
  let purchased: LibBook[] = [];
  const pu = await supabase.from("purchases").select("book_id").eq("user_id", user.id);
  if (!pu.error) {
    const ids = (pu.data ?? []).map((r: { book_id: number }) => r.book_id);
    const m = await booksByIds(supabase, ids);
    purchased = [...m.values()];
  }

  const initialTab = tab === "wishlist" || tab === "purchased" ? (tab as "wishlist" | "purchased") : "reading";

  return (
    <>
      <AppNav />
      <section className="section">
        <div className="section-header">
          <h2>My Library</h2>
        </div>
        <p style={{ color: "var(--muted)", marginTop: "-1.5rem", marginBottom: "2rem" }}>
          Everything you&apos;re reading, saving, and own — in one place.
        </p>

        <LibraryTabs reading={reading} wishlist={wishlist} purchased={purchased} initialTab={initialTab} />
      </section>
    </>
  );
}
