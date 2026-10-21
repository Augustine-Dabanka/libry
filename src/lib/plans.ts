// Lybry Unlimited plan definitions — shared by the server action and the client
// customizer so pricing stays in one place.
export type Plan = "weekly" | "monthly" | "yearly";

export const PLAN_PRICE: Record<Plan, number> = { weekly: 2.49, monthly: 6.99, yearly: 59 };
// Books a plan lets you keep per period. Fixed per plan (it used to be a free
// choice up to 50 at the same price, which a weekly plan could abuse).
export const PLAN_PICKS: Record<Plan, number> = { weekly: 1, monthly: 4, yearly: 48 };
export const PERIOD_DAYS: Record<Plan, number> = { weekly: 7, monthly: 30, yearly: 365 };

export const PLAN_LABEL: Record<Plan, string> = { weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" };
export const PLAN_UNIT: Record<Plan, string> = { weekly: "/ week", monthly: "/ month", yearly: "/ year" };
