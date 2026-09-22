import LibryLoader from "@/components/LibryLoader";

export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--charcoal)", display: "grid", placeItems: "center" }}>
      <LibryLoader label="Opening your story…" minHeight="auto" />
    </div>
  );
}
