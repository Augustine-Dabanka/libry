"use server";

import { sendEmail, libryEmail } from "@/lib/email";

// Confirmation email sent to a new waitlist signup. Best-effort: the caller
// never blocks on it, and a missing key / unverified domain just returns not-ok.
export async function sendWaitlistWelcome(
  email: string,
  role: string,
  position: number
): Promise<{ ok: boolean; error?: string }> {
  const clean = (email || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) return { ok: false, error: "invalid email" };

  const what =
    role === "unlimited" ? "Libry Unlimited" : role === "investor" ? "Libry early access" : "Libry";
  const spot = position > 0 ? `You're <strong style="color:#EDE7DE;">#${position}</strong> in line.` : "You're on the list.";

  const html = libryEmail({
    heading: "You're on the list ✨",
    body:
      `${spot} Thanks for joining the ${what} waitlist.<br/><br/>` +
      `We're building a calm, curated bookstore where readers come first and writers keep 65%. ` +
      `Want in sooner? Every friend who joins with your referral link moves you up.`,
    cta: { label: "Share your link", href: "https://libry-sigma.vercel.app/waitlist" },
  });

  return sendEmail({ to: clean, subject: "You're on the Libry waitlist ✨", html });
}
