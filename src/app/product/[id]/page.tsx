import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import ProductBuy from "@/components/ProductBuy";
import { formatPrice } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  download: "Download", template: "Template", audio: "Audio", ebook: "E-book",
  video: "Video", course: "Course", bundle: "Bundle",
};

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pid = Number(id);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/product/${id}`);

  const { data: p } = await supabase
    .from("products")
    .select("id, user_id, title, description, type, price, cover_url, external_url, category, is_published")
    .eq("id", pid)
    .maybeSingle();
  if (!p) notFound();

  const isOwner = p.user_id === user.id;
  if (!p.is_published && !isOwner) notFound();

  // Creator name.
  const { data: prof } = await supabase.from("profiles").select("username, full_name, pen_name").eq("id", p.user_id).maybeSingle();
  const creatorName = prof?.pen_name || prof?.full_name || prof?.username || "A Libry creator";

  // Ownership.
  let owned = isOwner;
  if (!isOwner) {
    const { data: pur } = await supabase.from("product_purchases").select("id").eq("product_id", pid).eq("user_id", user.id).maybeSingle();
    owned = !!pur;
  }
  const isVideo = p.type === "video" || p.type === "course";
  const price = Number(p.price) || 0;

  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 960 }}>
        <a href="/discover" style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.88rem", fontWeight: 600 }}>← Back</a>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: "2rem", marginTop: "1rem" }} className="product-layout">
          <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 300px) 1fr", gap: "2rem", alignItems: "start" }} className="product-grid">
            {/* Cover / preview */}
            <div style={{ position: "sticky", top: "1.5rem" }}>
              <div style={{ aspectRatio: "2 / 3", borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)", background: "linear-gradient(150deg, hsl(35 30% 24%), hsl(20 35% 15%))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover_url} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "3rem" }}>{isVideo ? "🎬" : p.type === "audio" ? "🎧" : "🎁"}</span>
                )}
              </div>
            </div>

            <div>
              <span className="badge" style={{ background: "rgba(196,163,90,0.16)", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.7rem", fontWeight: 700 }}>
                {TYPE_LABEL[p.type] || "Product"}
              </span>
              <h1 style={{ fontSize: "2rem", margin: "0.7rem 0 0.4rem", lineHeight: 1.15 }}>{p.title}</h1>
              <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.95rem", marginBottom: "0.3rem" }}>by {creatorName}</p>
              {p.category ? <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem" }}>{p.category}</p> : null}

              <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", margin: "1rem 0 1.3rem" }}>
                <span style={{ fontFamily: "var(--sans)", fontWeight: 800, fontSize: "1.8rem", color: "var(--gold)" }}>{price > 0 ? formatPrice(price) : "Free"}</span>
              </div>

              <div style={{ maxWidth: 340, marginBottom: "1.6rem" }}>
                <ProductBuy productId={p.id} price={price} owned={owned} email={user.email ?? undefined} isVideo={isVideo} />
              </div>

              {/* Video preview once owned. */}
              {isVideo && owned && p.external_url ? (
                <div style={{ aspectRatio: "16 / 9", borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)", marginBottom: "1.6rem" }}>
                  <iframe src={p.external_url} allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowFullScreen style={{ width: "100%", height: "100%", border: "none" }} title={p.title} />
                </div>
              ) : null}

              {p.description ? (
                <div style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.95rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{p.description}</div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
