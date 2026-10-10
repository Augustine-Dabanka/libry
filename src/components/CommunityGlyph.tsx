import Glyph from "@/components/Glyph";

// A community's icon. Rooms store an emoji in the database; this shows it as a
// Leep icon (falls back to a stack of books).
export default function CommunityGlyph({ value, size = "1em" }: { value?: string | null; size?: number | string }) {
  return <Glyph e={value || "📚"} size={size} />;
}
