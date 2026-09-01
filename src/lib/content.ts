export const AGE_RATINGS = ["All Ages", "9+", "13+", "18+"] as const;

// Which book age-ratings a reader may see, from their onboarding age band.
// Minors are strictly gated; unknown/adult sees everything.
export function allowedRatings(agePref?: string | null): string[] {
  if (agePref === "Under 13") return ["All Ages", "9+"];
  if (agePref === "13-17") return ["All Ages", "9+", "13+"];
  return ["All Ages", "9+", "13+", "18+"];
}
