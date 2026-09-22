import { Skeleton, BookGridSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="section" style={{ paddingTop: "2rem" }}>
      <Skeleton w={200} h={30} r={8} style={{ marginBottom: "1.4rem" }} />
      <BookGridSkeleton count={12} />
    </div>
  );
}
