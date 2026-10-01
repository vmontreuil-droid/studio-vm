import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Crosshair, Cpu, FileText, Package, Receipt, MessageSquareWarning, Check, CreditCard, ExternalLink, ShieldAlert } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import {
  STAPPEN,
  STATUS_LABEL,
  CATEGORIE_LABEL,
  werfTekst,
  grootteTekst,
  perVersie,
  statusKleur,
  type Project,
  type Levering,
} from "@/lib/projecten";
import { eur, dt } from "@/lib/portal-shared";
import { isBetaald } from "@/lib/projecten-server";
import { payInvoice } from "@/app/actions/portal-client";
import { LeveringKnop, PlanKnop, RevisieFormulier } from "@/components/project-acties";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

const T: Record<Locale, Record<string, string>> = {
  nl: {
    terug: "Projecten", werf: "Werf", stelsel: "Coördinatenstelsel", hoogte: "Hoogte", systemen: "Machinesturingen", categorie: "Categorie", ingediend: "Ingediend op",
    plannen: "Uw plannen", geenPlannen: "Geen plannen opgeladen.", offerte: "Offerte & betaling", geenOfferte: "U ontvangt hier uw offerte zodra ik uw plannen bekeken heb.",
    bekijkOfferte: "Offerte bekijken", factuur: "Factuur", betaal: "Betaal via Mollie", betaald: "Betaald", uren: "Geschat aantal uren",
    leveringen: "Modelbestanden", geenLeveringen: "Hier verschijnen de modelbestanden per machinesturing zodra ze klaar zijn.", versie: "Versie", slotUitleg: "De bestanden worden vrijgegeven zodra de factuur betaald is.",
    revisie: "Revisie of vraag", revisieUitleg: "Is er iets aan te passen of hebt u een vraag over dit model? Laat het weten.",
    verantw: "Controleer het model vóór de start op een gekend punt, in ligging én hoogte. Werking en kalibratie van uw machinesturing blijven uw verantwoordelijkheid.",
    kaart: "Kaart",
  },
  fr: {
    terug: "Projets", werf: "Chantier", stelsel: "Système de coordonnées", hoogte: "Altitude", systemen: "Systèmes de guidage", categorie: "Catégorie", ingediend: "Introduit le",
    plannen: "Vos plans", geenPlannen: "Aucun plan chargé.", offerte: "Devis & paiement", geenOfferte: "Vous recevrez ici votre devis dès que j'aurai examiné vos plans.",
    bekijkOfferte: "Voir le devis", factuur: "Facture", betaal: "Payer via Mollie", betaald: "Payée", uren: "Nombre d'heures estimé",
    leveringen: "Fichiers du modèle", geenLeveringen: "Les fichiers par système de guidage apparaîtront ici dès qu'ils seront prêts.", versie: "Version", slotUitleg: "Les fichiers sont mis à disposition dès que la facture est payée.",
    revisie: "Révision ou question", revisieUitleg: "Quelque chose à adapter ou une question sur ce modèle ? Faites-le savoir.",
    verantw: "Vérifiez le modèle avant de commencer sur un point connu, en position et en altitude. Le fonctionnement et la calibration de votre guidage restent sous votre responsabilité.",
    kaart: "Carte",
  },
  en: {
    terug: "Projects", werf: "Site", stelsel: "Coordinate system", hoogte: "Height", systemen: "Machine control systems", categorie: "Category", ingediend: "Submitted on",
    plannen: "Your plans", geenPlannen: "No plans uploaded.", offerte: "Quote & payment", geenOfferte: "Your quote will appear here once I've reviewed your plans.",
    bekijkOfferte: "View quote", factuur: "Invoice", betaal: "Pay via Mollie", betaald: "Paid", uren: "Estimated hours",
    leveringen: "Model files", geenLeveringen: "The model files per machine control system will appear here once they're ready.", versie: "Version", slotUitleg: "Files are released once the invoice is paid.",
    revisie: "Revision or question", revisieUitleg: "Anything to change or a question about this model? Let me know.",
    verantw: "Check the model on a known point before you start, in position and height. Operation and calibration of your machine control remain your responsibility.",
    kaart: "Map",
  },
};

type Factuur = { id: string; number: string; amount_cents: number; status: string; due_at: string | null };
type Offerte = { id: string; status: string; amount_cents: number; offer_no: string | null };

