// Lightweight per-viewer cart kept in localStorage. No server/payment backend
// yet — this holds what a reader wants to buy and drives the cart drawer badge.
// Every mutation dispatches "libry:cart" so open UI (badge, drawer) refreshes.

export type CartItem = {
  id: number | string;
  title: string;
  author: string | null;
  price: number | null;
};

const KEY = "libry_cart";
const EVENT = "libry:cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function save(items: CartItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage blocked — badge just won't persist */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function addToCart(item: CartItem) {
  const items = getCart();
  if (items.some((i) => String(i.id) === String(item.id))) return; // no duplicates
  save([...items, item]);
}

export function removeFromCart(id: number | string) {
  save(getCart().filter((i) => String(i.id) !== String(id)));
}

export function cartCount(): number {
  return getCart().length;
}

export function subtotal(): number {
  return getCart().reduce((sum, i) => sum + (Number(i.price) || 0), 0);
}

export function onCartChange(fn: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, fn);
  window.addEventListener("storage", fn); // sync across tabs
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener("storage", fn);
  };
}

export function openCart() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("libry:cart-open"));
}
