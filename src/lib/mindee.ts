import { mindeeApiKey } from "@/lib/supabase/config";

// Aankoop-OCR via Mindee (Invoice OCR v4). Optioneel: zonder key
// geeft parseInvoice null terug en valt de UI terug op handmatig.
const ENDPOINT =
  "https://api.mindee.net/v1/products/mindee/invoices/v4/predict";

export type ParsedInvoice = {
  supplierName: string | null;
  supplierVat: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null; // ISO yyyy-mm-dd
  dueDate: string | null;
  netCents: number | null;
  vatCents: number | null;
  totalCents: number | null;
  vatRate: number | null;
};

type MindeeField = { value?: unknown } | undefined;
type MindeeTax = { rate?: number | null; value?: number | null };

function cents(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}
function dateStr(v: unknown): string | null {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)
    ? v.slice(0, 10)
    : null;
}
function fieldValue(f: MindeeField): unknown {
  return f && typeof f === "object" ? f.value : undefined;
}

export async function parseInvoice(
  file: File,
): Promise<ParsedInvoice | null> {
  if (!mindeeApiKey) return null;
  try {
    const body = new FormData();
    body.append("document", file, file.name || "document");
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Token ${mindeeApiKey}` },
      body,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      document?: {
        inference?: {
          prediction?: Record<string, MindeeField | MindeeTax[]>;
        };
      };
    };
    const p = json.document?.inference?.prediction;
    if (!p) return null;

    const taxes = (p.taxes as MindeeTax[] | undefined) ?? [];
    const firstTax = taxes.find((t) => t && t.rate != null);
    const net = cents(fieldValue(p.total_net as MindeeField));
    const vat = cents(fieldValue(p.total_tax as MindeeField));
    const total = cents(fieldValue(p.total_amount as MindeeField));

    return {
      supplierName:
        (fieldValue(p.supplier_name as MindeeField) as string) ?? null,
      supplierVat:
        (fieldValue(
          p.supplier_company_registrations as MindeeField,
        ) as string) ?? null,
      invoiceNumber:
        (fieldValue(p.invoice_number as MindeeField) as string) ?? null,
      invoiceDate: dateStr(fieldValue(p.date as MindeeField)),
      dueDate: dateStr(fieldValue(p.due_date as MindeeField)),
      netCents: net,
      vatCents: vat,
      totalCents: total,
      vatRate:
        firstTax?.rate != null ? Number(firstTax.rate) : null,
    };
  } catch {
    return null;
  }
}
