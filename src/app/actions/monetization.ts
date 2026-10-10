"use server";


export const TIERS: Record<string, { priority: number; days: number; price: number }> = {
  Boost: { priority: 10, days: 3, price: 4 },
  Featured: { priority: 20, days: 7, price: 8 },
  Spotlight: { priority: 30, days: 7, price: 15 },
};

// Legacy free "promote" button: it granted home-page placement with no payment.
// Promotions now go through the paid Promote panel (actions/promotions.ts).
export async function promoteBook(_bookId: number, _tier: string) {
  void _bookId; void _tier;
  return { error: "Use Promote in your creator dashboard." };
}

// Token bundles are disabled until purchases are verified server-side with
// Paystack. The old version granted any amount for free to anyone who called it.
export async function buyTokens(_amount: number) {
  void _amount;
  return { error: "Token purchases open soon." };
}
