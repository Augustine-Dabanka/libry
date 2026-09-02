import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";

export default async function Cart() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppNav />
      <section className="section">
        <div className="section-header">
          <h2>Cart</h2>
        </div>
        <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "3rem 2rem", textAlign: "center", background: "var(--stone)" }}>
          <p style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Your cart is empty.</p>
          <p style={{ color: "var(--muted)", maxWidth: 440, margin: "0 auto" }}>
            Add a book from the <a href="/catalog" style={{ color: "var(--gold)" }}>catalog</a> to check out.
          </p>
        </div>
      </section>
    </>
  );
}
