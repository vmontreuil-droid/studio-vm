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
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

type Design = {
  id: string;
  title: string;
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
    .select("id, title, status, updated_at, slug, published")
    .order("updated_at", { ascending: false });
  const designs = (data as Design[]) ?? [];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {l.title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        {l.sub}
      </p>

      {ok === "live" && (
        <p className="mt-4 rounded-xl border border-green-500/60 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 dark:bg-green-950/40 dark:text-green-300">
          {locale === "fr"
            ? "Votre site est en ligne 🎉"
            : locale === "en"
              ? "Your site is live 🎉"
              : "Je site staat online 🎉"}
        </p>
      )}
      {fout === "abo" && (
        <p className="mt-4 rounded-xl border border-amber-400 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-600/70 dark:bg-amber-950/50 dark:text-amber-200">
          {locale === "fr"
            ? "Un abonnement actif est requis pour publier. Voir « Abonnement »."
            : locale === "en"
              ? "An active subscription is required to publish. See “Subscription”."
              : "Publiceren kan enkel met een actief abonnement. Zie ‘Abonnement’."}
        </p>
      )}
      {fout && fout !== "abo" && (
        <p className="mt-4 rounded-xl border border-amber-400 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-600/70 dark:bg-amber-950/50 dark:text-amber-200">
          {locale === "fr"
            ? "Impossible de créer la maquette pour l'instant. Réessayez plus tard."
            : locale === "en"
              ? "Could not create the draft right now. Please try again later."
              : "Kon het ontwerp nu niet aanmaken. Probeer het zo opnieuw."}
        </p>
      )}

      <form action={createDesign} className="mt-6">
        <input type="hidden" name="locale" value={locale} />
        <SubmitButton className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90">
          <PenTool className="h-4 w-4" strokeWidth={2} />
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
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5"
          >
            <div className="min-w-0">
              <p className="font-semibold tracking-tight">{d.title}</p>
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
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                {l.resume}
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
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
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm transition-colors hover:bg-card-hover"
                  >
                    <EyeOff className="h-4 w-4" strokeWidth={2} />
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    <Rocket className="h-4 w-4" strokeWidth={2} />
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
                    className="rounded-full border px-3 py-2 text-sm transition-colors hover:bg-card-hover"
                  >
                    <Send className="h-4 w-4" strokeWidth={2} />
                  </SubmitButton>
                </form>
              )}
              <form action={deleteDesign}>
                <input type="hidden" name="id" value={d.id} />
                <input type="hidden" name="locale" value={locale} />
                <SubmitButton
                  ariaLabel="Verwijder"
                  className="rounded-full border p-2 text-muted transition-colors hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </SubmitButton>
              </form>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
