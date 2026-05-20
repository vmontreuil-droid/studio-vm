import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getMolliePayment } from "@/lib/mollie";
import { isValidLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

const T: Record<
  Locale,
  {
    paid: { title: string; sub: string; cta: string };
    pending: { title: string; sub: string };
    failed: { title: string; sub: string; retry: string };
    backHome: string;
  }
> = {
  nl: {
    paid: {
      title: "Bedankt voor je betaling 🎉",
      sub: "Ik scan je site nu. Het rapport komt binnen 1-2 min in je inbox — open je mail (en check eventueel de spam-folder).",
      cta: "Open mijn rapport",
    },
    pending: {
      title: "Betaling wordt verwerkt…",
      sub: "We wachten op de bevestiging van Mollie. Refresh deze pagina over een minuutje, of check je inbox.",
    },
    failed: {
      title: "Betaling niet voltooid",
      sub: "De betaling werd afgebroken of geweigerd. Geen geld afgehouden, je kan opnieuw proberen.",
      retry: "Opnieuw proberen",
    },
    backHome: "← Terug naar studio-vm.be",
  },
  fr: {
    paid: {
      title: "Merci pour votre paiement 🎉",
      sub: "Je scanne votre site maintenant. Le rapport arrive dans votre boîte mail dans 1-2 min — ouvrez votre courrier (et vérifiez vos spams).",
      cta: "Ouvrir mon rapport",
    },
    pending: {
      title: "Paiement en cours de traitement…",
      sub: "Nous attendons la confirmation de Mollie. Rafraîchissez cette page dans une minute, ou vérifiez votre boîte mail.",
    },
    failed: {
      title: "Paiement non finalisé",
      sub: "Le paiement a été interrompu ou refusé. Aucun débit, vous pouvez réessayer.",
      retry: "Réessayer",
    },
    backHome: "← Retour à studio-vm.be",
  },
  en: {
    paid: {
      title: "Thanks for your payment 🎉",
      sub: "I'm scanning your site now. The report lands in your inbox within 1-2 min — open your mail (and check spam too).",
      cta: "Open my report",
    },
    pending: {
      title: "Payment processing…",
      sub: "We're waiting for Mollie's confirmation. Refresh this page in a minute, or check your inbox.",
    },
    failed: {
      title: "Payment not completed",
      sub: "The payment was cancelled or declined. Nothing was charged — you can try again.",
      retry: "Try again",
    },
    backHome: "← Back to studio-vm.be",
  },
};

export default async function ThanksPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = T[locale];

  const db = getSupabaseAdmin();
  const { data } = await db
    .from("health_checks")
    .select("scan_token, status, mollie_payment_id")
    .eq("id", id)
    .maybeSingle();
  const hc = data as {
    scan_token: string;
    status: string;
    mollie_payment_id: string | null;
  } | null;
  if (!hc) notFound();

  // Echte status bij Mollie ophalen (webhook is mogelijks nog niet
  // binnen, of de gebruiker heeft terug-geklikt). Update lokaal.
  let status = hc.status;
  if (hc.mollie_payment_id && status === "wachten") {
    const p = await getMolliePayment(hc.mollie_payment_id);
    if (p) {
      if (p.status === "paid") status = "betaald";
      else if (
        p.status === "canceled" ||
        p.status === "failed" ||
        p.status === "expired"
      )
        status = "mislukt";
      // anders: still 'open' / 'pending' → laat 'wachten' staan
      if (status !== hc.status) {
        await db
          .from("health_checks")
          .update({
            status,
            ...(status === "betaald"
              ? { paid_at: new Date().toISOString() }
              : {}),
          })
          .eq("id", id);
      }
    }
  }

  // Render per status
  if (status === "mislukt") {
    return (
      <main>
        <section className="border-b">
          <div className="mx-auto max-w-2xl px-6 py-20 sm:py-24 text-center">
            <XCircle
              className="mx-auto h-16 w-16 text-red-500"
              strokeWidth={2}
            />
            <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.failed.title}
            </h1>
            <p className="mt-4 text-lg text-muted">{t.failed.sub}</p>
            <Link
              href={`/${locale}/site-health-check`}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t.failed.retry}
              <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
            </Link>
            <p className="mt-10">
              <Link
                href={`/${locale}`}
                className="text-sm text-muted hover:text-foreground"
              >
                {t.backHome}
              </Link>
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (status === "betaald") {
    return (
      <main>
        <section className="border-b">
          <div className="mx-auto max-w-2xl px-6 py-20 sm:py-24 text-center">
            <CheckCircle2
              className="mx-auto h-16 w-16 text-green-600 dark:text-green-400"
              strokeWidth={2}
            />
            <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.paid.title}
            </h1>
            <p className="mt-4 text-lg text-muted">{t.paid.sub}</p>
            {hc.scan_token && (
              <Link
                href={`/${locale}/portail/scan/${hc.scan_token}`}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                {t.paid.cta}
                <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
              </Link>
            )}
            <p className="mt-10">
              <Link
                href={`/${locale}`}
                className="text-sm text-muted hover:text-foreground"
              >
                {t.backHome}
              </Link>
            </p>
          </div>
        </section>
      </main>
    );
  }

  // pending
  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-2xl px-6 py-20 sm:py-24 text-center">
          <Loader2
            className="mx-auto h-16 w-16 animate-spin text-accent"
            strokeWidth={2}
          />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.pending.title}
          </h1>
          <p className="mt-4 text-lg text-muted">{t.pending.sub}</p>
          <p className="mt-10">
            <Link
              href={`/${locale}`}
              className="text-sm text-muted hover:text-foreground"
            >
              {t.backHome}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
