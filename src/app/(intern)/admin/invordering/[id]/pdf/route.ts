import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isDeurwaarder, laadDossier, type Deurwaarder } from "@/lib/invordering/dossier";
import { briefPdf, bewijsPdf, factuurPdf, taalVoor } from "@/lib/invordering/documenten";

export const dynamic = "force-dynamic";

// Voorbeeld van de pdf's zoals de deurwaarder ze krijgt:
// ?soort=brief | factuur | bewijs

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!adminConfigured || !(await requireAdmin())) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Niet gevonden", { status: 404 });
  const { data } = await getSupabaseAdmin()
    .from("invorderingen")
    .select("invoice_id, deurwaarder")
    .eq("id", id)
    .maybeSingle();
  const r = data as { invoice_id: string; deurwaarder: unknown } | null;
  if (!r) return new Response("Niet gevonden", { status: 404 });
  const d = await laadDossier(r.invoice_id);
  if (!d) return new Response("Niet gevonden", { status: 404 });

  // Zonder gekozen deurwaarder: brief met een lege aanhef (enkel voorbeeld).
  const dw: Deurwaarder = isDeurwaarder(r.deurwaarder)
    ? r.deurwaarder
    : { naam: "(nog geen deurwaarder gekozen)", email: "—", taal: taalVoor(null, d) };
  const soort = new URL(req.url).searchParams.get("soort");
  const bytes =
    soort === "factuur" ? await factuurPdf(d) : soort === "bewijs" ? await bewijsPdf(d, taalVoor(dw, d)) : await briefPdf(d, dw);
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${soort ?? "brief"}-${d.factuur.nummer.replace(/[^A-Za-z0-9-]/g, "")}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
