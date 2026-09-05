"use client";

import { useRouter, useSearchParams } from "next/navigation";

// Sort dropdown that applies immediately on change, preserving the current
// search term and filters.
export default function CatalogSort({ value }: { value: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const sp = new URLSearchParams(Array.from(params.entries()));
    if (e.target.value) sp.set("sort", e.target.value);
    else sp.delete("sort");
    const qs = sp.toString();
    router.push(`/catalog${qs ? "?" + qs : ""}`);
  }

  return (
    <select
      value={value}
      onChange={onChange}
      aria-label="Sort"
      style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 999, color: "var(--ivory)", fontFamily: "var(--sans)", padding: "0.6rem 0.7rem", outline: "none", cursor: "pointer" }}
    >
      <option value="">Sort: featured</option>
      <option value="rating">Top rated</option>
      <option value="title">Title A–Z</option>
      <option value="price-asc">Price: low to high</option>
      <option value="price-desc">Price: high to low</option>
    </select>
  );
}
