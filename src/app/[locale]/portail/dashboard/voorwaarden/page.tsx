import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n/config";
import {
  VOORWAARDEN,
  VoorwaardenInhoud,
  voorwaardenToc,
} from "@/components/juridisch/voorwaarden-inhoud";
import {
  PortaalJuridisch,
  portaalJuridischMeta,
} from "@/components/juridisch/portaal-document";

// Algemene voorwaarden binnen het klantenportaal: dezelfde tekst als
// /voorwaarden, maar de klant blijft in de portaal-shell.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return portaalJuridischMeta(VOORWAARDEN[locale].meta);
}

export default async function PortaalVoorwaarden({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <PortaalJuridisch locale={locale} pad="/voorwaarden" toc={voorwaardenToc(locale)} genummerd>
      <VoorwaardenInhoud locale={locale} />
    </PortaalJuridisch>
  );
}
