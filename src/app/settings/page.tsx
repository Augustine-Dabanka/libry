import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import AppearanceMode from "@/components/AppearanceMode";
import LookPicker from "@/components/LookPicker";
import InterfaceStylePicker from "@/components/InterfaceStylePicker";
import SharedAccess from "@/components/SharedAccess";
import AvatarSettings from "@/components/AvatarSettings";
import AccountSettings from "@/components/AccountSettings";
import DeleteAccount from "@/components/DeleteAccount";
import BackgroundPicker from "@/components/BackgroundPicker";
import AccentPicker from "@/components/AccentPicker";
import ProfileLookSettings from "@/components/ProfileLookSettings";
import MatureToggle from "@/components/MatureToggle";
import ReferralLink from "@/components/ReferralLink";
import ReferralReward from "@/components/ReferralReward";
import BecomeCreator from "@/components/BecomeCreator";
import SettingsTabs from "@/components/SettingsTabs";
import VolumeControl from "@/components/VolumeControl";
import AmbienceSettings from "@/components/AmbienceSettings";
import AccessibilitySettings from "@/components/AccessibilitySettings";
import TwoStepSetup from "@/components/TwoStepSetup";
import BirthdateSetting from "@/components/BirthdateSetting";
import { FontStylePicker } from "@/components/StylePrefs";
import { Accessibility, Palette, ShieldCheck, UserRound, Volume2 } from "lucide-react";

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
    .select("full_name, username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  const displayName = profile?.full_name || profile?.username || user.email || "";
  const refCode = profile?.username || user.id;
  // Private columns come from my_profile (0048), which only returns your own row.
  const mp = await supabase.from("my_profile").select("prefs").eq("id", user.id).maybeSingle();
  const prefs = ((mp.data as { prefs?: unknown } | null)?.prefs && typeof (mp.data as { prefs?: unknown }).prefs === "object" ? (mp.data as { prefs: Record<string, unknown> }).prefs : {}) as Record<string, unknown>;
  const sharedWith = Array.isArray(prefs.shared_with) ? (prefs.shared_with as string[]) : [];

  const sm = await supabase.from("my_profile").select("show_mature").eq("id", user.id).maybeSingle();
  const showMature = sm.data?.show_mature ?? false;

  // Koala + pronouns (0046); guarded so Settings works before the migration.
  const lk = await supabase.from("profiles").select("avatar, pronouns").eq("id", user.id).maybeSingle();
  const lookReady = !lk.error;
  const myLook = lk.data ? (lk.data as { avatar?: unknown }).avatar ?? null : null;
  const myPronouns = lk.data ? (lk.data as { pronouns?: string | null }).pronouns ?? null : null;

  const cr = await supabase.from("profiles").select("is_creator").eq("id", user.id).maybeSingle();
  const isCreator = cr.error ? false : !!cr.data?.is_creator;

  const pv = await supabase.from("profile_private").select("date_of_birth").eq("user_id", user.id).maybeSingle();
  const dobReady = !pv.error;
  const myDob = (pv.data as { date_of_birth?: string | null } | null)?.date_of_birth ?? null;

  const rc = await supabase.rpc("my_referral_count");
  const referralCount = typeof rc.data === "number" ? rc.data : 0;

  const section = (title: string, lead: string | null, body: React.ReactNode, extra?: React.CSSProperties) => (
    <div style={{ ...card, ...extra }}>
      <h3 style={cardTitle}>{title}</h3>
      {lead ? <p style={cardLead}>{lead}</p> : null}
      {body}
    </div>
  );

  const general = (
    <>
      {section("Account", "Update your display name or change your password.", <AccountSettings userId={user.id} initialName={displayName} />)}
      {section("Profile photo", "A square photo works best. It's stored on your profile.", <AvatarSettings initialUrl={profile?.avatar_url ?? null} initials={initialsFrom(displayName)} />)}
      {section("Creator account", isCreator ? "You can publish stories on Lybry." : "You have a reader account. Become a creator to publish.", isCreator ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <span className="badge" style={{ background: "color-mix(in srgb, var(--success) 20%, transparent)", color: "var(--success)" }}>Creator ✓</span>
          <a className="btn btn-outline" href="/creator" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}>Open Creator Dashboard →</a>
        </div>
      ) : <BecomeCreator variant="row" />)}
      <ReferralLink refCode={refCode} count={referralCount} />
      <ReferralReward />
      {section("Danger zone", "Permanently delete your account and all of its data. This can't be undone.", <DeleteAccount />, { borderColor: "rgba(181,83,63,0.4)" })}
    </>
  );

  const personal = (
    <>
      {lookReady ? section("Your bushbaby", "Your bushbaby is your face on Lybry: your profile, comments and shelf. Pronouns show on your profile.", <ProfileLookSettings userId={user.id} initialLook={myLook} initialPronouns={myPronouns} />) : null}
      {section("Appearance", "Light, dark, or follow your device. Saved on this device.", <AppearanceMode />)}
      {section("Font style", "Changes headings and buttons. Books keep their reading font. Saved on this device.", <FontStylePicker />)}
      {section("Interface style", "Change how panels, buttons and icons are drawn. Saved on this device.", <InterfaceStylePicker />)}
      {section("Accent color", "Colors your highlights, progress bars and tabs. The Lybry orange stays on buttons and the logo. Saved on this device.", <AccentPicker />)}
      {section("Genre looks", "Give Lybry the mood of what you read. Full palette in dark mode. Saved on this device.", <LookPicker />)}
      {section("Floating background", "A gentle animation behind the app. Off by default.", <BackgroundPicker />)}
    </>
  );

  const sound = (
    <>
      {section("Interface sounds", "Little clicks and taps as you use Lybry. Set to 0 to mute. Saved on this device.", <VolumeControl />)}
      {section("Background sounds", "Ambience while you browse and read. The moving scene matches the sound. It keeps playing as you move around Lybry.", <AmbienceSettings />)}
    </>
  );

  const access = (
    <>
      {section("Reading comfort", "Saved on this device.", <AccessibilitySettings />)}
    </>
  );

  const security = (
    <>
      {dobReady ? section("Date of birth", "Kept private. Used for age-rated books, creator limits and your greeting.", <BirthdateSetting initial={myDob} />) : null}
      {section("Two-step sign-in", "Ask for a code from an app on your phone each time you sign in, so a stolen password alone can't get in.", <TwoStepSetup />)}
      <div style={{ ...card, display: "flex", alignItems: "center", gap: "1.2rem" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--sans)", fontWeight: 700, marginBottom: "0.2rem" }}>Show mature content</div>
          <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem" }}>
            Mature (18+) stories are hidden by default. Turning this on asks for your password and uses the date of birth on your account, which can&apos;t be changed here.
          </div>
        </div>
        <MatureToggle initial={showMature} />
      </div>
      {section("Shared access", "Invite another reader to share your Lybry: reading together, one library.", <SharedAccess userId={user.id} myUsername={profile?.username || ""} initial={sharedWith} />)}
    </>
  );

  const ic = { size: 17, strokeWidth: 2.4 };
  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="section-header">
          <h2>Settings</h2>
        </div>
        <SettingsTabs
          tabs={[
            { key: "general", label: "General", icon: <UserRound {...ic} />, content: general },
            { key: "personalization", label: "Personalization", short: "Style", icon: <Palette {...ic} />, content: personal },
            { key: "sound", label: "Sound", icon: <Volume2 {...ic} />, content: sound },
            { key: "accessibility", label: "Accessibility", short: "Access", icon: <Accessibility {...ic} />, content: access },
            { key: "security", label: "Security", icon: <ShieldCheck {...ic} />, content: security },
          ]}
        />
      </section>
    </>
  );
}
