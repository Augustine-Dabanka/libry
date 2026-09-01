export const AGE_RATINGS = ["Everyday", "Teen", "Mature"] as const;
export type AgeRating = (typeof AGE_RATINGS)[number];

// Display labels for the stored values.
export const AGE_LABEL: Record<string, string> = {
  Everyday: "Everyday / Kids",
  Teen: "Teen (13+)",
  Mature: "Mature (18+)",
};

// Which ratings a viewer may see. Mature is hidden by default, shown only when
// the reader has toggled "show mature content" on in their settings.
export function allowedRatings(showMature: boolean | null | undefined): string[] {
  return showMature ? ["Everyday", "Teen", "Mature"] : ["Everyday", "Teen"];
}
