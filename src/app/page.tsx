import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StoryChoiceDemo from "@/components/StoryChoiceDemo";
import s from "./landing.module.css";

// Public marketing landing. Signed-in users are sent straight to their app home.
export default async function Landing() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/home");

  // Popular communities for the marketing showcase (public read).
  type Comm = { id: number; slug: string; name: string; description: string | null; emoji: string | null; member_count: number };
  let communities: Comm[] = [];
  {
    const { data } = await supabase
      .from("communities")
      .select("id, slug, name, description, emoji, member_count, is_official")
      .order("is_official", { ascending: false })
      .order("member_count", { ascending: false })
      .limit(4);
    if (data) communities = data as Comm[];
  }

  return (
    <div className={s.page}>
      <div className={s.topbar}>
        ✦ <b>Libry is live in early access</b> — reading is free to start.{" "}
        <a href="/onboarding">Create your free account →</a>
      </div>

      <nav className={s.nav}>
        <div className={s.navIn}>
          <a href="/" className={s.logo}>
            Libry<span>.</span>
          </a>
          <div className={s.navLinks}>
            <a href="#features">Features</a>
            <a href="#interactive">Interactive</a>
            <a href="#creators">Creators</a>
            <a href="#communities">Communities</a>
            <a href="/unlimited">Unlimited</a>
          </div>
          <div className={s.navRight}>
            <a href="/login" className={s.txt}>
              Log in
            </a>
            <a href="/onboarding" className={`${s.btn} ${s.btnGold}`}>
              Sign up
            </a>
          </div>
        </div>
      </nav>

      <header className={s.hero}>
        <div className={`${s.wrap} ${s.heroIn}`}>
          <div>
            <span className={s.eyebrow}>Every story · every path · all yours</span>
            <h1>
              Stories worth <em>lingering</em> in.
            </h1>
            <p className={s.sub}>
              A calm bookstore and creator marketplace — books, interactive
              choose-your-path stories, and digital products, where readers come
              first and creators keep 65%.
            </p>
            <div className={s.heroCta} style={{ marginTop: "1.7rem" }}>
              <a className={`${s.btn} ${s.btnGold} ${s.btnLg}`} href="/onboarding">
                Start Reading Free
              </a>
              <a className={`${s.btn} ${s.btnGhost} ${s.btnLg}`} href="/onboarding?intent=creator">
                Publish &amp; Sell
              </a>
            </div>
            <div className={s.heroNote}>
              <span className={s.dot} /> Free to start · 65% to creators · no card required
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <StoryChoiceDemo />
          </div>
        </div>
      </header>

      <div className={s.trust}>
        <div className={`${s.wrap} ${s.trustIn}`}>
          <div className={s.trustItem}>
            <b>65%</b> to creators
          </div>
          <div className={s.trustItem}>
            <b>17</b> books to read free
          </div>
          <div className={s.trustItem}>Interactive, choose-your-path stories</div>
          <div className={s.trustItem}>Free — no card required</div>
        </div>
      </div>

      {communities.length > 0 ? (
        <section id="communities" className={s.band} style={{ scrollMarginTop: 70 }}>
          <div className={s.wrap}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "1rem", marginBottom: "1.4rem" }}>
              <div>
                <span className={s.eyebrow}>Explore</span>
                <h2 style={{ margin: 0 }}>Popular communities</h2>
              </div>
              <a href="/onboarding" style={{ color: "#c4a35a", fontFamily: "var(--sans)", fontWeight: 700, textDecoration: "none" }}>View all communities →</a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "1rem" }}>
              {communities.map((c) => (
                <a key={c.id} href={`/c/${c.slug}`} style={{ textDecoration: "none", display: "block", background: "#1c1917", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.3rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "0.6rem" }}>
                    <span style={{ width: 44, height: 44, borderRadius: "50%", border: "1.5px solid rgba(196,163,90,0.5)", display: "grid", placeItems: "center", fontSize: "1.3rem", flexShrink: 0 }}>{c.emoji || "📚"}</span>
                    <div style={{ fontFamily: "var(--serif, Georgia, serif)", color: "#faf7f2", fontSize: "1.1rem" }}>{c.name}</div>
                  </div>
                  {c.description ? <p style={{ color: "#a8a29e", fontFamily: "var(--sans)", fontSize: "0.88rem", lineHeight: 1.5, margin: "0 0 0.8rem" }}>{c.description}</p> : null}
                  <div style={{ color: "#8a8580", fontFamily: "var(--sans)", fontSize: "0.8rem" }}>👥 {c.member_count.toLocaleString()} member{c.member_count === 1 ? "" : "s"}</div>
                </a>
              ))}
            </div>

            {/* Digital Store + Comics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem", marginTop: "1.2rem" }}>
              <a href="/onboarding" style={{ textDecoration: "none", display: "block", background: "#1c1917", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem 1.6rem" }}>
                <div style={{ color: "#c4a35a", fontFamily: "var(--sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.4rem" }}>Store</div>
                <h3 style={{ color: "#faf7f2", fontSize: "1.4rem", marginBottom: "0.4rem" }}>Digital Store</h3>
                <p style={{ color: "#a8a29e", fontFamily: "var(--sans)", fontSize: "0.92rem", lineHeight: 1.55, marginBottom: "0.9rem" }}>Templates, audio, courses and downloads. Support creators, add to your collection.</p>
                <span style={{ color: "#c4a35a", fontFamily: "var(--sans)", fontWeight: 700 }}>Browse the store →</span>
              </a>
              <a href="/onboarding" style={{ textDecoration: "none", display: "block", background: "#1c1917", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem 1.6rem" }}>
                <div style={{ color: "#c4a35a", fontFamily: "var(--sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.4rem" }}>Comics</div>
                <h3 style={{ color: "#faf7f2", fontSize: "1.4rem", marginBottom: "0.4rem" }}>Comics</h3>
                <p style={{ color: "#a8a29e", fontFamily: "var(--sans)", fontSize: "0.92rem", lineHeight: 1.55, marginBottom: "0.9rem" }}>Visual stories, infinite worlds. Read panel by panel, or all at once.</p>
                <span style={{ color: "#c4a35a", fontFamily: "var(--sans)", fontWeight: 700 }}>Explore comics →</span>
              </a>
            </div>
          </div>
        </section>
      ) : null}

      <section className={`${s.band} ${s.cardBg}`}>
        <div className={s.wrap}>
          <div className={s.secHead} style={{ textAlign: "center", marginInline: "auto" }}>
            <span className={s.eyebrow}>Why Libry</span>
            <h2>The bookstore that actually pays its writers.</h2>
            <p>Big platforms treat readers like a feed and writers like inventory. We built the opposite.</p>
          </div>
          <div className={s.cards}>
            <div className={s.fcard}>
              <div className={s.ic}>💛</div>
              <h3>Writers get paid, openly</h3>
              <p>65% of every sale, shown on a live dashboard, open to everyone from day one — not an invite-only trickle.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic}>🤝</div>
              <h3>You own your readers</h3>
              <p>Keep your followers — and actually see them, in a private subscriber list on your dashboard. Never a marketplace that quietly owns your audience.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic}>🌙</div>
              <h3>Calm, not a casino</h3>
              <p>A quiet, curated place to read — no doomscroll, no ads, just the next good story.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className={`${s.band} ${s.sky}`} style={{ scrollMarginTop: 70 }}>
        <div className={s.wrap}>
          <div className={s.secHead}>
            <span className={s.eyebrow}>Discover</span>
            <h2>Find your next favorite book.</h2>
            <p>Browse the catalog, preview any book, and let honest reviews point the way — then read free with a free account.</p>
          </div>
          <div className={s.cards}>
            <div className={s.fcard}>
              <div className={s.ic}>🔍</div>
              <h3>Search &amp; shelves</h3>
              <p>Search every title and author, filter by genre, and browse curated shelves — with a “readers also read” shelf on every book.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic}>⭐</div>
              <h3>Reviews &amp; ratings</h3>
              <p>Star ratings and honest reader reviews on every book, so you know what&apos;s worth your evening before you start.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic}>📖</div>
              <h3>Read it, then keep it</h3>
              <p>A calm, page-turning reader — themes, type size, and your place kept on any device. A reading companion you can name helps with tricky words and synonyms, and you can download your own EPUB to read offline.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic}>🫶</div>
              <h3>A calm community</h3>
              <p>Share what you&apos;re reading, follow the authors you love, and swap thoughts in a newest-first community feed — no algorithm, no doomscroll, just readers and writers.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="interactive" className={`${s.band} ${s.peach}`} style={{ scrollMarginTop: 70 }}>
        <div className={s.wrap}>
          <div className={s.secHead}>
            <span className={s.eyebrow}>Interactive</span>
            <h2>Choose-your-path storybooks.</h2>
            <p>Every choice bends the tale — branching endings, and a paragraph comment tray with likes, replies and author pins that reads like your group chat.</p>
          </div>
          <div className={s.cards}>
            <div className={s.fcard}>
              <div className={s.ic}>🌿</div>
              <h3>Branch the story</h3>
              <p>Tap a choice and the plot forks — try the live demo up in the hero.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic}>💬</div>
              <h3>Talk in the margins</h3>
              <p>Comment on any passage, like or reply to other readers, and watch the author join in — they wear a Creator badge and can pin the best thread.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic}>🔖</div>
              <h3>Never lose your place</h3>
              <p>The reader saves your spot as you go and picks up right where you left off, on any device.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${s.band} ${s.cardBg}`}>
        <div className={s.wrap}>
          <div className={s.secHead} style={{ textAlign: "center", marginInline: "auto" }}>
            <span className={s.eyebrow}>The studio</span>
            <h2>Write anything — from a novel to a comic.</h2>
            <p>A Word-style editor for prose, a free-canvas designer for comics and handcrafted pages, and real branching tools for interactive stories.</p>
          </div>
          <div className={s.cards}>
            <div className={s.fcard}>
              <div className={s.ic}>✍️</div>
              <h3>A real writing editor</h3>
              <p>Headings, images, callouts and shapes — lay your story out the way you picture it, then publish in a click.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic}>🎨</div>
              <h3>Comics &amp; handcrafted pages</h3>
              <p>Drop art, text and panels anywhere on a page and arrange them by hand — not just walls of text.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic}>🌿</div>
              <h3>Branching stories</h3>
              <p>Build choose-your-path tales with real forks and multiple endings — no code required.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="creators" className={`${s.band} ${s.peach}`} style={{ scrollMarginTop: 70 }}>
        <div className={`${s.wrap} ${s.earn}`}>
          <div>
            <span className={s.eyebrow}>For creators</span>
            <div className={s.big}>
              65%<small>Yours on every sale</small>
            </div>
            <p className={s.sub} style={{ marginTop: "1.2rem", maxWidth: "40ch" }}>
              Sell books, interactive stories and digital products — keep the
              majority, and see who&apos;s actually reading you.
            </p>
            <a className={`${s.btn} ${s.btnGold} ${s.btnLg}`} href="/onboarding" style={{ marginTop: "1.3rem" }}>
              Start creating
            </a>
          </div>
          <div className={s.steps}>
            <div className={s.step}>
              <b>1</b>
              <span>
                <strong>Write</strong> — draft prose, comics or choose-your-path stories in the studio, or paste your manuscript.
              </span>
            </div>
            <div className={s.step}>
              <b>2</b>
              <span>
                <strong>Sell more than books</strong> — add templates, audio, downloads, video &amp; courses as digital products, free or premium.
              </span>
            </div>
            <div className={s.step}>
              <b>3</b>
              <span>
                <strong>Publish</strong> — it goes live instantly. Keep 65%; withdraw once you join the Library Partnership Program.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className={`${s.band} ${s.finalCta}`}>
        <div className={s.wrap}>
          <h2>Your next favorite read is waiting.</h2>
          <a className={`${s.btn} ${s.btnGold} ${s.btnLg}`} href="/onboarding">
            Start reading free
          </a>
          <div style={{ marginTop: "1rem" }}>
            <a href="/waitlist" className="fx" style={{ color: "var(--gold)", fontFamily: "var(--sans)", fontSize: "0.95rem" }}>
              Not ready yet? Join the early-access waitlist →
            </a>
          </div>
        </div>
      </section>

      <footer className={s.footer}>
        <div className={s.wrap}>
          <div className={s.footGrid}>
            <div>
              <div className={s.footLogo}>
                Libry<span>.</span>
              </div>
              <p className={s.footTag}>Stories worth lingering in.</p>
              <div className={s.footSocial}>
                <a href="https://www.youtube.com/@officially_libry" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.8-1.8C19.3 5 12 5 12 5s-7.3 0-8.8.5A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.8 1.8C4.7 19 12 19 12 19s7.3 0 8.8-.5a2.5 2.5 0 0 0 1.8-1.8C23 15.2 23 12 23 12zM9.8 15.3V8.7l5.7 3.3z" /></svg>
                </a>
                <a href="https://x.com/officially_libry" target="_blank" rel="noopener noreferrer" aria-label="X">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.2 2h3.3l-7.2 8.3L23 22h-6.6l-5.2-6.8L5.3 22H2l7.7-8.8L1.5 2h6.8l4.7 6.2zm-1.2 18h1.8L7.1 3.9H5.2z" /></svg>
                </a>
                <a href="https://www.instagram.com/officially_libry" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
                </a>
                <a href="https://www.tiktok.com/@officially_libry" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.3 2.1 1.6 3.7 3.7 4.1v2.7c-1.4 0-2.7-.4-3.7-1.1v5.9a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.8a2.8 2.8 0 1 0 2 2.7V3z" /></svg>
                </a>
              </div>
            </div>
            <div>
              <h4>Read</h4>
              <a className="fx" href="/catalog">Browse the catalog</a>
              <a className="fx" href="/unlimited">Libry Unlimited</a>
              <a className="fx" href="/discover?filter=free">Free to read</a>
              <a className="fx" href="/discover?filter=interactive">Interactive stories</a>
              <a className="fx" href="/my-library">My Library</a>
            </div>
            <div>
              <h4>Write</h4>
              <a className="fx" href="/creator">Become a creator</a>
              <a className="fx" href="/creator-hub/docs?tab=guidelines">Publishing guidelines</a>
              <a className="fx" href="/creator-hub/docs?tab=analytics">Creator Hub</a>
            </div>
            <div>
              <h4>Legal</h4>
              <a className="fx" href="/terms">Terms of Service</a>
              <a className="fx" href="/privacy">Privacy Policy</a>
              <a className="fx" href="/cookies">Cookie Policy</a>
              <a className="fx" href="/refunds">Refund Policy</a>
            </div>
          </div>

          <div className={s.footBar}>
            <span>© 2026 Libry. Operated by Craft &amp; Anchor [registered legal name], [registered address].</span>
            <span>Crafted with care for readers &amp; writers.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
