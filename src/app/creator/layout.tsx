import CreatorNav from "@/components/CreatorNav";

// The Creator Hub runs on its own chrome — separate from the reader app — so
// the two surfaces stop bleeding into each other.
export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CreatorNav />
      {children}
    </>
  );
}
