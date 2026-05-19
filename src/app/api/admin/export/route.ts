import { type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Boekhoudkundige export voor de accountant: één CSV per soort
// (verkoop / aankoop / creditnota's) over een boekjaar.
function csv(rows: (string | number)[][]): string {
  return rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c ?? "");
          return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(";"),
    )
    .join("\r\n");
}
const e = (c: number) => (c / 100).toFixed(2).replace(".", ",");

export async function GET(req: NextRequest) {
  if (!adminConfigured || !(await requireAdmin())) {
    return new Response("unauthorized", { status: 401 });
  }
  const sp = req.nextUrl.searchParams;
  const year = Number(sp.get("year")) || new Date().getFullYear();
  const type = sp.get("type") || "verkoop";
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const db = getSupabaseAdmin();

  let rows: (string | number)[][] = [];
  let fname = `export-${year}.csv`;

  if (type === "verkoop") {
    const { data } = await db
      .from("invoices")
      .select("number, client_email, description, amount_cents, status, issued_at, paid_at")
      .gte("issued_at", from)
      .lte("issued_at", to)
      .order("issued_at", { ascending: true })
      .limit(5000);
    rows = [
      ["Nummer", "Klant", "Omschrijving", "Excl. btw", "Btw 21%", "Incl. btw", "Status", "Datum", "Betaald op"],
      ...((data as Record<string, unknown>[] | null) ?? []).map((i) => {
        const net = (i.amount_cents as number) ?? 0;
        const vat = Math.round(net * 0.21);
        return [
          i.number as string,
          (i.client_email as string) ?? "",
          (i.description as string) ?? "",
          e(net),
          e(vat),
          e(net + vat),
          (i.status as string) ?? "",
          (i.issued_at as string) ?? "",
          (i.paid_at as string)?.slice(0, 10) ?? "",
        ];
      }),
    ];
    fname = `verkoop-${year}.csv`;
  } else if (type === "aankoop") {
    const { data } = await db
      .from("purchase_invoices")
      .select("number, supplier_name, category, net_cents, vat_cents, total_cents, status, invoice_date")
      .gte("invoice_date", from)
      .lte("invoice_date", to)
      .order("invoice_date", { ascending: true })
      .limit(5000);
    rows = [
      ["Nummer", "Leverancier", "Categorie", "Excl. btw", "Btw", "Incl. btw", "Status", "Datum"],
      ...((data as Record<string, unknown>[] | null) ?? []).map((p) => [
        (p.number as string) ?? "",
        (p.supplier_name as string) ?? "",
        (p.category as string) ?? "",
        e((p.net_cents as number) ?? 0),
        e((p.vat_cents as number) ?? 0),
        e((p.total_cents as number) ?? 0),
        (p.status as string) ?? "",
        (p.invoice_date as string) ?? "",
      ]),
    ];
    fname = `aankoop-${year}.csv`;
  } else {
    const { data } = await db
      .from("credit_notes")
      .select("number, client_email, amount_cents, vat_rate, reason, status, issued_at")
      .gte("issued_at", from)
      .lte("issued_at", to)
      .order("issued_at", { ascending: true })
      .limit(5000);
    rows = [
      ["Nummer", "Klant", "Excl. btw", "Btw", "Incl. btw", "Reden", "Status", "Datum"],
      ...((data as Record<string, unknown>[] | null) ?? []).map((c) => {
        const net = (c.amount_cents as number) ?? 0;
        const vat = Math.round(net * (((c.vat_rate as number) ?? 21) / 100));
        return [
          c.number as string,
          (c.client_email as string) ?? "",
          e(-net),
          e(-vat),
          e(-(net + vat)),
          (c.reason as string) ?? "",
          (c.status as string) ?? "",
          (c.issued_at as string) ?? "",
        ];
      }),
    ];
    fname = `creditnotas-${year}.csv`;
  }

  return new Response("﻿" + csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fname}"`,
    },
  });
}
