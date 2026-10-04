import "server-only";
// Projecten + afgeleide gegevens voor de admin-overzichten (projectenlijst en
// werfkaart): klantnaam en factuur-/betaalstatus, op één plek berekend.
//
// - klant: bedrijf of naam uit de aanvraag (quote), anders uit de offerte,
//   anders het e-mailadres van het project.
// - factuurStatus: status van de gekoppelde factuur (open / betaald /
//   vervallen …), null zonder factuur; betaald = status "betaald".
// - offerte: het project hangt aan een offerte die (nog) bestaat.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Project } from "@/lib/projecten";

export type ProjectRij = Project & {
  klant: string;
  factuurStatus: string | null;
  betaald: boolean;
  offerte: boolean;
};

type Fout = { message: string } | null;

// Ids per blok opvragen: een `in.(…)` met honderden uuid's maakt de URL te lang.
const BLOK = 150;
// Supabase geeft per verzoek hoogstens 1000 rijen terug.
const PAGINA = 1000;

async function perBlok<T>(ids: string[], haal: (deel: string[]) => PromiseLike<{ data: unknown }>): Promise<T[]> {
  const delen: string[][] = [];
  for (let i = 0; i < ids.length; i += BLOK) delen.push(ids.slice(i, i + BLOK));
  const res = await Promise.all(delen.map((d) => haal(d)));
  return res.flatMap((r) => (r.data as T[] | null) ?? []);
}

/**
 * Projecten (nieuwste eerst) met klant en factuurstatus.
 * `limiet`: hoogstens zoveel projecten (één verzoek); zonder limiet worden
 * álle projecten pagina per pagina opgehaald (tot `plafond`).
 */
export async function laadProjectRijen(
  db: SupabaseClient,
  opties: { limiet?: number; plafond?: number } = {},
): Promise<{ rijen: ProjectRij[]; error: Fout }> {
  let projecten: Project[] = [];
  let error: Fout = null;

  if (opties.limiet != null) {
    const r = await db.from("projecten").select("*").order("created_at", { ascending: false }).limit(opties.limiet);
    projecten = (r.data as Project[] | null) ?? [];
    error = r.error;
  } else {
    const plafond = opties.plafond ?? 10000;
    for (let van = 0; van < plafond; van += PAGINA) {
      const r = await db
        .from("projecten")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .range(van, Math.min(van + PAGINA, plafond) - 1);
      if (r.error) {
        error = r.error;
        break;
      }
      const deel = (r.data as Project[] | null) ?? [];
      projecten = projecten.concat(deel);
      if (deel.length < PAGINA) break;
    }
  }

  const uniek = (xs: (string | null)[]) => [...new Set(xs.filter(Boolean))] as string[];
  const [quotes, offers, invoices] = await Promise.all([
    perBlok<{ id: string; company: string | null; name: string | null }>(uniek(projecten.map((p) => p.quote_id)), (d) =>
      db.from("quotes").select("id, company, name").in("id", d),
    ),
    perBlok<{ id: string; client_company: string | null; client_name: string | null }>(
      uniek(projecten.map((p) => p.offer_id)),
      (d) => db.from("offers").select("id, client_company, client_name").in("id", d),
    ),
    perBlok<{ id: string; status: string }>(uniek(projecten.map((p) => p.invoice_id)), (d) =>
      db.from("invoices").select("id, status").in("id", d),
    ),
  ]);
  const quoteNaam = new Map(quotes.map((x) => [x.id, x.company || x.name]));
  const offerNaam = new Map(offers.map((x) => [x.id, x.client_company || x.client_name]));
  const facStatus = new Map(invoices.map((x) => [x.id, x.status]));

  const rijen = projecten.map((p) => {
    const fs = p.invoice_id ? (facStatus.get(p.invoice_id) ?? null) : null;
    return {
      ...p,
      klant: (p.quote_id && quoteNaam.get(p.quote_id)) || (p.offer_id && offerNaam.get(p.offer_id)) || p.client_email,
      factuurStatus: fs,
      betaald: fs === "betaald",
      offerte: Boolean(p.offer_id && offerNaam.has(p.offer_id)),
    };
  });
  return { rijen, error };
}
