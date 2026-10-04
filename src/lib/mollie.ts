import { mollieApiKey, paymentsEnabled } from "@/lib/supabase/config";

const API = "https://api.mollie.com/v2";

type CreateInput = {
  amountCents: number;
  description: string;
  redirectUrl: string;
  webhookUrl: string;
  metadata: Record<string, string>;
  /** Taal van de betaalpagina (nl_BE, fr_BE, …); zonder: Mollie kiest zelf. */
  locale?: string;
};

type MolliePayment = {
  id: string;
  status: string;
  amount?: { currency: string; value: string };
  method?: string | null;
  metadata?: Record<string, string> | null;
  _links?: { checkout?: { href?: string } };
};

export async function createMolliePayment(
  input: CreateInput,
): Promise<{ id: string; checkoutUrl: string } | null> {
  if (!mollieApiKey || !paymentsEnabled) return null;
  try {
    const res = await fetch(`${API}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mollieApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: {
          currency: "EUR",
          value: (input.amountCents / 100).toFixed(2),
        },
        description: input.description,
        redirectUrl: input.redirectUrl,
        webhookUrl: input.webhookUrl,
        metadata: input.metadata,
        ...(input.locale ? { locale: input.locale } : {}),
      }),
    });
    if (!res.ok) return null;
    const p = (await res.json()) as MolliePayment;
    const checkoutUrl = p._links?.checkout?.href;
    if (!p.id || !checkoutUrl) return null;
    return { id: p.id, checkoutUrl };
  } catch {
    return null;
  }
}

export async function getMolliePayment(
  id: string,
): Promise<MolliePayment | null> {
  if (!mollieApiKey) return null;
  try {
    const res = await fetch(`${API}/payments/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${mollieApiKey}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as MolliePayment;
  } catch {
    return null;
  }
}
