import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PenTool,
  Trash2,
  Send,
  ArrowRight,
  Globe,
  Rocket,
  EyeOff,
} from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { dt } from "@/lib/portal-shared";
import {
  createDesign,
  deleteDesign,
  sendDesign,
  publishDesign,
  unpublishDesign,
} from "@/app/actions/builder-designs";
import {
  startPublishSubscription,
  cancelPublishSubscription,
  addExtraSite,
} from "@/app/actions/subscription";
import {
  publishSetupCents,
  PUBLISH_BASE_MONTHLY_CENTS,
} from "@/lib/pricing";
import { SubmitButton } from "@/components/submit-button";

const euroFmt = (c: number) =>
  (c / 100).toLocaleString("nl-BE").replace(/,00$/, "");

export const dynamic = "force-dynamic";

type Design = {
  id: string;
  title: string;
  bname: string | null;
  status: string;
  updated_at: string;
  slug: string | null;
  published: boolean;
};

const L: Record<
  Locale,
  {
    title: string;
    sub: string;
    none: string;
    nieuw: string;
    resume: string;
    send: string;
    sent: string;
    concept: string;
    upd: string;
  }
> = {
  nl: {
    title: "Mijn ontwerpen",
    sub: "Bouw je website helemaal zelf op. Werk in meerdere concepten, sla op en hervat later op om het even welk toestel — en stuur het naar Studio VM zodra je tevreden bent.",
    none: "Nog geen ontwerp. Start je eerste hieronder.",
    nieuw: "Nieuw ontwerp",
    resume: "Verder bouwen",
    send: "Verstuur naar Studio VM",
    sent: "Verstuurd",
    concept: "Concept",
    upd: "bijgewerkt",
  },
  fr: {
    title: "Mes maquettes",
    sub: "Construisez votre site vous-même. Travaillez en plusieurs concepts, enregistrez et reprenez sur n'importe quel appareil — puis envoyez-le à Studio VM.",
    none: "Aucune maquette. Démarrez la première ci-dessous.",
    nieuw: "Nouvelle maquette",
    resume: "Continuer",
    send: "Envoyer à Studio VM",
    sent: "Envoyé",
    concept: "Concept",
    upd: "mis à jour",
  },
  en: {
    title: "My drafts",
    sub: "Build your website yourself. Work in multiple drafts, save and resume on any device — then send it to Studio VM when you're happy.",
    none: "No draft yet. Start your first one below.",
    nieuw: "New draft",
    resume: "Keep building",
    send: "Send to Studio VM",
    sent: "Sent",
    concept: "Draft",
    upd: "updated",
  },
};

