// Libry's own icon set: 24px grid, 1.75 stroke, round caps. Replaces emoji
// across the UI so icons look the same on every phone and computer.
// Inline SVG: no extra requests, no icon font, inherits `color`.
const PATHS = {
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18",
  sun: "M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
  store: "M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2",
  comics: "M3 4h18v16H3zM12 4v9M3 13h18M8 13v7",
  interactive: "M4 5a2 2 0 1 0 4 0a2 2 0 1 0-4 0M4 19a2 2 0 1 0 4 0a2 2 0 1 0-4 0M16 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0M6 7v10M6 12h10",
  discover: "M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0M15.5 8.5l-2 5-5 2 2-5z",
  read: "M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3zM21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z",
  book: "M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h11",
  coins: "M5 7a7 3 0 1 0 14 0a7 3 0 1 0-14 0M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5",
  members: "M6 8a3 3 0 1 0 6 0a3 3 0 1 0-6 0M3 20a6 6 0 0 1 12 0M14.5 9a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M16 14.5a5 5 0 0 1 5 5.5",
  calm: "M5 19c0-8 6-14 15-14 0 9-6 15-14 15M5 19l7-7",
  search: "M4 11a7 7 0 1 0 14 0a7 7 0 1 0-14 0M20 20l-4-4",
  star: "M12 3l2.8 5.9 6.2.7-4.6 4.3 1.2 6.1L12 17l-5.6 3 1.2-6.1L3 9.6l6.2-.7z",
  chat: "M4 5h16v11H9l-5 4z",
  write: "M4 20l4-1 11-11-3-3L5 16zM14 6l3 3",
  save: "M6 3h12v18l-6-4-6 4z",
  streak: "M12 21c-4 0-7-2.7-7-6.5 0-3.5 3-5.5 4-9 2 1.5 3 3 3 5 1-1 1.5-2 1.5-3.5 2.5 2 5.5 4.5 5.5 7.5 0 3.8-3 6.5-7 6.5z",
  trophy: "M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M8 20h8M9 17h6",
  gift: "M3 7h18v4H3zM5 11h14v9H5zM12 7v13M12 7C10 3 6 4 7.5 7M12 7c2-4 6-3 4.5 0",
  home: "M4 11l8-7 8 7v9h-5v-6H9v6H4z",
  library: "M4 20h16M6 20V5h3v15M10 20V7h3v13M14.5 19.5l2.8-13 3 .6-2.8 13",
  profile: "M8 8a4 4 0 1 0 8 0a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0",
  check: "M5 12.5l4.5 4.5L19 7",
  lock: "M5 11h14v10H5zM8 11V8a4 4 0 0 1 8 0v3",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  target: "M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0M7 12a5 5 0 1 0 10 0a5 5 0 1 0-10 0M11 12a1 1 0 1 0 2 0a1 1 0 1 0-2 0",
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({
  name,
  size = 20,
  strokeWidth = 1.75,
  label,
  style,
  className,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  /** Set only when the icon carries meaning on its own (no visible text next to it). */
  label?: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className={className}
      style={{ flexShrink: 0, verticalAlign: "-0.15em", ...style }}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
