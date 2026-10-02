import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { maakProject } from "@/app/actions/projecten-admin";
import { MERKEN, CATEGORIE_LABEL } from "@/lib/projecten";
import { LANDEN } from "@/lib/stelsel";
import { UURTARIEF_CENT, euro } from "@/lib/tarieven";
import { TALEN, TAAL_NAAM } from "@/lib/projecten-teksten";
import { SubmitButton } from "@/components/submit-button";
import { VELD } from "@/components/admin/project-ui";

export const dynamic = "force-dynamic";

const FOUT: Record<string, string> = {
  email: "Geef een geldig e-mailadres van de klant op.",
  titel: "Geef het project een titel.",
  werf: "Vul minstens gemeente en land van de werf in.",
  opslag: "Opslaan mislukte — probeer opnieuw.",
};

export default async function NieuwProject({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const landNaam = new Intl.DisplayNames(["nl"], { type: "region" });
  const landen = [...LANDEN].map((c) => ({ c, n: landNaam.of(c) ?? c })).sort((a, b) => a.n.localeCompare(b.n, "nl"));

  return (
    <>
      <Link href="/admin/projecten" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Terug naar projecten
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Nieuw project</h1>
      <p className="mt-2 text-sm text-muted">
        Voor een klant die belde of mailde. Het werfadres wordt op de kaart gezocht en bepaalt het voorgestelde stelsel. De klant krijgt
        meteen portaaltoegang (er gaat nu nog geen mail weg).
      </p>

      {FOUT[pick("fout")] && (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-400">{FOUT[pick("fout")]}</p>
      )}

      <form action={maakProject} className="mt-6 space-y-6">
        <section className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-mono text-[11px] uppercase tracking-widest text-muted">Klant</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-muted">
              E-mail *
              <input name="email" type="email" required defaultValue={pick("email")} className={VELD} />
            </label>
            <label className="text-xs text-muted">
              Taal
              <select name="taal" defaultValue={pick("taal") || "nl"} className={VELD}>
                {TALEN.map((t) => (
                  <option key={t} value={t}>
                    {TAAL_NAAM[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-muted">
              Naam
              <input name="naam" defaultValue={pick("naam")} className={VELD} />
            </label>
            <label className="text-xs text-muted">
              Bedrijf
              <input name="bedrijf" defaultValue={pick("bedrijf")} className={VELD} />
            </label>
            <label className="text-xs text-muted">
              Telefoon
              <input name="telefoon" defaultValue={pick("telefoon")} className={VELD} />
            </label>
            <label className="text-xs text-muted">
              Btw-nummer
              <input name="btw" defaultValue={pick("btw")} placeholder="BE0123456789" className={VELD} />
            </label>
          </div>
        </section>

        <section className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-mono text-[11px] uppercase tracking-widest text-muted">Project</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-muted sm:col-span-2">
              Titel *
              <input name="titel" required maxLength={140} placeholder="bv. Riolering Kerkstraat — Gent" className={VELD} />
            </label>
            <label className="text-xs text-muted">
              Categorie
              <select name="categorie" defaultValue="normaal" className={VELD}>
                {(["vroegtijdig", "normaal", "last-minute"] as const).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORIE_LABEL[c].nl} — {euro(UURTARIEF_CENT[c])}/u
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-muted">
              Leverdatum
              <input name="leverdatum" type="date" className={VELD} />
            </label>
            <label className="text-xs text-muted">
              Geschatte uren
              <input name="geschatte_uren" inputMode="decimal" placeholder="bv. 4,5" className={VELD} />
            </label>
          </div>
          <p className="mt-5 text-xs text-muted">Machinesturing</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[...MERKEN, "anders"].map((m) => (
              <label
                key={m}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/10"
              >
                <input type="checkbox" name="merken" value={m} className="accent-[var(--accent)]" />
                {m === "anders" ? "Ander merk" : m}
              </label>
            ))}
          </div>
          <label className="mt-3 block max-w-sm text-xs text-muted">
            Ander merk (indien aangevinkt)
            <input name="merk_anders" maxLength={80} className={VELD} />
          </label>
        </section>

        <section className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-mono text-[11px] uppercase tracking-widest text-muted">Werf</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            <label className="text-xs text-muted sm:col-span-2">
              Straat + nr.
              <input name="werf_straat" className={VELD} />
            </label>
            <label className="text-xs text-muted">
              Postcode
              <input name="werf_postcode" className={VELD} />
            </label>
            <label className="text-xs text-muted">
              Gemeente *
              <input name="werf_gemeente" required className={VELD} />
            </label>
            <label className="text-xs text-muted sm:col-span-2">
              Land *
              <select name="werf_land" defaultValue="BE" className={VELD}>
                {landen.map((l) => (
                  <option key={l.c} value={l.c}>
                    {l.n} ({l.c})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-2xl bg-card p-5 shadow-sm">
          <label className="block text-xs text-muted">
            Interne notitie / omschrijving
            <textarea name="opmerking" rows={4} className={VELD} />
          </label>
        </section>

        <SubmitButton
          pendingLabel="Aanmaken…"
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Project aanmaken
        </SubmitButton>
      </form>
    </>
  );
}
