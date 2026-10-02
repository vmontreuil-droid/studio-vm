import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Mail } from "lucide-react";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { supabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PortailLogin } from "@/components/portail-login";

export const dynamic = "force-dynamic";

const MAIL = "info@studio-vm.be";

type Copy = {
  metaTitle: string;
  title: string;
  notice: string;
};

const copy: Record<Locale, Copy> = {
  nl: {
    metaTitle: "Klantportaal — Studio VM",
    title: "Klantenportaal",
    notice: `Het klantenportaal is tijdelijk niet beschikbaar. Mail naar ${MAIL} en u krijgt uw bestanden rechtstreeks.`,
  },
  fr: {
    metaTitle: "Espace client — Studio VM",
    title: "Espace client",
    notice: `L'espace client est temporairement indisponible. Écrivez à ${MAIL} et vous recevrez vos fichiers directement.`,
  },
  en: {
    metaTitle: "Client portal — Studio VM",
    title: "Client portal",
    notice: `The client portal is temporarily unavailable. Email ${MAIL} and you will receive your files directly.`,
  },
  de: {
    metaTitle: "Kundenportal — Studio VM",
    title: "Kundenportal",
    notice: `Das Kundenportal ist vorübergehend nicht verfügbar. Schreiben Sie an ${MAIL}, dann erhalten Sie Ihre Dateien direkt.`,
  },
  es: {
    metaTitle: "Portal de cliente — Studio VM",
    title: "Portal de clientes",
    notice: `El portal de clientes no está disponible temporalmente. Escriba a ${MAIL} y recibirá sus archivos directamente.`,
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return {
    title: { absolute: copy[locale].metaTitle },
    robots: { index: false, follow: true },
  };
}

export default async function PortailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const { next: rawNext } = await searchParams;
  const next =
    typeof rawNext === "string" &&
    /^\/(nl|fr|en|de|es)\/portail(\/|$)/.test(rawNext)
      ? rawNext
      : undefined;

  // Echte auth indien Supabase geconfigureerd; anders een neutrale melding.
  if (supabaseConfigured) {
    const sb = await getSupabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (user)
      redirect(next ?? localePath(locale, "/portail/dashboard"));
    return (
      <main>
        <PortailLogin locale={locale} next={next} />
      </main>
    );
  }

  const c = copy[locale];

  return (
    <main>
      <section className="border-b">
        <div className="wrap py-24 text-center sm:py-32 2xl:py-40">
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {c.title}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-muted">{c.notice}</p>
          <div className="mt-10 flex justify-center">
            <a
              href={`mailto:${MAIL}`}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              <Mail className="h-4 w-4" strokeWidth={2} />
              {MAIL}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
