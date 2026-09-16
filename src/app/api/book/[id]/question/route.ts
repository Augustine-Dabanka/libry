import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { looksLikeHtml } from "@/lib/sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Model for the lightweight, cached mid-read question generator. Haiku is the
// right tool here — it's a short, high-volume-shaped, latency-sensitive task and
// each question is cached per book — but it's overridable if you want more depth.
const MODEL = process.env.LIBRY_QUESTION_MODEL || "claude-haiku-4-5";

type Q = { question: string; options: string[]; answer: number };

function stripToText(content: string, isHtml: boolean): string {
  if (!isHtml) return content;
  return content.replace(/<\/(p|div|h[1-6]|li|br)\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ");
}

// A mid-read comprehension question about what the reader has read so far (up to
// `at`%), returned from cache when possible. { available:false } means "no
// question — show the reflection prompt instead", never an error to the reader.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const at = Number(new URL(req.url).searchParams.get("at"));
  if (![25, 50, 75].includes(at)) return json({ available: false });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ available: false });

  // Cache hit?
  try {
    const cached = await supabase.from("book_questions").select("question, options, answer").eq("book_id", id).eq("checkpoint", at).maybeSingle();
    if (cached.data) return json({ available: true, ...(cached.data as Q) });
  } catch {
    /* table not migrated — fall through to (maybe) generate */
  }

  if (!process.env.ANTHROPIC_API_KEY) return json({ available: false });

  const { data: book } = await supabase.from("books").select("content").eq("id", id).maybeSingle();
  const content = (book?.content as string) || "";
  if (!content) return json({ available: false });

  const text = stripToText(content, looksLikeHtml(content));
  const upto = Math.floor(text.length * (at / 100));
  const passage = text.slice(Math.max(0, upto - 3500), upto).trim();
  if (passage.length < 250) return json({ available: false });

  let q: Q | null = null;
  try {
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system:
        "You are a warm reading companion. Given a passage a reader has just read, write ONE short multiple-choice comprehension question about THIS passage only (no outside knowledge, no spoilers beyond it). Exactly 3 options, exactly one correct, plausible distractors. Respond with ONLY a JSON object: {\"question\": string, \"options\": [string, string, string], \"answer\": number} where answer is the 0-based index of the correct option. No markdown, no prose.",
      messages: [{ role: "user", content: `Passage:\n\n${passage}` }],
    });
    const textBlock = msg.content.find((b) => b.type === "text");
    const raw = textBlock && textBlock.type === "text" ? textBlock.text : "";
    const parsed = JSON.parse(raw.replace(/^```json\s*|^```\s*|\s*```$/g, "").trim()) as Q;
    if (parsed && typeof parsed.question === "string" && Array.isArray(parsed.options) && parsed.options.length === 3 && Number.isInteger(parsed.answer) && parsed.answer >= 0 && parsed.answer <= 2) {
      q = { question: parsed.question, options: parsed.options.map(String), answer: parsed.answer };
    }
  } catch {
    return json({ available: false });
  }

  if (!q) return json({ available: false });

  // Cache for everyone (best-effort).
  try {
    await supabase.from("book_questions").insert({ book_id: Number(id), checkpoint: at, question: q.question, options: q.options, answer: q.answer });
  } catch {
    /* no table / race — fine */
  }

  return json({ available: true, ...q });
}

function json(body: unknown) {
  return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" } });
}
