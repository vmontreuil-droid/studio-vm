import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { toCsv, csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

type Quote = {
  created_at: string;
  name: string;
  email: string;
  source: string | null;
  status: string;
  locale: string;
  base: string;
  plan: string;
  est_low: number | null;
  est_high: number | null;
  modules: string[] | null;
  message: string | null;
  notes: string | null;
};

export async function GET() {
  if (!adminConfigured || !(await requireAdmin())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data } = await getSupabaseAdmin()
    .from("quotes")
    .select(
      "created_at, name, email, source, status, locale, base, plan, est_low, est_high, modules, message, notes",
    )
    .order("created_at", { ascending: false })
    .limit(5000);

  const rows = (data as Quote[]) ?? [];
  const csv = toCsv(
    [
      "Datum",
      "Naam",
      "E-mail",
      "Bron",
      "Status",
      "Taal",
      "Pakket",
      "Plan",
      "Richtprijs laag",
      "Richtprijs hoog",
      "Modules",
      "Bericht",
      "Notitie",
    ],
    rows.map((q) => [
      q.created_at,
      q.name,
      q.email,
      q.source,
      q.status,
      q.locale,
      q.base,
      q.plan,
      q.est_low,
      q.est_high,
      q.modules,
      q.message,
      q.notes,
    ]),
  );

  const day = new Date().toISOString().slice(0, 10);
  return csvResponse(csv, `aanvragen-${day}.csv`);
}
