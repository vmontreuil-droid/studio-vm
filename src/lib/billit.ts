// Billit REST-client — gebruikt als Peppol Access Point én bookkeeping-
// bridge. Auth gaat via een ApiKey-header die Vincent zelf in
// /admin/instellingen kan invullen; geen omgevingsvariabele dus, zodat
// de key per-firma kan verschillen (handig als hij later voor klanten
// werkt).
//
// API docs: https://my.billit.be — login en zie 'API'-sectie voor je
// persoonlijke key. Endpoints: https://api.billit.be/v1
//
// Faalt-stil-design: een API-fout mag NOOIT de Mollie-webhook of de
// klant-flow blokkeren. We loggen het in invoices.peppol_error en geven
// 'mislukt' als status terug. Manueel opnieuw verzenden kan vanuit
// /admin/facturen.

import { getCompanySettings } from "@/lib/admin/settings";

const BILLIT_BASE = "https://api.billit.be/v1";

export type BillitClient = {
  customer_name: string;
  customer_vat: string | null;
  customer_address: string | null; // multiline, free-form
  customer_email: string;
  postal_code: string | null;
  city: string | null;
  country: string | null; // ISO-2, default BE
};

export type BillitLine = {
  description: string;
  amount_excl_cents: number;
  vat_rate: number; // 21 voor 21%, 0 voor vrijgesteld
  quantity?: number; // default 1
};

export type BillitInvoiceInput = {
  number: string; // ons factuurnummer (Billit slaat dit op als externe ref)
  issued_at: string; // YYYY-MM-DD
  lines: BillitLine[];
  client: BillitClient;
};

export type BillitResult =
  | {
      ok: true;
      billit_order_id: string;
      peppol_status: "verzonden" | "wachten" | "niet_vereist";
    }
  | { ok: false; error: string };

type Cfg = {
  apiKey: string;
  companyId: string;
};

// Haalt Billit-config uit company_settings. Returns null als niet
// geconfigureerd — caller doet dan niets (geen crash, geen Peppol).
async function getCfg(): Promise<Cfg | null> {
  const s = await getCompanySettings();
  type Extra = {
    billit_api_key?: string | null;
    billit_company_id?: string | null;
  };
  const e = s as unknown as Extra;
  if (!e.billit_api_key || !e.billit_company_id) return null;
  return {
    apiKey: e.billit_api_key,
    companyId: e.billit_company_id,
  };
}

// Eén centrale wrapper: voegt auth-headers toe + retry op 5xx + timeout.
async function billitFetch(
  cfg: Cfg,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = `${BILLIT_BASE}${path}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: {
          ApiKey: cfg.apiKey,
          partyID: cfg.companyId,
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(init?.headers ?? {}),
        },
        signal: AbortSignal.timeout(15_000),
      });
      // Op 5xx: nog eens proberen (Billit-platform kan tijdelijk traag)
      if (res.status >= 500 && attempt < 2) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
      return res;
    } catch (e) {
      if (attempt === 2) throw e;
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  throw new Error("billit: unreachable");
}

// Maakt een uitgaande factuur in Billit, gestructureerd zoals zij het
// verwachten (Customer + OrderLines + OrderType=Invoice + OrderDirection
// =Outgoing). Returnt het Billit-order-id zodat wij het kunnen bewaren.
async function createOrder(
  cfg: Cfg,
  input: BillitInvoiceInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const body = {
    OrderType: "Invoice",
    OrderDirection: "Outgoing",
    OrderNumber: input.number,
    OrderDate: input.issued_at,
    Customer: {
      Name: input.client.customer_name,
      VATNumber: input.client.customer_vat || undefined,
      Email: input.client.customer_email,
      Street: input.client.customer_address || undefined,
      Zipcode: input.client.postal_code || undefined,
      City: input.client.city || undefined,
      CountryCode: input.client.country || "BE",
    },
    OrderLines: input.lines.map((l) => ({
      Description: l.description,
      Quantity: l.quantity ?? 1,
      UnitPriceExcl: (l.amount_excl_cents / 100).toFixed(2),
      VATPercentage: l.vat_rate,
    })),
  };
  const res = await billitFetch(cfg, "/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      error: `Billit ${res.status}: ${text.slice(0, 300)}`,
    };
  }
  const data = (await res.json()) as { OrderID?: string; Id?: string };
  const id = data.OrderID || data.Id;
  if (!id) return { ok: false, error: "Billit gaf geen OrderID terug" };
  return { ok: true, id };
}

// Triggert Peppol-verzending op een bestaande Billit-order. Idempotent:
// als Billit al weet dat de order verzonden is, geeft het 200 OK terug
// zonder dubbel te versturen.
async function triggerPeppol(
  cfg: Cfg,
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await billitFetch(cfg, `/orders/commands/send`, {
    method: "POST",
    body: JSON.stringify({
      Transporttype: "Peppol",
      OrderIDs: [orderId],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      error: `Billit-Peppol ${res.status}: ${text.slice(0, 300)}`,
    };
  }
  return { ok: true };
}

// High-level entry: push naar Billit + Peppol versturen indien klant
// een btw-nummer heeft (= B2B). Voor particulieren doen we niets — die
// krijgen alleen de PDF-factuur via onze eigen factuur-page.
export async function sendInvoiceViaBillit(
  input: BillitInvoiceInput,
): Promise<BillitResult> {
  // Particulier? Geen Peppol nodig.
  if (!input.client.customer_vat) {
    return { ok: true, billit_order_id: "", peppol_status: "niet_vereist" };
  }
  const cfg = await getCfg();
  if (!cfg) {
    return {
      ok: false,
      error: "Billit niet geconfigureerd in company_settings",
    };
  }
  const created = await createOrder(cfg, input);
  if (!created.ok) return { ok: false, error: created.error };
  const sent = await triggerPeppol(cfg, created.id);
  if (!sent.ok) {
    // Order staat WEL in Billit (kan manueel verstuurd worden vanuit
    // hun UI of via /admin/facturen retry-knop) — daarom 'wachten'.
    return {
      ok: true,
      billit_order_id: created.id,
      peppol_status: "wachten",
    };
  }
  return {
    ok: true,
    billit_order_id: created.id,
    peppol_status: "verzonden",
  };
}

// Voor manuele 'verzend opnieuw' vanuit /admin/facturen.
export async function resendPeppol(
  billitOrderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const cfg = await getCfg();
  if (!cfg)
    return {
      ok: false,
      error: "Billit niet geconfigureerd in company_settings",
    };
  return triggerPeppol(cfg, billitOrderId);
}
