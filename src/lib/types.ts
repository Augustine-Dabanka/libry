export type Book = {
  id: number | string;
  title: string;
  author: string | null;
  price: number | null;
  type: string | null;
  age_rating?: string | null;
  rating?: number | null;
  category?: string | null;
  cover_url?: string | null;
  cover?: string | null;
};

// The best available cover image URL for a book, or null to fall back to the
// generated frame. `cover_url` (a real image) wins over the legacy `cover`.
export function bookCover(b: { cover_url?: string | null; cover?: string | null }): string | null {
  const c = (b.cover_url || b.cover || "").trim();
  return c && /^https?:\/\//i.test(c) ? c : null;
}

// A generated SVG cover URL for anything without a real image — stable per
// title, so books and products always have an attractive default cover.
export function genCover(title?: string | null, subtitle?: string | null): string {
  const p = new URLSearchParams({ t: (title || "Untitled").slice(0, 90) });
  if (subtitle) p.set("a", subtitle.slice(0, 60));
  return `/api/cover?${p.toString()}`;
}

// Prices are stored in USD. When Paystack charges in a local currency (e.g.
// GHS), show that amount, so the price on the page is the price you pay.
// Stripe always charges USD at the list price.
const STRIPE = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER === "stripe";
const CUR = STRIPE ? "USD" : process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY || "USD";
const RATE = STRIPE ? 1 : Number(process.env.NEXT_PUBLIC_PAYSTACK_USD_RATE || "1") || 1;
const SYMBOL: Record<string, string> = { GHS: "GH₵", NGN: "₦", KES: "KSh ", ZAR: "R", USD: "$" };
export function formatPrice(price: number | null): string {
  if (!price || price <= 0) return "Free";
  if (CUR !== "USD") return `${SYMBOL[CUR] ?? CUR + " "}${(Number(price) * RATE).toFixed(2)}`;
  return `$${Number(price).toFixed(2)}`;
}

// Consistent format language (spec §9). Maps a book's raw `type` to one of the
// formats the product actually supports, with an icon. Serial/Audio only when
// the type explicitly says so — we don't over-claim formats.
export function bookFormat(type?: string | null): { label: string; icon: string } {
  const t = (type || "").toLowerCase();
  if (t === "interactive") return { label: "Interactive", icon: "✦" };
  if (t === "comic" || t === "comics" || t === "graphic novel" || t === "webtoon") return { label: "Comic", icon: "▦" };
  if (t === "audio" || t === "audiobook") return { label: "Audio", icon: "♪" };
  if (t === "serial" || t === "series") return { label: "Serial", icon: "≡" };
  return { label: "Novel", icon: "❦" };
}
