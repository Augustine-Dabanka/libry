"use server";

import { createClient } from "@/lib/supabase/server";

// Same Formspree form as the waitlist — reports arrive with their own subject.
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mppzqqpy";

// File a trust-and-safety report on a book. Emails the team (Formspree) and, if
// the reports table exists, also logs it. Signed-in readers only.
export async function submitReport(bookId: number, reason: string, note: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to report a book." };
  if (!reason) return { error: "Pick a reason." };

  const cleanNote = (note || "").trim().slice(0, 1000);

  // Look up the book title so the email is readable.
  const { data: bk } = await supabase.from("books").select("title").eq("id", bookId).maybeSingle();
  const title = bk?.title || `#${bookId}`;

  // 1) Log to the reports table (best-effort — works once 0012 is run).
  await supabase.from("reports").insert({ book_id: bookId, reporter_id: user.id, reason, note: cleanNote });

  // 2) Email the team via Formspree so it actually reaches an inbox.
  try {
    await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: `⚑ Book report: ${title}`,
        book: title,
        book_id: bookId,
        reason,
        note: cleanNote || "(none)",
        reporter: user.email,
        link: `/book/${bookId}`,
      }),
    });
  } catch {
    /* non-blocking — the DB log is the backup */
  }

  return { ok: true };
}
