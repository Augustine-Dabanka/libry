import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import MatureToggle from "@/components/MatureToggle";

export default async function Settings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sm = await supabase.from("profiles").select("show_mature").eq("id", user.id).maybeSingle();
  const showMature = sm.data?.show_mature ?? false;

  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 680, margin: "0 auto" }}>
        <div className="section-header">
          <h2>Reader Settings</h2>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.2rem",
            background: "var(--stone)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "1.3rem 1.5rem",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--sans)", fontWeight: 700, marginBottom: "0.2rem" }}>
              Show mature content
            </div>
            <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem" }}>
              Mature (18+) stories are hidden by default. Turn this on to include them
              across Home, Catalog, and Discover.
            </div>
          </div>
          <MatureToggle initial={showMature} />
        </div>

        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem", marginTop: "1.2rem" }}>
          This is a parental / content control — leave it off to keep the catalog family-friendly.
        </p>
      </section>
    </>
  );
}
