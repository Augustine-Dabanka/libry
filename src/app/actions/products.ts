"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const RATE = Number(process.env.NEXT_PUBLIC_PAYSTACK_USD_RATE || "1") || 1;

export type ProductType = "download" | "template" | "audio" | "ebook" | "video" | "course" | "bundle";

export type ProductInput = {
  title: string;
  description?: string;
  type: ProductType;
  price: number;
  cover_url?: string | null;
  file_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  external_url?: string | null;
  category?: string | null;
};

function clean(input: ProductInput) {
  const price = Math.max(0, Number(input.price) || 0);
  return {
    title: (input.title || "").trim().slice(0, 160),
    description: (input.description || "").trim().slice(0, 6000) || null,
    type: input.type,
    price,
    cover_url: input.cover_url || null,
    file_path: input.file_path || null,
    file_name: input.file_name || null,
    file_size: input.file_size ?? null,
    external_url: (input.external_url || "").trim() || null,
    category: (input.category || "").trim() || null,
  };
}

export async function createProduct(input: ProductInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };
  const row = clean(input);
  if (!row.title) return { error: "Give your product a title." };
  const { data, error } = await supabase.from("products").insert({ ...row, user_id: user.id }).select("id").maybeSingle();
  if (error) return { error: error.message };
  revalidatePath("/creator");
  return { ok: true, id: data?.id as number };
}

export async function updateProduct(id: number, input: ProductInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };
  const row = clean(input);
  if (!row.title) return { error: "Give your product a title." };
  const { error } = await supabase.from("products").update({ ...row, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/creator");
  revalidatePath(`/product/${id}`);
  return { ok: true };
}

export async function publishProduct(id: number, publish: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };
  // A published product must be deliverable: a file or an external (video/course) URL.
  if (publish) {
    const { data: p } = await supabase.from("products").select("file_path, external_url, price").eq("id", id).eq("user_id", user.id).maybeSingle();
    if (p && !p.file_path && !p.external_url) return { error: "Add a file or a video/course link before publishing." };
  }
  const { error } = await supabase.from("products").update({ is_published: publish }).eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/creator");
  revalidatePath(`/product/${id}`);
  return { ok: true };
}

export async function deleteProduct(id: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };
  // Best-effort remove the stored file too.
  const { data: p } = await supabase.from("products").select("file_path").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (p?.file_path) await supabase.storage.from("product-files").remove([p.file_path]);
  const { error } = await supabase.from("products").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/creator");
  return { ok: true };
}

async function verifyPaystack(reference: string, expectedMinor: number): Promise<{ ok: boolean; error?: string }> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return { ok: false, error: "Payments aren't fully set up yet." };
  try {
    const r = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` }, cache: "no-store",
    });
    const j = await r.json();
    if (!j?.status || j?.data?.status !== "success") return { ok: false, error: "Payment wasn't completed." };
    if (Number(j.data.amount) + 1 < expectedMinor) return { ok: false, error: "Payment amount didn't match." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't confirm the payment. If you were charged, contact support." };
  }
}

// Grant a product to the buyer after a verified (or, for free/pre-launch, simulated) payment.
export async function buyProduct(productId: number, reference: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to buy." };
  const { data: prod, error: pErr } = await supabase.from("products").select("id, price, user_id, is_published").eq("id", productId).maybeSingle();
  if (pErr || !prod) return { error: "Product not found." };
  if (!prod.is_published && prod.user_id !== user.id) return { error: "This product isn't available." };
  const price = Number(prod.price) || 0;

  const isSimulated = /^(demo|free)-/.test(reference);
  if (price > 0 && !isSimulated) {
    const v = await verifyPaystack(reference, Math.round(price * RATE * 100));
    if (!v.ok) return { error: v.error };
  }
  const { error } = await supabase.from("product_purchases").upsert(
    { user_id: user.id, product_id: productId, amount: price, reference },
    { onConflict: "user_id,product_id", ignoreDuplicates: true }
  );
  if (error) return { error: error.message };
  revalidatePath("/my-library");
  revalidatePath("/creator");
  return { ok: true };
}

// A short-lived signed URL for a purchased (or owned) product's file. Uses the
// service role so the private bucket never needs a public read policy.
export async function getDownloadUrl(productId: number): Promise<{ url?: string; name?: string; external?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };
  const { data: prod } = await supabase.from("products").select("file_path, file_name, external_url, price, user_id").eq("id", productId).maybeSingle();
  if (!prod) return { error: "Product not found." };

  const owns = prod.user_id === user.id;
  if (!owns) {
    if (Number(prod.price) > 0) {
      const { data: pur } = await supabase.from("product_purchases").select("id").eq("product_id", productId).eq("user_id", user.id).maybeSingle();
      if (!pur) return { error: "Buy this product to access it." };
    }
  }
  if (prod.external_url) return { external: prod.external_url, name: prod.file_name || undefined };
  if (!prod.file_path) return { error: "This product has no file yet." };

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return { error: "Downloads aren't configured yet." };
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
  const { data, error } = await admin.storage.from("product-files").createSignedUrl(prod.file_path, 60 * 10, { download: prod.file_name || true });
  if (error || !data) return { error: "Couldn't create a download link." };
  return { url: data.signedUrl, name: prod.file_name || undefined };
}