export default async function PortalBuilderOverview({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ fout?: string; ok?: string }>;
}) {
  const { locale } = await params;
  const { fout, ok } = await searchParams;
  if (!isValidLocale(locale)) notFound();
  if (!supabaseConfigured) return null;
  const l = L[locale];

  const sb = await getSupabaseServer();
  const { data } = await sb
    .from("builder_designs")
    .select(
      "id, title, status, updated_at, slug, published, bname:snapshot->>businessName",
    )
    .order("updated_at", { ascending: false });
  const designs = (data as Design[]) ?? [];

  const { count: subCount } = await sb
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("status", "actief");
  const allowedSites = subCount ?? 0;
  const subActive = allowedSites > 0;
  const liveSites = designs.filter((d) => d.published).length;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {l.title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        {l.sub}
      </p>

      {(ok === "live" || ok === "betaald" || ok === "gestopt") && (
        <p className="mt-4 rounded-md bg-green-100 px-3 py-2 text-xs font-semibold text-green-900 dark:bg-green-900 dark:text-green-50">
          {ok === "gestopt"
            ? locale === "fr"
              ? "Abonnement résilié."
              : locale === "en"
                ? "Subscription cancelled."
                : "Abonnement opgezegd."
            : ok === "betaald"
              ? locale === "fr"
                ? "Paiement reçu — activation en cours…"
                : locale === "en"
                  ? "Payment received — activating…"
                  : "Betaling ontvangen — abonnement wordt geactiveerd…"
              : locale === "fr"
                ? "Votre site est en ligne."
                : locale === "en"
                  ? "Your site is live."
                  : "Je site staat online."}
        </p>
      )}
      {fout && !(fout === "abo" && subActive) && (
        <p className="mt-4 rounded-md bg-amber-100 px-3 py-2 text-xs font-medium text-amber-900 dark:bg-amber-900 dark:text-amber-50">
          {fout === "abo"
            ? locale === "fr"
              ? "Un abonnement actif est requis pour publier."
              : locale === "en"
                ? "An active subscription is required to publish."
                : "Publiceren kan enkel met een actief abonnement."
            : fout === "onesite"
              ? locale === "fr"
                ? "Vous avez déjà un site en ligne. Mettez-le d'abord hors ligne, ou prenez un abonnement supplémentaire."
                : locale === "en"
                  ? "You already have a site online. Take it offline first, or add another subscription."
                  : "Je hebt al een site online. Haal die eerst offline, of koop een extra site."
              : fout === "mollie"
                ? locale === "fr"
                  ? "Le paiement (Mollie) n'est pas encore actif — disponible dès que la liaison de paiement est en ligne."
                  : locale === "en"
                    ? "Payment (Mollie) is not active yet — available once the payment link is live."
                    : "De betaalkoppeling (Mollie) staat nog niet actief — dit werkt zodra die live is."
                : locale === "fr"
                  ? "Impossible de créer la maquette. Réessayez."
                  : locale === "en"
                    ? "Could not create the draft. Try again."
                    : "Kon het ontwerp niet aanmaken. Probeer opnieuw."}
        </p>
      )}

      {subActive ? (
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="font-medium text-foreground">
              {locale === "fr"
                ? "Abonnement actif"
                : locale === "en"
                  ? "Subscription active"
                  : "Abonnement actief"}
            </span>
            <span>
              · {liveSites}/{allowedSites}{" "}
              {locale === "fr"
                ? "site en ligne"
                : locale === "en"
                  ? "site online"
                  : "site online"}
            </span>
          </span>
          <span aria-hidden>·</span>
          <form action={addExtraSite} className="contents">
            <input type="hidden" name="locale" value={locale} />
            <SubmitButton className="text-accent underline underline-offset-2 hover:opacity-80">
              {locale === "fr"
                ? `+ site (+€${Math.round(PUBLISH_BASE_MONTHLY_CENTS / 100)}/m)`
                : `+ extra site (+€${Math.round(
                    PUBLISH_BASE_MONTHLY_CENTS / 100,
                  )}/m)`}
            </SubmitButton>
          </form>
          <span aria-hidden>·</span>
          <form action={cancelPublishSubscription} className="contents">
            <input type="hidden" name="locale" value={locale} />
            <SubmitButton className="underline underline-offset-2 hover:text-red-500">
              {locale === "fr"
                ? "résilier"
                : locale === "en"
                  ? "cancel"
                  : "opzeggen"}
            </SubmitButton>
          </form>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
          <span className="text-muted">
            {locale === "fr"
              ? `Mettez votre site en ligne — €${euroFmt(
                  publishSetupCents(),
                )} + €${euroFmt(PUBLISH_BASE_MONTHLY_CENTS)}/m.`
              : locale === "en"
                ? `Put your site online — €${euroFmt(
                    publishSetupCents(),
                  )} + €${euroFmt(PUBLISH_BASE_MONTHLY_CENTS)}/m.`
                : `Zet je site online — €${euroFmt(
                    publishSetupCents(),
                  )} opstart, daarna €${euroFmt(
                    PUBLISH_BASE_MONTHLY_CENTS,
                  )}/m.`}
          </span>
          <form action={startPublishSubscription} className="contents">
            <input type="hidden" name="locale" value={locale} />
            <SubmitButton className="font-medium text-accent underline underline-offset-2 hover:opacity-80">
              {locale === "fr"
                ? "Démarrer l'abonnement"
                : locale === "en"
                  ? "Start subscription"
                  : "Start abonnement"}
            </SubmitButton>
          </form>
        </div>
      )}

      <form action={createDesign} className="mt-5">
        <input type="hidden" name="locale" value={locale} />
        <SubmitButton className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors hover:bg-card-hover">
          <PenTool className="h-3.5 w-3.5" strokeWidth={2} />
          {l.nieuw}
        </SubmitButton>
      </form>

      <div className="mt-8 space-y-3">
        {designs.length === 0 && (
          <p className="rounded-2xl border border-dashed bg-card/50 p-8 text-center text-sm text-muted">
            {l.none}
          </p>
        )}
        {designs.map((d) => (
          <div
            key={d.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3.5"
          >
            <div className="min-w-0">
              <p className="font-semibold tracking-tight">
                {d.bname || d.title}
              </p>
              <p className="mt-1 font-mono text-[11px] text-muted">
                <span
                  className={`mr-2 rounded-full px-2 py-0.5 ${
                    d.published
                      ? "bg-green-500/15 text-green-600 dark:text-green-400"
                      : d.status === "verstuurd"
                        ? "bg-green-500/15 text-green-600 dark:text-green-400"
                        : "bg-accent/15 text-accent"
                  }`}
                >
                  {d.published
                    ? locale === "fr"
                      ? "En ligne"
                      : locale === "en"
                        ? "Live"
                        : "Online"
                    : d.status === "verstuurd"
                      ? l.sent
                      : l.concept}
                </span>
                {l.upd} {dt(d.updated_at, locale)}
              </p>
              {d.published && d.slug && (
                <a
                  href={`https://${d.slug}.studio-vm.be`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-accent underline"
                >
                  <Globe className="h-3 w-3" strokeWidth={2} />
                  {d.slug}.studio-vm.be
                </a>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={localePath(
                  locale,
                  `/portail/dashboard/builder/editor?d=${d.id}`,
                )}
                className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-[11px] font-medium text-background transition-opacity hover:opacity-90"
              >
                {l.resume}
                <ArrowRight className="h-3 w-3" strokeWidth={2} />
              </Link>
              {d.published ? (
                <form action={unpublishDesign}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="locale" value={locale} />
                  <SubmitButton
                    ariaLabel={
                      locale === "fr"
                        ? "Hors ligne"
                        : locale === "en"
                          ? "Take offline"
                          : "Offline halen"
                    }
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] transition-colors hover:bg-card-hover"
                  >
                    <EyeOff className="h-3 w-3" strokeWidth={2} />
                  </SubmitButton>
                </form>
              ) : (
                <form action={publishDesign}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="locale" value={locale} />
                  <SubmitButton
                    ariaLabel={
                      locale === "fr"
                        ? "Publier"
                        : locale === "en"
                          ? "Publish"
                          : "Publiceren"
                    }
                    className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-white transition-opacity hover:opacity-90"
                  >
                    <Rocket className="h-3 w-3" strokeWidth={2} />
                    {locale === "fr"
                      ? "Publier"
                      : locale === "en"
                        ? "Publish"
                        : "Publiceren"}
                  </SubmitButton>
                </form>
              )}
              {d.status !== "verstuurd" && (
                <form action={sendDesign}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="locale" value={locale} />
                  <SubmitButton
                    ariaLabel={l.send}
                    className="rounded-full border px-2 py-1 text-[11px] transition-colors hover:bg-card-hover"
                  >
                    <Send className="h-3 w-3" strokeWidth={2} />
                  </SubmitButton>
                </form>
              )}
              <form action={deleteDesign}>
                <input type="hidden" name="id" value={d.id} />
                <input type="hidden" name="locale" value={locale} />
                <SubmitButton
                  ariaLabel="Verwijder"
                  className="rounded-full border p-1.5 text-muted transition-colors hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                </SubmitButton>
              </form>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
