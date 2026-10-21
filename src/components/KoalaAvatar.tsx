"use client";

import Mascot, { type KoalaLook, type MascotFur, type MascotHat, type MascotKind, type MascotScarf } from "@/components/Mascot";

// A reader's own koala, as built in the sign-up "Customise" step or Settings.
// Stored as profiles.avatar (jsonb, see 0046). Anything missing falls back to
// the default koala, so an old or partial value never breaks.
export const FURS: { key: MascotFur; name: string; swatch: string }[] = [
  { key: "grey", name: "Classic grey", swatch: "#9CA8B6" },
  { key: "cocoa", name: "Cocoa", swatch: "#9C7458" },
  { key: "cream", name: "Cream", swatch: "#E2CFB2" },
  { key: "midnight", name: "Midnight", swatch: "#454E68" },
  { key: "laterite", name: "Laterite", swatch: "#D96A42" },
];
export const SCARVES: { key: MascotScarf; name: string; swatch: string }[] = [
  { key: "gold", name: "Gold", swatch: "#E2B04A" },
  { key: "laterite", name: "Laterite", swatch: "#C8471F" },
  { key: "adire", name: "Adire", swatch: "#3446D4" },
  { key: "palm", name: "Palm", swatch: "#1E7F5C" },
  { key: "sobolo", name: "Sobolo", swatch: "#C42B6B" },
];
export const HATS: { key: MascotHat | "none"; name: string }[] = [
  { key: "none", name: "No hat" },
  { key: "beanie", name: "Beanie" },
  { key: "party", name: "Party" },
  { key: "crown", name: "Crown" },
  { key: "heart", name: "Heart" },
];
export const KINDS: { key: MascotKind; name: string }[] = [
  { key: "neutral", name: "Just bushbaby" },
  { key: "girl", name: "Girl" },
  { key: "boy", name: "Boy" },
];
export const BGS = ["#FDEDE5", "#E6F0EC", "#E9ECFB", "#FBE7EF", "#FBF0D9"];

export const DEFAULT_LOOK: Required<KoalaLook> = { fur: "grey", scarf: "laterite", hat: "none", glasses: false, book: true, bg: "#FDEDE5", kind: "neutral" };

export function normalizeLook(v: unknown): Required<KoalaLook> {
  const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  const pick = <T extends string>(x: unknown, list: readonly { key: T }[], d: T): T =>
    list.some((i) => i.key === x) ? (x as T) : d;
  return {
    fur: pick(o.fur, FURS, DEFAULT_LOOK.fur),
    scarf: pick(o.scarf, SCARVES, DEFAULT_LOOK.scarf),
    hat: pick(o.hat, HATS, DEFAULT_LOOK.hat),
    glasses: o.glasses === true,
    book: o.book !== false,
    bg: typeof o.bg === "string" && BGS.includes(o.bg) ? o.bg : DEFAULT_LOOK.bg,
    kind: pick(o.kind, KINDS, DEFAULT_LOOK.kind),
  };
}

export default function KoalaAvatar({ look, size = 96, mood = "idle", interactive = false, cape = false }: { look: unknown; size?: number; mood?: "idle" | "wave" | "cheer"; interactive?: boolean; cape?: boolean }) {
  const l = normalizeLook(look);
  return (
    <span style={{ display: "inline-grid", placeItems: "center", width: size, height: size, borderRadius: "50%", background: l.bg, overflow: "hidden", flexShrink: 0 }}>
      <span style={{ marginTop: size * 0.12 }}>
        <Mascot
          size={size * 0.92}
          mood={mood}
          interactive={interactive}
          fur={l.fur}
          scarf={l.scarf}
          glasses={l.glasses}
          kind={l.kind}
          cape={cape}
          hat={l.hat === "none" ? undefined : l.hat}
          prop={l.book ? "book" : undefined}
          label="Your bushbaby"
        />
      </span>
    </span>
  );
}
