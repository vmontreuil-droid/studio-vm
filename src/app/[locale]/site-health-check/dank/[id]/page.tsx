import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isValidLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

const T: Record<
  Locale,
  { title: string; sub: string; portal: string; backHome: string }
> = {
  nl: {
    title: "Bedankt voor je betaling 🎉",
    sub: "Ik scan je site nu (~30 sec). Het rapport komt binnen 1-2 min in je inbox terecht — open je mail.",
    portal: "Open mijn rapport",
    backHome: "← Terug naar studio-vm.be",
  },
  fr: {
    title: "Merci pour votre paiement 🎉",
    sub: "Je scanne votre site maintenant (~30 sec). Le rapport arrivera dans votre boîte mail dans 1-2 min — ouvrez votre courrier.",
    portal: "Ouvrir mon rapport",
    backHome: "← Retour à studio-vm.be",
  },
  en: {
    title: "Thanks for your payment 🎉",
    sub: "I'm scanning your site now (~30 sec). The report lands in your inbox within 1-2 min — open your mail.",
    portal: "Open my report",
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

  const { data } = await getSupabaseAdmin()
    .from("health_checks")
    .select("scan_token, status")
    .eq("id", id)
    .maybeSingle();
  const hc = data as { scan_token: string; status: string } | null;

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-2xl px-6 py-20 sm:py-24 text-center">
          <CheckCircle2
            className="mx-auto h-16 w-16 text-green-600 dark:text-green-400"
            strokeWidth={2}
          />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.title}
          </h1>
          <p className="mt-4 text-lg text-muted">{t.sub}</p>
          {hc?.status === "betaald" && hc.scan_token && (
            <Link
              href={`/${locale}/portail/scan/${hc.scan_token}`}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t.portal}
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
