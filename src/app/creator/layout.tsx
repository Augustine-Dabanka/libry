import AppNav from "@/components/AppNav";

// The Creator Hub now shares the main app's vertical rail nav (desktop) / top bar
// (mobile), so the whole app feels like one place.
export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav />
      {children}
    </>
  );
}
