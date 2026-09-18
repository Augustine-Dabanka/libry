// Libry Unlimited plan definitions — shared by the server action and the client
// customizer so pricing stays in one place.
export type Plan = "weekly" | "monthly" | "yearly";

export const PLAN_PRICE: Record<Plan, number> = { weekly: 2.49, monthly: 6.99, yearly: 59 };
export const PERIOD_DAYS: Record<Plan, number> = { weekly: 7, monthly: 30, yearly: 365 };

export const PLAN_LABEL: Record<Plan, string> = { weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" };
export const PLAN_UNIT: Record<Plan, string> = { weekly: "/ week", monthly: "/ month", yearly: "/ year" };
