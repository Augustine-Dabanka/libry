"use server";

import { createHash } from "crypto";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

const TOPICS = ["support", "refund", "privacy", "safety", "creators", "other"] as const;
type Topic = (typeof TOPICS)[number];

export type ContactState = { ok: boolean; message: string };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export async function submitContact(_prev: ContactState, form: FormData): Promise<ContactState> {
  // Honeypot: real people never fill the hidden "website" field.
  if (String(form.get("website") || "").trim()) return { ok: true, message: "Thanks, we got your message." };

  const name = String(form.get("name") || "").trim().slice(0, 80);
  const email = String(form.get("email") || "").trim().slice(0, 200);
  const topicRaw = String(form.get("topic") || "other");
  const topic: Topic = (TOPICS as readonly string[]).includes(topicRaw) ? (topicRaw as Topic) : "other";
  const body = String(form.get("body") || "").trim().slice(0, 4000);

  if (!name) return { ok: false, message: "Add your name." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, message: "That email doesn't look right." };
  if (body.length < 10) return { ok: false, message: "Tell us a little more (at least 10 characters)." };

  const h = await headers();
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "";
  const salt = process.env.CONTACT_HASH_SALT || process.env.NEXT_PUBLIC_SUPABASE_URL || "leep";
  const ipHash = ip ? createHash("sha256").update(salt + ip).digest("hex").slice(0, 32) : null;

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_contact", {
    p_name: name, p_email: email, p_topic: topic, p_body: body, p_ip_hash: ipHash,
  });
  if (error) {
    if (/rate_limited/.test(error.message)) return { ok: false, message: "You've sent a few messages already. Please try again in an hour." };
    return { ok: false, message: "Couldn't send right now. Please try again shortly." };
  }

  // Best effort: forward to the first staff inbox so nothing sits unseen.
  const staff = (process.env.CONTACT_INBOX || process.env.ADMIN_EMAILS || "").split(",")[0]?.trim();
  if (staff) {
    await sendEmail({
      to: staff,
      replyTo: email,
      subject: `[Lybry contact: ${topic}] ${name}`,
      html: `<p><strong>${esc(name)}</strong> &lt;${esc(email)}&gt; — ${topic}</p><p style="white-space:pre-wrap">${esc(body)}</p>`,
    }).catch(() => undefined);
  }

  return { ok: true, message: "Thanks, we got your message. We'll reply by email." };
}
