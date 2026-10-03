import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n/config";
import { PRIVACY, PrivacyInhoud, privacyToc } from "@/components/juridisch/privacy-inhoud";
import { juridischeLinks } from "@/components/juridisch/links";
import {
  PortaalJuridisch,
  portaalJuridischMeta,
} from "@/components/juridisch/portaal-document";

// Privacyverklaring binnen het klantenportaal: dezelfde tekst als /privacy;
// de verwijzing naar de cookieverklaring blijft in het portaal.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return portaalJuridischMeta(PRIVACY[locale].meta);
}

export default async function PortaalPrivacy({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <PortaalJuridisch locale={locale} pad="/privacy" toc={privacyToc(locale)}>
      <PrivacyInhoud locale={locale} links={juridischeLinks(locale, "portaal")} />
    </PortaalJuridisch>
  );
}
