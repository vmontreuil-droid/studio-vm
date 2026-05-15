import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured, leadsConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { toCsv, csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

type Subscriber = {
  email: string;
  locale: string;
  source: string | null;
  active: boolean;
  created_at: string;
  unsubscribed_at: string | null;
};

export async function GET() {
  if (!adminConfigured || !(await requireAdmin())) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!leadsConfigured) {
    return new Response("Niet geconfigureerd", { status: 404 });
  }

  const { data } = await getSupabaseAdmin()
    .from("newsletter_subscribers")
    .select("email, locale, source, active, created_at, unsubscribed_at")
    .order("created_at", { ascending: false })
    .limit(10000);

  const rows = (data as Subscriber[]) ?? [];
  const csv = toCsv(
    ["E-mail", "Taal", "Bron", "Actief", "Ingeschreven", "Uitgeschreven"],
    rows.map((s) => [
      s.email,
      s.locale,
      s.source,
      s.active ? "ja" : "nee",
      s.created_at,
      s.unsubscribed_at,
    ]),
  );

  const day = new Date().toISOString().slice(0, 10);
  return csvResponse(csv, `abonnees-${day}.csv`);
}
