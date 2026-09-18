// Server-only Paystack Transfers helper — sends a creator's payout to their
// mobile-money or bank account. Best-effort: every failure returns a clear
// message so the admin can fall back to a manual transfer.
//
// Requires: PAYSTACK_SECRET_KEY, Transfers enabled + verified on the Paystack
// business, and (for full automation) "OTP for transfers" DISABLED in Paystack
// settings — otherwise Paystack queues the transfer pending an OTP.

const API = "https://api.paystack.co";
const RATE = Number(process.env.NEXT_PUBLIC_PAYSTACK_USD_RATE || "1") || 1;

type Acct = { method: string; provider: string | null; account_name: string | null; account_number: string | null };

function headers() {
  return { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" };
}

// Common Ghana mobile-money provider aliases → Paystack bank_code.
const MOMO_CODES: Record<string, string> = {
  mtn: "MTN", "mtn mobile money": "MTN", momo: "MTN",
  vodafone: "VOD", "vodafone cash": "VOD", telecel: "VOD", "telecel cash": "VOD",
  airteltigo: "ATL", "airtel tigo": "ATL", "airtel": "ATL", tigo: "ATL",
};

async function resolveBankCode(provider: string, type: "mobile_money" | "ghipss"): Promise<string | null> {
  const name = (provider || "").trim().toLowerCase();
  if (!name) return null;
  if (type === "mobile_money" && MOMO_CODES[name]) return MOMO_CODES[name];
  try {
    const r = await fetch(`${API}/bank?currency=GHS&type=${type}`, { headers: headers(), cache: "no-store" });
    const j = await r.json();
    const list: { name: string; code: string }[] = j?.data ?? [];
    const hit = list.find((b) => b.name.toLowerCase() === name)
      || list.find((b) => b.name.toLowerCase().includes(name) || name.includes(b.name.toLowerCase()));
    return hit?.code ?? null;
  } catch {
    return null;
  }
}

export type TransferResult = { ok: boolean; status?: "success" | "pending" | "otp"; reference?: string; error?: string };

// Send `amountUsd` (converted to GHS via RATE) to the given account.
export async function sendPaystackTransfer(amountUsd: number, acct: Acct, reason: string): Promise<TransferResult> {
  if (!process.env.PAYSTACK_SECRET_KEY) return { ok: false, error: "Paystack secret key isn't set." };
  if (!acct?.account_number) return { ok: false, error: "No payout account on file." };
  const isMomo = acct.method !== "bank";
  const type = isMomo ? "mobile_money" : "ghipss";

  const bankCode = await resolveBankCode(acct.provider || "", type);
  if (!bankCode) return { ok: false, error: `Couldn't match "${acct.provider}" to a Paystack ${isMomo ? "mobile-money network" : "bank"}. Send this one manually.` };

  try {
    // 1) Create (or reuse) a transfer recipient.
    const recRes = await fetch(`${API}/transferrecipient`, {
      method: "POST", headers: headers(),
      body: JSON.stringify({
        type, name: acct.account_name || "Libry creator",
        account_number: acct.account_number, bank_code: bankCode, currency: "GHS",
      }),
      cache: "no-store",
    });
    const recJ = await recRes.json();
    const recipient = recJ?.data?.recipient_code;
    if (!recipient) return { ok: false, error: recJ?.message || "Couldn't create the transfer recipient." };

    // 2) Initiate the transfer from the Paystack balance.
    const amountMinor = Math.round(amountUsd * RATE * 100);
    const trRes = await fetch(`${API}/transfer`, {
      method: "POST", headers: headers(),
      body: JSON.stringify({ source: "balance", amount: amountMinor, recipient, currency: "GHS", reason }),
      cache: "no-store",
    });
    const trJ = await trRes.json();
    if (!trJ?.status) return { ok: false, error: trJ?.message || "Paystack rejected the transfer." };
    const status = trJ?.data?.status as TransferResult["status"];
    const reference = trJ?.data?.transfer_code || trJ?.data?.reference;
    if (status === "otp") {
      return { ok: false, status: "otp", reference, error: "Paystack needs an OTP for this transfer. Disable “OTP for transfers” in Paystack settings for full automation, or approve it in your Paystack dashboard." };
    }
    return { ok: true, status: status || "pending", reference };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Transfer failed." };
  }
}
