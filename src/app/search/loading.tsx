import { Skeleton, BookGridSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <section className="section" style={{ maxWidth: 1040, marginInline: "auto" }}>
      <Skeleton w="min(560px, 100%)" h={48} r={999} style={{ marginBottom: "1.6rem" }} />
      <Skeleton w={200} h={12} style={{ marginBottom: "1rem" }} />
      <BookGridSkeleton count={12} />
    </section>
  );
}
