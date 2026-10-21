"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BoxStatus = {
  kind: "sub" | "trial" | "none";
  endsAt: string | null;
  picksTotal: number;
  picksUsed: number;
  trialAvailable: boolean;
  trialDays: number;
  trialPicks: number;
};

// What the signed-in reader can do with Unlimited right now. Null when the
// trial migration (0044) hasn't been run yet, so callers can hide the feature.
export async function getBoxStatus(): Promise<BoxStatus | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("box_status");
  if (error) return null;
  const r = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  if (!r) return null;
  return {
    kind: (r.kind as BoxStatus["kind"]) ?? "none",
    endsAt: (r.ends_at as string | null) ?? null,
    picksTotal: Number(r.picks_total ?? 0),
    picksUsed: Number(r.picks_used ?? 0),
    trialAvailable: !!r.trial_available,
    trialDays: Number(r.trial_days ?? 7),
    trialPicks: Number(r.trial_picks ?? 2),
  };
}

export async function startTrial(): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_trial");
  if (error) return { ok: false, message: "Couldn't start your trial. Try again." };
  const r = (Array.isArray(data) ? data[0] : data) as { ok?: boolean; message?: string } | null;
  if (r?.ok) {
    revalidatePath("/unlimited");
    revalidatePath("/home");
  }
  return { ok: !!r?.ok, message: String(r?.message ?? "Couldn't start your trial.") };
}

export async function keepBook(bookId: number): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("keep_book", { p_book: bookId });
  if (error) return { ok: false, message: "Couldn't keep this book. Try again." };
  const r = (Array.isArray(data) ? data[0] : data) as { ok?: boolean; message?: string } | null;
  if (r?.ok) {
    revalidatePath(`/book/${bookId}`);
    revalidatePath("/my-library");
    revalidatePath("/unlimited");
  }
  return { ok: !!r?.ok, message: String(r?.message ?? "Couldn't keep this book.") };
}
