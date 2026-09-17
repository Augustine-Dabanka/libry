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

export function formatPrice(price: number | null): string {
  if (!price || price <= 0) return "Free";
  return `$${Number(price).toFixed(2)}`;
}
