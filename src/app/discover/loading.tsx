import { Skeleton, BookGridSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <section className="section" style={{ maxWidth: 1100, marginInline: "auto" }}>
      <Skeleton w={180} h={30} r={8} />
      <div style={{ display: "flex", gap: "0.5rem", margin: "1.2rem 0" }}>
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} w={90} h={32} r={999} />)}
      </div>
      <Skeleton w={260} h={12} style={{ marginBottom: "1.4rem" }} />
      <BookGridSkeleton count={12} />
    </section>
  );
}
