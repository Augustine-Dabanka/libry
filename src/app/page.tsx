import { redirect } from "next/navigation";
import SocialIcons from "@/components/SocialIcons";
import { operatorLine } from "@/lib/legal";
import { createClient } from "@/lib/supabase/server";
import StoryChoiceDemo from "@/components/StoryChoiceDemo";
import CommunityCover from "@/components/CommunityCover";
import Icon from "@/components/Icon";
import MovingShelf from "@/components/MovingShelf";
import { allowedRatings } from "@/lib/content";
import { type Book } from "@/lib/types";
import s from "./landing.module.css";
import PreviewClip from "@/components/PreviewClip";
import LandingThemeToggle from "@/components/LandingThemeToggle";

// Public marketing landing. Signed-in users are sent straight to their app home.
export default async function Landing() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/home");

  // Real, DB-derived platform figures — never hardcode counts (spec §22/§23).
  let freeCount = 0;
  let publishedCount = 0;
  {
    const pub = await supabase.from("books").select("id", { count: "exact", head: true }).eq("is_published", true);
    publishedCount = pub.count ?? 0;
    const free = await supabase.from("books").select("id", { count: "exact", head: true }).eq("is_published", true).or("price.is.null,price.lte.0");
    freeCount = free.count ?? 0;
  }

  // Free, all-ages books for the moving shelf (guests can open any of them).
  let shelf: Book[] = [];
  {
    const { data } = await supabase
      .from("books")
      .select("id, title, author, price, type, is_free, age_rating, rating, category, cover_url")
      .eq("is_published", true)
      .in("age_rating", allowedRatings(false))
      .or("price.is.null,price.lte.0")
      .order("rating", { ascending: false })
      .limit(14);
    if (data) shelf = data as Book[];
  }

  // Popular communities for the marketing showcase (public read).
  type Comm = { id: number; slug: string; name: string; description: string | null; emoji: string | null; cover_url: string | null; member_count: number };
  let communities: Comm[] = [];
  {
    const { data } = await supabase
      .from("communities")
      .select("id, slug, name, description, emoji, cover_url, member_count, is_official")
      .order("is_official", { ascending: false })
      .order("member_count", { ascending: false })
      .limit(4);
    if (data) communities = data as Comm[];
  }

  return (
    <div className={s.page}>
      <div className={s.topbar}>
        <b>Lybry is live in early access</b> — reading is free to start.{" "}
        <a href="/onboarding">Create your free account →</a>
      </div>

      <nav className={s.nav}>
        <div className={s.navIn}>
          <a href="/" className={s.logo}>
            Lybry<span>.</span>
          </a>
          <div className={s.navLinks}>
            <a href="#features">Features</a>
            <a href="#interactive">Interactive</a>
            <a href="#creators">Creators</a>
            <a href="/unlimited">Unlimited</a>
            <a href="#communities">Communities</a>
            <a href="#comics">Comics</a>
          </div>
          <div className={s.navRight}>
            <LandingThemeToggle />
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
              Lybry is the home of interactive stories, creator voices, and
              communities that keep the story going — where readers come first
              and creators keep 65%.
            </p>
            <div className={s.heroCta} style={{ marginTop: "1.7rem" }}>
              <a className={`${s.btn} ${s.btnGold} ${s.btnLg}`} href="/onboarding">
                Start your story
              </a>
              <a className={`${s.btn} ${s.btnGhost} ${s.btnLg}`} href="#preview">
                ▶ See how it works
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
          {freeCount > 0 ? (
            <div className={s.trustItem}>
              <b>{freeCount.toLocaleString()}</b> free {freeCount === 1 ? "book" : "books"} to read
            </div>
          ) : null}
          {publishedCount > 0 ? (
            <div className={s.trustItem}>
              <b>{publishedCount.toLocaleString()}</b> stories &amp; counting
            </div>
          ) : null}
          <div className={s.trustItem}>Interactive, choose-your-path stories</div>
        </div>
      </div>

      {/* Try before you sign up: 15 seconds of the real app. */}
      <section id="preview" className={s.band} style={{ scrollMarginTop: 70 }}>
        <div className={`${s.wrap} ${s.earn}`}>
          <div className={s.secHead} style={{ marginBottom: 0 }}>
            <span className={s.eyebrow}>See it first</span>
            <h2>Lybry in 15 seconds.</h2>
            <p>Pick what you like, make your bushbaby, start reading. No account needed for the first two.</p>
            <ul style={{ margin: "1.1rem 0 0", paddingLeft: "1.1rem", display: "grid", gap: "0.45rem", color: "var(--body)", fontWeight: 600 }}>
              <li>A real free sample of every book, at least 2,500 words.</li>
              <li>Interactive stories where your choices change the ending.</li>
              <li>Unlimited free for 7 days. No card.</li>
            </ul>
            <a className={`${s.btn} ${s.btnGold} ${s.btnLg}`} href="/onboarding" style={{ marginTop: "1.3rem" }}>Try it now</a>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <PreviewClip />
          </div>
        </div>
      </section>

      {shelf.length >= 4 ? (
        <section className={s.band} aria-label="Free books">
          <div className={s.wrap}>
            <div className={s.secHead} style={{ marginBottom: "1.4rem" }}>
              <span className={s.eyebrow}>Free to read</span>
              <h2 style={{ margin: "0.4rem 0 0" }}>Open any of these tonight.</h2>
            </div>
            <MovingShelf books={shelf} />
          </div>
        </section>
      ) : null}

      {/* Explore rail: Unlimited + Comics + Interactive as cover-topped cards */}
      <section id="comics" className={s.band} style={{ scrollMarginTop: 70 }}>
        <div className={s.wrap}>
          <div className={s.secHead} style={{ marginBottom: "1.4rem" }}>
            <span className={s.eyebrow}>Explore Lybry</span>
            <h2 style={{ margin: "0.4rem 0 0" }}>More than books.</h2>
          </div>
          <div className={s.exploreGrid}>
            <a href="/unlimited" className={s.xcard}>
              <div className={s.xcover} style={{ background: "#FDEDE5", color: "#C8471F" }}>
                <span className={s.xemoji}><Icon name="book" size={48} strokeWidth={1.4} /></span>
                <span className={s.xtag}>Unlimited</span>
              </div>
              <div className={s.xbody}>
                <h3>Lybry Unlimited</h3>
                <p>Keep a set number of books every month for one price. Try it free first. It never renews by itself.</p>
                <span className={s.xlink}>See the plans →</span>
              </div>
            </a>
            <a href="/comics" className={s.xcard}>
              <div className={s.xcover} style={{ background: "#E6F0EC", color: "#2F6B5E" }}>
                <span className={s.xemoji}><Icon name="comics" size={48} strokeWidth={1.4} /></span>
                <span className={s.xtag}>Comics</span>
              </div>
              <div className={s.xbody}>
                <h3>Comics</h3>
                <p>Visual stories, infinite worlds. Read panel by panel, or all at once.</p>
                <span className={s.xlink}>Explore comics →</span>
              </div>
            </a>
            <a href="/catalog?type=Interactive" className={s.xcard}>
              <div className={s.xcover} style={{ background: "#FBF0D9", color: "#8A5A00" }}>
                <span className={s.xemoji}><Icon name="interactive" size={48} strokeWidth={1.4} /></span>
                <span className={s.xtag}>Interactive</span>
              </div>
              <div className={s.xbody}>
                <h3>Interactive stories</h3>
                <p>Choose-your-path tales that branch with every decision — and end differently for everyone.</p>
                <span className={s.xlink}>Start a path →</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {communities.length > 0 ? (
        <section id="communities" className={`${s.band} ${s.cardBg}`} style={{ scrollMarginTop: 70 }}>
          <div className={s.wrap}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "1rem", marginBottom: "1.4rem" }}>
              <div>
                <span className={s.eyebrow}>Find your people</span>
                <h2 style={{ margin: "0.4rem 0 0" }}>Communities that keep the story going.</h2>
              </div>
              <a href="/communities" style={{ color: "var(--gold)", fontFamily: "var(--sans)", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>View all →</a>
            </div>
            <div className={s.commGrid}>
              {communities.map((c) => (
                <a key={c.id} href={`/c/${c.slug}`} className={s.commCard}>
                  <div className={s.commCover}>
                    <CommunityCover name={c.name} emoji={c.emoji} coverUrl={c.cover_url} />
                  </div>
                  <div className={s.commBody}>
                    <div className={s.commName}>{c.name}</div>
                    {c.description ? <p className={s.commDesc}>{c.description}</p> : null}
                    {/* Small counts read as empty rooms: show the number only from 25 members. */}
                    <div className={s.commMeta}>{c.member_count >= 25 ? <><Icon name="members" size={15} /> {c.member_count.toLocaleString()} members</> : "New community, join early"}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className={`${s.band} ${s.cardBg}`}>
        <div className={s.wrap}>
          <div className={s.secHead} style={{ textAlign: "center", marginInline: "auto" }}>
            <span className={s.eyebrow}>Why Lybry</span>
            <h2>The bookstore that actually pays its writers.</h2>
            <p>Big platforms treat readers like a feed and writers like inventory. We built the opposite.</p>
          </div>
          <div className={s.cards}>
            <div className={s.fcard}>
              <div className={s.ic} style={{ color: "var(--gold)" }}><Icon name="coins" size={24} /></div>
              <h3>Writers get paid, openly</h3>
              <p>65% of every sale, shown on a live dashboard, open to everyone from day one — not an invite-only trickle.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic} style={{ color: "var(--gold)" }}><Icon name="members" size={24} /></div>
              <h3>You own your readers</h3>
              <p>Keep your followers — and actually see them, in a private subscriber list on your dashboard. Never a marketplace that quietly owns your audience.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic} style={{ color: "var(--gold)" }}><Icon name="calm" size={24} /></div>
              <h3>Calm, not a casino</h3>
              <p>A quiet, curated place to read — no doomscroll, and no ads unless you choose to watch one for coins. Just the next good story.</p>
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
              <div className={s.ic} style={{ color: "var(--gold)" }}><Icon name="search" size={24} /></div>
              <h3>Search &amp; shelves</h3>
              <p>Search every title and author, filter by genre, and browse curated shelves — with a “readers also read” shelf on every book.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic} style={{ color: "var(--gold)" }}><Icon name="star" size={24} /></div>
              <h3>Reviews &amp; ratings</h3>
              <p>Star ratings and honest reader reviews on every book, so you know what&apos;s worth your evening before you start.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic} style={{ color: "var(--gold)" }}><Icon name="read" size={24} /></div>
              <h3>Read it, then keep it</h3>
              <p>A calm, page-turning reader — themes, type size, and your place kept on any device. A reading companion you can name helps with tricky words and synonyms, and you can download your own EPUB to read offline.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic} style={{ color: "var(--gold)" }}><Icon name="chat" size={24} /></div>
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
              <div className={s.ic} style={{ color: "var(--gold)" }}><Icon name="interactive" size={24} /></div>
              <h3>Branch the story</h3>
              <p>Tap a choice and the plot forks — try the live demo up in the hero.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic} style={{ color: "var(--gold)" }}><Icon name="chat" size={24} /></div>
              <h3>Talk in the margins</h3>
              <p>Comment on any passage, like or reply to other readers, and watch the author join in — they wear a Creator badge and can pin the best thread.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic} style={{ color: "var(--gold)" }}><Icon name="save" size={24} /></div>
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
              <div className={s.ic} style={{ color: "var(--gold)" }}><Icon name="write" size={24} /></div>
              <h3>A real writing editor</h3>
              <p>Headings, images, callouts and shapes — lay your story out the way you picture it, then publish in a click.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic} style={{ color: "var(--gold)" }}><Icon name="comics" size={24} /></div>
              <h3>Comics &amp; handcrafted pages</h3>
              <p>Drop art, text and panels anywhere on a page and arrange them by hand — not just walls of text.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic} style={{ color: "var(--gold)" }}><Icon name="interactive" size={24} /></div>
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
              Sell books and interactive stories, keep the majority, and see
              who&apos;s actually reading you.
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
                <strong>Set your price</strong> — free, paid, or a free first chapter. You can also include a paid book in Lybry Unlimited.
              </span>
            </div>
            <div className={s.step}>
              <b>3</b>
              <span>
                <strong>Publish</strong> — it goes live instantly. Keep 65%; withdraw once you join the Lybry Partnership Program.
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
        </div>
      </section>

      <footer className={s.footer}>
        <div className={s.wrap}>
          <div className={s.footGrid}>
            <div>
              <div className={s.footLogo}>
                Lybry<span>.</span>
              </div>
              <p className={s.footTag}>Stories worth lingering in.</p>
              <div className={s.news}>
                <span className={s.newsLabel}>Stay in the story</span>
                <p className={s.newsText}>New releases, interactive drops and creator spotlights — a quiet note, now and then.</p>
                <a className={`${s.btn} ${s.btnGold}`} href="/login?auth=signup" style={{ marginTop: "0.7rem" }}>
                  Create an account →
                </a>
              </div>
              <SocialIcons className={s.footSocial} />
            </div>
            <div>
              <h4>Read</h4>
              <a className="fx" href="/catalog">Browse the catalog</a>
              <a className="fx" href="/discover?filter=interactive">Interactive stories</a>
              <a className="fx" href="/discover?filter=free">Free to read</a>
              <a className="fx" href="/unlimited">Premium (Unlimited)</a>
              <a className="fx" href="/my-library">My Library</a>
            </div>
            <div>
              <h4>Create</h4>
              <a className="fx" href="/creator">Become a creator</a>
              <a className="fx" href="/creator/opportunities">Creator opportunities</a>
              <a className="fx" href="/creator-hub/docs?tab=guidelines">Publishing guidelines</a>
              <a className="fx" href="/creator-hub/docs?tab=analytics">Creator Hub</a>
            </div>
            <div>
              <h4>Legal</h4>
              <a className="fx" href="/contact">Contact</a>
              <a className="fx" href="/terms">Terms of Service</a>
              <a className="fx" href="/privacy">Privacy Policy</a>
              <a className="fx" href="/cookies">Cookie Policy</a>
              <a className="fx" href="/refunds">Refund Policy</a>
            </div>
          </div>

          <div className={s.footBar}>
            <span>© 2026 Lybry. Operated by {operatorLine()}.</span>
            <span>Crafted with care for readers &amp; writers.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
