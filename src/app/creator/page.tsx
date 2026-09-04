import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import QuickUpload from "@/components/QuickUpload";
import NewStoryButton from "@/components/NewStoryButton";
import PublishToggle from "@/components/PublishToggle";
import DeleteBookButton from "@/components/DeleteBookButton";
import ReferralLink from "@/components/ReferralLink";
import RevenueChart from "@/components/RevenueChart";
import MonetizationTracker from "@/components/MonetizationTracker";
import { formatPrice } from "@/lib/types";

type MyBook = {
  id: number | string;
  title: string;
  price: number | null;
  type: string | null;
  status: string | null;
  rating: number | null;
  is_published?: boolean;
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
  const refCode = profile?.username || user.id;

  const rc = await supabase.rpc("my_referral_count");
  const referralCount = typeof rc.data === "number" ? rc.data : 0;
  const bs = await supabase.rpc("my_books_sold");
  const booksSold = typeof bs.data === "number" ? bs.data : 0;

  // Owned books (with rating + publish state, guarded pre-migration).
  const primaryMine = await supabase
    .from("books")
    .select("id, title, price, type, status, rating, is_published")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  let books: MyBook[];
  if (primaryMine.error) {
    const alt = await supabase
      .from("books")
      .select("id, title, price, type, status, rating")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    books = ((alt.data ?? []) as MyBook[]).map((b) => ({ ...b, is_published: b.status !== "Draft" }));
  } else {
    books = (primaryMine.data ?? []) as MyBook[];
  }
  const ownedIds = books.map((b) => Number(b.id));

  // --- Audience: distinct readers of the creator's books ---
  let totalReaders = 0;
  let countriesReached = 0;
  let topCountry = "—";
  if (ownedIds.length) {
    const { data: prog } = await supabase
      .from("reading_progress")
      .select("user_email")
      .in("book_id", ownedIds);
    const emails = [...new Set((prog ?? []).map((p: { user_email: string }) => p.user_email).filter(Boolean))];
    totalReaders = emails.length;
    if (emails.length) {
      const { data: readers } = await supabase.from("profiles").select("prefs").in("email", emails);
      const counts = new Map<string, number>();
      (readers ?? []).forEach((r: { prefs: { country?: string } | null }) => {
        const c = r.prefs?.country;
        if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
      });
      countriesReached = counts.size;
      let best = 0;
      counts.forEach((n, c) => { if (n > best) { best = n; topCountry = c; } });
    }
  }

  // --- Stats (no payment backend yet → revenue/sales are zero, shown honestly) ---
  const rated = books.filter((b) => (b.rating ?? 0) > 0);
  const avgRating = rated.length ? (rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length) : 0;
  const revenue7 = [0, 0, 0, 0, 0, 0, 0];

  // Books shared WITH me (co-author).
  const { data: myCollabs } = await supabase.from("book_collaborators").select("book_id").eq("user_id", user.id);
  const sharedIds = (myCollabs ?? []).map((c: { book_id: number }) => c.book_id);
  let sharedBooks: MyBook[] = [];
  if (sharedIds.length) {
    const { data: sb } = await supabase.from("books").select("id, title, price, type, status, rating").in("id", sharedIds);
    sharedBooks = (sb ?? []) as MyBook[];
  }

  const stat = (label: string, value: string, sub: string) => (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      <div className="change" style={{ color: "var(--muted)" }}>{sub}</div>
    </div>
  );

  return (
    <>
      <AppNav />
      <section className="section">
        <div className="dashboard-header">
          <h1>Creator Dashboard</h1>
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)" }}>
            Welcome back, {authorName}. Here&apos;s how your stories are performing.
          </p>
        </div>

        {/* Stat cards */}
        <div className="stats-grid">
          {stat("Total Revenue", "$0.00", "From real sales")}
          {stat("Books Sold", "0", "Acquisitions to date")}
          {stat("Next Payout", "$0.00", "Across your titles")}
          {stat("Avg Rating", avgRating ? avgRating.toFixed(1) : "—", "Across your titles")}
        </div>

        {/* Revenue overview */}
        <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.5rem 1.6rem", marginBottom: "2.5rem" }}>
          <h3 style={{ marginBottom: "1.2rem" }}>Revenue Overview</h3>
          <RevenueChart daily={revenue7} />
        </div>

        {/* Monetization — progress toward unlocking creator earnings */}
        <MonetizationTracker sales={booksSold} referrals={referralCount} />

        {/* Create — write chapter by chapter, or import a manuscript */}
        <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.5rem 1.6rem", marginBottom: "2.5rem" }}>
          <h3 style={{ marginBottom: "0.3rem" }}>Create a new story</h3>
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", marginBottom: "1.3rem" }}>
            Write it chapter by chapter in the editor, or import a finished manuscript and we&apos;ll lay it out for you.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", alignItems: "start" }}>
            {/* Option A — Chapter editor */}
            <div style={{ background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.2rem 1.2rem 1.3rem" }}>
              <div style={{ fontFamily: "var(--sans)", fontWeight: 700, marginBottom: "0.3rem" }}>✍️ Write in the Chapter Editor</div>
              <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                Start a blank draft and build it chapter by chapter, with images and branching choices.
              </p>
              <NewStoryButton userId={user.id} authorName={authorName} />
            </div>
            {/* Option B — Manuscript upload */}
            <div style={{ background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.2rem" }}>
              <div style={{ fontFamily: "var(--sans)", fontWeight: 700, marginBottom: "0.3rem" }}>📄 Upload a manuscript</div>
              <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                Drop in a PDF, Word doc, or text file — we&apos;ll import it as a draft you can edit.
              </p>
              <QuickUpload userId={user.id} authorName={authorName} />
            </div>
          </div>
        </div>

        {/* Your Books table */}
        <h3 style={{ marginBottom: "1.2rem" }}>Your Books ({books.length})</h3>
        {books.length > 0 ? (
          <div style={{ overflowX: "auto", marginBottom: "3rem" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th><th>Type</th><th>Sales</th><th>Revenue</th><th>Rating</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.id}>
                    <td><a href={`/book/${b.id}`} style={{ color: "var(--ivory)", fontFamily: "var(--serif)" }}>{b.title}</a></td>
                    <td>{b.type || "—"}</td>
                    <td>0</td>
                    <td>{formatPrice(0)}</td>
                    <td>{(b.rating ?? 0) > 0 ? (b.rating ?? 0).toFixed(1) : "—"}</td>
                    <td>
                      <span className="badge" style={b.is_published
                        ? { background: "rgba(78,122,82,0.2)", color: "#7DBE86" }
                        : { background: "rgba(168,162,158,0.2)", color: "var(--muted)" }}>
                        {b.is_published ? "Live" : "Draft"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                        <PublishToggle bookId={Number(b.id)} published={!!b.is_published} />
                        <a className="btn btn-outline" href={`/creator/edit/${b.id}`} style={{ padding: "0.3rem 0.9rem", fontSize: "0.8rem" }}>Edit</a>
                        <DeleteBookButton bookId={Number(b.id)} title={b.title} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "var(--muted)", marginBottom: "3rem" }}>
            You haven&apos;t created anything yet. Upload a manuscript or start a blank draft above to begin your first title.
          </p>
        )}

        {/* Audience insights */}
        <h3 style={{ marginBottom: "1.2rem" }}>Audience Insights</h3>
        <div className="stats-grid" style={{ marginBottom: "2.5rem" }}>
          {stat("Total Readers", String(totalReaders), "Unique readers of your books")}
          {stat("Countries Reached", String(countriesReached), "Where your readers are")}
          {stat("Top Country", topCountry, "Your biggest audience")}
        </div>

        {/* Invite readers */}
        <ReferralLink refCode={refCode} count={referralCount} />

        {/* Shared with you */}
        {sharedBooks.length > 0 ? (
          <>
            <h3 style={{ margin: "1rem 0 1.2rem" }}>Shared with you ({sharedBooks.length})</h3>
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
                    <a className="btn btn-outline" href={`/creator/edit/${b.id}`} style={{ padding: "0.3rem 0.9rem", fontSize: "0.8rem" }}>Edit</a>
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
