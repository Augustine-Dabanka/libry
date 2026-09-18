// Promotion pricing + labels, shared by the creator UI and the server action.
export type PromoKind = "boost" | "prerelease";

// USD per day. Deliberately flat, low, and legible — no auction, no surge.
export const PROMO_RATES: Record<PromoKind, number> = { boost: 1.5, prerelease: 2 };
export const PROMO_DURATIONS = [3, 7] as const;

export function promoPrice(kind: PromoKind, days: number): number {
  return Math.round((PROMO_RATES[kind] || 0) * days * 100) / 100;
}

export function promoLabel(kind: PromoKind): string {
  return kind === "prerelease" ? "Pre-Release Buzz" : "Live Boost";
}

export function promoBlurb(kind: PromoKind): string {
  return kind === "prerelease"
    ? "For a book that isn't out yet — build anticipation and collect early follows before launch."
    : "For a live book — a placement in the Discover Spotlight to reach new readers now.";
}
