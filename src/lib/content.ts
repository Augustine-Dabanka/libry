// Age ratings a creator can pick. Finer scale than before (Everyone → 18+);
// legacy stored values (Everyday/Teen/Mature/"All Ages") still display and gate
// correctly via the helpers below.
export const AGE_RATINGS = ["Everyone", "9+", "13+", "16+", "18+"] as const;
export type AgeRating = (typeof AGE_RATINGS)[number];

// Full labels for the editor's select.
export const AGE_LABEL: Record<string, string> = {
  Everyone: "Everyone",
  "9+": "Older kids (9+)",
  "13+": "Teen (13+)",
  "16+": "Older teen (16+)",
  "18+": "Mature (18+)",
  // legacy values still in the DB
  Everyday: "Everyone",
  Teen: "Teen (13+)",
  Mature: "Mature (18+)",
  "All Ages": "Everyone",
  "Everyone | Kids": "Everyone",
  "Everyone (Kids)": "Everyone",
};

// Short pill shown on cards and the book page (e.g. "18+", "9+", "All ages").
export function agePill(value: string | null | undefined): string {
  const v = (value || "").trim();
  if (v === "18+" || v === "Mature") return "18+";
  if (v === "16+") return "16+";
  if (v === "13+" || v === "Teen") return "13+";
  if (v === "9+") return "9+";
  return "All ages";
}

// A rating is "mature" (gated behind the 18+ toggle) at 16+ and up.
export function isMatureRating(value: string | null | undefined): boolean {
  const v = (value || "").trim();
  return v === "Mature" || v === "16+" || v === "18+";
}

const NON_MATURE = ["Everyone", "9+", "13+", "Everyday", "Teen", "All Ages", "Everyone | Kids", "Everyone (Kids)"];
const MATURE = ["16+", "18+", "Mature"];

// Which stored values a viewer may see. Mature (16+/18+) is shown only when the
// reader has turned on "show mature content".
export function allowedRatings(showMature: boolean | null | undefined): string[] {
  return showMature ? [...NON_MATURE, ...MATURE] : NON_MATURE;
}

// Genres a creator can publish in (stored in books.category). Free text in the
// DB, so this list can grow without a migration.
export const GENRES = [
  "Fiction",
  "Non-Fiction",
  "Sci-Fi",
  "Fantasy",
  "Romance",
  "Mystery",
  "Thriller",
  "Horror",
  "Historical",
  "Adventure",
  "Young Adult",
  "Children",
  "Poetry",
  "Biography & Memoir",
  "Self-Help",
  "Psychology",
  "Business",
  "Science",
  "Philosophy",
  "Health & Wellness",
  "Spirituality",
  "Comics & Graphic",
] as const;
