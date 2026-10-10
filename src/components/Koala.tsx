import Mascot, { type MascotMood } from "@/components/Mascot";

export type KoalaState = "idle" | "happy" | "sad" | "frozen" | "detective";

// Old API, new koala: maps the streak states onto the v2 mascot (Mascot.tsx).
const MOOD: Record<KoalaState, MascotMood> = {
  idle: "idle",
  happy: "cheer",
  sad: "sad",
  frozen: "sad",
  detective: "think",
};

export default function Koala({ state = "idle", size = 96 }: { state?: KoalaState; size?: number }) {
  return (
    <span style={{ display: "inline-block", filter: state === "frozen" ? "hue-rotate(170deg) saturate(0.6) brightness(1.1)" : undefined }}>
      <Mascot mood={MOOD[state]} size={size} prop={state === "detective" ? "magnifier" : undefined} label={`Koala (${state})`} />
    </span>
  );
}
