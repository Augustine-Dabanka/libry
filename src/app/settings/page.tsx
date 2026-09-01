import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import MatureToggle from "@/components/MatureToggle";
import ThemePicker from "@/components/ThemePicker";
import AvatarSettings from "@/components/AvatarSettings";

function initialsFrom(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

const card: React.CSSProperties = {
  background: "var(--stone)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: "1.4rem 1.5rem",
  marginBottom: "1.4rem",
};

export default async function Settings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  const displayName = profile?.full_name || profile?.username || user.email || "";

  const sm = await supabase.from("profiles").select("show_mature").eq("id", user.id).maybeSingle();
  const showMature = sm.data?.show_mature ?? false;

  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="section-header">
          <h2>Settings</h2>
        </div>

        {/* Profile photo */}
        <div style={card}>
          <h3 style={{ marginBottom: "0.3rem", fontSize: "1.1rem" }}>Profile photo</h3>
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", marginBottom: "1.2rem" }}>
            A square photo works best. It&apos;s stored on your profile.
          </p>
          <AvatarSettings initialUrl={profile?.avatar_url ?? null} initials={initialsFrom(displayName)} />
        </div>

        {/* Theme */}
        <div style={card}>
          <h3 style={{ marginBottom: "0.3rem", fontSize: "1.1rem" }}>Luxury theme</h3>
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", marginBottom: "1.2rem" }}>
            Recolor the app accent. Your pick is saved on this device.
          </p>
          <ThemePicker />
        </div>

        {/* Mature toggle */}
        <div style={{ ...card, display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--sans)", fontWeight: 700, marginBottom: "0.2rem" }}>Show mature content</div>
            <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem" }}>
              Mature (18+) stories are hidden by default. Turn this on to include them across Home, Catalog, and Discover.
            </div>
          </div>
          <MatureToggle initial={showMature} />
        </div>
      </section>
    </>
  );
}
