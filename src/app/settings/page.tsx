import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import AppearanceMode from "@/components/AppearanceMode";
import ThemePicker from "@/components/ThemePicker";
import SharedAccess from "@/components/SharedAccess";
import AvatarSettings from "@/components/AvatarSettings";
import AccountSettings from "@/components/AccountSettings";
import DeleteAccount from "@/components/DeleteAccount";
import BackgroundPicker from "@/components/BackgroundPicker";
import LanguagePref from "@/components/LanguagePref";
import MatureToggle from "@/components/MatureToggle";
import ReferralLink from "@/components/ReferralLink";
import ReferralReward from "@/components/ReferralReward";
import BecomeCreator from "@/components/BecomeCreator";

function initialsFrom(name: string): string {
  return (
    name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?"
  );
}

const card: React.CSSProperties = {
  background: "var(--stone)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: "1.5rem 1.6rem",
  marginBottom: "1.4rem",
};
const cardTitle: React.CSSProperties = { fontSize: "1.1rem", marginBottom: "0.3rem" };
const cardLead: React.CSSProperties = {
  color: "var(--muted)",
  fontFamily: "var(--sans)",
  fontSize: "0.9rem",
  marginBottom: "1.2rem",
};

export default async function Settings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url, prefs")
    .eq("id", user.id)
    .maybeSingle();
  const displayName = profile?.full_name || profile?.username || user.email || "";
  const refCode = profile?.username || user.id;
  const prefs = (profile?.prefs && typeof profile.prefs === "object" ? profile.prefs : {}) as Record<string, unknown>;
  const sharedWith = Array.isArray(prefs.shared_with) ? (prefs.shared_with as string[]) : [];

  const sm = await supabase.from("profiles").select("show_mature").eq("id", user.id).maybeSingle();
  const showMature = sm.data?.show_mature ?? false;

  const cr = await supabase.from("profiles").select("is_creator").eq("id", user.id).maybeSingle();
  const isCreator = cr.error ? false : !!cr.data?.is_creator;

  const rc = await supabase.rpc("my_referral_count");
  const referralCount = typeof rc.data === "number" ? rc.data : 0;

  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="section-header">
          <h2>Settings</h2>
        </div>

        {/* Appearance */}
        <div style={card}>
          <h3 style={cardTitle}>Appearance</h3>
          <p style={cardLead}>Choose how Libry looks. Saved on this device.</p>
          <AppearanceMode />
        </div>

        {/* Luxury theme (accent) */}
        <div style={card}>
          <h3 style={cardTitle}>Luxury theme</h3>
          <p style={cardLead}>Recolour the app&apos;s accent with a premium palette. Saved on this device.</p>
          <ThemePicker />
        </div>

        {/* Profile photo */}
        <div style={card}>
          <h3 style={cardTitle}>Profile photo</h3>
          <p style={cardLead}>A square photo works best. It&apos;s stored on your profile.</p>
          <AvatarSettings initialUrl={profile?.avatar_url ?? null} initials={initialsFrom(displayName)} />
        </div>

        {/* Account */}
        <div style={card}>
          <h3 style={cardTitle}>Account</h3>
          <p style={cardLead}>Update your display name or change your password.</p>
          <AccountSettings userId={user.id} initialName={displayName} />
        </div>

        {/* Creator account */}
        <div style={card}>
          <h3 style={cardTitle}>Creator account</h3>
          <p style={cardLead}>
            {isCreator ? "You can publish stories on Libry." : "You have a reader account. Become a creator to publish."}
          </p>
          {isCreator ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <span className="badge" style={{ background: "rgba(78,122,82,0.2)", color: "#7DBE86" }}>Creator ✓</span>
              <a className="btn btn-outline" href="/creator" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}>Open Creator Dashboard →</a>
            </div>
          ) : (
            <BecomeCreator variant="row" />
          )}
        </div>

        {/* Language */}
        <div style={card}>
          <h3 style={cardTitle}>Language</h3>
          <p style={cardLead}>Your preferred language for Libry.</p>
          <LanguagePref userId={user.id} initial="en" />
        </div>

        {/* Background */}
        <div style={card}>
          <h3 style={cardTitle}>Background</h3>
          <p style={cardLead}>A gentle ambient animation behind the app. Off by default.</p>
          <BackgroundPicker />
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

        {/* Shared access */}
        <div style={card}>
          <h3 style={cardTitle}>Shared access</h3>
          <p style={cardLead}>Invite another reader to share your Libry — reading together, one library.</p>
          <SharedAccess userId={user.id} myUsername={profile?.username || ""} initial={sharedWith} />
        </div>

        {/* Refer & earn (ReferralLink is self-boxed) */}
        <ReferralLink refCode={refCode} count={referralCount} />
        <ReferralReward />

        {/* Danger zone */}
        <div style={{ ...card, borderColor: "rgba(181,83,63,0.4)" }}>
          <h3 style={{ ...cardTitle, color: "var(--terracotta, #b5533f)" }}>Danger zone</h3>
          <p style={cardLead}>Permanently delete your account and all of its data. This can&apos;t be undone.</p>
          <DeleteAccount />
        </div>
      </section>
    </>
  );
}