export default async function ProjectPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = T[locale];
  const sb = await getSupabaseServer();
  const { data } = await sb.from("projecten").select("*").eq("id", id).maybeSingle();
  const p = data as Project | null;
  if (!p) notFound();

  const [{ data: lev }, offerRes, invRes] = await Promise.all([
    sb.from("leveringen").select("*").eq("project_id", id).order("versie", { ascending: false }),
    p.offer_id ? sb.from("offers").select("id, status, amount_cents, offer_no").eq("id", p.offer_id).maybeSingle() : Promise.resolve({ data: null }),
    p.invoice_id ? sb.from("invoices").select("id, number, amount_cents, status, due_at").eq("id", p.invoice_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const leveringen = (lev as Levering[] | null) ?? [];
  const offerte = offerRes.data as Offerte | null;
  const factuur = invRes.data as Factuur | null;
  const betaald = await isBetaald(p);
  const stapIndex = STAPPEN.indexOf(p.status);
  const kaart = p.werf?.lat ? `https://www.openstreetmap.org/?mlat=${p.werf.lat}&mlon=${p.werf.lon}#map=17/${p.werf.lat}/${p.werf.lon}` : null;

  return (
    <div className="space-y-8">
      <Link href={localePath(locale, "/portail/dashboard/projecten")} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent">
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        {t.terug}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{p.titel}</h1>
          <p className="mt-1 text-sm text-muted">
            {t.ingediend} {dt(p.created_at, locale)} · {t.categorie}: {CATEGORIE_LABEL[p.categorie][locale]}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-sm font-medium ${statusKleur(p.status)}`}>{STATUS_LABEL[p.status][locale]}</span>
      </header>

      {p.status !== "geannuleerd" && (
        <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {STAPPEN.map((s, i) => {
            const klaar = i <= stapIndex;
            return (
              <li key={s} className={`rounded-xl border p-3 text-xs ${klaar ? "border-accent/40 bg-accent/5" : "opacity-60"}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${klaar ? "bg-accent text-white" : "border"}`}>
                  {klaar ? <Check className="h-3 w-3" strokeWidth={3} /> : <span className="font-mono text-[10px]">{i + 1}</span>}
                </span>
                <span className="mt-2 block font-medium leading-tight">{STATUS_LABEL[s][locale]}</span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Blok icoon={Package} titel={t.leveringen}>
            {leveringen.length === 0 ? (
              <p className="text-sm text-muted">{t.geenLeveringen}</p>
            ) : (
              <div className="space-y-5">
                {!betaald && <p className="rounded-xl border border-accent/30 bg-accent/5 p-3 text-sm">{t.slotUitleg}</p>}
                {perVersie(leveringen).map((v) => (
                  <div key={v.versie}>
                    <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
                      {t.versie} {v.versie} · {dt(v.items[0].created_at, locale)}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {v.items.map((l) => (
                        <LeveringKnop key={l.id} id={l.id} naam={l.naam} systeem={l.systeem} grootte={grootteTekst(l.grootte)} betaald={betaald} locale={locale} />
                      ))}
                    </div>
                    {v.items[0].opmerking && <p className="mt-2 text-sm text-muted">{v.items[0].opmerking}</p>}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-5 flex gap-2 border-t pt-4 text-xs leading-relaxed text-muted">
              <ShieldAlert className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />
              {t.verantw}
            </p>
          </Blok>

          <Blok icoon={MessageSquareWarning} titel={t.revisie}>
            <p className="mb-4 text-sm text-muted">{t.revisieUitleg}</p>
            <RevisieFormulier projectId={p.id} locale={locale} />
          </Blok>
        </div>

        <div className="space-y-6">
          <Blok icoon={Receipt} titel={t.offerte}>
            {!offerte && !factuur ? (
              <p className="text-sm text-muted">{t.geenOfferte}</p>
            ) : (
              <div className="space-y-4 text-sm">
                {p.geschatte_uren != null && (
                  <Rij k={t.uren} v={`${Number(p.geschatte_uren).toLocaleString(locale)} u`} />
                )}
                {offerte && (
                  <Link href={localePath(locale, "/portail/dashboard/offertes")} className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline">
                    {t.bekijkOfferte} {offerte.offer_no ? `(${offerte.offer_no})` : ""}
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                  </Link>
                )}
                {factuur && (
                  <div className="rounded-xl border p-4">
                    <Rij k={`${t.factuur} ${factuur.number}`} v={eur(factuur.amount_cents)} />
                    {betaald ? (
                      <p className="mt-3 inline-flex items-center gap-1.5 text-emerald-500">
                        <Check className="h-4 w-4" strokeWidth={2} />
                        {t.betaald}
                      </p>
                    ) : (
                      <form action={payInvoice.bind(null, factuur.id)} className="mt-3">
                        <SubmitButton className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90">
                          <CreditCard className="h-4 w-4" strokeWidth={2} />
                          {t.betaal}
                        </SubmitButton>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </Blok>

          <Blok icoon={MapPin} titel={t.werf}>
            <div className="space-y-3 text-sm">
              <p>
                {werfTekst(p.werf)}
                {kaart && (
                  <a href={kaart} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 text-accent hover:underline">
                    {t.kaart}
                    <ExternalLink className="h-3 w-3" strokeWidth={2} />
                  </a>
                )}
              </p>
              {p.stelsel && (
                <div className="flex gap-2 rounded-xl border border-accent/30 bg-accent/5 p-3">
                  <Crosshair className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
                  <div>
                    <p className="font-medium">
                      {p.stelsel.stelsel} <span className="font-mono text-xs text-muted">({p.stelsel.epsg})</span>
                    </p>
                    <p className="text-muted">
                      {t.hoogte}: {p.stelsel.hoogte}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Blok>

          <Blok icoon={Cpu} titel={t.systemen}>
            <div className="flex flex-wrap gap-2">
              {p.merken.map((m) => (
                <span key={m} className="rounded-full border px-3 py-1 text-sm">{m}</span>
              ))}
            </div>
          </Blok>

          <Blok icoon={FileText} titel={t.plannen}>
            {p.plannen.length === 0 ? (
              <p className="text-sm text-muted">{t.geenPlannen}</p>
            ) : (
              <ul className="divide-y">
                {p.plannen.map((pl) => (
                  <PlanKnop key={pl.pad} projectId={p.id} pad={pl.pad} naam={pl.naam} grootte={grootteTekst(pl.grootte)} locale={locale} />
                ))}
              </ul>
            )}
          </Blok>
        </div>
      </div>
    </div>
  );
}

function Blok({ icoon: Icoon, titel, children }: { icoon: React.ComponentType<{ className?: string; strokeWidth?: number }>; titel: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 font-semibold tracking-tight">
        <Icoon className="h-4 w-4 text-accent" strokeWidth={1.75} />
        {titel}
      </h2>
      {children}
    </section>
  );
}

function Rij({ k, v }: { k: string; v: string }) {
  return (
    <p className="flex items-baseline justify-between gap-4">
      <span className="text-muted">{k}</span>
      <span className="font-medium">{v}</span>
    </p>
  );
}
