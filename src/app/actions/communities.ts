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
