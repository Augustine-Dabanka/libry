import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import { getCheckout, grantCheckout } from "@/lib/stripe";

export const metadata: Metadata = { title: "Payment — Lybry" };
export const dynamic = "force-dynamic";

// Stripe sends the buyer back here. We re-fetch the session from Stripe (never
// trusting the URL), grant the order, and say plainly what happened.
export default async function CheckoutReturn({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let title = "Something went wrong";
  let body = "We couldn't confirm this payment. If you were charged, contact us with your receipt and we'll sort it out.";
  let href = "/catalog";
  let cta = "Back to books";

  if (!session_id || !/^cs_[A-Za-z0-9_]+$/.test(session_id)) {
    body = "This link is missing its payment details.";
  } else if (!process.env.STRIPE_SECRET_KEY) {
    body = "Card payments aren't set up yet.";
  } else {
    try {
      const s = await getCheckout(session_id);
      const owner = s.metadata.user_id || s.client_reference_id;
      if (user && owner && owner !== user.id) {
        body = "This payment belongs to a different account. Sign in with the account that paid.";
      } else if (s.payment_status !== "paid") {
        title = "Payment not finished";
        body = "Your card wasn't charged. You can try again whenever you like.";
        href = s.metadata.kind === "unlimited" ? "/unlimited" : "/catalog";
        cta = "Try again";
      } else {
        const res = await grantCheckout(s);
        if (res.ok) {
          title = "Payment complete";
          if (s.metadata.kind === "unlimited") {
            body = "Lybry Unlimited is active. Pick the books you want to keep.";
            href = "/catalog?unlimited=1";
            cta = "Pick books";
          } else {
            body = "Your books are in your library, yours to keep.";
            href = "/my-library";
            cta = "Open my library";
          }
        } else {
          body = `${res.error ?? "We couldn't record this order."} Your receipt from Stripe is your proof of payment.`;
        }
      }
    } catch {
      body = "We couldn't reach the payment service just now. Refresh this page in a minute; your order will still be recorded.";
    }
  }

  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 560, marginInline: "auto", textAlign: "center", display: "grid", gap: "1rem", paddingTop: "3rem" }}>
        <h1 style={{ margin: 0 }}>{title}</h1>
        <p style={{ margin: 0, color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "1.05rem", lineHeight: 1.6 }}>{body}</p>
        <div><a className="btn btn-gold" href={href}>{cta}</a></div>
      </section>
    </>
  );
}
