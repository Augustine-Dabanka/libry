import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import s from "./landing.module.css";

// Public marketing landing. Signed-in users are sent straight to their app home.
export default async function Landing() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/home");

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
            <a href="/catalog">Browse</a>
            <a href="/onboarding">For creators</a>
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
              Curated books and interactive, choose-your-path storybooks — with a
              comments section better than your group chat.
            </p>
            <form action="/catalog" method="get" className={s.heroSearch} role="search">
              <input name="q" placeholder="Try a title, author, or “interactive”…" aria-label="Search stories" />
              <button type="submit" className={`${s.btn} ${s.btnGold}`}>
                Search
              </button>
            </form>
            <div className={s.heroCta}>
              <a className={`${s.btn} ${s.btnGold} ${s.btnLg}`} href="/onboarding">
                Start reading free
              </a>
              <a className={`${s.btn} ${s.btnGhost} ${s.btnLg}`} href="/onboarding">
                Publish your book
              </a>
            </div>
            <div className={s.heroNote}>
              <span className={s.dot} /> Free to start · 70% to creators · no card required
            </div>
          </div>

          <div className={s.heroArt} aria-hidden="true">
            <div className={`${s.artCover} ${s.ac1}`}>
              <span className="ct">The Forgotten Forest</span>
              <span className="ca">Elena Marsh</span>
            </div>
            <div className={`${s.artCover} ${s.ac2}`}>
              <span className="ct">Letters from the Moon</span>
              <span className="ca">Libry Originals</span>
            </div>
            <div className={`${s.artCover} ${s.ac3}`}>
              <span className="ct">Ocean Secrets</span>
              <span className="ca">M. Awuah</span>
            </div>
          </div>
        </div>
      </header>

      <div className={s.trust}>
        <div className={`${s.wrap} ${s.trustIn}`}>
          <div className={s.trustItem}>
            <b>70%</b> to creators
          </div>
          <div className={s.trustItem}>
            <b>5</b> languages
          </div>
          <div className={s.trustItem}>Read-aloud on every book</div>
          <div className={s.trustItem}>Free — no card required</div>
        </div>
      </div>

      <section className={`${s.band} ${s.sky}`}>
        <div className={s.wrap}>
          <div className={s.secHead}>
            <span className={s.eyebrow}>Why Libry</span>
            <h2>Reading, but social.</h2>
            <p>A shelf that learns your taste, streaks that keep you turning pages, and a comment tray on every chapter.</p>
          </div>
          <div className={s.cards}>
            <div className={s.fcard}>
              <div className={s.ic}>🌿</div>
              <h3>Curated shelf</h3>
              <p>A playful onboarding learns your taste, then lays out a shelf that fits — from question one.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic}>🔥</div>
              <h3>Streaks &amp; badges</h3>
              <p>Daily reading streaks, XP, and post-read challenges make finishing a book feel like a win.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic}>🎧</div>
              <h3>Read-aloud</h3>
              <p>Any book becomes an audiobook — plus creator narration, in five languages.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${s.band} ${s.cardBg}`}>
        <div className={`${s.wrap} ${s.earn}`}>
          <div>
            <span className={s.eyebrow}>For creators</span>
            <div className={s.big}>
              70%<small>Yours on every sale</small>
            </div>
            <p className={s.sub} style={{ marginTop: "1.2rem", maxWidth: "40ch" }}>
              Publish in minutes, keep the majority, and see who&apos;s actually reading you.
            </p>
            <a className={`${s.btn} ${s.btnGold} ${s.btnLg}`} href="/onboarding" style={{ marginTop: "1.3rem" }}>
              Publish your book
            </a>
          </div>
          <div className={s.steps}>
            <div className={s.step}>
              <b>1</b>
              <span>
                <strong>Write</strong> — draft your story right in the editor, or paste your manuscript.
              </span>
            </div>
            <div className={s.step}>
              <b>2</b>
              <span>
                <strong>Set</strong> — free or premium, pick a type, add a cover.
              </span>
            </div>
            <div className={s.step}>
              <b>3</b>
              <span>
                <strong>Publish</strong> — it goes live in the catalog instantly. Keep 70%, always.
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
                Libry<span>.</span>
              </div>
              <p className={s.footTag}>Stories worth lingering in.</p>
            </div>
            <div>
              <h4>Discover</h4>
              <a className="fx" href="/catalog">Explore</a>
              <a className="fx" href="/discover?filter=editors-pick">Editor&apos;s Pick</a>
              <a className="fx" href="/discover?filter=free">Free reads</a>
              <a className="fx" href="/discover?filter=interactive">Interactive</a>
            </div>
            <div>
              <h4>Create</h4>
              <a className="fx" href="/onboarding">Publish &amp; earn 70%</a>
              <a className="fx" href="/royalty-calculator">Royalty Calculator</a>
              <a className="fx" href="/creator-hub/docs?tab=api">Publishing API</a>
              <a className="fx" href="/creator-hub/docs?tab=analytics">Creator Hub</a>
            </div>
            <div>
              <h4>Legal</h4>
              <a className="fx" href="/docs?tab=terms">Terms of Service</a>
              <a className="fx" href="/docs?tab=privacy">Privacy Policy</a>
              <a className="fx" href="/docs?tab=guidelines">Guidelines</a>
            </div>
          </div>
          <div className={s.footBar}>
            <span>© 2026 Libry. All rights reserved.</span>
            <span>Crafted with care for readers &amp; writers</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
