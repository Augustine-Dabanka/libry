import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuickUpload from "@/components/QuickUpload";
import NewStoryButton from "@/components/NewStoryButton";
import PublishToggle from "@/components/PublishToggle";
import DeleteBookButton from "@/components/DeleteBookButton";
import ReferralLink from "@/components/ReferralLink";
import RevenueChart from "@/components/RevenueChart";
import CreatorProfileForm from "@/components/CreatorProfileForm";
import BecomeCreator from "@/components/BecomeCreator";
import CreatorTabs, { type CreatorTab } from "@/components/CreatorTabs";
import { isCreatorActive, creatorStatusMeta } from "@/lib/creatorStatus";
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

  type Prof = { full_name?: string; username?: string; pen_name?: string; bio?: string; is_creator?: boolean };
  const primaryProfile = await supabase
    .from("profiles")
    .select("full_name, username, pen_name, bio, is_creator")
    .eq("id", user.id)
    .maybeSingle();
  const profile = primaryProfile.error
    ? ((await supabase.from("profiles").select("full_name, username").eq("id", user.id).maybeSingle()).data as Prof | null)
    : (primaryProfile.data as Prof | null);
  const authorName = profile?.pen_name || profile?.full_name || profile?.username || user.email || "Independent Creator";
  const refCode = profile?.username || user.id;
  // Readers can't publish. If the column isn't migrated, default to allowing
  // (so nothing breaks before the migration is run).
  const isCreator = primaryProfile.error ? true : !!profile?.is_creator;

  // Creator standing (ban engine). Queried separately + guarded so the page
  // still works before migration 0021 is run (defaults to "active").
  let creatorStatus = "active";
  let statusReason: string | null = null;
  let statusUntil: string | null = null;
  let payoutFrozen = false;
  {
    const st = await supabase.from("profiles").select("creator_status, creator_status_reason, creator_status_until, payout_frozen").eq("id", user.id).maybeSingle();
    if (!st.error && st.data) {
      const d = st.data as { creator_status?: string; creator_status_reason?: string | null; creator_status_until?: string | null; payout_frozen?: boolean };
      creatorStatus = d.creator_status ?? "active";
      statusReason = d.creator_status_reason ?? null;
      statusUntil = d.creator_status_until ?? null;
      payoutFrozen = !!d.payout_frozen;
    }
  }
  const active = isCreatorActive(creatorStatus);
  const statusMeta = creatorStatusMeta(creatorStatus, statusUntil, statusReason);

  const rc = await supabase.rpc("my_referral_count");
  const referralCount = typeof rc.data === "number" ? rc.data : 0;
  const bs = await supabase.rpc("my_books_sold");
  const booksSold = typeof bs.data === "number" ? bs.data : 0;

  // Real earnings from purchases of this creator's books (creators keep 70%).
  const earn = await supabase.rpc("my_earnings");
  const earnRow = (Array.isArray(earn.data) ? earn.data[0] : earn.data) as { gross?: number; net?: number; sales?: number } | null;
  const netEarnings = Number(earnRow?.net ?? 0);
  const salesCount = Number(earnRow?.sales ?? booksSold);

  const bookSalesRes = await supabase.rpc("my_book_sales");
  const salesByBook = new Map<number, { sales: number; revenue: number }>();
  if (Array.isArray(bookSalesRes.data)) {
    for (const r of bookSalesRes.data as { book_id: number; sales: number; revenue: number }[]) {
      salesByBook.set(Number(r.book_id), { sales: Number(r.sales), revenue: Number(r.revenue) });
    }
  }

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

  // --- Subscribers: who follows this creator (private to the creator). ---
  type Subscriber = { name: string; username: string | null; avatar: string | null; since: string };
  let subscribers: Subscriber[] = [];
  {
    const fol = await supabase.from("author_follows").select("follower_id, created_at").eq("author", authorName).order("created_at", { ascending: false });
    if (!fol.error && fol.data?.length) {
      const ids = [...new Set((fol.data as { follower_id: string }[]).map((r) => r.follower_id))];
      const { data: profs } = await supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", ids);
      const byId = new Map((profs ?? []).map((p: { id: string; full_name?: string | null; username?: string | null; avatar_url?: string | null }) => [p.id, p]));
      subscribers = (fol.data as { follower_id: string; created_at: string }[]).map((r) => {
        const p = byId.get(r.follower_id);
        return { name: p?.full_name || p?.username || "Reader", username: p?.username ?? null, avatar: p?.avatar_url ?? null, since: r.created_at };
      });
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
      <section className="section">
        <div className="dashboard-header">
          <h1>Creator Dashboard</h1>
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)" }}>
            Welcome back, {authorName}. Here&apos;s how your stories are performing.
          </p>
        </div>

        {!isCreator ? (
          <BecomeCreator />
        ) : (
          <>
            {/* Account-standing banner (only when suspended/banned) */}
            {!active ? (
              <div style={{ marginBottom: "2rem", padding: "1.1rem 1.3rem", borderRadius: 14, border: `1px solid ${statusMeta.tone === "bad" ? "rgba(196,85,63,0.5)" : "rgba(217,164,65,0.5)"}`, background: statusMeta.tone === "bad" ? "rgba(196,85,63,0.10)" : "rgba(217,164,65,0.10)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>{statusMeta.tone === "bad" ? "⛔" : "⏸️"}</span>
                  <strong style={{ fontFamily: "var(--sans)", color: "var(--ivory)" }}>{statusMeta.heading}</strong>
                </div>
                <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>{statusMeta.blurb}</p>
              </div>
            ) : null}

            {(() => {
              const overview = (
                <>
                  <div className="stats-grid">
                    {stat("Projected earnings", formatPrice(netEarnings), "Your 70% at list price")}
                    {stat("Books sold", String(salesCount), "Copies acquired")}
                    {stat("Next payout", payoutFrozen ? "On hold" : formatPrice(netEarnings), payoutFrozen ? "Payouts frozen" : "When payouts open")}
                    {stat("Avg Rating", avgRating ? avgRating.toFixed(1) : "—", "Across your titles")}
                  </div>
                  <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.5rem 1.6rem", marginBottom: "2.5rem" }}>
                    <h3 style={{ marginBottom: "1.2rem" }}>Revenue Overview</h3>
                    <RevenueChart daily={revenue7} />
                  </div>
                  <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.5rem 1.6rem", marginBottom: "0.5rem" }}>
                    <h3 style={{ marginBottom: "0.3rem" }}>How you get paid</h3>
                    <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", marginBottom: "1.2rem" }}>
                      You keep the majority of every sale — openly, on this dashboard.
                    </p>
                    <div style={{ display: "flex", height: 40, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.85rem" }}>
                      <div style={{ flex: 70, background: "var(--gold)", color: "#12100E", display: "flex", alignItems: "center", justifyContent: "center" }}>You keep 70%</div>
                      <div style={{ flex: 30, background: "var(--charcoal)", color: "var(--ivory-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>Libry 30%</div>
                    </div>
                    <ul style={{ margin: "1.2rem 0 0", paddingLeft: "1.1rem", color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", lineHeight: 1.7 }}>
                      <li>Every purchase of your book credits <strong style={{ color: "var(--ivory)" }}>70% of the price</strong> to you — the &ldquo;Projected earnings&rdquo; figure above.</li>
                      <li>Libry keeps 30% to run the platform (hosting, payments, discovery).</li>
                      <li>Payments are simulating while we finish setup, so these are projected at current prices. <strong style={{ color: "var(--ivory)" }}>Real payouts begin via Paystack</strong> once the merchant account is verified.</li>
                      <li>You keep your readers — followers, reviews, and the relationship — always.</li>
                    </ul>
                  </div>
                </>
              );

              const booksNode = (
                <>
                  <h3 style={{ marginBottom: "1.2rem" }}>Your Books ({books.length})</h3>
                  {books.length > 0 ? (
                    <div style={{ overflowX: "auto", marginBottom: "3rem" }}>
                      <table className="data-table">
                        <thead>
                          <tr><th>Title</th><th>Type</th><th>Sales</th><th>Revenue</th><th>Rating</th><th>Status</th><th></th></tr>
                        </thead>
                        <tbody>
                          {books.map((b) => (
                            <tr key={b.id}>
                              <td><a href={`/book/${b.id}`} style={{ color: "var(--ivory)", fontFamily: "var(--serif)" }}>{b.title}</a></td>
                              <td>{b.type || "—"}</td>
                              <td>{salesByBook.get(Number(b.id))?.sales ?? 0}</td>
                              <td>{formatPrice(salesByBook.get(Number(b.id))?.revenue ?? 0)}</td>
                              <td>{(b.rating ?? 0) > 0 ? (b.rating ?? 0).toFixed(1) : "—"}</td>
                              <td>
                                <span className="badge" style={b.is_published ? { background: "rgba(78,122,82,0.2)", color: "#7DBE86" } : { background: "rgba(168,162,158,0.2)", color: "var(--muted)" }}>
                                  {b.is_published ? "Live" : "Draft"}
                                </span>
                              </td>
                              <td>
                                {active ? (
                                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                                    <PublishToggle bookId={Number(b.id)} published={!!b.is_published} />
                                    {b.is_published ? (
                                      <a className="btn btn-outline" href={`/b/${b.id}`} target="_blank" rel="noopener noreferrer" style={{ padding: "0.3rem 0.9rem", fontSize: "0.8rem" }}>Share ↗</a>
                                    ) : null}
                                    <a className="btn btn-outline" href={`/creator/edit/${b.id}`} style={{ padding: "0.3rem 0.9rem", fontSize: "0.8rem" }}>Edit</a>
                                    <DeleteBookButton bookId={Number(b.id)} title={b.title} />
                                  </div>
                                ) : (
                                  <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.8rem" }}>🔒 Publishing paused</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: "var(--muted)", marginBottom: "3rem" }}>
                      You haven&apos;t created anything yet. Head to <strong style={{ color: "var(--ivory)" }}>Create</strong> to start your first title.
                    </p>
                  )}
                  {sharedBooks.length > 0 ? (
                    <>
                      <h3 style={{ margin: "1rem 0 1.2rem" }}>Shared with you ({sharedBooks.length})</h3>
                      <div className="book-grid">
                        {sharedBooks.map((b) => (
                          <div key={b.id} className="book-card" style={{ padding: "1.3rem", cursor: "default" }}>
                            <a href={`/book/${b.id}`} style={{ textDecoration: "none" }}><h3 style={{ marginBottom: "0.4rem" }}>{b.title}</h3></a>
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
                </>
              );

              const createNode = active ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", alignItems: "start" }}>
                  <div style={{ background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.2rem 1.2rem 1.3rem" }}>
                    <div style={{ fontFamily: "var(--sans)", fontWeight: 700, marginBottom: "0.3rem" }}>✍️ Write in the Chapter Editor</div>
                    <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                      Start a blank draft and build it chapter by chapter, with images and branching choices.
                    </p>
                    <NewStoryButton userId={user.id} authorName={authorName} />
                  </div>
                  <div style={{ background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.2rem" }}>
                    <div style={{ fontFamily: "var(--sans)", fontWeight: 700, marginBottom: "0.3rem" }}>📄 Upload a manuscript</div>
                    <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                      Drop in a PDF, Word doc, or text file — we&apos;ll import it as a draft you can edit.
                    </p>
                    <QuickUpload userId={user.id} authorName={authorName} />
                  </div>
                </div>
              ) : (
                <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "2rem 1.6rem", textAlign: "center" }}>
                  <div style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>🔒</div>
                  <h3 style={{ marginBottom: "0.4rem" }}>Publishing is paused</h3>
                  <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", maxWidth: 440, margin: "0 auto", lineHeight: 1.6 }}>{statusMeta.blurb}</p>
                </div>
              );

              const audienceNode = (
                <>
                  <h3 style={{ marginBottom: "1.2rem" }}>Audience Insights</h3>
                  <div className="stats-grid" style={{ marginBottom: "2.5rem" }}>
                    {stat("Subscribers", String(subscribers.length), "People following you")}
                    {stat("Total Readers", String(totalReaders), "Unique readers of your books")}
                    {stat("Countries Reached", String(countriesReached), "Where your readers are")}
                    {stat("Top Country", topCountry, "Your biggest audience")}
                  </div>

                  {/* Subscribers — visible only here, on the creator's own dashboard. */}
                  <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.5rem 1.6rem", marginBottom: "2.5rem" }}>
                    <h3 style={{ marginBottom: "0.3rem" }}>Your subscribers</h3>
                    <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.88rem", marginBottom: "1.2rem" }}>
                      The readers following you — only you can see this list.
                    </p>
                    {subscribers.length === 0 ? (
                      <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem" }}>
                        No subscribers yet. Readers who follow you from your author page or a book will show up here.
                      </p>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.7rem" }}>
                        {subscribers.map((s, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.7rem", padding: "0.6rem 0.7rem", background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 10 }}>
                            {s.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={s.avatar} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                            ) : (
                              <span style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--gold)", color: "#20180a", display: "grid", placeItems: "center", fontFamily: "var(--sans)", fontWeight: 800, flexShrink: 0 }}>{(s.name[0] || "?").toUpperCase()}</span>
                            )}
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: "0.9rem", color: "var(--ivory)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                              {s.username ? <div style={{ fontFamily: "var(--sans)", fontSize: "0.78rem", color: "var(--muted)" }}>@{s.username}</div> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <ReferralLink refCode={refCode} count={referralCount} />
                </>
              );

              const profileNode = (
                <CreatorProfileForm userId={user.id} initialPenName={profile?.pen_name || profile?.full_name || ""} initialBio={profile?.bio || ""} />
              );

              const accountNode = (
                <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.6rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "0.8rem" }}>
                    <span className="badge" style={{ background: statusMeta.tone === "ok" ? "rgba(78,122,82,0.2)" : statusMeta.tone === "warn" ? "rgba(217,164,65,0.2)" : "rgba(196,85,63,0.2)", color: statusMeta.tone === "ok" ? "#7DBE86" : statusMeta.tone === "warn" ? "#D9A441" : "#E0836B", fontWeight: 700 }}>{statusMeta.label}</span>
                    <strong style={{ fontFamily: "var(--sans)", color: "var(--ivory)" }}>{statusMeta.heading}</strong>
                  </div>
                  <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.3rem" }}>{statusMeta.blurb}</p>
                  <div style={{ display: "grid", gap: "0.7rem", fontFamily: "var(--sans)", fontSize: "0.9rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: "0.7rem" }}><span style={{ color: "var(--muted)" }}>Reading &amp; library</span><span style={{ color: "#7DBE86" }}>Always available</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: "0.7rem" }}><span style={{ color: "var(--muted)" }}>Publishing new work</span><span style={{ color: active ? "#7DBE86" : "var(--muted)" }}>{active ? "Available" : "Paused"}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: "0.7rem" }}><span style={{ color: "var(--muted)" }}>Payouts</span><span style={{ color: active && !payoutFrozen ? "#7DBE86" : "var(--muted)" }}>{active && !payoutFrozen ? "Enabled (once verified)" : "Frozen"}</span></div>
                  </div>
                  <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.8rem", marginTop: "1.3rem", lineHeight: 1.6 }}>
                    Standing is governed by our <a href="/terms" style={{ color: "var(--gold)" }}>Terms</a>. If you believe this is a mistake, contact support and we&apos;ll review.
                  </p>
                </div>
              );

              const tabs: CreatorTab[] = [
                { id: "overview", label: "Overview", icon: "📊", node: overview },
                { id: "books", label: "Your Books", icon: "📚", node: booksNode },
                { id: "create", label: "Create", icon: "✍️", node: createNode },
                { id: "audience", label: "Audience", icon: "🌍", node: audienceNode },
                { id: "profile", label: "Profile", icon: "👤", node: profileNode },
                { id: "account", label: "Account", icon: "🛡️", node: accountNode },
              ];
              return <CreatorTabs tabs={tabs} />;
            })()}
          </>
        )}
      </section>
    </>
  );
}
