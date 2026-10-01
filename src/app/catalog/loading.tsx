import { Skeleton, BookGridSkeleton } from "@/components/Skeleton";
import LibryLoader from "@/components/LibryLoader";

export default function Loading() {
  return (
    <div className="section" style={{ paddingTop: "2rem" }}>
      <div className="ll-loading"><LibryLoader size={44} label="Loading the catalog" /></div>
      <Skeleton w={220} h={30} r={8} style={{ marginBottom: "1.4rem" }} />
      <BookGridSkeleton count={18} />
    </div>
  );
}
