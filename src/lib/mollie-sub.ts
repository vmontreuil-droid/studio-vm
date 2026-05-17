import { mollieApiKey, siteUrl } from "@/lib/supabase/config";

// Recurring-abonnement via Mollie: klant → eerste betaling (mandaat) →
// maandelijks abonnement. Zonder MOLLIE_API_KEY doet alles niets
// (return null) — volledig inert tot de keys gezet zijn.

const API = "https://api.mollie.com/v2";
const WEBHOOK = `${siteUrl}/api/mollie/webhook`;

function eur(cents: number) {
  return (cents / 100).toFixed(2);
}

export async function mollieCreateCustomer(
  email: string,
  name: string,
): Promise<string | null> {
  if (!mollieApiKey) return null;
  try {
    const res = await fetch(`${API}/customers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mollieApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, name: name || email }),
    });
    if (!res.ok) return null;
    const c = (await res.json()) as { id?: string };
    return c.id ?? null;
  } catch {
    return null;
  }
}

// Eerste betaling met sequenceType "first": legt het mandaat vast zodat
// daarna maandelijks automatisch geïnd kan worden.
export async function mollieFirstPayment(input: {
  customerId: string;
  amountCents: number;
  description: string;
  redirectUrl: string;
  metadata: Record<string, string>;
}): Promise<{ id: string; checkoutUrl: string } | null> {
  if (!mollieApiKey) return null;
  try {
    const res = await fetch(`${API}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mollieApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: { currency: "EUR", value: eur(input.amountCents) },
        description: input.description,
        redirectUrl: input.redirectUrl,
        webhookUrl: WEBHOOK,
        customerId: input.customerId,
        sequenceType: "first",
        metadata: input.metadata,
      }),
    });
    if (!res.ok) return null;
    const p = (await res.json()) as {
      id?: string;
      _links?: { checkout?: { href?: string } };
    };
    const url = p._links?.checkout?.href;
    if (!p.id || !url) return null;
    return { id: p.id, checkoutUrl: url };
  } catch {
    return null;
  }
}

// Maandelijks abonnement op de bestaande klant/mandaat.
export async function mollieCreateSubscription(input: {
  customerId: string;
  amountCents: number;
  description: string;
  metadata: Record<string, string>;
}): Promise<string | null> {
  if (!mollieApiKey) return null;
  try {
    const res = await fetch(
      `${API}/customers/${encodeURIComponent(input.customerId)}/subscriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mollieApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: { currency: "EUR", value: eur(input.amountCents) },
          interval: "1 month",
          description: input.description,
          webhookUrl: WEBHOOK,
          metadata: input.metadata,
        }),
      },
    );
    if (!res.ok) return null;
    const s = (await res.json()) as { id?: string };
    return s.id ?? null;
  } catch {
    return null;
  }
}

export async function mollieCancelSubscription(
  customerId: string,
  subId: string,
): Promise<void> {
  if (!mollieApiKey || !customerId || !subId) return;
  try {
    await fetch(
      `${API}/customers/${encodeURIComponent(
        customerId,
      )}/subscriptions/${encodeURIComponent(subId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${mollieApiKey}` },
      },
    );
  } catch {
    /* stil */
  }
}
