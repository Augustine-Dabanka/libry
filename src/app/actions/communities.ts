"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function joinCommunity(communityId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };
  const { error } = await supabase.from("community_members").upsert({ community_id: communityId, user_id: user.id }, { onConflict: "community_id,user_id", ignoreDuplicates: true });
  if (error) return { error: error.message };
  revalidatePath("/communities");
  return { ok: true };
}

export async function leaveCommunity(communityId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };
  const { error } = await supabase.from("community_members").delete().eq("community_id", communityId).eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/communities");
  return { ok: true };
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

// Spin up a community pre-configured from a story (spec §31) — a far better
// cold-start than an empty generic community. Only the story's creator may do
// it; if one already exists for the story, we just return it.
export async function createStoryCommunity(bookId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const { data: book } = await supabase
    .from("books")
    .select("id, title, author, description, category, cover_url, user_id")
    .eq("id", bookId)
    .maybeSingle();
  if (!book) return { error: "Story not found." };
  if (book.user_id && book.user_id !== user.id) return { error: "Only the story's creator can start its community." };

  // Already linked? Return it.
  const existing = await supabase.from("communities").select("slug").eq("book_id", bookId).maybeSingle();
  if (existing.data?.slug) return { ok: true, slug: existing.data.slug };

  const base = slugify(`${book.title}-readers`) || `story-${bookId}`;
  let slug = base;
  const clash = await supabase.from("communities").select("id").eq("slug", slug).maybeSingle();
  if (clash.data) slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: created, error } = await supabase
    .from("communities")
    .insert({
      slug,
      name: `${book.title} — Readers`,
      description: book.description ? `The community for readers of ${book.title}. ${String(book.description).slice(0, 240)}` : `Discussion, theories and chapter chat for ${book.title}.`,
      emoji: "📖",
      cover_url: book.cover_url ?? null,
      category: book.category ?? "Stories",
      book_id: bookId,
      created_by: user.id,
    })
    .select("id, slug")
    .maybeSingle();
  if (error) return { error: error.message };

  if (created?.id) {
    await supabase.from("community_members").upsert({ community_id: created.id, user_id: user.id, role: "admin" }, { onConflict: "community_id,user_id", ignoreDuplicates: true });
    // Seed a welcome post so it never feels empty (spec §27.1).
    await supabase.from("community_posts").insert({
      user_id: user.id,
      author_name: book.author || "The author",
      body: `Welcome to the ${book.title} community 📖 Share theories, favourite moments and chapter reactions here — please flag spoilers before you post them.`,
      community_id: created.id,
      channel: "general",
    });
  }
  revalidatePath("/communities");
  return { ok: true, slug: created?.slug };
}

export async function createCommunity(input: { name: string; description?: string; emoji?: string; coverUrl?: string | null }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };
  const name = (input.name || "").trim().slice(0, 80);
  if (!name) return { error: "Give your community a name." };
  let slug = slugify(name);
  if (!slug) slug = `c-${Date.now()}`;
  // Ensure uniqueness.
  const existing = await supabase.from("communities").select("id").eq("slug", slug).maybeSingle();
  if (existing.data) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  // Accept an uploaded data-URI image or an http(s) URL; ignore anything else.
  const rawCover = (input.coverUrl || "").trim();
  const cover_url = /^data:image\/(png|jpe?g|webp|gif);/i.test(rawCover) || /^https?:\/\//i.test(rawCover) ? rawCover : null;

  const { data, error } = await supabase
    .from("communities")
    .insert({ slug, name, description: (input.description || "").trim().slice(0, 500) || null, emoji: (input.emoji || "📚").slice(0, 8), cover_url, created_by: user.id })
    .select("id, slug")
    .maybeSingle();
  if (error) return { error: error.message };
  // Creator auto-joins as admin.
  if (data?.id) await supabase.from("community_members").upsert({ community_id: data.id, user_id: user.id, role: "admin" }, { onConflict: "community_id,user_id", ignoreDuplicates: true });
  revalidatePath("/communities");
  return { ok: true, slug: data?.slug };
}
