"use client";

import { useActionState } from "react";
import { submitContact, type ContactState } from "@/app/actions/contact";

const TOPICS: { v: string; l: string }[] = [
  { v: "support", l: "Help with my account or reading" },
  { v: "refund", l: "Payment or refund" },
  { v: "privacy", l: "Privacy or my data" },
  { v: "safety", l: "Report content or appeal a decision" },
  { v: "creators", l: "Creators, partnerships, ambassadors" },
  { v: "other", l: "Something else" },
];

const field: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", background: "var(--stone)", color: "var(--ivory)",
  border: "1px solid var(--border)", borderRadius: 12, padding: "0.8rem 0.95rem",
  fontFamily: "var(--sans)", fontSize: "1rem",
};
const label: React.CSSProperties = { display: "grid", gap: "0.4rem", fontFamily: "var(--sans)", fontSize: "0.85rem", color: "var(--ivory-muted)" };

export default function ContactForm({ topic }: { topic?: string }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitContact, { ok: false, message: "" });

  if (state.ok) {
    return <p role="status" style={{ fontFamily: "var(--sans)", color: "var(--ivory)", padding: "1.2rem", border: "1px solid var(--border)", borderRadius: 14 }}>{state.message}</p>;
  }

  return (
    <form action={action} style={{ display: "grid", gap: "1rem" }}>
      <label style={label}>Your name<input name="name" required maxLength={80} autoComplete="name" style={field} /></label>
      <label style={label}>Email we should reply to<input name="email" type="email" required maxLength={200} autoComplete="email" style={field} /></label>
      <label style={label}>
        What&apos;s it about?
        <select name="topic" defaultValue={TOPICS.some((t) => t.v === topic) ? topic : "support"} style={field}>
          {TOPICS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
        </select>
      </label>
      <label style={label}>
        Message
        <textarea name="body" required minLength={10} maxLength={4000} rows={6} style={{ ...field, resize: "vertical" }} placeholder="For payments, include the reference from your receipt." />
      </label>
      {/* Honeypot: hidden from people, tempting to bots. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} />
      {state.message ? <p role="alert" style={{ margin: 0, fontFamily: "var(--sans)", fontSize: "0.9rem", color: "#e8a08a" }}>{state.message}</p> : null}
      <button type="submit" className="btn" disabled={pending} style={{ justifySelf: "start" }}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
