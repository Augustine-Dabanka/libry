export type Book = {
  id: number | string;
  title: string;
  author: string | null;
  price: number | null;
  type: string | null;
  age_rating?: string | null;
  rating?: number | null;
  category?: string | null;
};

export function formatPrice(price: number | null): string {
  if (!price || price <= 0) return "Free";
  return `$${Number(price).toFixed(2)}`;
}
