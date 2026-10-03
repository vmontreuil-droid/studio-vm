import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n/config";
import { COOKIES, CookiesInhoud, cookiesToc } from "@/components/juridisch/cookies-inhoud";
import {
  PortaalJuridisch,
  portaalJuridischMeta,
} from "@/components/juridisch/portaal-document";

// Cookieverklaring binnen het klantenportaal: dezelfde tekst als /cookies,
// maar de klant blijft in de portaal-shell.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return portaalJuridischMeta(COOKIES[locale].meta);
}

export default async function PortaalCookies({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <PortaalJuridisch locale={locale} pad="/cookies" toc={cookiesToc(locale)}>
      <CookiesInhoud locale={locale} />
    </PortaalJuridisch>
  );
}
