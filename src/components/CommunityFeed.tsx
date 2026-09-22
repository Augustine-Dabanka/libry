"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Post = { id: number; user_id: string; author_name: string | null; body: string; image_url?: string | null; created_at: string; likes: number; liked: boolean; comments: number };
type Comment = { id: number; post_id: number; user_id: string; author_name: string | null; body: string; created_at: string };
type Meta = { creator: boolean; avatar: string | null };

function timeAgo(iso: string): string {
  const d = (Date.now() - +new Date(iso)) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  if (d < 604800) return `${Math.floor(d / 86400)}d`;
  return new Date(iso).toLocaleDateString();
}

export default function CommunityFeed({ userId, userName, avatarUrl, communityId = null, channel = "general", canPost = true }: { userId: string; userName: string; avatarUrl: string | null; communityId?: number | null; channel?: string; canPost?: boolean }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [meta, setMeta] = useState<Map<string, Meta>>(new Map());
  const [draft, setDraft] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imgBusy, setImgBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false); // migration not run
  const [expanded, setExpanded] = useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [cDraft, setCDraft] = useState("");
  const [cBusy, setCBusy] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    let q = supabase.from("community_posts").select("id, user_id, author_name, body, image_url, created_at").order("created_at", { ascending: false }).limit(50);
    q = communityId == null ? q.is("community_id", null) : q.eq("community_id", communityId).eq("channel", channel);
    let p = await q;
    // Pre-migration fallback (no community_id/image_url columns yet).
    if (p.error) {
      p = (await supabase.from("community_posts").select("id, user_id, author_name, body, created_at").order("created_at", { ascending: false }).limit(50)) as typeof p;
      if (p.error) { setPending(true); setLoaded(true); return; }
    }
    const rows = (p.data ?? []) as Omit<Post, "likes" | "liked" | "comments">[];
    const ids = rows.map((r) => r.id);
    const likeCount = new Map<number, number>();
    const liked = new Set<number>();
    const commentCount = new Map<number, number>();
    if (ids.length) {
      const [lk, cm] = await Promise.all([
        supabase.from("community_post_likes").select("post_id, user_id").in("post_id", ids),
        supabase.from("community_comments").select("post_id").in("post_id", ids),
      ]);
      for (const r of (lk.data ?? []) as { post_id: number; user_id: string }[]) {
        likeCount.set(r.post_id, (likeCount.get(r.post_id) ?? 0) + 1);
        if (r.user_id === userId) liked.add(r.post_id);
      }
      for (const r of (cm.data ?? []) as { post_id: number }[]) commentCount.set(r.post_id, (commentCount.get(r.post_id) ?? 0) + 1);
    }
    const uids = [...new Set(rows.map((r) => r.user_id))];
    const m = new Map<string, Meta>();
    if (uids.length) {
      const pr = await supabase.from("profiles").select("id, is_creator, avatar_url").in("id", uids);
      for (const r of (pr.data ?? []) as { id: string; is_creator?: boolean; avatar_url?: string | null }[]) m.set(r.id, { creator: !!r.is_creator, avatar: r.avatar_url ?? null });
    }
    setMeta(m);
    setPosts(rows.map((r) => ({ ...r, likes: likeCount.get(r.id) ?? 0, liked: liked.has(r.id), comments: commentCount.get(r.id) ?? 0 })));
    setLoaded(true);
  }, [userId, communityId, channel]);

  useEffect(() => { load(); }, [load]);

  // Live feed: new posts appear without a refresh (Supabase Realtime). RLS still
  // gates delivery, so a client only receives posts it may read. Scoped to a
  // specific community/channel; the global feed stays on load-only.
  useEffect(() => {
    if (communityId == null) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`community-${communityId}-${channel}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_posts", filter: `community_id=eq.${communityId}` },
        async (payload) => {
          const row = payload.new as { id: number; user_id: string; author_name: string | null; body: string; image_url?: string | null; created_at: string; channel?: string };
          if (row.channel && row.channel !== channel) return;
          setPosts((prev) => (prev.some((p) => p.id === row.id) ? prev : [{ id: row.id, user_id: row.user_id, author_name: row.author_name, body: row.body, image_url: row.image_url ?? null, created_at: row.created_at, likes: 0, liked: false, comments: 0 }, ...prev]));
          const pr = await supabase.from("profiles").select("id, is_creator, avatar_url").eq("id", row.user_id).maybeSingle();
          const data = pr.data as { is_creator?: boolean; avatar_url?: string | null } | null;
          if (data) setMeta((m) => new Map(m).set(row.user_id, { creator: !!data.is_creator, avatar: data.avatar_url ?? null }));
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [communityId, channel]);

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setImgBusy(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `community/${userId}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("book-media").upload(path, file, { contentType: file.type, upsert: true });
      if (!up.error) setImage(supabase.storage.from("book-media").getPublicUrl(path).data.publicUrl);
    } catch { /* ignore */ }
    setImgBusy(false);
  }

  async function submitPost() {
    const body = draft.trim();
    if (!body && !image) return;
    setBusy(true);
    const supabase = createClient();
    const row: Record<string, unknown> = { user_id: userId, author_name: userName, body: body || "" };
    if (communityId != null) { row.community_id = communityId; row.channel = channel; }
    if (image) row.image_url = image;
    let res = await supabase.from("community_posts").insert(row).select("id, user_id, author_name, body, image_url, created_at").single();
    if (res.error) res = await supabase.from("community_posts").insert({ user_id: userId, author_name: userName, body: body || "" }).select("id, user_id, author_name, body, image_url, created_at").single();
    setBusy(false);
    if (res.error || !res.data) return;
    setDraft("");
    setImage(null);
    setPosts((prev) => [{ ...(res.data as Omit<Post, "likes" | "liked" | "comments">), likes: 0, liked: false, comments: 0 }, ...prev]);
    setMeta((prev) => { const n = new Map(prev); if (!n.has(userId)) n.set(userId, { creator: false, avatar: avatarUrl }); return n; });
  }

  async function toggleLike(post: Post) {
    const supabase = createClient();
    const liked = !post.liked;
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, liked, likes: p.likes + (liked ? 1 : -1) } : p)));
    try {
      if (liked) await supabase.from("community_post_likes").upsert({ post_id: post.id, user_id: userId }, { onConflict: "post_id,user_id" });
      else await supabase.from("community_post_likes").delete().eq("post_id", post.id).eq("user_id", userId);
    } catch { /* ignore — optimistic */ }
  }

  async function deletePost(id: number) {
    const supabase = createClient();
    setPosts((prev) => prev.filter((p) => p.id !== id));
    if (expanded === id) setExpanded(null);
    await supabase.from("community_posts").delete().eq("id", id);
  }

  async function openComments(id: number) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    setComments([]);
    setCDraft("");
    const supabase = createClient();
    const c = await supabase.from("community_comments").select("id, post_id, user_id, author_name, body, created_at").eq("post_id", id).order("created_at", { ascending: true });
    if (!c.error) setComments((c.data ?? []) as Comment[]);
  }

  async function submitComment(postId: number) {
    const body = cDraft.trim();
    if (!body) return;
    setCBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("community_comments").insert({ post_id: postId, user_id: userId, author_name: userName, body }).select("id, post_id, user_id, author_name, body, created_at").single();
    setCBusy(false);
    if (error || !data) return;
    setCDraft("");
    setComments((prev) => [...prev, data as Comment]);
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p)));
  }

  async function deleteComment(c: Comment) {
    const supabase = createClient();
    setComments((prev) => prev.filter((x) => x.id !== c.id));
    setPosts((prev) => prev.map((p) => (p.id === c.post_id ? { ...p, comments: Math.max(0, p.comments - 1) } : p)));
    await supabase.from("community_comments").delete().eq("id", c.id);
  }

  const Avatar = ({ uid, name }: { uid: string; name: string | null }) => {
    const a = meta.get(uid)?.avatar;
    return a ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={a} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
    ) : (
      <span style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--gold)", color: "#20180a", display: "grid", placeItems: "center", fontFamily: "var(--sans)", fontWeight: 800, flexShrink: 0 }}>{(name?.[0] || "?").toUpperCase()}</span>
    );
  };

  const ta: React.CSSProperties = { width: "100%", boxSizing: "border-box", resize: "vertical", padding: "0.7rem 0.85rem", background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.95rem", outline: "none" };

  return (
    <div>
      {/* composer */}
      {canPost ? (
        <div style={{ display: "flex", gap: "0.8rem", background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "1rem 1.1rem", marginBottom: "1.6rem" }}>
          <Avatar uid={userId} name={userName} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={pending ? "Community is being set up…" : "Share something…"} maxLength={1000} disabled={pending} style={{ ...ta, minHeight: 66 }} />
            {image ? (
              <div style={{ position: "relative", marginTop: "0.6rem", display: "inline-block" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" style={{ maxHeight: 160, borderRadius: 10, border: "1px solid var(--border)" }} />
                <button type="button" onClick={() => setImage(null)} aria-label="Remove image" style={{ position: "absolute", top: 6, right: 6, background: "rgba(18,16,14,0.8)", color: "#fff", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
              </div>
            ) : null}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.6rem", gap: "0.6rem" }}>
              <label style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.82rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                🖼 {imgBusy ? "Uploading…" : "Photo"}
                <input type="file" accept="image/*" onChange={uploadImage} style={{ display: "none" }} disabled={pending || imgBusy} />
              </label>
              <button type="button" onClick={submitPost} disabled={busy || pending || imgBusy || (!draft.trim() && !image)} className="btn btn-gold" style={{ opacity: busy || pending || (!draft.trim() && !image) ? 0.6 : 1 }}>{busy ? "Posting…" : "Post"}</button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "1rem 1.2rem", marginBottom: "1.6rem", textAlign: "center", color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem" }}>
          Join this community to post.
        </div>
      )}

      {pending ? (
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", textAlign: "center", padding: "2rem 1rem" }}>
          The community feed goes live once its migration is applied. Check back soon.
        </p>
      ) : !loaded ? (
        <p style={{ color: "var(--muted)", textAlign: "center", padding: "2rem" }}>Loading…</p>
      ) : posts.length === 0 ? (
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", textAlign: "center", padding: "2rem 1rem" }}>
          No posts yet. Be the first to say what you&apos;re reading.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {posts.map((p) => {
            const m = meta.get(p.user_id);
            return (
              <div key={p.id} style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.1rem 1.2rem" }}>
                <div style={{ display: "flex", gap: "0.8rem" }}>
                  <Avatar uid={p.user_id} name={p.author_name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "var(--sans)", fontWeight: 700, color: "var(--ivory)" }}>{p.author_name || "Reader"}</span>
                      {m?.creator ? <span style={{ fontFamily: "var(--sans)", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#12100E", background: "var(--gold)", borderRadius: 999, padding: "0.1rem 0.45rem" }}>Creator</span> : null}
                      <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.8rem" }}>· {timeAgo(p.created_at)}</span>
                    </div>
                    {p.body ? <p style={{ fontFamily: "var(--sans)", fontSize: "0.96rem", color: "var(--ivory-muted)", lineHeight: 1.6, margin: "0.4rem 0 0.7rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{p.body}</p> : null}
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt="" style={{ maxWidth: "100%", borderRadius: 12, border: "1px solid var(--border)", margin: "0.2rem 0 0.7rem", display: "block" }} />
                    ) : null}
                    <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", fontFamily: "var(--sans)", fontSize: "0.85rem" }}>
                      <button type="button" onClick={() => toggleLike(p)} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "transparent", border: "none", cursor: "pointer", color: p.liked ? "var(--gold)" : "var(--muted)", fontWeight: 600 }}>
                        {p.liked ? "♥" : "♡"} {p.likes > 0 ? p.likes : ""}
                      </button>
                      <button type="button" onClick={() => openComments(p.id)} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)", fontWeight: 600 }}>
                        💬 {p.comments > 0 ? p.comments : "Reply"}
                      </button>
                      {p.user_id === userId ? (
                        <button type="button" onClick={() => deletePost(p.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)", fontWeight: 600, marginLeft: "auto" }}>Delete</button>
                      ) : null}
                    </div>

                    {expanded === p.id ? (
                      <div style={{ marginTop: "0.9rem", borderTop: "1px solid var(--border)", paddingTop: "0.9rem", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                        {comments.map((c) => (
                          <div key={c.id} style={{ display: "flex", gap: "0.6rem" }}>
                            <Avatar uid={c.user_id} name={c.author_name} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
                                <span style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.85rem", color: "var(--ivory)" }}>{c.author_name || "Reader"}</span>
                                {meta.get(c.user_id)?.creator ? <span style={{ fontFamily: "var(--sans)", fontSize: "0.58rem", fontWeight: 700, textTransform: "uppercase", color: "#12100E", background: "var(--gold)", borderRadius: 999, padding: "0.05rem 0.4rem" }}>Creator</span> : null}
                                <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>· {timeAgo(c.created_at)}</span>
                              </span>
                              <p style={{ fontFamily: "var(--sans)", fontSize: "0.9rem", color: "var(--ivory-muted)", lineHeight: 1.5, margin: "0.2rem 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{c.body}</p>
                              {c.user_id === userId ? <button type="button" onClick={() => deleteComment(c)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.72rem", padding: 0, marginTop: "0.2rem" }}>Delete</button> : null}
                            </div>
                          </div>
                        ))}
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <textarea value={cDraft} onChange={(e) => setCDraft(e.target.value)} placeholder="Write a reply…" maxLength={1000} style={{ ...ta, minHeight: 40, fontSize: "0.9rem" }} />
                          <button type="button" onClick={() => submitComment(p.id)} disabled={cBusy || !cDraft.trim()} className="btn btn-gold" style={{ flexShrink: 0, opacity: cBusy || !cDraft.trim() ? 0.6 : 1 }}>Reply</button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
