import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <section className="section" style={{ maxWidth: 1040, marginInline: "auto" }}>
      <Skeleton w={240} h={30} r={8} />
      <Skeleton w={320} h={12} style={{ margin: "0.7rem 0 1.4rem" }} />
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.4rem" }}>
        {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} w={80} h={32} r={999} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
            <Skeleton w="100%" h={96} r={0} />
            <div style={{ padding: "0.9rem 1rem 1.1rem" }}>
              <Skeleton w="70%" h={14} />
              <Skeleton w="90%" h={10} style={{ marginTop: "0.5rem" }} />
              <Skeleton w="40%" h={10} style={{ marginTop: "0.5rem" }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
