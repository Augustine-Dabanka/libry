# Holiday theme engine

The reusable rules and registry live in `src/lib/holidayEngine.ts`. Date-sensitive functions accept an injected `Date`, so unit tests and previews do not need to alter the machine clock.

## Add or adjust a holiday

Add a `HolidayTheme` entry to `HOLIDAY_REGISTRY` with a stable `id`, display name, ISO 3166-1 alpha-2 country codes (or `*` for global), priority, enabled flag, activation window, rule, and palette. Country-specific themes win over global themes; ties are resolved by descending priority.

Supported rules:
- `fixed`: Gregorian month/day.
- `range`: Gregorian date range; ranges may cross New Year.
- `easter`: Western Gregorian Easter with configurable day offsets.
- `annual-dates`: explicitly reviewed dates by year. Use this for lunar holidays whose observed date varies by country or moon-sighting authority. Empty or missing years deliberately produce no activation.

Do not invent Islamic dates or treat a predicted date as universal. Populate `annual-dates.dates` with approved local calendar data for the selected country/year. Keep source and review notes in the change description when updating dates.

## Preview and test

Call `selectHolidayTheme({ date: new Date(2026, 9, 31, 12), country: "GH" })` to preview Halloween selection. The date argument is local-calendar time; use midday in tests to avoid daylight-saving boundary ambiguity. Pass `manualTheme: "halloween"` to test a manual override, or `automatic: false` to verify that automatic themes are disabled.

The current application also has an admin-managed schedule in `src/lib/themes.ts` and `src/lib/themeSchedule.ts`. Keep its existing keys and storage behavior compatible while integrating new registry entries into the pre-paint boot script.
