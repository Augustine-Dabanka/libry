/** @type {import('tailwindcss').Config} */
// Partial Tailwind adoption for Libry. Two guardrails keep it from touching the
// existing custom-CSS design system:
//   1. preflight OFF  → no global reset, existing styles are untouched.
//   2. prefix "tw-"    → every utility is tw-* so nothing collides with our
//                        existing class names (.btn, .badge, .cc-card, …).
// Use tw-* utilities freely in new/experimental UI; the rest of the app keeps
// its custom CSS. Brand tokens are bridged below so tw- colors match the theme.
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  corePlugins: { preflight: false },
  prefix: "tw-",
  theme: {
    extend: {
      colors: {
        gold: "var(--gold)",
        ivory: "var(--ivory)",
        "ivory-muted": "var(--ivory-muted)",
        stone: "var(--stone)",
        charcoal: "var(--charcoal)",
        muted: "var(--muted)",
        border: "var(--border)",
      },
      fontFamily: {
        sans: ["var(--sans)", "system-ui", "sans-serif"],
        serif: ["var(--serif)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
