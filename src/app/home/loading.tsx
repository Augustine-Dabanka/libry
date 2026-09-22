import { Skeleton, RailSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="section" style={{ paddingTop: "2rem" }}>
      <Skeleton w="min(420px, 80%)" h={34} r={8} />
      <Skeleton w="min(320px, 60%)" h={14} style={{ marginTop: "0.8rem", marginBottom: "2rem" }} />
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ marginBottom: "1.8rem" }}>
          <Skeleton w={200} h={16} style={{ marginBottom: "0.9rem" }} />
          <RailSkeleton count={6} />
        </div>
      ))}
    </div>
  );
}
