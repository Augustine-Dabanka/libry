"use client";

import { useEffect, useState } from "react";
import { addToCart, getCart, onCartChange, openCart, type CartItem } from "@/lib/cart";

// Add-to-cart for a priced book on the detail page. Once added, it flips to a
// link that opens the cart drawer.
export default function AddToCartButton({ item }: { item: CartItem }) {
  const [inCart, setInCart] = useState(false);

  useEffect(() => {
    const sync = () => setInCart(getCart().some((i) => String(i.id) === String(item.id)));
    sync();
    return onCartChange(sync);
  }, [item.id]);

  if (inCart) {
    return (
      <button className="btn btn-outline" type="button" onClick={openCart}>
        In cart — view →
      </button>
    );
  }

  return (
    <button
      className="btn btn-gold"
      type="button"
      onClick={() => {
        addToCart(item);
        openCart();
      }}
    >
      Add to cart
    </button>
  );
}
