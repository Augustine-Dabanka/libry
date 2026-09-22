import { Skeleton, BookGridSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="section" style={{ paddingTop: "2rem" }}>
      <Skeleton w={220} h={30} r={8} style={{ marginBottom: "1.4rem" }} />
      <BookGridSkeleton count={18} />
    </div>
  );
}
