import "server-only";

// Server-only transactional email via Resend's REST API (no SDK dependency).
// Reads RESEND_API_KEY / RESEND_FROM from the environment; if the key is
// missing it no-ops so callers can stay best-effort and never block a flow.
const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM || "Libry <onboarding@resend.dev>";

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!KEY) return { ok: false, error: "RESEND_API_KEY not set" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (!res.ok) return { ok: false, error: `${res.status} ${(await res.text()).slice(0, 300)}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}

// Branded shell so every Libry email looks the same. Keep it inline-styled and
// simple — email clients strip <style>, <script> and most modern CSS.
export function libryEmail({ heading, body, cta }: { heading: string; body: string; cta?: { label: string; href: string } }): string {
  return `<!doctype html><html><body style="margin:0;background:#12100E;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#1C1917;border:1px solid #2A2622;border-radius:16px;overflow:hidden;">
      <tr><td style="padding:28px 32px 0;">
        <div style="font-family:Georgia,serif;font-size:22px;color:#EDE7DE;">Libry<span style="color:#5FA068;">.</span></div>
      </td></tr>
      <tr><td style="padding:20px 32px 8px;">
        <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;line-height:1.25;color:#EDE7DE;font-weight:600;">${heading}</h1>
      </td></tr>
      <tr><td style="padding:6px 32px 20px;color:#A8A29E;font-size:15px;line-height:1.65;">${body}</td></tr>
      ${cta ? `<tr><td style="padding:0 32px 28px;"><a href="${cta.href}" style="display:inline-block;background:#5FA068;color:#0B0A09;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:999px;">${cta.label}</a></td></tr>` : ""}
      <tr><td style="padding:18px 32px 26px;border-top:1px solid #2A2622;color:#6b6560;font-size:12px;line-height:1.6;">
        Libry — stories worth lingering in. You're getting this because you joined at libry-sigma.vercel.app.
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}
