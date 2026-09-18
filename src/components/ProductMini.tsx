import { formatPrice, genCover } from "@/lib/types";

export type ProductCard = {
  id: number;
  title: string;
  type: string;
  price: number | null;
  cover_url: string | null;
  category?: string | null;
};

const ICON: Record<string, string> = {
  download: "🎁", template: "🧩", audio: "🎧", ebook: "📘", video: "🎬", course: "🎓", bundle: "📦",
};

// Compact product card matching the book-grid-mini rhythm, for Discover / library.
export default function ProductMini({ product }: { product: ProductCard }) {
  const price = Number(product.price) || 0;
  const cover = product.cover_url && /^https?:\/\//.test(product.cover_url) ? product.cover_url : genCover(product.title, ICON[product.type] ? product.type : "");
  return (
    <a href={`/product/${product.id}`} className="cc-card" style={{ textDecoration: "none", display: "block" }}>
      <div className="cc-cover" style={{ position: "relative", aspectRatio: "2 / 3", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", background: "linear-gradient(150deg, hsl(35 30% 24%), hsl(20 35% 15%))" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <span style={{ position: "absolute", top: 6, left: 6, background: "rgba(18,16,14,0.78)", color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "0.15rem 0.4rem", borderRadius: 6 }}>{product.type}</span>
      </div>
      <div style={{ marginTop: "0.5rem" }}>
        <div style={{ fontFamily: "var(--serif)", color: "var(--ivory)", fontSize: "0.92rem", lineHeight: 1.25, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{product.title}</div>
        <div style={{ color: "var(--gold)", fontFamily: "var(--sans)", fontSize: "0.82rem", fontWeight: 700, marginTop: "0.2rem" }}>{price > 0 ? formatPrice(price) : "Free"}</div>
      </div>
    </a>
  );
}
