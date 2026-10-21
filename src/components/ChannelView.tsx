"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import BookMini from "@/components/BookMini";
import type { Book } from "@/lib/types";

// A creator's channel: Home · Books · Videos · Reviews · About, with a sort
// menu ("For you" / Newest / Popular / A–Z) like the notebook sketch.
// Videos are linked from YouTube or Vimeo and only load the player when tapped
// (privacy-enhanced YouTube domain, no tracking until you press play).
export type ChannelVideo = { id: number; provider: "youtube" | "vimeo"; video_id: string; title: string; created_at: string };
type Sort = "foryou" | "new" | "popular" | "az";

export function embedUrl(v: Pick<ChannelVideo, "provider" | "video_id">, autoplay = true) {
  return v.provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${v.video_id}?rel=0${autoplay ? "&autoplay=1" : ""}`
    : `https://player.vimeo.com/video/${v.video_id}?dnt=1${autoplay ? "&autoplay=1" : ""}`;
}
function thumb(v: ChannelVideo) {
  return v.provider === "youtube" ? `https://i.ytimg.com/vi/${v.video_id}/hqdefault.jpg` : `https://vumbnail.com/${v.video_id}.jpg`;
}

export function VideoCard({ v }: { v: ChannelVideo }) {
  const [on, setOn] = useState(false);
  return (
    <div className="ch-video">
      {on ? (
        <iframe src={embedUrl(v)} title={v.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" />
      ) : (
        <button type="button" className="ch-thumb" onClick={() => setOn(true)} aria-label={`Play ${v.title}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb(v)} alt="" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <span className="ch-play"><span><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg></span></span>
        </button>
      )}
      <h4>{v.title}</h4>
    </div>
  );
}

export default function ChannelView({ books, videos, reviews, about, isOwner }: { books: Book[]; videos: ChannelVideo[]; reviews: ReactNode; about: ReactNode; isOwner: boolean }) {
  const tabs = useMemo(() => [
    { key: "home", label: "Home" },
    { key: "books", label: `Books${books.length ? ` · ${books.length}` : ""}` },
    { key: "videos", label: `Videos${videos.length ? ` · ${videos.length}` : ""}` },
    { key: "reviews", label: "Reviews" },
    { key: "about", label: "About" },
  ], [books.length, videos.length]);
  const [tab, setTab] = useState("home");
  const [sort, setSort] = useState<Sort>("foryou");
  useEffect(() => { const h = window.location.hash.slice(1); if (tabs.some((t) => t.key === h)) setTab(h); }, [tabs]);
  const go = (k: string) => { setTab(k); try { history.replaceState(null, "", `#${k}`); } catch { /* ignore */ } };

  const sortedBooks = useMemo(() => {
    const b = [...books];
    if (sort === "popular" || sort === "foryou") b.sort((x, y) => Number(y.rating ?? 0) - Number(x.rating ?? 0) || Number(y.id) - Number(x.id));
    if (sort === "new") b.sort((x, y) => Number(y.id) - Number(x.id));
    if (sort === "az") b.sort((x, y) => x.title.localeCompare(y.title));
    return b;
  }, [books, sort]);
  const sortedVideos = useMemo(() => {
    const v = [...videos];
    if (sort === "az") v.sort((x, y) => x.title.localeCompare(y.title));
    else v.sort((x, y) => y.created_at.localeCompare(x.created_at));
    return v;
  }, [videos, sort]);

  const empty = (what: string, cta?: ReactNode) => (
    <div style={{ border: "2px dashed var(--border)", borderRadius: 16, padding: "2.2rem 1.4rem", textAlign: "center", color: "var(--muted)", fontWeight: 700 }}>
      <p style={{ margin: 0 }}>No {what} yet.</p>
      {isOwner && cta ? <div style={{ marginTop: "0.8rem" }}>{cta}</div> : null}
    </div>
  );
  const addVideo = <a className="btn btn-gold" href="/creator#channel">Add a video</a>;
  const sorter = (
    <label style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontWeight: 800, fontSize: "0.85rem", color: "var(--muted)" }}>
      Sort
      <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} style={{ padding: "0.35rem 0.5rem", borderRadius: 10, border: "2px solid var(--edge)", background: "var(--stone)", color: "var(--ivory)", fontWeight: 800 }}>
        <option value="foryou">For you</option>
        <option value="new">Newest</option>
        <option value="popular">Popular</option>
        <option value="az">A–Z</option>
      </select>
    </label>
  );

  return (
    <div>
      <div className="ch-tabs" role="tablist" aria-label="Channel sections">
        {tabs.map((t) => <button key={t.key} type="button" role="tab" className="ch-tab" aria-selected={tab === t.key} onClick={() => go(t.key)}>{t.label}</button>)}
      </div>

      {tab === "home" ? (
        <div style={{ display: "grid", gap: "1.6rem" }}>
          {sortedVideos[0] ? (
            <div>
              <h3 style={{ margin: "0 0 0.7rem" }}>Latest video</h3>
              <div style={{ maxWidth: 640 }}><VideoCard v={sortedVideos[0]} /></div>
            </div>
          ) : null}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "0.7rem" }}>
              <h3 style={{ margin: 0 }}>Books</h3>
              {books.length > 6 ? <button type="button" className="btn btn-outline" onClick={() => go("books")} style={{ padding: "0.35rem 0.9rem" }}>See all</button> : null}
            </div>
            {books.length ? <div className="book-grid-mini">{sortedBooks.slice(0, 6).map((b) => <BookMini key={b.id} book={b} />)}</div> : empty("books", <a className="btn btn-gold" href="/creator">Publish a book</a>)}
          </div>
          {videos.length > 1 ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "0.7rem" }}>
                <h3 style={{ margin: 0 }}>More videos</h3>
                <button type="button" className="btn btn-outline" onClick={() => go("videos")} style={{ padding: "0.35rem 0.9rem" }}>See all</button>
              </div>
              <div className="ch-grid">{sortedVideos.slice(1, 4).map((v) => <VideoCard key={v.id} v={v} />)}</div>
            </div>
          ) : null}
        </div>
      ) : tab === "books" ? (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.8rem" }}>{sorter}</div>
          {books.length ? <div className="book-grid-mini">{sortedBooks.map((b) => <BookMini key={b.id} book={b} />)}</div> : empty("books")}
        </div>
      ) : tab === "videos" ? (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.8rem" }}>{sorter}</div>
          {videos.length ? <div className="ch-grid">{sortedVideos.map((v) => <VideoCard key={v.id} v={v} />)}</div> : empty("videos", addVideo)}
        </div>
      ) : tab === "reviews" ? (
        <div>{reviews}</div>
      ) : (
        <div>{about}</div>
      )}
    </div>
  );
}
