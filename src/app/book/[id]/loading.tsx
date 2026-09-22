import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="section" style={{ paddingTop: "2rem" }}>
      <div style={{ display: "flex", gap: "1.6rem", flexWrap: "wrap" }}>
        <Skeleton w={200} h={300} r={12} />
        <div style={{ flex: 1, minWidth: 240 }}>
          <Skeleton w="70%" h={30} />
          <Skeleton w="40%" h={14} style={{ marginTop: "0.7rem" }} />
          <Skeleton w="55%" h={20} style={{ marginTop: "1.1rem" }} />
          <Skeleton w="100%" h={12} style={{ marginTop: "1.2rem" }} />
          <Skeleton w="95%" h={12} style={{ marginTop: "0.5rem" }} />
          <Skeleton w="85%" h={12} style={{ marginTop: "0.5rem" }} />
          <Skeleton w={180} h={48} r={12} style={{ marginTop: "1.4rem" }} />
        </div>
      </div>
    </div>
  );
}
