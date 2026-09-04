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
              A calm, curated bookstore with interactive, choose-your-path stories —
              where readers come first and writers keep 70%.
            </p>
            <div className={s.heroCta} style={{ marginTop: "1.7rem" }}>
              <a className={`${s.btn} ${s.btnGold} ${s.btnLg}`} href="/onboarding">
                Start Reading Free
              </a>
              <a className={`${s.btn} ${s.btnGhost} ${s.btnLg}`} href="/onboarding?intent=creator">
                Publish Your Story
              </a>
            </div>
            <div className={s.heroNote}>
              <span className={s.dot} /> Free to start · 70% to creators · no card required
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
            <b>70%</b> to creators
          </div>
          <div className={s.trustItem}>
            <b>5</b> languages
          </div>
          <div className={s.trustItem}>Read-aloud on every book</div>
          <div className={s.trustItem}>Free — no card required</div>
        </div>
      </div>

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
              <p>70% of every sale, shown on a live dashboard, open to everyone from day one — not an invite-only trickle.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic}>🤝</div>
              <h3>You own your readers</h3>
              <p>Followers and reader relationships you keep — never a marketplace that quietly owns your audience.</p>
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
            <span className={s.eyebrow}>Features</span>
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

      <section id="interactive" className={`${s.band} ${s.peach}`} style={{ scrollMarginTop: 70 }}>
        <div className={s.wrap}>
          <div className={s.secHead}>
            <span className={s.eyebrow}>Interactive</span>
            <h2>Choose-your-path storybooks.</h2>
            <p>Every choice bends the tale — branching endings, paragraph reactions, and a comments tray that reads like your group chat.</p>
          </div>
          <div className={s.cards}>
            <div className={s.fcard}>
              <div className={s.ic}>🌿</div>
              <h3>Branch the story</h3>
              <p>Tap a choice and the plot forks — try the live demo up in the hero.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic}>💬</div>
              <h3>React in the margins</h3>
              <p>Drop reactions on any paragraph and argue about the twist with other readers.</p>
            </div>
            <div className={s.fcard}>
              <div className={s.ic}>🎧</div>
              <h3>Read or listen</h3>
              <p>Every book has read-aloud, so your story travels with you.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${s.band} ${s.peach}`}>
        <div className={s.wrap}>
          <div className={s.secHead} style={{ textAlign: "center", marginInline: "auto" }}>
            <span className={s.eyebrow}>Reader discussions</span>
            <h2>A comments section better than your group chat.</h2>
          </div>
          <div className={s.cards}>
            {[
              { a: "M", c: "#B4547A", u: "@mara_reads", t: "chapter 12 WRECKED me 😭 the branching ending got me", h: 214 },
              { a: "K", c: "#4E7A8C", u: "@keys", t: "read-aloud at 1am = perfect. what is this app 🥹", h: 176 },
              { a: "S", c: "#4E7A52", u: "@softreads", t: "the choices actually change the plot?? obsessed", h: 240 },
            ].map((x) => (
              <div key={x.u} className={s.fcard} style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start" }}>
                <span style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", color: "#fff", fontWeight: 800, background: x.c }}>
                  {x.a}
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ fontWeight: 800, fontSize: "0.85rem", display: "block", color: "var(--ink)" }}>{x.u}</span>
                  <span style={{ fontSize: "0.9rem", color: "var(--body)" }}>{x.t}</span>
                </span>
                <span style={{ color: "var(--terra-soft, #D2793B)", fontWeight: 700, fontSize: "0.78rem", textAlign: "center", flexShrink: 0 }}>
                  ♥<br />
                  {x.h}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="creators" className={`${s.band} ${s.cardBg}`} style={{ scrollMarginTop: 70 }}>
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
              <a className="fx" href="/docs?tab=terms">Terms of Service</a>
              <a className="fx" href="/docs?tab=privacy">Privacy Policy</a>
              <a className="fx" href="/docs?tab=guidelines">Guidelines</a>
            </div>
          </div>
          <div className={s.footBar}>
            <span>© 2026 Libry. All rights reserved.</span>
            <span>Crafted with care for readers &amp; writers.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
