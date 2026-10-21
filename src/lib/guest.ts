// Guest progress that survives sign-up.
//
// A guest's onboarding answers and the books they opened are kept on this
// device. Answers also go in the `libry_prefs` cookie, which the server copies
// into the new profile at sign-up (see actions/auth.ts and auth/callback). The
// books are copied by syncGuestToAccount() the first time the reader is
// signed in, so "Continue reading" already shows them.
//
// Browser-only helpers: every call is wrapped so private mode or blocked
// storage never breaks the page.

const PREFS_KEY = "leep-guest-prefs";
const BOOKS_KEY = "leep-guest-books";
const MAX_BOOKS = 30;

export type GuestBook = { id: string; at: number };

export function saveGuestPrefs(prefs: Record<string, string>) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
  try {
    const month = 60 * 60 * 24 * 30;
    if (Object.keys(prefs).length) {
      document.cookie = `libry_prefs=${encodeURIComponent(JSON.stringify(prefs))}; path=/; max-age=${month}; samesite=lax`;
    }
    document.cookie = `libry_seen_onboarding=1; path=/; max-age=${month * 12}; samesite=lax`;
  } catch {}
}

export function getGuestPrefs(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === "object" ? (v as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function markGuestBook(bookId: string) {
  try {
    const list = getGuestBooks().filter((b) => b.id !== bookId);
    list.unshift({ id: bookId, at: Date.now() });
    localStorage.setItem(BOOKS_KEY, JSON.stringify(list.slice(0, MAX_BOOKS)));
  } catch {}
}

export function getGuestBooks(): GuestBook[] {
  try {
    const raw = localStorage.getItem(BOOKS_KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? (v as GuestBook[]).filter((b) => b && typeof b.id === "string") : [];
  } catch {
    return [];
  }
}

export function clearGuestBooks() {
  try {
    localStorage.removeItem(BOOKS_KEY);
  } catch {}
}
