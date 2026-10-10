// Coin economy constants (shared by server and client).
// 20 coins = 1.00 of list price, so packs and book unlocks use the same rate.
export const COINS_PER_UNIT = 20;
export const AD_REWARD = 5;
export const AD_SECONDS = 15;      // watch this long to earn
export const AD_SKIP_AFTER = 5;    // skipping unlocks after this, but earns nothing
export const AD_DAILY_CAP = 5;

export const COIN_PACKS = [
  { id: "p100", coins: 100, price: 5, label: "100 coins" },
  { id: "p550", coins: 550, price: 25, label: "550 coins", note: "10% bonus" },
] as const;
export type CoinPackId = (typeof COIN_PACKS)[number]["id"];

export function coinCost(price: number | null | undefined): number {
  return Math.ceil(Number(price || 0) * COINS_PER_UNIT);
}
