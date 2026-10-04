import Link from "next/link";
import { ArrowLeft, ExternalLink, TriangleAlert } from "lucide-react";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ARRONDISSEMENTEN, type Arrondissement } from "@/lib/invordering/arrondissement";
import { deurwaarders } from "@/lib/invordering/dossier";
import { bewaarDeurwaarder } from "@/app/actions/invordering";

export const dynamic = "force-dynamic";
export const metadata = { title: "Deurwaarders" };

const MELDING: Record<string, { tekst: string; goed?: boolean }> = {
  bewaard: { tekst: "Deurwaarder bewaard.", goed: true },
  gewist: { tekst: "Deurwaarder verwijderd.", goed: true },
  onvolledig: { tekst: "Naam en een geldig e-mailadres zijn verplicht." },
  fout: { tekst: "Bewaren mislukt. Is migratie 0052 uitgevoerd?" },
};

// Welke postcodes bij welk arrondissement horen (ter info).
const POSTCODES: Record<Arrondissement, string> = {
  brussel: "1000–1299, 1500–1999",
  "waals-brabant": "1300–1499",
  antwerpen: "2000–2999",
  leuven: "3000–3499",
  limburg: "3500–3999",
  luik: "4000–4699, 4800–4999",
  eupen: "4700–4799",
  namen: "5000–5999",
  henegouwen: "6000–6599, 7000–7999",
  luxemburg: "6600–6999",
  "west-vlaanderen": "8000–8999",
  "oost-vlaanderen": "9000–9999",
};

const veld = "w-full rounded-lg border bg-background px-3 py-2 text-sm";

export default async function AdminDeurwaarders({ searchParams }: { searchParams: Promise<{ melding?: string }> }) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const { melding } = await searchParams;
  const [dws, check] = await Promise.all([
    deurwaarders(),
    getSupabaseAdmin().from("deurwaarders").select("arrondissement", { count: "exact", head: true }),
  ]);
  const m = melding ? MELDING[melding] : null;

  return (
    <>
      <Link href="/admin/invordering" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Invordering
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Deurwaarders</h1>
      <p className="mt-0.5 max-w-2xl text-sm text-muted">
        Een gerechtsdeurwaarder werkt binnen zijn gerechtelijk arrondissement. Kies er per arrondissement één: een
        dossier gaat dan vanzelf naar de deurwaarder van de streek van de klant. Zoeken kan via{" "}
        <a href="https://www.gerechtsdeurwaarders.be" target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-accent hover:underline">
          gerechtsdeurwaarders.be <ExternalLink className="h-3 w-3" />
        </a>
        . Naam en e-mail leeg maken en bewaren = verwijderen.
      </p>

      {m && (
        <p
          className={`mt-4 rounded-xl border px-4 py-2 text-sm ${
            m.goed ? "border-emerald-300 bg-emerald-100 text-emerald-900" : "border-amber-400 bg-amber-200 text-amber-950"
          }`}
        >
          {m.tekst}
        </p>
      )}
      {check.error && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400 bg-amber-200 px-4 py-2 text-sm text-amber-950">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          Migratie 0052 (invordering) is nog niet uitgevoerd: bewaren lukt pas daarna.
        </p>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(Object.keys(ARRONDISSEMENTEN) as Arrondissement[]).map((a) => {
          const dw = dws.get(a);
          return (
            <form
              key={a}
              id={a}
              action={bewaarDeurwaarder}
              className="scroll-mt-24 space-y-2 rounded-xl border bg-background p-5 text-sm shadow-sm"
            >
              <input type="hidden" name="arrondissement" value={a} />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-medium">{ARRONDISSEMENTEN[a].naam}</h2>
                <span className="text-xs text-muted">postcodes {POSTCODES[a]}</span>
              </div>
              <input name="naam" defaultValue={dw?.naam ?? ""} placeholder="Naam deurwaarder" className={veld} />
              <input name="kantoor" defaultValue={dw?.kantoor ?? ""} placeholder="Kantoor (optioneel)" className={veld} />
              <div className="grid gap-2 sm:grid-cols-2">
                <input name="email" type="email" defaultValue={dw?.email ?? ""} placeholder="E-mail" className={veld} />
                <input name="telefoon" defaultValue={dw?.telefoon ?? ""} placeholder="Telefoon (optioneel)" className={veld} />
              </div>
              <textarea name="adres" rows={2} defaultValue={dw?.adres ?? ""} placeholder="Adres (komt op de brief)" className={veld} />
              <div className="flex flex-wrap items-center gap-2">
                <select name="taal" defaultValue={dw?.taal ?? ARRONDISSEMENTEN[a].taal} className={`${veld} w-auto`}>
                  <option value="nl">Brief in het Nederlands</option>
                  <option value="fr">Brief in het Frans</option>
                  <option value="de">Brief in het Duits</option>
                </select>
                <button
                  type="submit"
                  className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-card-hover"
                >
                  Bewaren
                </button>
              </div>
            </form>
          );
        })}
      </div>
    </>
  );
}
